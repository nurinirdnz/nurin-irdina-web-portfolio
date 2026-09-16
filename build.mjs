// Rebuild self-contained distributable assets from locked dependencies.
import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await mkdir('frontend/vendor', {recursive:true});
for(const [source,dest] of [
 ['gsap/dist/gsap.min.js','gsap.min.js'],
 ['gsap/dist/ScrollTrigger.min.js','ScrollTrigger.min.js'],
 ['lenis/dist/lenis.min.js','lenis.min.js'],
 ['gsap/README.md','GSAP-README.md'],
 ['lenis/LICENSE','LENIS-LICENSE.txt'],
 ['tailwindcss/LICENSE','TAILWIND-LICENSE.txt']
]) await copyFile('node_modules/'+source,'frontend/vendor/'+dest);
const result=spawnSync(process.execPath,['node_modules/@tailwindcss/cli/dist/index.mjs','-i','tailwind.input.css','-o','frontend/vendor/tailwind.css','--minify'],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
const pkg=JSON.parse(await readFile('package.json','utf8'));
await writeFile('frontend/vendor/versions.json',JSON.stringify(pkg.dependencies,null,2)+'\n');
console.log('Built local Tailwind CSS, GSAP, ScrollTrigger and Lenis assets.');
