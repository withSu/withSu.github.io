import {searchEntries} from './search.mjs';
const root=document.documentElement;
const themeButton=document.querySelector('.theme-toggle');
function applyTheme(theme){root.dataset.theme=theme;themeButton.setAttribute('aria-label',`Switch to ${theme==='dark'?'light':'dark'} theme`);document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#1c1c1d':'#ffffff';window.dispatchEvent(new Event('site-themechange'));}
applyTheme(root.dataset.theme||'dark');
themeButton.addEventListener('click',()=>{const theme=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('bk-theme-v2',theme);}catch{}applyTheme(theme);});
const header=document.querySelector('.site-header'),menu=document.querySelector('.menu-toggle');
function setMenu(open){header.dataset.menuOpen=String(open);menu.setAttribute('aria-expanded',String(open));}
menu.addEventListener('click',()=>setMenu(header.dataset.menuOpen!=='true'));
document.addEventListener('click',event=>{if(!header.contains(event.target))setMenu(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape')setMenu(false);});
matchMedia('(min-width: 641px)').addEventListener('change',event=>{if(event.matches)setMenu(false);});

const dialog=document.getElementById('site-search'),input=document.getElementById('search-input'),results=document.getElementById('search-results'),status=document.getElementById('search-status');
let index,loading,opener;
function drawResults(){if(!index)return;const matches=searchEntries(index,input.value);results.replaceChildren();status.textContent=input.value.trim()?`${matches.length} result${matches.length===1?'':'s'}`:'Explore this website';for(const item of matches){const li=document.createElement('li'),a=document.createElement('a');a.href=item.url;for(const [cls,text] of [['search-result-category',item.category],['search-result-title',item.title],['search-result-description',item.summary]]){if(!text)continue;const span=document.createElement('span');span.className=cls;span.textContent=text;a.append(span);}li.append(a);results.append(li);}if(!matches.length){const li=document.createElement('li');li.className='search-empty';li.textContent='No matches. Try a research topic, project name, or “CV”.';results.append(li);}}
async function openSearch(){if(dialog.open){dialog.close();return;}opener=document.activeElement;setMenu(false);dialog.showModal();input.focus();if(index){drawResults();return;}status.textContent='Loading search…';try{loading??=fetch('/assets/search.json').then(r=>{if(!r.ok)throw new Error('Search index unavailable');return r.json();});index=await loading;drawResults();}catch{loading=undefined;status.textContent='Search is unavailable. Please use the navigation links.';}}
document.querySelector('.search-trigger').addEventListener('click',openSearch);
document.querySelector('.search-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{if(opener instanceof HTMLElement)opener.focus();});
dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch();}});
input.addEventListener('input',drawResults);
dialog.addEventListener('keydown',event=>{const links=[...results.querySelectorAll('a')];if(!links.length)return;if(event.target===input){if(event.key==='ArrowDown'){event.preventDefault();links[0].focus();}else if(event.key==='ArrowUp'){event.preventDefault();links.at(-1).focus();}else if(event.key==='Enter'){event.preventDefault();location.assign(links[0].href);}return;}const current=links.indexOf(document.activeElement);if(current<0)return;if(event.key==='ArrowDown'){event.preventDefault();(links[current+1]||input).focus();}else if(event.key==='ArrowUp'){event.preventDefault();(links[current-1]||input).focus();}});
if(!/Mac|iPhone|iPad/.test(navigator.platform))document.querySelector('.search-trigger kbd').textContent='Ctrl K';

const outline=document.querySelector('[data-page-toc]');
if(outline){
  const toggle=outline.querySelector('.toc-toggle');
  const links=[...outline.querySelectorAll('a[href^="#"]')];
  const sections=links.map(link=>document.getElementById(link.hash.slice(1)));
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let active=-1,scrollFrame=0,requested=-1,settling=false,settleTimer=0;
  let pendingBounce=null,bounceAnimation=null;
  function setOutlineOpen(open){outline.dataset.open=String(open);toggle.setAttribute('aria-expanded',String(open));}
  function updateOutline(){
    scrollFrame=0;
    const marker=header.getBoundingClientRect().bottom+64;
    let next=0;
    sections.forEach((section,i)=>{if(section.getBoundingClientRect().top<=marker)next=i;});
    const end=document.documentElement.scrollHeight-window.innerHeight;
    if(end>1&&window.scrollY>=end-2)next=sections.length-1;
    // Several anchors can share the same clamped scroll position near the page end.
    if(requested>=0)next=requested;
    if(next===active)return;
    active=next;
    links.forEach((link,i)=>{if(i===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  }
  function queueOutline(){if(!scrollFrame)scrollFrame=requestAnimationFrame(updateOutline);}
  function cancelBounce(){
    pendingBounce=null;bounceAnimation?.cancel();bounceAnimation=null;
  }
  function bounceSection(){
    const target=pendingBounce;pendingBounce=null;
    if(!target||reducedMotion.matches||document.hidden||sections[requested]!==target)return;
    const animation=target.animate([
      {transform:'translateY(0)',offset:0,easing:'cubic-bezier(.16,1,.3,1)'},
      {transform:'translateY(-4px)',offset:.38,easing:'cubic-bezier(.4,0,.2,1)'},
      {transform:'translateY(1px)',offset:.72,easing:'cubic-bezier(.16,1,.3,1)'},
      {transform:'translateY(0)',offset:1}
    ],{duration:420});
    bounceAnimation=animation;
    animation.onfinish=()=>{if(bounceAnimation===animation)bounceAnimation=null;};
  }
  function settleAnchor(){
    clearTimeout(settleTimer);
    settleTimer=setTimeout(()=>{settling=false;bounceSection();},180);
  }
  function selectAnchor(hash){
    const next=links.findIndex(link=>link.hash===hash);
    if(next!==requested)cancelBounce();
    requested=next;
    settling=requested>=0;
    if(settling)settleAnchor();else clearTimeout(settleTimer);
    queueOutline();
  }
  function resumeTracking(){
    cancelBounce();requested=-1;settling=false;clearTimeout(settleTimer);queueOutline();
  }
  function onOutlineScroll(){
    if(settling)settleAnchor();else requested=-1;
    queueOutline();
  }
  toggle.addEventListener('click',()=>setOutlineOpen(outline.dataset.open!=='true'));
  outline.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    setOutlineOpen(false);
    cancelBounce();selectAnchor(link.hash);
    if(event.detail>0&&!reducedMotion.matches)pendingBounce=sections[requested];
    if(event.detail===0){root.style.scrollBehavior='auto';requestAnimationFrame(()=>root.style.removeProperty('scroll-behavior'));}
    queueOutline();
  });
  outline.addEventListener('keydown',event=>{if(event.key==='Escape'&&outline.dataset.open==='true'){setOutlineOpen(false);toggle.focus();}});
  window.addEventListener('scroll',onOutlineScroll,{passive:true});
  window.addEventListener('wheel',resumeTracking,{passive:true});
  window.addEventListener('touchmove',resumeTracking,{passive:true});
  window.addEventListener('keydown',event=>{
    if(dialog.open||event.target.closest('input,textarea,[contenteditable="true"]'))return;
    if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))resumeTracking();
  });
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)cancelBounce();});
  window.addEventListener('resize',queueOutline);
  window.addEventListener('hashchange',()=>selectAnchor(location.hash));
  window.addEventListener('pageshow',event=>{if(event.persisted)resumeTracking();else selectAnchor(location.hash);});
  document.fonts.ready.then(queueOutline);
  selectAnchor(location.hash);
  updateOutline();
}

const stage=document.querySelector('[data-flywheel]');
if(stage){
  const observer=new IntersectionObserver(async entries=>{
    if(!entries.some(e=>e.isIntersecting))return;
    observer.disconnect();
    try{const {mountFlywheel}=await import('./flywheel.js');mountFlywheel(stage);}
    catch(error){console.warn('Learning loop unavailable; the research content remains readable.',error);}
  },{rootMargin:'150px'});
  observer.observe(stage);
}
