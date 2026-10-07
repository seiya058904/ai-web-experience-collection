import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createVesselData } from '../src/geometry.js';
import { generateMaterialField } from '../src/material-textures.js';
import { deflateSync } from 'node:zlib';

const directory = new URL('../public/models/', import.meta.url);
const profile = JSON.parse(await readFile(new URL('vessel-profile.json', directory), 'utf8'));
const mesh = createVesselData(profile);
const lines = [
  '# URUSHI — Layers of Lacquer',
  '# Original closed vessel. Same profile and geometry as the live renderer.',
  '# MIT License. Coordinates are artistic units, +Y up. See the root LICENSE.',
  'o URUSHI_Pebble_Vessel',
];
const n = value => Number(value.toFixed(7)).toString();
for (let i=0;i<mesh.positions.length;i+=3) lines.push(`v ${n(mesh.positions[i])} ${n(mesh.positions[i+1])} ${n(mesh.positions[i+2])}`);
for (let i=0;i<mesh.uvs.length;i+=2) lines.push(`vt ${n(mesh.uvs[i])} ${n(mesh.uvs[i+1])}`);
for (let i=0;i<mesh.normals.length;i+=3) lines.push(`vn ${n(mesh.normals[i])} ${n(mesh.normals[i+1])} ${n(mesh.normals[i+2])}`);
lines.push('s 1');
for (let i=0;i<mesh.indices.length;i+=3) {
  const a=mesh.indices[i]+1,b=mesh.indices[i+1]+1,c=mesh.indices[i+2]+1;
  lines.push(`f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}`);
}
await mkdir(directory,{recursive:true});
const target = new URL('urushi-vessel.obj',directory);
await writeFile(target,lines.join('\n')+'\n');
console.log(`Exported ${mesh.positions.length/3} vertices and ${mesh.indices.length/3} triangles to ${fileURLToPath(target)}`);

// The archived PNG is byte-equivalent to the procedural data uploaded by the
// live renderer. Built-in Node modules keep model/texture export reproducible.
function crc32(buffer){
  let crc=0xffffffff;
  for(const byte of buffer){
    crc^=byte;
    for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}
function chunk(type,body){
  const tag=Buffer.from(type),length=Buffer.alloc(4),checksum=Buffer.alloc(4);
  length.writeUInt32BE(body.length);checksum.writeUInt32BE(crc32(Buffer.concat([tag,body])));
  return Buffer.concat([length,tag,body,checksum]);
}
const size=256,pixels=generateMaterialField(size),scanlines=Buffer.alloc(size*(size*4+1));
for(let y=0;y<size;y++)Buffer.from(pixels.buffer,y*size*4,size*4).copy(scanlines,y*(size*4+1)+1);
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(scanlines)),chunk('IEND',Buffer.alloc(0))]);
const textureDirectory=new URL('../public/textures/',import.meta.url);
await mkdir(textureDirectory,{recursive:true});
await writeFile(new URL('lacquer-microstructure.png',textureDirectory),png);
console.log('Exported fixed-seed lacquer microstructure texture (MIT).');
