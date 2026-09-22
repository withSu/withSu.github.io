import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
import matter from 'gray-matter';
import {marked} from 'marked';
import PDFDocument from 'pdfkit';
import {createWriteStream} from 'node:fs';

const root=process.cwd();
const profile=JSON.parse(await fs.readFile('content/profile.json','utf8'));
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(url,label,cls='text-link')=>`<a class="${cls}" href="${esc(url)}">${label}</a>`;
const external=(url,label)=>`<a class="text-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}<span class="arrow" aria-hidden="true">↗</span></a>`;
const generated=[];
async function write(file,data){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,data);generated.push(file);}
async function entries(type){
  const names=(await fs.readdir(`content/${type}`)).filter(n=>n.endsWith('.md'));
  const items=await Promise.all(names.map(async file=>{const {data,content}=matter(await fs.readFile(`content/${type}/${file}`,'utf8'));return {...data,slug:file.slice(0,-3),body:marked.parse(content),type};}));
  for(const item of items){if(!item.title)throw new Error(`Missing title in ${type}/${item.slug}`);if(!/^[a-z0-9-]+$/.test(item.slug))throw new Error(`Invalid slug: ${item.slug}`);}
  return items.filter(e=>e.draft!==true).sort((a,b)=>(a.order??99)-(b.order??99)||String(b.year??b.date??'').localeCompare(String(a.year??a.date??'')));
}
const [projects,papers,notes]=await Promise.all(['projects','papers','notes'].map(entries));
const routes=[['/','CV','cv'],['/papers/','Papers','papers'],['/research/','Research interests','research'],['/notes/','Notes','notes']];
const tags=list=>`<ul class="topic-list">${list.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
function layout({title,description=profile.intro,section='cv',url='/',body,script=false}){
  const canonical=profile.siteUrl+url;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | ${esc(profile.name)}</title><meta name="description" content="${esc(description)}"><meta name="author" content="${esc(profile.name)}"><meta name="theme-color" content="#fbfbfc"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)} | ${esc(profile.name)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/site.css">${script?'<script type="module" src="/assets/app.js"></script>':''}</head>
<body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="wrap header-inner"><a class="brand" href="/" aria-label="Bumsu Kim, CV"><span class="brand-mark" aria-hidden="true">bk</span><span class="brand-name">Bumsu Kim</span></a><nav class="site-nav" aria-label="Main navigation">${routes.map(([href,label,key])=>`<a href="${href}"${section===key?' aria-current="page"':''}>${key==='research'?'<span class="long-label">Research interests</span><span class="short-label">Research</span>':label}</a>`).join('')}</nav></div></header><main class="wrap" id="main">${body}</main><footer class="site-footer"><div class="wrap footer-inner"><span>© ${new Date().getFullYear()} Bumsu Kim</span><div class="footer-links"><a href="${esc(profile.labUrl)}">IMC Lab<span aria-hidden="true"> ↗</span></a><a href="${esc(profile.github)}">GitHub<span aria-hidden="true"> ↗</span></a><a href="mailto:${esc(profile.email)}">Email<span aria-hidden="true"> ↗</span></a></div></div></footer></body></html>`;
}
const timeline=items=>items.map(item=>`<div class="timeline-entry"><div class="timeline-date">${esc(item.period)}</div><div class="timeline-body"><h3>${item.url?link(item.url,esc(item.role??item.degree),''):esc(item.role??item.degree)}</h3><div class="institution">${esc(item.institution)}</div>${item.detail?`<p>${esc(item.detail)}</p>`:''}</div></div>`).join('');
const projectList=()=>projects.map(item=>`<article class="project-row"><h3><a href="/projects/${item.slug}/">${esc(item.title)}<span class="arrow" aria-hidden="true">↗</span></a></h3><p>${esc(item.summary)}</p><p class="meta">${esc(item.period??'Public software project')} · ${esc(item.tags?.join(' / '))}</p></article>`).join('');
const paperList=()=>papers.map(item=>`<article class="paper-row"><span class="content-label">${esc(item.year)}</span><div><h2><a href="/papers/${item.slug}/">${esc(item.title)}</a></h2><p>${esc(item.authors)}</p><p>${esc(item.venue)}</p><p>${esc(item.summary)}</p><div class="paper-links">${item.paper?external(item.paper,'Paper'):''}${item.code?external(item.code,'Code'):''}<a href="/papers/${item.slug}/">Overview →</a></div></div></article>`).join('');
const cvSections=[['about','About'],['education','Education'],['experience','Research experience'],['projects','Selected projects'],...(papers.length?[['publications','Publications']]:[])];
const cv=`<section class="profile-top" aria-labelledby="profile-name"><div class="profile-summary"><div class="profile-main"><p class="eyebrow">Curriculum vitae</p><h1 id="profile-name">Bumsu Kim<span class="accent">.</span></h1><p class="profile-role">${esc(profile.role)}</p><p class="profile-affiliation"><a href="${esc(profile.labUrl)}">${esc(profile.lab)}</a><br>${esc(profile.affiliation)} · ${esc(profile.location)}</p></div><div class="links"><a class="button primary" href="/assets/Bumsu-Kim-CV.pdf" download>Download CV <span aria-hidden="true">↓</span></a><a class="text-link" href="mailto:${esc(profile.email)}">Email <span aria-hidden="true">↗</span></a>${external(profile.github,'GitHub')}</div></div><img class="portrait" src="/assets/portrait.jpg" alt="Bumsu Kim" width="174" height="206" fetchpriority="high"></section>
<div class="cv-layout"><aside class="on-page" aria-label="CV sections"><div class="on-page-inner"><p class="eyebrow">On this page</p>${cvSections.map(([id,title])=>`<a href="#${id}">${title}</a>`).join('')}</div></aside><div><section class="cv-section" id="about"><h2>About</h2><p class="about-copy">${esc(profile.intro)}</p>${tags(profile.interests)}</section><section class="cv-section" id="education"><h2>Education</h2>${timeline(profile.education)}</section><section class="cv-section" id="experience"><h2>Research experience</h2>${timeline(profile.experience)}</section><section class="cv-section" id="projects"><h2>Selected projects</h2>${projectList()}</section>${papers.length?`<section class="cv-section" id="publications"><div class="section-heading"><h2>Publications</h2><a href="/papers/">All papers →</a></div>${paperList()}</section>`:''}</div></div>`;
await write('index.html',layout({title:'CV',body:cv}));
await write('cv/index.html',layout({title:'CV',url:'/cv/',body:cv}));
const heading=(label,title,text)=>`<header class="page-heading"><p class="eyebrow">${label}</p><h1>${title}<span class="accent">.</span></h1><p>${text}</p></header>`;
await write('papers/index.html',layout({title:'Papers',section:'papers',url:'/papers/',body:heading('Research output','Papers','Publications and preprints, with links to the work behind them.')+`<div class="page-body">${papers.length?paperList():`<section class="empty-state"><span class="index" aria-hidden="true">—</span><h2>No public paper links yet.</h2><p>Publications and preprints will be listed here when public links are available. In the meantime, explore my research interests and selected projects.</p><div class="links"><a class="text-link" href="/research/">Research interests →</a><a class="text-link" href="/#projects">Selected projects →</a></div></section>`}</div>`}));
await write('notes/index.html',layout({title:'Notes',section:'notes',url:'/notes/',body:heading('Reading & thinking','Notes','Paper readings, research perspectives, and questions worth following.')+`<div class="page-body">${notes.length?notes.map(n=>`<article class="notes-row"><time datetime="${esc(String(n.date).slice(0,10))}">${esc(String(n.date).slice(0,10))}</time><h2><a href="/notes/${n.slug}/">${esc(n.title)} <span aria-hidden="true">↗</span></a></h2><p>${esc(n.summary)}</p></article>`).join(''):`<section class="empty-state"><span class="index" aria-hidden="true">—</span><h2>A space for research in progress.</h2><p>No notes have been published yet.</p><a class="text-link" href="/research/">Explore my research interests →</a></section>`}</div>`}));
const research=`<section class="research-hero"><div class="research-copy"><p class="eyebrow">Research interests</p><h1>Self-improving.<br>Self-evolving<span class="accent">.</span></h1><p class="intro">I am interested in AI systems that learn from their own experience, use feedback, and carry what they learn into the next iteration.</p><div class="cycle" aria-label="Learning cycle"><button type="button" data-phase="0" aria-pressed="true">01 Generate</button><span aria-hidden="true">→</span><button type="button" data-phase="1" aria-pressed="false">02 Evaluate</button><span aria-hidden="true">→</span><button type="button" data-phase="2" aria-pressed="false">03 Learn</button></div><p class="cycle-description" aria-live="polite">Generate candidate responses, behaviors, or solutions.</p></div><div><div class="flywheel-stage" data-flywheel><div class="flywheel-fallback" role="img" aria-label="Generate, evaluate, and learn in a repeating cycle">Generate → Evaluate → Learn ↻</div><canvas aria-hidden="true"></canvas></div><p class="flywheel-caption">The learning flywheel</p></div></section><section class="research-directions" aria-label="Research directions"><article class="direction"><span class="number">01</span><h2>MLLM self-improvement<br>& self-evolution</h2><p>How can multimodal language models use feedback to improve their own behavior? I am interested in making iterative improvement useful beyond a single interaction.</p></article><article class="direction"><span class="number">02</span><h2>Multimodal learning</h2><p>Learning from complementary information across modalities, and understanding how those signals can support more capable AI systems.</p></article><article class="direction"><span class="number">03</span><h2>Industrial anomaly detection</h2><p>Recognizing anomalous objects in industrial settings, informed by my undergraduate work on semiconductor microdevices. <a class="text-link" href="/projects/semiconductor-anomaly-detection/">Project overview →</a></p></article></section>`;
await write('research/index.html',layout({title:'Research interests',section:'research',url:'/research/',body:research,script:true}));
for(const item of [...projects,...papers,...notes]){
  const isProject=item.type==='projects',section=isProject?'cv':item.type;
  const backlink=isProject?'/#projects':`/${item.type}/`;
  const extraLinks=[item.repository?external(item.repository,'Code & documentation'):'',item.paper?external(item.paper,'Read paper'):'',item.code?external(item.code,'Code'):''].join('');
  const body=`<a class="back-link" href="${backlink}">← ${isProject?'Back to CV':`All ${item.type}`}</a><header class="article-header"><p class="eyebrow">${isProject?'Selected project':item.type==='papers'?'Paper':'Research note'}</p><h1>${esc(item.title)}</h1><p class="summary">${esc(item.summary)}</p><p class="article-meta">${esc([item.organization,item.period,item.authors,item.venue,item.year].filter(Boolean).join(' · '))}</p>${extraLinks?`<div class="links">${extraLinks}</div>`:''}${item.tags?tags(item.tags):''}</header><div class="article-layout"><aside class="on-page"><p class="eyebrow">${isProject?'Project overview':'Reading'}</p><a href="${backlink}">← ${isProject?'Curriculum vitae':`All ${item.type}`}</a></aside><article class="prose">${item.body}</article></div>`;
  await write(`${item.type}/${item.slug}/index.html`,layout({title:item.title,description:item.summary,section,url:`/${item.type}/${item.slug}/`,body}));
}
await write('404.html',layout({title:'Page not found',body:heading('404','Page not found','This page may have moved as the website was updated.')+'<div class="page-body"><a class="button primary" href="/">Return to CV →</a></div>'}));
await fs.mkdir('assets',{recursive:true});
await write('assets/site.css',await fs.readFile('src/styles.css'));
await write('assets/portrait.jpg',await fs.readFile('public/portrait.jpg'));
await write('assets/favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="9" fill="#1b2638"/><text x="20" y="27" text-anchor="middle" font-family="Georgia,serif" font-size="24" fill="white">b</text></svg>');
const js=await build({entryPoints:['src/app.js'],bundle:true,format:'esm',splitting:true,outdir:'assets',chunkNames:'[name]-[hash]',minify:true,target:['es2022'],metafile:true});
for(const file of Object.keys(js.metafile.outputs))generated.push(file);
await createPDF(profile,projects,papers);
generated.push('assets/Bumsu-Kim-CV.pdf');
await write('.nojekyll','');
await write('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${profile.siteUrl}/sitemap.xml\n`);
const publicRoutes=generated.filter(f=>f.endsWith('/index.html')||f==='index.html').map(f=>'/'+f.replace(/index\.html$/,''));
await write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicRoutes.filter(p=>p!=='/cv/').map(url=>`<url><loc>${profile.siteUrl}${url}</loc></url>`).join('')}</urlset>`);
try{const old=JSON.parse(await fs.readFile('.generated-files.json','utf8'));for(const file of old){if(!generated.includes(file)&&!file.includes('..')&&(/^(assets|projects|papers|notes|research|cv)\//.test(file)))await fs.rm(file,{force:true});}}catch{}
await fs.writeFile('.generated-files.json',JSON.stringify(generated,null,2));
console.log(`Built ${publicRoutes.length+1} HTML pages, ${projects.length} projects, ${papers.length} papers, ${notes.length} notes, and CV PDF.`);

async function createPDF(p,projects,papers){
  const doc=new PDFDocument({size:'A4',margin:48,info:{Title:`${p.name} - Curriculum Vitae`,Author:p.name,Subject:'Academic curriculum vitae'}});
  const stream=createWriteStream('assets/Bumsu-Kim-CV.pdf');const done=new Promise((resolve,reject)=>{stream.on('finish',resolve);stream.on('error',reject);});doc.pipe(stream);
  const left=48,width=499,ink='#1b2638',muted='#616b7d',blue='#345ecc';
  doc.fillColor(ink).font('Times-Roman').fontSize(30).text(p.name,left,43);
  doc.font('Helvetica').fontSize(10.5).text(p.role,left,81);
  doc.fillColor(muted).fontSize(9.5).text(`${p.lab} | ${p.affiliation}`,left,99);
  doc.fillColor(blue).fontSize(9).text(`${p.email}  |  github.com/withSu  |  withsu.github.io`,left,116);
  doc.moveTo(left,137).lineTo(547,137).strokeColor('#d8dfe9').lineWidth(.7).stroke();doc.y=151;
  const section=title=>{if(doc.y>715)doc.addPage();doc.moveDown(.65);doc.fillColor(blue).font('Helvetica-Bold').fontSize(10).text(title.toUpperCase(),left,doc.y,{width});doc.moveDown(.6);doc.font('Helvetica').fillColor(ink).fontSize(9.5);};
  const paragraph=text=>{doc.font('Helvetica').fontSize(9.5).fillColor(ink).text(text,left,doc.y,{width,lineGap:3});doc.moveDown(.4);};
  const row=(title,period,subtitle,detail)=>{if(doc.y>690)doc.addPage();const y=doc.y;doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text(title,left,y,{width:340});doc.font('Helvetica').fontSize(8.5).fillColor(muted).text(period,393,y+1,{width:154,align:'right'});doc.y=Math.max(y+17,doc.y);if(subtitle){doc.fontSize(9.5).fillColor(ink).text(subtitle,left,doc.y,{width});doc.moveDown(.25);}if(detail)paragraph(detail);doc.moveDown(.35);};
  section('Research interests');paragraph(p.interests.join(' / '));
  section('Education');p.education.forEach(e=>row(e.degree,e.period,e.institution,''));
  section('Research experience');p.experience.forEach(e=>row(e.role,e.period,e.institution,e.detail));
  section('Selected projects');projects.forEach(e=>row(e.title,e.period??'Public project','',e.summary));
  if(papers.length){section('Publications');papers.forEach(e=>paragraph(`${e.authors}. ${e.title}. ${e.venue}, ${e.year}.`));}
  doc.fillColor(muted).font('Helvetica').fontSize(8).text('Full project details and current CV: https://withsu.github.io',left,doc.y+12,{width});
  doc.end();await done;
}
