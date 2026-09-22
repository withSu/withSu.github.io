import PDFDocument from 'pdfkit';
import {createWriteStream} from 'node:fs';
export async function createPDF(p,projects,papers){
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
  section('Education');p.education.forEach(e=>row(e.degree,e.period,[e.department,e.institution].filter(Boolean).join(', '),''));
  section('Research experience');p.experience.forEach(e=>row(e.role,e.period,e.institution,e.detail));
  section('Selected projects');projects.forEach(e=>row(e.title,e.period??'Public project','',e.summary));
  if(papers.length){section('Publications');papers.forEach(e=>paragraph(`${e.authors}. ${e.title}. ${e.venue}, ${e.year}.`));}
  doc.fillColor(muted).font('Helvetica').fontSize(8).text('Full project details and current CV: https://withsu.github.io',left,doc.y+12,{width});
  doc.end();await done;
}
