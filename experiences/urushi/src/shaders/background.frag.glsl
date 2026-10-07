precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uTime;
uniform float uChamber;
uniform float uWood;
uniform float uLight;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec2 p=vUv;
  float room=exp(-dot((p-vec2(.67,.39))*vec2(1.7,2.0),(p-vec2(.67,.39))*vec2(1.7,2.0)));
  float floorGlow=exp(-dot((p-vec2(.50,.045))*vec2(1.8,6.3),(p-vec2(.50,.045))*vec2(1.8,6.3)));
  vec3 color=vec3(.0059,.0055,.0048)+vec3(.0047,.0039,.0029)*room;
  color+=vec3(.040,.026,.015)*floorGlow*(.6+.4*uLight);
  float enclosure=1.0-uChamber*.26;
  color*=enclosure;
  float mist=sin(p.y*8.0+sin(p.x*5.0+uTime*.045)*.5)*.5+.5;
  color+=uChamber*vec3(.0018,.0015,.0011)*mist*room;
  color+=uWood*vec3(.0022,.0015,.0009)*room;
  color+=vec3((hash(gl_FragCoord.xy)-.5)*.00045);
  gl_FragColor=vec4(max(color,vec3(0.0)),1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
