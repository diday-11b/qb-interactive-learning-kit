import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export async function verifyBuild(output) {
  const root=path.resolve(output), files=[];
  async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const name=path.join(dir,e.name);if(e.isDirectory())await walk(name);else files.push(name);}}
  await walk(root);
  const available=new Set(files.map(f=>path.relative(root,f).split(path.sep).join('/')));
  const required=['index.html','01._qb_public_homepage/code.html','02._qb_explore_games_catalog/code.html','03._qb_game_details_ship_battle/code.html','16._qb_unified_sign_in_sign_up/code.html','auth/callback.html','auth/onboarding.html','games/rabbit-racing/index.html','games/rabbit-racing/app.js','assets/qb-adventure-setup.js','assets/brand/qb-lion-mark.svg','assets/supabase-config.js'];
  const failures=required.filter(f=>!available.has(f)).map(f=>'Missing entry: '+f);
  for(const file of available)if(/(^|\/)(?:\.env[^/]*|supabase|tests|scripts|\.git)(\/|$)|\.(?:sql|md|log)$/i.test(file))failures.push('Non-public file in output: '+file);
  function reference(ref,owner){
    ref=ref.trim();if(!ref||ref.startsWith('#')||ref.startsWith('//')||/^[a-z][a-z0-9+.-]*:/i.test(ref)||/\$\{|\{\{/.test(ref))return;
    let uri;try{uri=new URL(ref,'https://build.invalid/'+owner);}catch{return;}
    let target;try{target=decodeURIComponent(uri.pathname).replace(/^\//,'');}catch{return;}
    if(!target||target.endsWith('/'))target+='index.html';
    if(!available.has(target)&&!available.has(target+'/index.html'))failures.push(owner+' -> '+target);
  }
  for(const file of available){
    if(!/\.(html|css)$/.test(file))continue;
    const text=await readFile(path.join(root,file),'utf8');
    if(file.endsWith('.html'))for(const m of text.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi))reference(m[1],file);
    else for(const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g))reference(m[1],file);
  }
  if(failures.length)throw new Error('Static build verification failed:\n'+[...new Set(failures)].join('\n'));
  console.log(`Verified ${available.size} public files and case-sensitive local HTML/CSS paths.`);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await verifyBuild(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist'));
