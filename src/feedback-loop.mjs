import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const clamp=value=>THREE.MathUtils.clamp(value,0,1);
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
const point=(x,y,z=0)=>new THREE.Vector3(x,y,z);
export const CYCLE_SECONDS=6.8;

// Three beads fan out to generate candidates; one candidate returns feedback per cycle.
export function createFeedbackLoop(){
  const group=new THREE.Group();
  const silverColor=new THREE.Color(),accentColor=new THREE.Color(),lineColor=new THREE.Color();
  const silver=new THREE.MeshPhysicalMaterial({metalness:.85,roughness:.28,clearcoat:.12,envMapIntensity:1.1});
  const topMaterial=silver.clone();
  const stroke=new THREE.MeshBasicMaterial({transparent:true,opacity:.5,depthWrite:false});
  const pulseMaterial=new THREE.MeshBasicMaterial({transparent:true,depthWrite:false});
  const generationMaterial=pulseMaterial.clone(),generationHaloMaterial=pulseMaterial.clone();
  const beadGeometry=new THREE.SphereGeometry(.038,20,14),haloGeometry=new THREE.SphereGeometry(.065,16,12);
  const arrowMaterial=stroke.clone();
  const markerMaterial=new THREE.MeshBasicMaterial();
  const layers=new THREE.Group();layers.position.x=-.93;layers.rotation.set(.16,.23,0);group.add(layers);
  const slabGeometry=new RoundedBoxGeometry(.82,.10,.62,3,.045);
  let top;
  for(let i=0;i<3;i++){
    const layer=new THREE.Mesh(slabGeometry,i===2?topMaterial:silver);
    layer.position.y=(i-1)*.18;layers.add(layer);if(i===2)top=layer;
  }

  const junction=point(1.44,1.03,-.03);
  const feedbackCurve=new THREE.CubicBezierCurve3(junction,point(.66,1.60,-.16),point(-1.74,1.42,-.20),point(-.96,.31,.045));
  const cards=[],paths=[],branches=[],routes=[],generationPulses=[];
  const cardGeometry=new RoundedBoxGeometry(.47,.33,.105,3,.038);
  for(let i=0;i<3;i++){
    const y=(1-i)*.59;
    const material=silver.clone();material.transparent=true;material.depthWrite=false;
    const card=new THREE.Mesh(cardGeometry,material);
    card.position.set(1.03,y,.045);card.rotation.y=-.10;group.add(card);cards.push(card);
    for(let j=0;j<2;j++){
      const mark=new THREE.Mesh(new THREE.BoxGeometry(j===0?.24:.15,.014,.007),markerMaterial);
      mark.position.set(j===0?0:-.045,.055-j*.105,.059);
      mark.scale.x=(j===0?[.82,1.08,.93]:[.80,1.16,.68])[i];card.add(mark);
    }
    const output=new THREE.CubicBezierCurve3(point(-.50,0),point(-.06,y*.08,.06),point(.37,y*.92,.06),point(.785,y,.045));
    const path=new THREE.Mesh(new THREE.TubeGeometry(output,48,.008,7,false),stroke.clone());
    group.add(path);paths.push(path);
    const pulse=new THREE.Mesh(beadGeometry,generationMaterial);
    pulse.name=`generate-pulse-${i}`;
    pulse.add(new THREE.Mesh(haloGeometry,generationHaloMaterial));
    group.add(pulse);generationPulses.push({mesh:pulse,curve:output});
    const branch=new THREE.CubicBezierCurve3(point(1.28,y,.05),point(1.66,y,.05),point(1.66,.86,-.02),junction);
    const branchMesh=new THREE.Mesh(new THREE.TubeGeometry(branch,48,.008,7,false),stroke.clone());
    group.add(branchMesh);branches.push(branchMesh);
    const route=new THREE.CurvePath();route.add(branch);route.add(feedbackCurve);routes.push(route);
  }
  const returnPath=new THREE.Mesh(new THREE.TubeGeometry(feedbackCurve,96,.010,8,false),stroke.clone());group.add(returnPath);
  const feedbackPulse=new THREE.Mesh(beadGeometry,pulseMaterial);
  feedbackPulse.name='feedback-pulse';group.add(feedbackPulse);
  const haloMaterial=pulseMaterial.clone();
  const halo=new THREE.Mesh(haloGeometry,haloMaterial);feedbackPulse.add(halo);
  const arrow=new THREE.Mesh(new THREE.ConeGeometry(.040,.105,12),arrowMaterial);
  arrow.position.copy(feedbackCurve.getPoint(.982));
  arrow.quaternion.setFromUnitVectors(point(0,1),feedbackCurve.getTangent(.982).normalize());group.add(arrow);

  const anchors={};
  for(const [name,position] of Object.entries({improve:point(-.96,-.52,.04),generate:point(-.02,-.48,.04),evaluate:point(1.03,-.91,.04),feedback:point(.03,1.49,-.08)})){
    const anchor=new THREE.Object3D();anchor.position.copy(position);group.add(anchor);anchors[name]=anchor;
  }
  let lastTime=0,dark=true;
  function setTime(seconds){
    lastTime=Math.max(0,seconds);
    const cycle=Math.floor(lastTime/CYCLE_SECONDS),p=(lastTime/CYCLE_SECONDS)%1;
    const candidate=[1,0,2][cycle%3];
    const generationTravel=clamp((p-.015)/.255);
    const generating=smooth(p/.025)*(1-smooth((p-.28)/.04));
    const generated=smooth((p-.23)/.045)*(1-smooth((p-.33)/.04));
    const selection=smooth((p-.30)/.08)*(1-smooth((p-.95)/.05));
    const arrival=smooth((p-.91)/.055)*(1-smooth((p-.965)/.035));
    const travel=clamp((p-.39)/.55);
    generationMaterial.opacity=smooth(p/.015)*(1-smooth((p-.265)/.025));
    generationHaloMaterial.opacity=generationMaterial.opacity*.14;
    topMaterial.color.copy(silverColor).lerp(accentColor,arrival*.85);
    top.scale.setScalar(1+arrival*.025);
    cards.forEach((card,i)=>{
      const selected=i===candidate;
      card.material.color.copy(silverColor).lerp(accentColor,selected?Math.max(generated*.22,selection*.65):generated*.22);
      card.material.opacity=selected?1:1-selection*.24;
      paths[i].material.color.copy(lineColor).lerp(accentColor,Math.max(generating*.75,selected?selection*.35:0));
      paths[i].material.opacity=Math.max(.23+generating*.42,selected?.38:.23);
      const pulse=generationPulses[i];
      pulse.mesh.visible=p<.29;
      pulse.curve.getPointAt(generationTravel,pulse.mesh.position);
      branches[i].material.color.copy(lineColor).lerp(accentColor,selected?selection*.8:0);
      branches[i].material.opacity=selected?.30+selection*.28:.16;
    });
    returnPath.material.color.copy(lineColor).lerp(accentColor,.6);
    returnPath.material.opacity=dark?.56:.65;
    // CurvePath maps distance across both segments, so the bead never jumps at the merge.
    routes[candidate].getPoint(travel,feedbackPulse.position);
    feedbackPulse.visible=p>=.39;
    pulseMaterial.opacity=smooth((p-.39)/.02)*(1-smooth((p-.97)/.03));
    haloMaterial.opacity=pulseMaterial.opacity*.14;
    arrowMaterial.opacity=.65+arrival*.35;
    const phase=p<.29?'generate':p<.39?'evaluate':p<.91?'feedback':'improve';
    return {candidate,phase,travel,generationTravel,cycle};
  }
  function setTheme(isDark){
    dark=isDark;
    silverColor.setHex(dark?0xcbd2d9:0xa5afb9);
    accentColor.setHex(dark?0x43adc3:0x277f9e);
    lineColor.setHex(dark?0x738693:0x8594a1);
    silver.color.copy(silverColor);
    markerMaterial.color.setHex(dark?0x465460:0x485968);
    [pulseMaterial,haloMaterial,generationMaterial,generationHaloMaterial,arrowMaterial].forEach(m=>m.color.copy(accentColor));
    [silver,topMaterial,...cards.map(c=>c.material)].forEach(m=>m.envMapIntensity=dark?1.1:.95);
    setTime(lastTime);
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
  return {group,anchors,setTime,setTheme,dispose};
}
