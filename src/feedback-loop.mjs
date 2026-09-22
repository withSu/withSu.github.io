import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const clamp=value=>THREE.MathUtils.clamp(value,0,1);
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
const point=(x,y,z=0)=>new THREE.Vector3(x,y,z);

// An illustrative loop: generate alternatives, evaluate, return feedback, regenerate.
export function createFeedbackLoop(){
  const group=new THREE.Group();
  const silverColor=new THREE.Color(),accentColor=new THREE.Color(),lineColor=new THREE.Color();
  const silver=new THREE.MeshPhysicalMaterial({metalness:.85,roughness:.28,clearcoat:.12,envMapIntensity:1.1});
  const topMaterial=silver.clone();
  const stroke=new THREE.MeshBasicMaterial({transparent:true,opacity:.5,depthWrite:false});
  const feedbackMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:1,depthWrite:false});
  const arrowMaterial=feedbackMaterial.clone();
  const markerMaterial=new THREE.MeshBasicMaterial();
  const beadGeometry=new THREE.SphereGeometry(.035,16,12);
  const layers=new THREE.Group();layers.position.x=-.93;layers.rotation.set(.16,.23,0);group.add(layers);
  const slabGeometry=new RoundedBoxGeometry(.82,.10,.62,3,.045);
  let top;
  for(let i=0;i<3;i++){
    const layer=new THREE.Mesh(slabGeometry,i===2?topMaterial:silver);
    layer.position.y=(i-1)*.18;layers.add(layer);if(i===2)top=layer;
  }

  const cards=[],paths=[],pulses=[],marks=[];
  const cardGeometry=new RoundedBoxGeometry(.47,.33,.105,3,.038);
  for(let i=0;i<3;i++){
    const y=(1-i)*.59;
    const material=silver.clone();material.transparent=true;material.depthWrite=false;
    const card=new THREE.Mesh(cardGeometry,material);
    card.position.set(1.03,y,.045);card.rotation.y=-.10;group.add(card);cards.push(card);
    const cardMarks=[];
    for(let j=0;j<2;j++){
      const mark=new THREE.Mesh(new THREE.BoxGeometry(j===0?.24:.15,.014,.007),markerMaterial);
      mark.position.set(j===0?0:-.045,.055-j*.105,.059);card.add(mark);cardMarks.push(mark);
    }
    marks.push(cardMarks);
    const curve=new THREE.CubicBezierCurve3(point(-.50,0),point(-.06,y*.08,.06),point(.37,y*.92,.06),point(.785,y,.045));
    const path=new THREE.Mesh(new THREE.TubeGeometry(curve,48,.009,7,false),stroke.clone());
    group.add(path);paths.push(path);
    const pulse=new THREE.Mesh(beadGeometry,feedbackMaterial);group.add(pulse);pulses.push({mesh:pulse,curve});
  }

  const feedbackCurve=new THREE.CubicBezierCurve3(point(1.28,0,.05),point(2.04,1.48,-.16),point(-1.76,1.62,-.25),point(-.96,.31,.045));
  const returnPath=new THREE.Mesh(new THREE.TubeGeometry(feedbackCurve,96,.009,8,false),stroke.clone());group.add(returnPath);
  const trail=new THREE.Mesh(new THREE.TubeGeometry(feedbackCurve,96,.014,8,false),feedbackMaterial);group.add(trail);
  const feedbackPulse=new THREE.Mesh(beadGeometry,feedbackMaterial);feedbackPulse.scale.setScalar(1.25);group.add(feedbackPulse);
  const arrow=new THREE.Mesh(new THREE.ConeGeometry(.042,.115,12),arrowMaterial);
  arrow.position.copy(feedbackCurve.getPoint(.982));
  arrow.quaternion.setFromUnitVectors(point(0,1),feedbackCurve.getTangent(.982).normalize());
  group.add(arrow);

  const anchors={};
  for(const [name,position] of Object.entries({model:point(-.96,-.61,.04),candidates:point(1.03,-.94,.04),feedback:point(.05,1.39,-.05)})){
    const anchor=new THREE.Object3D();anchor.position.copy(position);group.add(anchor);anchors[name]=anchor;
  }
  let lastProgress=0,dark=true;
  function setProgress(progress){
    const p=clamp(progress);lastProgress=p;
    const evaluated=smooth((p-.31)/.24);
    const returned=smooth((p-.62)/.27);
    const updated=smooth((p-.82)/.09);
    const regenerated=smooth((p-.92)/.08);
    topMaterial.color.copy(silverColor).lerp(accentColor,updated*.82);
    top.scale.setScalar(1+Math.sin(updated*Math.PI)*.045);
    cards.forEach((card,i)=>{
      const selected=i===1;
      card.material.color.copy(silverColor).lerp(accentColor,selected?evaluated*(1-regenerated)*.88:0);
      card.material.opacity=selected?1:1-evaluated*(1-regenerated)*.73;
      paths[i].material.color.copy(lineColor).lerp(accentColor,selected?evaluated*(1-regenerated)+regenerated*.5:regenerated*.5);
      paths[i].material.opacity=selected?.35+evaluated*(1-regenerated)*.4+regenerated*.1:.4-evaluated*(1-regenerated)*.27;
      const pulse=pulses[i];
      pulse.mesh.visible=p<.33||p>.92;
      const travel=p<.33?clamp(.13+i*.11+p*2.1):regenerated;
      pulse.curve.getPoint(travel,pulse.mesh.position);
      marks[i][0].scale.x=[.82,1.08,.93][i]+regenerated*[.22,-.12,.17][i];
      marks[i][1].scale.x=[.80,1.16,.68][i]+regenerated*[.38,-.08,.36][i];
    });
    returnPath.material.color.copy(lineColor);returnPath.material.opacity=dark?.27:.35;
    const count=Math.floor(returned*96)*8*6;
    trail.geometry.setDrawRange(0,count);
    trail.visible=p>.62;feedbackPulse.visible=p>.62&&returned<.997;
    feedbackCurve.getPoint(returned,feedbackPulse.position);
    arrowMaterial.opacity=.23+returned*.77;
    return {phase:Math.min(2,Math.floor(p*3)),updated:updated>.9,nextCandidates:regenerated>.25};
  }
  function setTheme(isDark){
    dark=isDark;
    silverColor.setHex(dark?0xcbd2d9:0xa5afb9);
    accentColor.setHex(dark?0x43adc3:0x277f9e);
    lineColor.setHex(dark?0x738693:0x8594a1);
    silver.color.copy(silverColor);
    markerMaterial.color.setHex(dark?0x465460:0x485968);
    feedbackMaterial.color.copy(accentColor);arrowMaterial.color.copy(accentColor);
    [silver,topMaterial,...cards.map(c=>c.material)].forEach(m=>m.envMapIntensity=dark?1.1:.95);
    setProgress(lastProgress);
  }
  function dispose(){
    const geometries=new Set(),materials=new Set([stroke]);
    group.traverse(object=>{
      if(object.geometry)geometries.add(object.geometry);
      if(object.material)for(const m of Array.isArray(object.material)?object.material:[object.material])materials.add(m);
    });
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  }
  setTheme(true);
  return {group,anchors,setProgress,setTheme,dispose};
}
