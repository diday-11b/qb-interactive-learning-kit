import { readdir, readFile, mkdir, copyFile, writeFile, rm, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { browserConfig } from './browser-config.mjs';
import { verifyBuild } from './verify-build.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const excluded = new Set(['.git','.github','.vercel','.agents','.codex','node_modules','dist','scripts','tests','supabase']);
const extensions = new Set(['.html','.css','.js','.json','.svg','.png','.jpg','.jpeg','.webp','.gif','.ico','.avif','.mp3','.wav','.ogg','.mp4','.webm','.woff','.woff2','.ttf','.pdf']);
let localSource = '';
try { localSource = await readFile(path.join(root,'assets/supabase-config.js'),'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const config = browserConfig(process.env, localSource);
// Never delete an arbitrary or symlinked output directory.
if (output !== path.resolve(root,'dist') || path.dirname(output) !== root) throw new Error('Unsafe output path.');
try { if ((await lstat(output)).isSymbolicLink()) throw new Error('Output directory must not be a symlink.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
await rm(output,{recursive:true,force:true});
let count = 0;
async function copy(directory, relative = '') {
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    if (entry.name.startsWith('.') || excluded.has(entry.name)) continue;
    const rel = path.join(relative, entry.name);
    if (entry.isDirectory()) { await copy(path.join(directory,entry.name),rel); continue; }
    if (!entry.isFile() || !extensions.has(path.extname(entry.name).toLowerCase())) continue;
    if (rel.replaceAll(path.sep,'/') === 'assets/supabase-config.js') continue;
    const destination = path.join(output,rel);
    await mkdir(path.dirname(destination),{recursive:true});
    await copyFile(path.join(directory,entry.name),destination);count++;
  }
}
await copy(root);
await mkdir(path.join(output,'assets'),{recursive:true});
await writeFile(path.join(output,'assets/supabase-config.js'),'// Generated public browser configuration.\nwindow.QB_SUPABASE_CONFIG = Object.freeze('+JSON.stringify(config || {url:'',publishableKey:''})+');\n');
if (!config) console.warn('Local practice build: account features need Supabase environment variables.');
await verifyBuild(output);
console.log(`Built ${count+1} public files into dist. Supabase configuration: ${config?'configured (public key only)':'local practice only'}.`);
