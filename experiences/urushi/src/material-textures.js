import { DataTexture, RGBAFormat, UnsignedByteType, RepeatWrapping, LinearMipmapLinearFilter, LinearFilter } from 'three';

/** Fixed-seed material field. Never re-seeded on scroll, resize or restore. */
export function generateMaterialField(size=256) {
  const data = new Uint8Array(size*size*4);
  let seed=0x4c414351;
  const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const i=(y*size+x)*4;
    data[i]=Math.floor(random()*256);
    data[i+1]=Math.floor(random()*256);
    data[i+2]=Math.floor(random()*256);
    data[i+3]=255;
  }
  return data;
}

export function makeMaterialField(size=256) {
  const texture=new DataTexture(generateMaterialField(size),size,size,RGBAFormat,UnsignedByteType);
  texture.name='Original fixed-seed lacquer microstructure';
  texture.wrapS=texture.wrapT=RepeatWrapping;
  texture.magFilter=LinearFilter;
  texture.minFilter=LinearMipmapLinearFilter;
  texture.generateMipmaps=true;
  texture.needsUpdate=true;
  return texture;
}
