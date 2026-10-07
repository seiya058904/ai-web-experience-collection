precision highp float;
varying float vOpacity;
varying float vSeed;
varying vec3 vNormal;
void main(){
  float radius=length(gl_PointCoord-.5);
  float alpha=(1.0-smoothstep(.20,.49,radius))*vOpacity*.77;
  if(alpha<.008)discard;
  float illumination=.32+.68*max(dot(normalize(vNormal),normalize(vec3(-.7,1.8,2.6))),0.0);
  vec3 color=vec3(.47,.255,.071)*illumination*(.7+.3*vSeed);
  gl_FragColor=vec4(color,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
