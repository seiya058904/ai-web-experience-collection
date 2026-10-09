precision highp float;
varying vec3 vLocal;
uniform float uPolish;
uniform float uWood;
uniform float uLight;
float square(float x){return x*x;}
void main(){
  vec2 p=vLocal.xy;
  float shadow=exp(-square(p.x/1.82)-square(p.y/.95));
  float reflection=exp(-square((p.x+.67)/.83)-square((p.y-.62)/.23));
  vec3 color=vec3(.002,.0018,.0014)+vec3(.026,.019,.010)*reflection*(.30+.38*uPolish)*(.65+.35*uLight);
  float alpha=clamp(shadow*.76+reflection*.075,0.0,.84);
  gl_FragColor=vec4(color,alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
