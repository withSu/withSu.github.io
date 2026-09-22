import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import matter from 'gray-matter';
import {marked} from 'marked';
import * as view from '../src/templates.mjs';
import {createPDF} from './pdf.mjs';
const profile=JSON.parse(await fs.readFile('content/profile.json','utf8'));
const generated=[];
async function write(file,data){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,data);generated.push(file);}
async function entries(type){const names=(await fs.readdir(`content/${type}`)).filter(n=>n.endsWith('.md'));const items=await Promise.all(names.map(async file=>{const {data,content}=matter(await fs.readFile(`content/${type}/${file}`,'utf8'));return {...data,date:data.date instanceof Date?data.date.toISOString().slice(0,10):data.date,slug:file.slice(0,-3),body:marked.parse(content),type};}));for(const item of items){if(!item.title||!/^[a-z0-9-]+$/.test(item.slug))throw new Error(`Invalid content: ${type}/${item.slug}`);}return items.filter(e=>e.draft!==true).sort((a,b)=>(a.order??99)-(b.order??99)||String(b.year??b.date??'').localeCompare(String(a.year??a.date??'')));}
const [projects,papers,notes]=await Promise.all(['projects','papers','notes'].map(entries));
const documents=[];
async function page(file,options,keywords=''){await write(file,view.layout(profile,options));documents.push({title:options.title,url:options.url??'/',category:options.category??'Page',summary:options.description??'',keywords,text:options.body.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ')});}
await page('index.html',{title:'About',description:profile.intro,body:view.about(profile)},'Bumsu Kim Hanyang IMCL 한양 소개 연구실');
await page('research/index.html',{title:'Research interests',section:'research',url:'/research/',description:'Self-improvement, self-evolution, multimodal learning, and industrial anomaly detection.',body:view.research(profile,projects)},'관심 분야 연구 self-improving self-evolving MLLM flywheel 플라이휠');
await page('publications/index.html',{title:'Publications',section:'publications',url:'/publications/',description:'Publications and preprints by Bumsu Kim.',body:view.heading('publications')+view.publications(papers)},'Papers 논문 출판');
await page('cv/index.html',{title:'CV',section:'cv',url:'/cv/',description:'Education, research experience, selected projects, and downloadable curriculum vitae.',body:view.cv(profile,projects,papers)},'CV resume curriculum vitae 이력 학력 경력');
await page('notes/index.html',{title:'Notes',section:'research',url:'/notes/',description:'Paper readings and research perspectives.',body:view.notes(notes)},'노트 논문 리뷰 의견');
for(const item of [...projects,...papers,...notes]){const base=item.type==='papers'?'publications':item.type;await page(`${base}/${item.slug}/index.html`,{title:item.title,description:item.summary,section:item.type==='projects'?'cv':item.type==='papers'?'publications':'research',category:item.type==='projects'?'Project':item.type==='papers'?'Paper':'Note',url:`/${base}/${item.slug}/`,body:view.detail(item)},`${(item.tags??[]).join(' ')} ${item.slug==='semiconductor-anomaly-detection'?'반도체 이상탐지 CBNU Robotics':''}`);}
await write('papers/index.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Publications | Bumsu Kim</title><meta name="description" content="Publications and preprints."><meta http-equiv="refresh" content="0; url=/publications/"><link rel="canonical" href="${profile.siteUrl}/publications/"></head><body><a href="/publications/">Continue to publications</a></body></html>`);
await write('404.html',view.layout(profile,{title:'Page not found',body:view.heading('page not found','This page may have moved as the website was updated.')+'<p><a href="/">Return to about →</a></p>'}));
await write('assets/search.json',JSON.stringify(documents));
await write('assets/site.css',await fs.readFile('src/academic.css'));
await write('assets/portrait.jpg',await fs.readFile('public/portrait.jpg'));
await write('assets/roboto-latin.woff2',await fs.readFile('node_modules/@fontsource-variable/roboto/files/roboto-latin-wght-normal.woff2'));
await write('assets/favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="5" fill="#1c1c1d"/><text x="20" y="28" text-anchor="middle" font-family="Arial,sans-serif" font-weight="300" font-size="27" fill="#2698ba">b</text></svg>');
const js=await build({entryPoints:{app:'src/site.js'},bundle:true,format:'esm',splitting:true,outdir:'assets',chunkNames:'[name]-[hash]',minify:true,target:['es2022'],metafile:true});generated.push(...Object.keys(js.metafile.outputs));
await createPDF(profile,projects,papers);generated.push('assets/Bumsu-Kim-CV.pdf');
await write('.nojekyll','');
await write('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${profile.siteUrl}/sitemap.xml\n`);
await write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${documents.map(p=>`<url><loc>${profile.siteUrl}${p.url}</loc></url>`).join('')}</urlset>`);
try{const old=JSON.parse(await fs.readFile('.generated-files.json','utf8'));for(const file of old){if(!generated.includes(file)&&!file.includes('..')&&(/^(assets|projects|papers|notes|research|publications|cv)\//.test(file)))await fs.rm(file,{force:true});}}catch{}
await fs.writeFile('.generated-files.json',JSON.stringify(generated,null,2));
console.log(`Built ${documents.length+2} pages, ${documents.length} searchable entries, and CV PDF.`);
