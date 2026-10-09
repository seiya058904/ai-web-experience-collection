precision highp float;
varying float vOpacity;
varying float vSeed;
varying vec3 vNormal;
void main(){
  vec2 grainPoint=gl_PointCoord-.5;
  float angle=vSeed*6.2831853;
  grainPoint=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*grainPoint;
  float radius=length(grainPoint*vec2(1.0,1.15+vSeed*.55));
  float alpha=(1.0-smoothstep(.20,.48,radius))*vOpacity*.69;
  if(alpha<.008)discard;
  float illumination=.32+.68*max(dot(normalize(vNormal),normalize(vec3(-.7,1.8,2.6))),0.0);
  vec3 color=vec3(.47,.255,.071)*illumination*(.7+.3*vSeed);
  gl_FragColor=vec4(color,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
