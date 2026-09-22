import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const manifest=JSON.parse(await fs.readFile('.generated-files.json','utf8'));
const pages=manifest.filter(f=>f.endsWith('.html'));
const documents=new Map(await Promise.all(pages.map(async f=>[f,await fs.readFile(f,'utf8')])));
let links=0;
for(const [file,html] of documents){
  assert.match(html,/<html lang="en">/,`${file}: document language`);
  assert.match(html,/<title>[^<]+<\/title>/,`${file}: page title`);
  assert.match(html,/<meta name="description" content="[^"]+">/,`${file}: description`);
  assert.equal((html.match(/aria-current="page"/g)||[]).length,1,`${file}: one active nav item`);
  assert.ok(!/Replace with|example\.com|TODO|undefined|\[object Object\]/.test(html),`${file}: no template content`);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,`${file}: unique IDs`);
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
    const target=match[1];if(/^(?:https?:|mailto:|data:)/.test(target))continue;
    const parsed=new URL(target,'https://withsu.github.io/'+file);
    let local=decodeURIComponent(parsed.pathname).replace(/^\//,'');if(!local||local.endsWith('/'))local+='index.html';
    assert.ok(manifest.includes(local),`${file}: missing local target ${target}`);
    if(parsed.hash){const doc=documents.get(local);assert.ok(doc?.includes(`id="${decodeURIComponent(parsed.hash.slice(1))}"`),`${file}: missing anchor ${target}`);}
    links++;
  }
}
const cv=documents.get('index.html');
for(const required of ['Sep 2026 - Present','Jan 2026 - Present','Sep 2024 - Dec 2025','CBNU Robotics Lab','Hanyang University'])assert.ok(cv.includes(required),`CV: missing confirmed detail ${required}`);
assert.ok(documents.get('papers/index.html').includes('No public paper links yet.'),'Publication empty state');
assert.ok(documents.get('notes/index.html').includes('No notes have been published yet.'),'Notes empty state');
const pdf=await fs.readFile('assets/Bumsu-Kim-CV.pdf');assert.equal(pdf.subarray(0,4).toString(),'%PDF','Valid PDF header');
const app=await fs.readFile('assets/app.js','utf8');for(const match of app.matchAll(/import\("([^"\n]+)"\)/g))assert.ok(manifest.includes(path.posix.join('assets',match[1])),`Missing JS chunk: ${match[1]}`);
const declared=new Set(manifest);assert.equal(manifest.length,declared.size,'No duplicate generated paths');
console.log(`Passed: ${pages.length} pages, ${links} internal links, page metadata, CV dates, honest empty states, PDF, and lazy-loaded assets.`);
