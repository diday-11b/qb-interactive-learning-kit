"""Audit existing header/footer URLs, local fragments and shared-header templates."""
import argparse
import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Navigation(HTMLParser):
    def __init__(self):
        super().__init__(); self.stack=[]; self.links=[]; self.ids=set(); self.headers=0; self.footers=0; self.shared=0
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if attrs.get('id'): self.ids.add(attrs['id'])
        if tag=='header': self.headers+=1
        if tag=='footer': self.footers+=1
        if tag=='qb-site-header': self.shared+=1
        if tag=='a' and any(t in {'header','footer'} for t in self.stack) and 'href' in attrs:
            self.links.append(attrs['href'])
        if tag not in VOID: self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in self.stack: self.stack=self.stack[:len(self.stack)-1-self.stack[::-1].index(tag)]

def run(http=False):
    failures=[]; targets={}; inventory=[]; parsed={}
    files=sorted(p for p in ROOT.rglob('*.html') if not any(v in p.parts for v in ['.git','supabase','dist','node_modules','.vercel']))
    for path in files:
        parser=Navigation(); parser.feed(path.read_text(encoding='utf-8-sig',errors='replace')); parsed[path.resolve()]=parser
        inventory.append({'page':path.relative_to(ROOT).as_posix(),'headers':parser.headers,'shared_headers':parser.shared,'footers':parser.footers})
    def check(href, source):
        if '${' in href: return
        uri=urlsplit(href)
        if uri.scheme or uri.netloc: return
        if not href or href=='#': failures.append({'page':source,'href':href,'reason':'Empty navigation destination'}); return
        owner=ROOT/source
        target=(ROOT/unquote(uri.path.lstrip('/')) if uri.path.startswith('/') else owner.parent/unquote(uri.path)) if uri.path else owner
        target=target.resolve()
        if target.is_dir(): target=target/'index.html'
        if not target.is_file(): failures.append({'page':source,'href':href,'reason':'Missing local destination'}); return
        if uri.fragment:
            dest=parsed.get(target)
            if dest is None:
                dest=Navigation();dest.feed(target.read_text(encoding='utf-8-sig',errors='replace'))
            if uri.fragment not in dest.ids: failures.append({'page':source,'href':href,'reason':'Missing fragment target'})
        web='/'+target.relative_to(ROOT).as_posix()+('?' + uri.query if uri.query else '')
        targets.setdefault(web,[]).append(source)
    for file,parser in parsed.items():
        for href in parser.links: check(href,file.relative_to(ROOT).as_posix())
    for source in ['assets/qb-design-system.js','assets/qb-game-detail-screen.js']:
        text=(ROOT/source).read_text(encoding='utf-8-sig').replace(chr(92)+'"','"')
        for href in re.findall(r'href="([^"<>]+)"',text):
            if href.startswith('/') and '${' not in href: check(href,source)
    if http:
        def request(path):
            try:
                with urllib.request.urlopen('http://127.0.0.1:8000'+path,timeout=8) as response:
                    if response.status!=200: return {'href':path,'reason':'HTTP '+str(response.status)}
            except Exception as error: return {'href':path,'reason':str(error)}
        with ThreadPoolExecutor(max_workers=4) as pool:
            failures.extend(result for result in pool.map(request,targets) if result)
    return {'pages_checked':len(files),'unique_destinations':len(targets),'http_checked':http,'failures':failures,'inventory':inventory,'paths':targets}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--http',action='store_true');parser.add_argument('--report');args=parser.parse_args()
    result=run(args.http)
    if args.report: Path(args.report).write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(f"Checked {result['pages_checked']} pages and {result['unique_destinations']} unique local destinations; {len(result['failures'])} failures.")
    for failure in result['failures']: print(failure)
    raise SystemExit(bool(result['failures']))
