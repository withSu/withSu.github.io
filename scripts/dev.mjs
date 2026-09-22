import http from 'node:http';
import {readFile,stat,watch} from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
const root=process.cwd();
const runBuild=()=>new Promise((resolve,reject)=>{const p=spawn(process.execPath,['scripts/build.mjs'],{stdio:'inherit'});p.on('close',c=>c===0?resolve():reject(new Error('Build failed')));});
await runBuild();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.pdf':'application/pdf','.xml':'application/xml','.txt':'text/plain','.json':'application/json','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
  try{let url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(url.endsWith('/'))url+='index.html';
    const file=path.resolve(root,'.'+url);if(!file.startsWith(root+path.sep))throw new Error('Invalid path');
    // Serve the generated public surface only.
    const allowed=JSON.parse(await readFile('.generated-files.json','utf8'));
    const relative=path.relative(root,file).split(path.sep).join('/');
    if(!allowed.includes(relative)) {if(!path.extname(url)&&allowed.includes(relative+'/index.html')){res.writeHead(301,{Location:url+'/'});res.end();return;}res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile('404.html'));return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173/'));
let busy=false,pending=false;
async function rebuild(){if(busy){pending=true;return;}busy=true;try{await runBuild();console.log('Rebuilt. Reload to see changes.');}catch(e){console.error(e.message);}busy=false;if(pending){pending=false;rebuild();}}
for(const folder of ['src','content','public']){(async()=>{for await(const event of watch(folder,{recursive:true})){if(event.filename)rebuild();}})();}
