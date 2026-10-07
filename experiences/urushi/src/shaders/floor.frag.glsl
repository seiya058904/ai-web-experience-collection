precision highp float;
varying vec3 vLocal;
uniform float uPolish;
uniform float uWood;
uniform float uLight;
void main(){
  vec2 p=vLocal.xy;
  float shadow=exp(-pow(p.x/1.82,2.0)-pow(p.y/.95,2.0));
  float reflection=exp(-pow((p.x+.67)/.83,2.0)-pow((p.y-.62)/.23,2.0));
  vec3 color=vec3(.002,.0018,.0014)+vec3(.026,.019,.010)*reflection*(.30+.38*uPolish)*(.65+.35*uLight);
  float alpha=clamp(shadow*.76+reflection*.075,0.0,.84);
  gl_FragColor=vec4(color,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
