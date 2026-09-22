import * as THREE from 'three';

export function mountFlywheel(stage){
  const canvas=stage.querySelector('canvas');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch{return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.45;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(34,1,.1,50);camera.position.set(0,.25,7.8);
  scene.add(new THREE.HemisphereLight(0xf5f7ff,0x6a7899,3.2));
  const key=new THREE.DirectionalLight(0xffffff,4.5);key.position.set(-3,5,5);scene.add(key);
  const fill=new THREE.DirectionalLight(0x8faeff,2.5);fill.position.set(4,-2,3);scene.add(fill);
  const rimLight=new THREE.DirectionalLight(0xffffff,3);rimLight.position.set(1,2,-4);scene.add(rimLight);
  const orientation=new THREE.Group();orientation.rotation.set(.72,-.32,-.32);scene.add(orientation);
  const wheel=new THREE.Group();orientation.add(wheel);
  const metal=new THREE.MeshStandardMaterial({color:0x8197ba,metalness:.72,roughness:.26});
  const edge=new THREE.MeshStandardMaterial({color:0xc6d4ee,metalness:.65,roughness:.22});
  const blue=new THREE.MeshStandardMaterial({color:0x426ae3,metalness:.55,roughness:.24});
  const ringShape=(outer,inner)=>{const s=new THREE.Shape();s.absarc(0,0,outer,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);s.holes.push(hole);return s;};
  const annulus=new THREE.ExtrudeGeometry(ringShape(1.48,1.13),{depth:.15,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.035,bevelThickness:.035,curveSegments:120});
  annulus.center();wheel.add(new THREE.Mesh(annulus,metal));
  for(const r of [1.47,1.14]){const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.015,12,150),edge);ring.position.z=.115;wheel.add(ring);}
  const inner=new THREE.Mesh(new THREE.TorusGeometry(.87,.04,16,150),edge);inner.position.z=-.035;wheel.add(inner);
  const hub=new THREE.Mesh(new THREE.ExtrudeGeometry(ringShape(.29,.13),{depth:.25,bevelEnabled:true,bevelSegments:3,bevelSize:.028,bevelThickness:.025,curveSegments:64}),metal);hub.position.z=-.12;wheel.add(hub);
  for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3;
    const pts=[];for(let j=0;j<=15;j++){const t=j/15,r=.26+t*.9,theta=a+t*.19;pts.push(new THREE.Vector3(Math.cos(theta)*r,Math.sin(theta)*r,.005));}
    const curve=new THREE.CatmullRomCurve3(pts);wheel.add(new THREE.Mesh(new THREE.TubeGeometry(curve,24,.031,8,false),metal));
  }
  const tickGeometry=new THREE.BoxGeometry(.045,.008,.005);
  for(let i=0;i<96;i++){const a=i*Math.PI*2/96;const tick=new THREE.Mesh(tickGeometry,edge);tick.position.set(Math.cos(a)*1.34,Math.sin(a)*1.34,.116);tick.rotation.z=a;if(i%8===0)tick.scale.x=1.9;wheel.add(tick);}
  const activeArc=new THREE.Mesh(new THREE.TorusGeometry(1.468,.02,8,38,.44),blue);activeArc.position.z=.124;wheel.add(activeArc);
  const orbitPoints=Array.from({length:161},(_,i)=>{const a=i/160*Math.PI*2;return new THREE.Vector3(1.7*Math.cos(a),1.7*Math.sin(a),0);});
  const orbit=new THREE.Line(new THREE.BufferGeometry().setFromPoints(orbitPoints),new THREE.LineBasicMaterial({color:0xa7b5ce,transparent:true,opacity:.5}));orientation.add(orbit);
  const dots=[];
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3,dot=new THREE.Mesh(new THREE.SphereGeometry(.04,14,12),i===0?blue:edge);dot.position.set(1.7*Math.cos(a),1.7*Math.sin(a),0);orientation.add(dot);dots.push(dot);}
  let phase=Number(document.querySelector('[data-phase][aria-pressed="true"]').dataset.phase),rotation=0,targetRotation=.28,frame=0,visible=true,lastTime=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const story=stage.closest('[data-research-story]');
  let progress=0,targetProgress=0,scrollDirty=true;
  function setPose(){
    const p=reduced.matches?0:progress;
    orientation.rotation.set(.58+Math.sin(p*Math.PI)*.64,-.40+p*.82,-.30+p*.35);
    orientation.position.y=Math.sin(p*Math.PI)*.10;
    wheel.rotation.z=rotation+p*Math.PI*2*1.25;
  }
  function measureScroll(){
    scrollDirty=false;
    if(!story||reduced.matches){targetProgress=0;return;}
    const rect=story.getBoundingClientRect();
    const travel=Math.max(rect.height-stage.offsetHeight,window.innerHeight*.62);
    targetProgress=THREE.MathUtils.clamp((108-rect.top)/travel,0,1);
  }
  function render(){renderer.render(scene,camera);}
  const resize=new ResizeObserver(()=>{const r=stage.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();scrollDirty=true;start();});resize.observe(stage);
  function animate(time){frame=0;if(!visible||document.hidden)return;const delta=Math.min((time-lastTime)/1000,.04);lastTime=time;
    if(scrollDirty)measureScroll();
    if(!reduced.matches){rotation+=(targetRotation-rotation)*(1-Math.exp(-delta*5));progress+=(targetProgress-progress)*(1-Math.exp(-delta*8));}
    setPose();render();if(!reduced.matches&&(Math.abs(targetRotation-rotation)>.001||Math.abs(targetProgress-progress)>.0001))frame=requestAnimationFrame(animate);
  }
  function start(){if(!frame){lastTime=performance.now();frame=requestAnimationFrame(animate);}}
  function stop(){cancelAnimationFrame(frame);frame=0;}
  const changePhase=event=>{
    const next=event.detail.phase;if(next===phase)return;phase=next;
    dots.forEach((dot,i)=>dot.material=i===phase?blue:edge);
    targetRotation+=Math.PI*2/3;if(reduced.matches||!event.detail.animated){rotation=targetRotation;setPose();render();}else start();
  };
  stage.addEventListener('phasechange',changePhase);
  dots.forEach((dot,i)=>dot.material=i===phase?blue:edge);
  const onScroll=()=>{scrollDirty=true;if(visible&&!reduced.matches)start();};
  window.addEventListener('scroll',onScroll,{passive:true});
  const theme=()=>{const dark=document.documentElement.dataset.theme==='dark';blue.color.setHex(dark?0x2698ba:0xb509ac);metal.color.setHex(dark?0x8095ad:0x9cabc0);orbit.material.opacity=dark?.38:.5;render();};
  window.addEventListener('site-themechange',theme);theme();
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;visible?start():stop();});observer.observe(stage);
  const visibility=()=>{document.hidden?stop():start();};document.addEventListener('visibilitychange',visibility);
  const motionPreference=()=>{stop();scrollDirty=true;if(reduced.matches){rotation=targetRotation;progress=targetProgress=0;setPose();render();}else start();};
  reduced.addEventListener('change',motionPreference);
  // Keep the static text fallback useful if the GPU context is lost.
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();stop();stage.classList.remove('ready');});
  canvas.addEventListener('webglcontextrestored',()=>{stage.classList.add('ready');start();});
  measureScroll();progress=targetProgress;setPose();stage.classList.add('ready');render();start();
  window.addEventListener('pageshow',event=>{if(event.persisted){scrollDirty=true;start();}});
  window.addEventListener('pagehide',event=>{stop();if(event.persisted)return;resize.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('scroll',onScroll);window.removeEventListener('site-themechange',theme);reduced.removeEventListener('change',motionPreference);stage.removeEventListener('phasechange',changePhase);scene.traverse(object=>{object.geometry?.dispose();});[metal,edge,blue,orbit.material].forEach(m=>m.dispose());renderer.dispose();});
}
