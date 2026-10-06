import * as THREE from 'three';

// Art-directed stream surfaces for the same +Z, two-spool machine as engine.js.
// These are explanatory paths, not a CFD solution. Every core path remains in
// the working annulus; no stream travels down the solid shafts or spinner.
const PATH_GLSL = /* glsl */`
  const float TAU = 6.28318530718;
  uniform float uTime;
  uniform float uHeat;
  uniform float uExplode;
  uniform float uIntensity;
  uniform float uCoreGain;
  uniform float uBypassGain;
  uniform float uProgress;

  float stageTravel(float sequence, float distance) {
    float own = smoothstep(sequence, min(1.0, sequence + 0.28), uExplode);
    float inherited = 1.63 * smoothstep(0.49, 0.70, uExplode);
    if (sequence >= 0.68) {
      return inherited + 0.88 * smoothstep(0.68, 0.96, uExplode) + (distance - 2.51) * own;
    }
    if (sequence >= 0.60) {
      return inherited + 0.34 * smoothstep(0.61, 0.89, uExplode) + (distance - 1.97) * own;
    }
    return distance * own;
  }

  float expandZ(float z) {
    if (uExplode < 0.0001) return z;
    // The same staggered axial anchors as engine.js: flow bridges separated
    // parts continuously, rather than drifting away under a global stretch.
    float inlet = -1.20 * smoothstep(0.08, 0.30, uExplode);
    float fan = -1.72 * smoothstep(0.12, 0.39, uExplode);
    float lpFirst = stageTravel(0.28, -0.72);
    float lpLast = stageTravel(0.28, -0.50);
    float hpFirst = stageTravel(0.36, 0.08);
    float hpLast = stageTravel(0.472, 1.44);
    float burner = 1.63 * smoothstep(0.49, 0.70, uExplode);
    float hptFirst = stageTravel(0.61, 1.97);
    float hptLast = stageTravel(0.628, 2.20);
    float lptFirst = stageTravel(0.68, 2.51);
    float lptLast = stageTravel(0.768, 3.35);
    float nozzle = burner + 0.88 * smoothstep(0.68, 0.96, uExplode)
      + 1.48 * smoothstep(0.768, 1.0, uExplode);
    float offset;
    if (z < 0.0) offset = mix(inlet, fan, smoothstep(-0.98, 0.0, z));
    else if (z < 1.15) offset = mix(fan, lpFirst, smoothstep(0.0, 1.15, z));
    else if (z < 2.05) offset = mix(lpFirst, lpLast, (z - 1.15) / 0.90);
    else if (z < 2.65) offset = mix(lpLast, hpFirst, smoothstep(2.05, 2.65, z));
    else if (z < 5.61) {
      float index = (z - 2.65) / 0.37;
      float lo = floor(index), hi = min(8.0, lo + 1.0);
      offset = mix(stageTravel(0.36 + lo * 0.014, 0.08 + lo * 0.17),
        stageTravel(0.36 + hi * 0.014, 0.08 + hi * 0.17), smoothstep(0.0, 1.0, index - lo));
    }
    else if (z < 6.17) offset = mix(hpLast, burner, smoothstep(5.61, 6.17, z));
    else if (z < 7.43) offset = burner;
    else if (z < 7.90) offset = mix(burner, hptFirst, smoothstep(7.43, 7.90, z));
    else if (z < 8.35) offset = mix(hptFirst, hptLast, smoothstep(7.90, 8.35, z));
    else if (z < 8.95) offset = mix(hptLast, lptFirst, smoothstep(8.35, 8.95, z));
    else if (z < 10.71) {
      float index = (z - 8.95) / 0.44;
      float lo = floor(index), hi = min(4.0, lo + 1.0);
      offset = mix(stageTravel(0.68 + lo * 0.022, 2.51 + lo * 0.21),
        stageTravel(0.68 + hi * 0.022, 2.51 + hi * 0.21), smoothstep(0.0, 1.0, index - lo));
    }
    else if (z < 11.05) offset = mix(lptLast, nozzle, smoothstep(10.71, 11.05, z));
    else offset = nozzle;
    return z + offset;
  }

  vec2 coreAnnulus(float z) {
    // Insets from the hub and outer wall, including the narrowing HPC passage.
    if (z < -0.3) return mix(vec2(0.93, 1.78), vec2(0.60, 1.04), smoothstep(-6.5, -0.3, z));
    if (z < 1.15) return mix(vec2(0.60, 1.04), vec2(0.60, 0.985), smoothstep(-0.3, 1.15, z));
    if (z < 2.65) return mix(vec2(0.60, 0.985), vec2(0.603, 0.884), smoothstep(1.15, 2.65, z));
    if (z < 5.61) return mix(vec2(0.603, 0.884), vec2(0.717, 0.790), smoothstep(2.65, 5.61, z));
    if (z < 6.23) return mix(vec2(0.717, 0.790), vec2(0.608, 0.929), smoothstep(5.61, 6.23, z));
    if (z < 7.35) return vec2(0.608, 0.929);
    if (z < 7.70) return mix(vec2(0.608, 0.929), vec2(0.693, 0.929), smoothstep(7.35, 7.70, z));
    if (z < 8.50) return mix(vec2(0.693, 0.929), vec2(0.673, 0.941), smoothstep(7.70, 8.50, z));
    if (z < 10.71) return mix(vec2(0.673, 0.941), vec2(0.559, 1.071), smoothstep(8.50, 10.71, z));
    if (z < 12.15) return mix(vec2(0.559, 1.071), vec2(0.296, 0.601), smoothstep(10.71, 12.15, z));
    return mix(vec2(0.296, 0.601), vec2(0.43, 0.87), smoothstep(12.15, 18.0, z));
  }

  vec2 bypassAnnulus(float z) {
    if (z < 0.4) return mix(vec2(1.72, 2.68), vec2(1.34, 1.995), smoothstep(-6.5, 0.4, z));
    if (z < 1.5) return mix(vec2(1.34, 1.995), vec2(1.485, 1.979), smoothstep(0.4, 1.5, z));
    if (z < 4.55) return mix(vec2(1.485, 1.979), vec2(1.475, 1.978), smoothstep(1.5, 4.55, z));
    if (z < 7.23) return mix(vec2(1.475, 1.978), vec2(1.420, 1.758), smoothstep(4.55, 7.23, z));
    if (z < 9.50) return mix(vec2(1.420, 1.758), vec2(1.372, 1.604), smoothstep(7.23, 9.50, z));
    return mix(vec2(1.372, 1.604), vec2(1.06, 1.74), smoothstep(9.50, 18.0, z));
  }

  vec3 pathPoint(float z, float angle, float lane, float branch) {
    vec2 limits = branch > 0.5 ? bypassAnnulus(z) : coreAnnulus(z);
    float r = mix(limits.x, limits.y, lane);
    float fanTurn = 0.13 * smoothstep(-0.1, 1.0, z);
    float statorStraightening = 0.08 * smoothstep(1.1, 2.7, z);
    float downstream = smoothstep(6.1, 7.1, z) * (1.0 - smoothstep(9.1, 12.2, z));
    // Radial drift is deliberately tiny where the compressor passage is thin.
    float wiggle = 0.0035 * sin(z * 2.7 + angle * 2.0 + lane * 3.0);
    r += wiggle * (limits.y - limits.x);
    float theta = angle + fanTurn - statorStraightening;
    theta += (1.0 - branch) * downstream * 0.11 * sin(z * 1.6 + lane * 2.0);
    theta += branch * 0.025 * sin(z * 0.43 + angle);
    float entrance = sin(smoothstep(-6.5, -0.55, z) * 3.14159265359);
    theta += entrance * 0.17 * sin(angle + 0.7);
    r += entrance * 0.18;
    vec3 point = vec3(cos(theta) * r, sin(theta) * r, expandZ(z));
    point.xy += vec2(-0.55, 0.24) * entrance;
    return point;
  }

  float temperature(float z, float branch) {
    return (1.0 - branch) * uHeat * smoothstep(6.08, 6.70, z)
      * (1.0 - 0.69 * smoothstep(8.0, 13.4, z));
  }

  vec3 airColor(float heat, float lane) {
    vec3 cold = mix(vec3(0.055, 0.34, 0.45), vec3(0.25, 0.57, 0.65), lane * 0.28);
    vec3 warm = mix(vec3(1.0, 0.31, 0.065), vec3(1.0, 0.77, 0.40), heat);
    return mix(cold, warm, smoothstep(0.015, 0.52, heat));
  }
`;

const ribbonVertex = /* glsl */`
  ${PATH_GLSL}
  attribute vec4 aPath;
  attribute float aEdge;
  attribute float aHero;
  varying float vEdge;
  varying float vZ;
  varying float vLane;
  varying float vBranch;
  varying float vSeed;
  varying float vHero;
  void main() {
    float z = position.z;
    vec3 p = pathPoint(z, aPath.x, aPath.y, aPath.z);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 next = modelViewMatrix * vec4(pathPoint(z + 0.025, aPath.x, aPath.y, aPath.z), 1.0);
    vec2 delta = next.xy - mv.xy;
    vec2 direction = delta * inversesqrt(max(dot(delta, delta), 0.0000000001));
    vec2 side = vec2(-direction.y, direction.x);
    // A restrained screen-facing ribbon; the luminous center is much narrower.
    // Keep the strip narrow even when the travelling camera passes a stream:
    // a world-space minimum would inflate into a broad near-plane triangle.
    float width = clamp(max(0.0, -mv.z) * 0.00095, 0.000025, 0.026);
    mv.xy += side * aEdge * width;
    gl_Position = projectionMatrix * mv;
    vEdge = aEdge;
    vZ = z;
    vLane = aPath.y;
    vBranch = aPath.z;
    vSeed = aPath.w;
    vHero = aHero;
  }
`;

const ribbonFragment = /* glsl */`
  ${PATH_GLSL}
  varying float vEdge;
  varying float vZ;
  varying float vLane;
  varying float vBranch;
  varying float vSeed;
  varying float vHero;
  void main() {
    float cycle = fract(vZ * 0.235 - uTime * (0.33 + vLane * 0.08) + vSeed);
    float head = smoothstep(0.39, 0.77, cycle) * (1.0 - smoothstep(0.78, 0.89, cycle));
    float filigree = 0.76 * exp(-vEdge * vEdge * 6.2) + 0.24 * exp(-vEdge * vEdge * 1.8);
    float startFade = smoothstep(-6.50, -3.1, vZ);
    float endFade = 1.0 - smoothstep(14.0, 18.0, vZ);
    float gain = mix(uCoreGain, uBypassGain, vBranch);
    float arrival = smoothstep(0.075, 0.18, uProgress);
    gain *= mix(vHero, 1.0, arrival) * mix(0.30, 0.85, arrival);
    float heat = temperature(vZ, vBranch);
    float density = 1.0 + (1.0 - vBranch) * 0.26 * smoothstep(2.6, 5.5, vZ);
    float alpha = filigree * (0.13 + 0.73 * head) * startFade * endFade * gain * density * uIntensity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(airColor(heat, vLane) * (0.77 + head * 0.56), alpha);
    #include <colorspace_fragment>
  }
`;

const particleVertex = /* glsl */`
  ${PATH_GLSL}
  attribute vec4 aParticle;
  attribute float aSeed;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float speed = 0.090 + aParticle.y * 0.020;
    float phase = fract(aSeed + uTime * speed);
    float z = -6.5 + phase * 24.5;
    vec3 p = pathPoint(z, aParticle.x, aParticle.y, aParticle.z);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aParticle.w / max(0.8, -mv.z), 1.3, 4.4);
    float endFade = smoothstep(0.0, 0.09, phase) * (1.0 - smoothstep(0.83, 1.0, phase));
    vAlpha = endFade * mix(uCoreGain, uBypassGain, aParticle.z) * uIntensity * 0.80;
    vAlpha *= mix(0.35, 1.0, smoothstep(0.075, 0.18, uProgress));
    vColor = airColor(temperature(z, aParticle.z), aParticle.y) * 1.55;
  }
`;

const particleFragment = /* glsl */`
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float glow = exp(-r * r * 4.8) * (1.0 - smoothstep(0.65, 1.0, r));
    if (glow < 0.008) discard;
    gl_FragColor = vec4(vColor, glow * vAlpha);
    #include <colorspace_fragment>
  }
`;

const flameVertex = /* glsl */`
  ${PATH_GLSL}
  attribute vec3 aFlame;
  varying vec3 vFlame;
  varying float vIgnite;
  varying float vFlameShell;
  varying float vFlameFacing;
  void main() {
    float t = position.z;
    float phi = position.x;
    float angle = aFlame.x + t * 0.075;
    angle += sin(t * 7.0 - uTime * 1.8 + aFlame.x * 3.0) * 0.015 * t;
    float shell = aFlame.y;
    float flutter = sin(t * 18.0 - uTime * 8.3 + aFlame.x * 4.0)
      + 0.4 * sin(t * 31.0 - uTime * 13.6 + phi * 2.0);
    float radius = (0.021 + 0.058 * sin(pow(t, 0.73) * 2.42)) * shell;
    radius *= 1.0 + flutter * 0.14 * t;
    float centerRadius = 0.80 + 0.012 * sin(t * 4.0 + aFlame.x) * smoothstep(0.0, 0.14, t);
    vec3 radial = vec3(cos(angle), sin(angle), 0.0);
    vec3 tangent = vec3(-sin(angle), cos(angle), 0.0);
    vec3 p = radial * (centerRadius + cos(phi) * radius);
    p += tangent * (sin(phi) * radius * 0.90);
    p.z = expandZ(6.224 + t * 1.306);
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    vec3 shellNormal = normalize(normalMatrix * (radial * cos(phi) + tangent * sin(phi)));
    vec3 viewDirection = -view.xyz * inversesqrt(max(dot(view.xyz, view.xyz), 0.00000001));
    gl_Position = projectionMatrix * view;
    vFlame = vec3(t, phi, aFlame.x);
    vIgnite = smoothstep(aFlame.z * 0.14, 0.42 + aFlame.z * 0.14, uHeat);
    vFlameShell = shell;
    vFlameFacing = abs(dot(shellNormal, viewDirection));
  }
`;

const flameFragment = /* glsl */`
  ${PATH_GLSL}
  uniform float uFlameSinglePass;
  varying vec3 vFlame;
  varying float vIgnite;
  varying float vFlameShell;
  varying float vFlameFacing;
  void main() {
    float t = clamp(vFlame.x, 0.0, 1.0);
    float phi = vFlame.y;
    float seed = vFlame.z;
    float inner = max(1.0 - smoothstep(0.55, 0.90, vFlameShell), uFlameSinglePass * 0.48);
    // Folded fine structures and darker gaps are present even at frozen time.
    // There is no continuously illuminated cylindrical surface underneath.
    float fold = 0.5 + 0.5 * sin(phi * 3.0 + t * 21.0 - uTime * 5.2
      + sin(t * 9.0 + seed * 3.0) * 1.4);
    float lace = 0.5 + 0.5 * sin(phi * 7.0 - t * 47.0 + uTime * 10.0 + seed * 4.0 + fold * 2.0);
    float pocket = 0.5 + 0.5 * sin(t * 12.0 - uTime * 2.4 + seed * 7.0);
    float structure = smoothstep(0.48, 0.82, fold * 0.47 + lace * 0.37 + pocket * 0.16);
    float jet = exp(-t * 20.0) * (0.3 + 0.7 * fold);
    structure = max(structure, jet * 0.75);
    float body = smoothstep(0.0, 0.040, t) * (1.0 - smoothstep(0.55, 1.0, t));
    float edge = 0.35 + 0.65 * pow(clamp(vFlameFacing, 0.0, 1.0), 0.60);
    float alpha = body * structure * edge * (0.045 + 0.205 * inner)
      * vIgnite * uIntensity * uCoreGain;
    float brightness = clamp(0.12 + inner * 0.56 + structure * 0.30 + jet * 0.36, 0.0, 1.0);
    vec3 amber = mix(vec3(0.43, 0.048, 0.002), vec3(1.0, 0.42, 0.055), brightness);
    amber += vec3(0.12, 0.070, 0.022) * jet * inner;
    amber = min(amber, vec3(1.0));
    if (alpha < 0.0015) discard;
    gl_FragColor = vec4(amber, alpha);
    #include <colorspace_fragment>
  }
`;

function ribbonGeometry(mobile) {
  const positions = [], paths = [], edges = [], hero = [], indices = [];
  const segments = mobile ? 104 : 164;
  const counts = mobile ? [7, 10] : [11, 17];
  for (let branch = 0; branch < 2; branch++) {
    for (let lane = 0; lane < counts[branch]; lane++) {
      const baseAngle = (lane / counts[branch]) * Math.PI * 2 + 0.21;
      const radius = 0.14 + ((lane * 0.61803398875) % 1) * 0.72;
      const heroLanes = (branch ? [0.06, 0.41, 0.76] : [0.09, 0.54]).map(fraction => Math.floor(counts[branch] * fraction));
      const selected = heroLanes.includes(lane) ? 1 : 0;
      for (let pair = 0; pair < 2; pair++) {
        const angle = baseAngle + (pair - 0.5) * 0.018;
        const start = positions.length / 3;
        for (let j = 0; j <= segments; j++) {
          const z = -6.5 + (j / segments) * 24.5;
          for (const side of [-1, 1]) {
            positions.push(0, 0, z);
            paths.push(angle, radius, branch, (lane * 0.381966 + pair * 0.093) % 1);
            edges.push(side);
            hero.push(selected);
          }
          if (j < segments) {
            const a = start + j * 2;
            indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
          }
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aPath', new THREE.Float32BufferAttribute(paths, 4));
  geometry.setAttribute('aEdge', new THREE.Float32BufferAttribute(edges, 1));
  geometry.setAttribute('aHero', new THREE.Float32BufferAttribute(hero, 1));
  geometry.setIndex(indices);
  return geometry;
}

function particleGeometry(mobile) {
  const count = mobile ? 104 : 264;
  const positions = new Float32Array(count * 3);
  const particles = new Float32Array(count * 4);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    particles[i * 4] = ((i * 0.61803398875) % 1) * Math.PI * 2;
    particles[i * 4 + 1] = 0.12 + ((i * 0.41421356) % 1) * 0.76;
    particles[i * 4 + 2] = i % 3 === 0 ? 0 : 1;
    particles[i * 4 + 3] = 24 + ((i * 0.7320508) % 1) * 20;
    seeds[i] = (i * 0.7548776662) % 1;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aParticle', new THREE.BufferAttribute(particles, 4));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  return geometry;
}

function flameGeometry(mobile) {
  const positions = [], flames = [], indices = [];
  const rings = mobile ? 16 : 26;
  const sides = mobile ? 8 : 12;
  for (let injector = 0; injector < 18; injector++) {
    const angle = (injector / 18) * Math.PI * 2;
    for (const shell of mobile ? [1] : [0.52, 1]) {
      const start = positions.length / 3;
      for (let j = 0; j <= rings; j++) {
        for (let k = 0; k <= sides; k++) {
          positions.push((k / sides) * Math.PI * 2, 0, j / rings);
          flames.push(angle, shell, injector / 18);
          if (j < rings && k < sides) {
            const a = start + j * (sides + 1) + k;
            indices.push(a, a + sides + 1, a + 1, a + 1, a + sides + 1, a + sides + 2);
          }
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aFlame', new THREE.Float32BufferAttribute(flames, 3));
  geometry.setIndex(indices);
  return geometry;
}

export function createFlow({ mobile = false } = {}) {
  const group = new THREE.Group();
  group.name = 'AIR / continuous annular streams';
  const uniforms = {
    uTime: { value: 0 }, uHeat: { value: 0 }, uExplode: { value: 0 },
    uIntensity: { value: 1 }, uCoreGain: { value: 1 }, uBypassGain: { value: 1 },
    uProgress: { value: 0 }, uFlameSinglePass: { value: mobile ? 1 : 0 },
  };
  const material = (vertexShader, fragmentShader) => new THREE.ShaderMaterial({
    uniforms, vertexShader, fragmentShader, transparent: true,
    depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide, toneMapped: false,
  });
  const streams = new THREE.Mesh(ribbonGeometry(mobile), material(ribbonVertex, ribbonFragment));
  streams.name = 'paired silver-cyan stream filaments';
  const particles = new THREE.Points(particleGeometry(mobile), material(particleVertex, particleFragment));
  particles.name = 'advecting air markers';
  const combustion = new THREE.Mesh(flameGeometry(mobile), material(flameVertex, flameFragment));
  combustion.name = '18 anchored annular combustion plumes';
  for (const object of [streams, particles, combustion]) {
    object.frustumCulled = false;
    object.renderOrder = 4;
    group.add(object);
  }
  group.userData.flow = { axis: '+Z', coreStart: -6.5, coreEnd: 18, injectorCount: 18, illustrative: true };

  return {
    group,
    update(time, { progress = 0, heat = 0, explode = 0, intensity = 1, focus = '' } = {}) {
      uniforms.uTime.value = Number.isFinite(time) ? time : 0;
      uniforms.uProgress.value = THREE.MathUtils.clamp(progress, 0, 1);
      uniforms.uHeat.value = THREE.MathUtils.clamp(heat, 0, 1);
      uniforms.uExplode.value = THREE.MathUtils.clamp(explode, 0, 1);
      uniforms.uIntensity.value = THREE.MathUtils.clamp(intensity, 0, 2);
      uniforms.uCoreGain.value = focus === 'bypass' ? 0.32 : 1;
      uniforms.uBypassGain.value = focus === 'core' ? 0.22 : 1;
      combustion.visible = heat > 0.002 && intensity > 0.002;
    },
    dispose() {
      for (const object of [streams, particles, combustion]) {
        object.geometry.dispose();
        object.material.dispose();
      }
      group.clear();
    },
  };
}
