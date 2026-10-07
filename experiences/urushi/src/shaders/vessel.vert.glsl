varying vec3 vWorldPosition;
varying vec3 vObjectPosition;
varying vec3 vObjectNormal;
varying vec3 vWorldNormal;
varying vec2 vUv;

void main() {
  vObjectPosition=position;
  vObjectNormal=normal;
  vUv=uv;
  vec4 world=modelMatrix*vec4(position,1.0);
  vWorldPosition=world.xyz;
  vWorldNormal=normalize(mat3(modelMatrix)*normal);
  gl_Position=projectionMatrix*viewMatrix*world;
}
