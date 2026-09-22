import {BufferGeometry, Float32BufferAttribute} from 'three';

// A closed ribbon with one full twist and a rounded rectangular cross-section.
export function createLearningLoopGeometry(){
  const segments=288,sides=24,positions=[],silver=[],accent=[];
  const rounded=value=>Math.sign(value)*Math.pow(Math.abs(value),.55);
  for(let i=0;i<segments;i++){
    const angle=i/segments*Math.PI*2;
    const cos=Math.cos(angle),sin=Math.sin(angle),twist=angle+.32;
    for(let j=0;j<sides;j++){
      const cross=j/sides*Math.PI*2;
      const wide=.255*rounded(Math.cos(cross));
      const thin=.045*rounded(Math.sin(cross));
      const radial=wide*Math.cos(twist)-thin*Math.sin(twist);
      const depth=wide*Math.sin(twist)+thin*Math.cos(twist);
      positions.push((1.21+radial)*cos,(1.21+radial)*sin,depth+.07*Math.sin(angle*2));
    }
  }
  for(let i=0;i<segments;i++){
    const faces=i<30?accent:silver;
    for(let j=0;j<sides;j++){
      const a=i*sides+j,b=((i+1)%segments)*sides+j;
      const c=((i+1)%segments)*sides+(j+1)%sides,d=i*sides+(j+1)%sides;
      faces.push(a,b,d,b,c,d);
    }
  }
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new Float32BufferAttribute(positions,3));
  geometry.setIndex([...silver,...accent]);
  geometry.addGroup(0,silver.length,0);
  geometry.addGroup(silver.length,accent.length,1);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
