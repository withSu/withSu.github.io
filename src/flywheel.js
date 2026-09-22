import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createFeedbackLoop} from './feedback-loop.mjs';

export function mountFlywheel(stage){
  const canvas=stage.querySelector('canvas');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(34,1,.1,30);
  camera.position.set(0,0,5.9);
  let environment;
  function lightStudio(){
    environment?.dispose();
    const room=new RoomEnvironment();
    const generator=new THREE.PMREMGenerator(renderer);
    try{environment=generator.fromScene(room,.04,.1,100,{size:128});scene.environment=environment.texture;}
    finally{room.dispose();generator.dispose();}
  }
  try{lightStudio();}catch{renderer.dispose();return;}

  scene.add(new THREE.HemisphereLight(0xffffff,0x34383f,.5));
  const key=new THREE.DirectionalLight(0xffffff,2);
  key.position.set(-3,5,4);scene.add(key);
  const fill=new THREE.DirectionalLight(0xe5edf5,.8);
  fill.position.set(3,-2,3);scene.add(fill);
  const diagram=createFeedbackLoop();
  const orientation=new THREE.Group();scene.add(orientation);orientation.add(diagram.group);
  const labelNodes=Object.fromEntries([...stage.querySelectorAll('[data-learning-label]')].map(el=>[el.dataset.learningLabel,el]));
  const projected=new THREE.Vector3();
  let stageWidth=0,stageHeight=0;

  const story=stage.closest('[data-research-story]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let phase='',progress=0,targetProgress=0,elapsed=0;
  let frame=0,lastTime=0,visible=true,scrollDirty=true,contextLost=false,disposed=false;
  function setPose(){
    const p=reduced.matches?0:progress;
    orientation.rotation.set(.20+Math.sin(p*Math.PI)*.16,-.18+p*.38,-.015+p*.025);
    const state=diagram.setTime(reduced.matches?4.3:elapsed);
    if(state.phase!==phase){
      phase=state.phase;
      for(const [name,node] of Object.entries(labelNodes))node.dataset.active=String(name===phase);
    }
    orientation.updateMatrixWorld(true);camera.updateMatrixWorld();
    for(const [name,node] of Object.entries(labelNodes)){
      projected.setFromMatrixPosition(diagram.anchors[name].matrixWorld).project(camera);
      node.style.transform=`translate3d(${(projected.x*.5+.5)*stageWidth}px,${(-projected.y*.5+.5)*stageHeight}px,0) translate(-50%,-50%)`;
    }
  }
  function measureScroll(){
    scrollDirty=false;
    if(!story||reduced.matches){targetProgress=0;return;}
    const rect=story.getBoundingClientRect();
    const visual=stage.closest('.research-visual');
    const travel=Math.max(rect.height-(visual?.offsetHeight||stage.offsetHeight),window.innerHeight*.35);
    targetProgress=THREE.MathUtils.clamp((76-rect.top)/travel,0,1);
  }
  function render(){if(!contextLost&&!disposed)renderer.render(scene,camera);}
  function animate(time){
    frame=0;
    if(!visible||document.hidden||contextLost||disposed)return;
    const delta=Math.min((time-lastTime)/1000,.04);lastTime=time;
    if(scrollDirty)measureScroll();
    if(!reduced.matches){
      elapsed+=delta;
      progress+=(targetProgress-progress)*(1-Math.exp(-delta*9));
    }
    setPose();render();
    if(!reduced.matches)frame=requestAnimationFrame(animate);
  }
  function start(){
    if(!frame&&!contextLost&&!disposed&&visible&&!document.hidden){lastTime=performance.now();frame=requestAnimationFrame(animate);}
  }
  function stop(){cancelAnimationFrame(frame);frame=0;}
  const updateSize=()=>{
    const {width,height}=stage.getBoundingClientRect();
    if(!width||!height)return;
    stageWidth=width;stageHeight=height;renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.updateProjectionMatrix();
    scrollDirty=true;start();
  };
  const resize=new ResizeObserver(updateSize);
  resize.observe(stage);updateSize();
  const onScroll=()=>{if(reduced.matches)return;scrollDirty=true;start();};
  window.addEventListener('scroll',onScroll,{passive:true});
  const theme=()=>{diagram.setTheme(document.documentElement.dataset.theme==='dark');render();};
  window.addEventListener('site-themechange',theme);theme();
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;visible?start():stop();});
  observer.observe(stage);
  const visibility=()=>{document.hidden?stop():start();};
  document.addEventListener('visibilitychange',visibility);
  const motionPreference=()=>{
    stop();scrollDirty=true;
    if(reduced.matches){progress=targetProgress=0;setPose();render();}
    else start();
  };
  reduced.addEventListener('change',motionPreference);
  const lost=event=>{event.preventDefault();contextLost=true;stop();stage.classList.remove('ready');};
  const restored=()=>{
    contextLost=false;
    try{lightStudio();stage.classList.add('ready');scrollDirty=true;start();}
    catch{stage.classList.remove('ready');}
  };
  canvas.addEventListener('webglcontextlost',lost);
  canvas.addEventListener('webglcontextrestored',restored);
  const pageshow=event=>{if(event.persisted){scrollDirty=true;start();}};
  const pagehide=event=>{
    stop();if(event.persisted)return;
    disposed=true;resize.disconnect();observer.disconnect();
    document.removeEventListener('visibilitychange',visibility);
    window.removeEventListener('scroll',onScroll);
    window.removeEventListener('site-themechange',theme);
    window.removeEventListener('pageshow',pageshow);
    window.removeEventListener('pagehide',pagehide);
    reduced.removeEventListener('change',motionPreference);
    canvas.removeEventListener('webglcontextlost',lost);
    canvas.removeEventListener('webglcontextrestored',restored);
    diagram.dispose();environment?.dispose();renderer.dispose();
  };
  window.addEventListener('pageshow',pageshow);
  window.addEventListener('pagehide',pagehide);
  measureScroll();progress=targetProgress;setPose();stage.classList.add('ready');start();
}
