const stage=document.querySelector('[data-flywheel]');
if(stage){
  const captions=['Generate candidate responses, behaviors, or solutions.','Evaluate outcomes and identify useful feedback.','Carry useful feedback into the next iteration.'];
  document.querySelectorAll('[data-phase]').forEach(button=>button.addEventListener('click',event=>{
    const phase=Number(button.dataset.phase);
    document.querySelectorAll('[data-phase]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.phase)===phase)));
    document.querySelector('.cycle-description').textContent=captions[phase];
    stage.dispatchEvent(new CustomEvent('phasechange',{detail:{phase,animated:event.detail!==0}}));
  }));
  const observer=new IntersectionObserver(async entries=>{
    if(!entries.some(entry=>entry.isIntersecting))return;
    observer.disconnect();
    try{const {mountFlywheel}=await import('./flywheel.js');mountFlywheel(stage);}catch(error){console.warn('Flywheel unavailable; the research content remains readable.',error);}
  },{rootMargin:'150px'});
  observer.observe(stage);
}
