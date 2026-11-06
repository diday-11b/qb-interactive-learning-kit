import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ignored=new Set(['.git','node_modules','dist','.vercel','vendor','supabase']);
const scripts=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.name.startsWith('.')||ignored.has(e.name))continue;const f=path.join(dir,e.name);if(e.isDirectory())await walk(f);else if(/\.(?:js|mjs)$/.test(e.name))scripts.push(f);}}
await walk(root);
for(const file of scripts){const result=spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8'});if(result.status!==0){console.error(result.stderr);process.exit(1);}}
console.log(`Syntax checked ${scripts.length} JavaScript files.`);
const tests=(await readdir(path.join(root,'tests'))).filter(n=>n.endsWith('.test.cjs')).map(n=>'tests/'+n);
const result=spawnSync(process.execPath,['--test',...tests],{cwd:root,stdio:'inherit'});process.exit(result.status??1);
