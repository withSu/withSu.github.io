import * as THREE from 'three';
const V=(x,y,z=0)=>new THREE.Vector3(x,y,z);
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
export const CYCLE_SECONDS=12.8;
const layerX=[-.72,-.36,0,.36,.72];
export function createFeedbackLoop(){
  const group=new THREE.Group();
  const neutral=new THREE.Color(0xa8bac2),accent=new THREE.Color(0x67c9d8);
  const sphere=new THREE.SphereGeometry(.023,12,8);
  const pulseSphere=new THREE.SphereGeometry(.035,18,12);
  const ringGeometry=new THREE.RingGeometry(.065,.073,48);
  const layers=[],wires=[],routes=[],outputs=[],pulses=[];
  const source=V(-1.30,0,.12);
  const sourceMesh=new THREE.Mesh(sphere,new THREE.MeshBasicMaterial({color:0xb4c9d1}));sourceMesh.position.copy(source);group.add(sourceMesh);
  function curve(a,b){return new THREE.CubicBezierCurve3(a,a.clone().lerp(b,.34),a.clone().lerp(b,.67),b);}
  function wire(c,opacity=.13,radius=.003){const m=new THREE.Mesh(new THREE.TubeGeometry(c,28,radius,5,false),new THREE.MeshBasicMaterial({color:0x76959f,transparent:true,opacity,depthWrite:false}));group.add(m);return m;}
  function pulse(name){const m=new THREE.Mesh(pulseSphere,new THREE.MeshBasicMaterial({color:0xc9f8fb,transparent:true,depthWrite:false}));m.name=name;const halo=new THREE.Mesh(new THREE.SphereGeometry(.075,12,8),new THREE.MeshBasicMaterial({color:0x67c9d8,transparent:true,opacity:.12,depthWrite:false}));m.add(halo);group.add(m);return m;}
  // Visual and text token streams meet before entering the shared MLLM.
  const imageTint=new THREE.Color(0x79c5d7),textTint=new THREE.Color(0xb2add3);
  const imageOrigin=V(-2.27,.57,.12),textOrigin=V(-2.27,-.45,.12);
  const imageIcon=new THREE.Group();imageIcon.position.copy(imageOrigin);group.add(imageIcon);
  const textIcon=new THREE.Group();textIcon.position.copy(textOrigin);group.add(textIcon);
  function iconLine(parent,points,color){const m=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:true,opacity:.8}));parent.add(m);return m;}
  iconLine(imageIcon,[V(-.21,-.16),V(.21,-.16),V(.21,.16),V(-.21,.16),V(-.21,-.16)],0x79c5d7);
  iconLine(imageIcon,[V(-.17,-.10),V(-.04,.045),V(.065,-.065),V(.12,-.012),V(.18,-.10)],0x79c5d7);
  const sun=new THREE.Mesh(new THREE.CircleGeometry(.026,20),new THREE.MeshBasicMaterial({color:0x79c5d7}));sun.position.set(.11,.085,.005);imageIcon.add(sun);
  [.37,.26,.33].forEach((w,i)=>{const bar=new THREE.Mesh(new THREE.PlaneGeometry(w,.022),new THREE.MeshBasicMaterial({color:0xb2add3,transparent:true,opacity:.8}));bar.position.set((w-.37)/2,.09-i*.09,0);textIcon.add(bar);});
  const inputCurves=[imageOrigin,textOrigin].map(origin=>new THREE.CubicBezierCurve3(origin.clone().add(V(.25,0,0)),origin.clone().add(V(.68,0,0)),source.clone().add(V(-.34,0,.04)),source));
  const inputWires=inputCurves.map((c,i)=>{const w=wire(c,.29,.004);w.material.color.copy(i?textTint:imageTint);return w;});
  const inputPulses=inputCurves.flatMap((c,i)=>[0,1,2].map(j=>{const m=pulse((i?'text':'image')+'-token-'+j);m.material.color.copy(i?textTint:imageTint);m.children[0].material.color.copy(i?textTint:imageTint);return {mesh:m,curve:c,stream:i,offset:j*.22};}));
  const joinHalo=new THREE.Mesh(new THREE.SphereGeometry(.10,20,16),new THREE.MeshBasicMaterial({color:0x8acfd9,transparent:true,opacity:0,depthWrite:false}));joinHalo.position.copy(source);group.add(joinHalo);
  const vertexShader=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const fragmentShader=`varying vec2 vUv;uniform vec3 color;uniform float activity;uniform float age;uniform vec2 hit0;uniform vec2 hit1;uniform vec2 hit2;void main(){vec2 edge=min(vUv,1.-vUv);float border=1.-smoothstep(.005,.014,min(edge.x,edge.y));vec2 grid=abs(fract(vUv*8.-.5)-.5);float lines=(1.-smoothstep(.0,.012,min(grid.x,grid.y)))*.035;float d=min(distance(vUv,hit0),min(distance(vUv,hit1),distance(vUv,hit2)));float glow=exp(-d*d*38.);float wave=exp(-pow((d-age*.62)*13.,2.))*(1.-age);float glass=.039+.028*vUv.y;float alpha=glass+lines+border*(.28+activity*.28)+activity*(glow*.33+wave*.36);gl_FragColor=vec4(color,alpha);}`;
  for(let i=0;i<5;i++){
    const plate=new THREE.Group();plate.position.set(layerX[i],(i-2)*.085,-i*.10);plate.rotation.y=.98;group.add(plate);
    const hits=[0,1,2].map(b=>new THREE.Vector2(.2+((i+b)%3)*.3,.8-((b+i)%3)*.3));
    const uniforms={color:{value:new THREE.Color(0x89b8c4)},activity:{value:0},age:{value:0},hit0:{value:hits[0]},hit1:{value:hits[1]},hit2:{value:hits[2]}};
    const sheet=new THREE.Mesh(new THREE.PlaneGeometry(.58,1.32),new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms,transparent:true,side:THREE.DoubleSide,depthWrite:false}));plate.add(sheet);
    const nodes=[];
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){
      const m=new THREE.Mesh(sphere,new THREE.MeshBasicMaterial({color:0x91a7b0,transparent:true,opacity:.56,depthWrite:false}));m.position.set((.2+col*.3-.5)*.58,(.8-row*.3-.5)*1.32,.012);plate.add(m);nodes.push(m);
    }
    const hitNodes=[0,1,2].map(b=>nodes[((b+i)%3)*3+(i+b)%3]);
    group.updateMatrixWorld(true);
    const points=nodes.map(n=>n.getWorldPosition(new THREE.Vector3()));
    layers.push({plate,sheet,nodes,points,hitNodes,uniforms});
  }
  for(let i=0;i<4;i++)for(let row=0;row<3;row++)for(let col=0;col<3;col++){
    const a=layers[i].points[row*3+col];
    const b=layers[i+1].points[row*3+(col+1)%3];
    wires.push(wire(curve(a,b),.12,.002));
  }
  const outputX=1.63;
  for(let b=0;b<3;b++){
    const end=V(outputX,(1-b)*.48,.02);
    const points=[source,...layers.map((l,i)=>l.points[((b+i)%3)*3+(i+b)%3]),end];
    const segments=points.slice(1).map((p,i)=>curve(points[i],p));
    const meshes=segments.map(c=>wire(c,.21,.004));
    routes.push({points,segments,meshes});
    const node=new THREE.Mesh(new THREE.SphereGeometry(.050,24,16),new THREE.MeshBasicMaterial({color:0x94b4bf,transparent:true,opacity:.72,depthWrite:false}));node.position.copy(end);group.add(node);
    const ring=new THREE.Mesh(ringGeometry,new THREE.MeshBasicMaterial({color:0x67c9d8,transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false}));ring.position.copy(end);group.add(ring);
    outputs.push({node,ring});
    pulses.push(pulse('generation-signal-'+b));
  }
  const junction=V(1.85,1.04,-.10);
  const inputJunction=V(-2.77,.94,.05);
  const feedback=new THREE.CubicBezierCurve3(junction,V(.68,1.83,-.28),V(-2.46,1.85,-.15),inputJunction);
  const returnWire=wire(feedback,.28,.006);
  const feedbackRoutes=outputs.map(({node})=>{const branch=new THREE.CubicBezierCurve3(node.position,node.position.clone().add(V(.40,0,0)),V(2.12,.76,-.03),junction);const branchMesh=wire(branch,.13,.004);const path=new THREE.CurvePath();path.add(branch);path.add(feedback);return {path,mesh:branchMesh};});
  const feedbackPulse=pulse('feedback-signal');
  const revisitCurves=[
    new THREE.CubicBezierCurve3(inputJunction,V(-2.89,.78,.05),V(-2.85,.57,.12),imageOrigin.clone().add(V(-.23,0,0))),
    new THREE.CubicBezierCurve3(inputJunction,V(-3.15,.64,.05),V(-3.04,-.45,.12),textOrigin.clone().add(V(-.23,0,0)))
  ];
  const revisitWires=revisitCurves.map((c,i)=>{const m=wire(c,.25,.005);m.material.color.copy(i?textTint:imageTint);return m;});
  const revisitPulses=revisitCurves.map((c,i)=>{const m=pulse(i?'feedback-to-text':'feedback-to-image');m.material.color.copy(i?textTint:imageTint);m.children[0].material.color.copy(i?textTint:imageTint);return m;});
  const returnArrows=revisitCurves.map((c,i)=>{const arrow=new THREE.Mesh(new THREE.ConeGeometry(.024,.070,12),new THREE.MeshBasicMaterial({color:i?textTint:imageTint,transparent:true,opacity:.7}));arrow.position.copy(c.getPoint(.88));arrow.quaternion.setFromUnitVectors(V(0,1),c.getTangent(.88).normalize());group.add(arrow);return arrow;});
  const anchors={};
  for(const [name,pos] of Object.entries({image:V(-2.27,.21,.1),text:V(-2.27,-.79,.1),layers:V(.05,-1.00,0),evaluate:V(1.63,-.83,.02),feedback:V(-.24,1.67,-.1)})){const a=new THREE.Object3D();a.position.copy(pos);group.add(a);anchors[name]=a;}
  function setTime(seconds){
    seconds=Number.isFinite(seconds)?Math.max(0,seconds):0;
    const cycle=Math.floor(seconds/CYCLE_SECONDS),inputTime=seconds%CYCLE_SECONDS,t=Math.max(0,inputTime-1.6),candidate=[1,0,2][cycle%3];
    for(const p of inputPulses){const local=(inputTime-.10-p.offset)/.87;p.mesh.visible=local>=0&&local<=1;p.curve.getPoint(smooth(local),p.mesh.position);p.mesh.scale.setScalar(.62*(1-smooth((local-.80)/.20))+.12);p.mesh.material.opacity=smooth(local/.08)*(1-smooth((local-.92)/.08));}
    const joining=smooth((inputTime-.85)/.20)*(1-smooth((inputTime-1.48)/.26));joinHalo.material.opacity=joining*.20;joinHalo.scale.setScalar(.65+joining*.7);sourceMesh.scale.setScalar(1+joining*.65);
    const forward=t<4.8,returning=t>=5.65&&t<8.15,revisiting=t>=8.15;
    const forwardP=clamp((t-.15)/4.2)*6;
    const segment=Math.min(5,Math.floor(forwardP)),fraction=forwardP-segment;
    const returnP=clamp((t-5.65)/2.5);
    layers.forEach((l,i)=>{
      const genAge=(t-(.15+(i+1)*.7))/.58;
      const ga=genAge>=0&&genAge<1?Math.sin(Math.PI*genAge)*.76:0;
      const activity=ga;
      l.uniforms.activity.value=activity;l.uniforms.age.value=clamp(genAge);
      l.nodes.forEach(node=>{const hit=l.hitNodes.includes(node);const a=hit?ga:ga*.1;node.material.color.copy(neutral).lerp(accent,a);node.material.opacity=.42+a*.58;node.scale.setScalar(1+a*.75);});
    });
    for(let b=0;b<3;b++){
      const m=pulses[b];m.visible=forward&&t>.15;
      routes[b].segments[segment].getPoint(smooth(fraction),m.position);
      const absorb=1-smooth((fraction-.74)/.26),emit=smooth(fraction/.21);
      m.scale.setScalar(.22+.78*Math.min(absorb,emit));m.material.opacity=smooth(t/.2)*(1-smooth((t-4.35)/.3));
      routes[b].meshes.forEach((mesh,i)=>{const active=forward&&i===segment;mesh.material.color.copy(neutral).lerp(accent,active?.7:.15);mesh.material.opacity=active?.33:.13;});
      const selected=b===candidate,evalAmount=smooth((t-4.45)/.7)*(1-smooth((t-10.85)/.3));
      outputs[b].node.material.color.copy(neutral).lerp(accent,selected?evalAmount:0);
      outputs[b].node.material.opacity=selected?.65+evalAmount*.35:.6-evalAmount*.3;
      outputs[b].ring.material.opacity=selected?.14+evalAmount*.60:.10;
      outputs[b].ring.scale.setScalar(selected?1+evalAmount*.45:1);
      feedbackRoutes[b].mesh.material.opacity=selected&&t>5?.35:.10;
    }
    feedbackPulse.visible=returning;feedbackRoutes[candidate].path.getPoint(returnP,feedbackPulse.position);
    feedbackPulse.scale.setScalar(1-smooth((returnP-.92)/.08)*.8);
    returnWire.material.opacity=returning?.45:.24;
    const revisitProgress=clamp((t-8.15)/1.30);
    revisitPulses.forEach((m,i)=>{m.visible=revisiting&&revisitProgress<1;revisitCurves[i].getPointAt(revisitProgress,m.position);m.scale.setScalar(1-smooth((revisitProgress-.82)/.18)*.8);m.material.opacity=1-smooth((revisitProgress-.93)/.07);revisitWires[i].material.opacity=revisiting?.48:.23;});
    const receipt=smooth((t-9.20)/.25)*(1-smooth((t-10.60)/.55));
    [imageIcon,textIcon].forEach(icon=>{icon.scale.setScalar(1+receipt*.035);icon.traverse(o=>{if(o.material&&o.material.transparent)o.material.opacity=.8+receipt*.2;});});
    const phase=inputTime<1.6?'encode':t<4.5?'generate':t<5.65?'evaluate':t<8.15?'feedback':'revisit';
    return {phase,candidate,cycle,t,inputTime};
  }
  function setTheme(dark){
    neutral.setHex(dark?0xa8bac2:0x45616e);accent.setHex(dark?0x67c9d8:0x167a96);
    layers.forEach(l=>l.uniforms.color.value.setHex(dark?0x89b8c4:0x366d83));
    imageTint.setHex(dark?0x79c5d7:0x1d7b94);textTint.setHex(dark?0xb2add3:0x7764a0);
    imageIcon.traverse(o=>{if(o.material)o.material.color.copy(imageTint);});textIcon.traverse(o=>{if(o.material)o.material.color.copy(textTint);});
    inputWires.forEach((w,i)=>w.material.color.copy(i?textTint:imageTint));inputPulses.forEach(p=>{p.mesh.material.color.copy(p.stream?textTint:imageTint);p.mesh.children[0].material.color.copy(p.stream?textTint:imageTint);});
    revisitPulses.forEach((m,i)=>{m.material.color.copy(i?textTint:imageTint);m.children[0].material.color.copy(i?textTint:imageTint);revisitWires[i].material.color.copy(i?textTint:imageTint);returnArrows[i].material.color.copy(i?textTint:imageTint);});
    [...pulses,feedbackPulse].forEach(p=>{p.material.color.setHex(dark?0xc9f8fb:0x167a96);p.children[0].material.color.copy(accent);});
  }
  function dispose(){const geos=new Set(),mats=new Set();group.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)mats.add(o.material);});geos.forEach(x=>x.dispose());mats.forEach(x=>x.dispose());}
  setTime(0);
  return {group,anchors,setTime,setTheme,dispose};
}
