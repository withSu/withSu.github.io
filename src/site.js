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

const stage=document.querySelector('[data-flywheel]');
if(stage){
  const captions=['Generate several candidate responses or solutions.','Evaluate candidates and extract useful feedback.','Use feedback to update the model and inform the next generation.'];
  const buttons=[...document.querySelectorAll('[data-phase]')];
  function showPhase(phase){buttons.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.phase)===phase)));document.querySelector('.cycle-description').textContent=captions[phase];}
  buttons.forEach(button=>button.addEventListener('click',event=>{const phase=Number(button.dataset.phase);showPhase(phase);stage.dispatchEvent(new CustomEvent('phasechange',{detail:{phase,animated:event.detail!==0}}));}));
  stage.addEventListener('learningphasechange',event=>showPhase(event.detail.phase));
  const observer=new IntersectionObserver(async entries=>{
    if(!entries.some(e=>e.isIntersecting))return;
    observer.disconnect();
    try{const {mountFlywheel}=await import('./flywheel.js');mountFlywheel(stage);}
    catch(error){console.warn('Learning loop unavailable; the research content remains readable.',error);}
  },{rootMargin:'150px'});
  observer.observe(stage);
}
