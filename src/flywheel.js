import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createLearningLoopGeometry} from './learning-loop.mjs';

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
  const silver=new THREE.MeshPhysicalMaterial({color:0xd3d8dc,metalness:1,roughness:.25,clearcoat:.15,clearcoatRoughness:.3,envMapIntensity:1.1});
  const accent=new THREE.MeshPhysicalMaterial({color:0x538ea0,metalness:.8,roughness:.3,clearcoat:.15,clearcoatRoughness:.3,envMapIntensity:1.1});
  const orientation=new THREE.Group();scene.add(orientation);
  const wheel=new THREE.Mesh(createLearningLoopGeometry(),[silver,accent]);
  orientation.add(wheel);

  const story=stage.closest('[data-research-story]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let phase=Number(document.querySelector('[data-phase][aria-pressed="true"]')?.dataset.phase||0);
  let rotation=phase*Math.PI*2/3,targetRotation=rotation,progress=0,targetProgress=0;
  let frame=0,lastTime=0,visible=true,scrollDirty=true,contextLost=false,disposed=false;
  function setPose(){
    const p=reduced.matches?0:progress;
    orientation.rotation.set(.23+Math.sin(p*Math.PI)*.6,-.55+p*.85,-.20+p*.12);
    wheel.rotation.z=rotation+p*Math.PI*1.35;
  }
  function measureScroll(){
    scrollDirty=false;
    if(!story||reduced.matches){targetProgress=0;return;}
    const rect=story.getBoundingClientRect();
    const travel=Math.max(rect.height-stage.offsetHeight,window.innerHeight*.62);
    targetProgress=THREE.MathUtils.clamp((92-rect.top)/travel,0,1);
  }
  function render(){if(!contextLost&&!disposed)renderer.render(scene,camera);}
  function animate(time){
    frame=0;
    if(!visible||document.hidden||contextLost||disposed)return;
    const delta=Math.min((time-lastTime)/1000,.04);lastTime=time;
    if(scrollDirty)measureScroll();
    if(!reduced.matches){
      rotation+=(targetRotation-rotation)*(1-Math.exp(-delta*8));
      progress+=(targetProgress-progress)*(1-Math.exp(-delta*9));
    }
    setPose();render();
    if(!reduced.matches&&(Math.abs(targetRotation-rotation)>.001||Math.abs(targetProgress-progress)>.0001))frame=requestAnimationFrame(animate);
  }
  function start(){
    if(!frame&&!contextLost&&!disposed&&visible&&!document.hidden){lastTime=performance.now();frame=requestAnimationFrame(animate);}
  }
  function stop(){cancelAnimationFrame(frame);frame=0;}
  const resize=new ResizeObserver(()=>{
    const {width,height}=stage.getBoundingClientRect();
    if(!width||!height)return;
    renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.updateProjectionMatrix();
    scrollDirty=true;start();
  });
  resize.observe(stage);
  const changePhase=event=>{
    const next=event.detail.phase;
    if(next===phase)return;
    const step=(next-phase+3)%3;phase=next;
    targetRotation+=step*Math.PI*2/3;
    if(reduced.matches||!event.detail.animated){rotation=targetRotation;setPose();render();}
    else start();
  };
  stage.addEventListener('phasechange',changePhase);
  const onScroll=()=>{scrollDirty=true;if(!reduced.matches)start();};
  window.addEventListener('scroll',onScroll,{passive:true});
  const theme=()=>{
    const dark=document.documentElement.dataset.theme==='dark';
    silver.color.setHex(dark?0xd3d8dc:0xa1a9b1);
    accent.color.setHex(dark?0x538ea0:0x56798d);
    silver.envMapIntensity=accent.envMapIntensity=dark?1.1:.95;
    render();
  };
  window.addEventListener('site-themechange',theme);theme();
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;visible?start():stop();});
  observer.observe(stage);
  const visibility=()=>{document.hidden?stop():start();};
  document.addEventListener('visibilitychange',visibility);
  const motionPreference=()=>{
    stop();scrollDirty=true;
    if(reduced.matches){rotation=targetRotation;progress=targetProgress=0;setPose();render();}
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
    stage.removeEventListener('phasechange',changePhase);
    canvas.removeEventListener('webglcontextlost',lost);
    canvas.removeEventListener('webglcontextrestored',restored);
    wheel.geometry.dispose();silver.dispose();accent.dispose();environment?.dispose();renderer.dispose();
  };
  window.addEventListener('pageshow',pageshow);
  window.addEventListener('pagehide',pagehide);
  measureScroll();progress=targetProgress;setPose();stage.classList.add('ready');start();
}
