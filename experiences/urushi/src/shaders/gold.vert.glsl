attribute vec3 aNormal;
attribute float aArrival;
attribute float aSize;
attribute float aSeed;
uniform float uGold;
uniform float uDpr;
varying float vOpacity;
varying float vSeed;
varying vec3 vNormal;
void main(){
  float approach=clamp((uGold-aArrival+.105)/.105,0.0,1.0);
  float begin=smoothstep(aArrival-.108,aArrival-.085,uGold);
  float end=1.0-smoothstep(aArrival-.004,aArrival+.025,uGold);
  vOpacity=begin*end;
  vSeed=aSeed;
  vNormal=normalize(mat3(modelMatrix)*aNormal);
  float height=pow(1.0-approach,1.55)*(.004+aSeed*.014);
  vec3 p=position+aNormal*height;
  p.x+=(1.0-approach)*sin(aSeed*19.0)*.002;
  p.z+=(1.0-approach)*cos(aSeed*13.0)*.0015;
  vec4 mv=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=clamp(aSize*uDpr*3.4/max(1.0,-mv.z),.55,1.9*uDpr);
}
