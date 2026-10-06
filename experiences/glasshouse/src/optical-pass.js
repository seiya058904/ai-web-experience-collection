import * as THREE from 'three';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { glassCausticGLSL } from './caustic-field.js';

/**
 * Ordered screen-space transmission.
 *
 * Three's single transmission buffer cannot contain another transmitting
 * object. This installation needs eight panes to remain mutually visible.
 * Each pane therefore reads the completed image behind it, in linear HDR,
 * and contributes its own refraction, absorption and physical specular light.
 * It is an art-directed real-time approximation, not a ray tracer.
 */
export function layeredGlass(material, { thickness = 0.3, prism = false } = {}) {
  const optical = {
    tOpticScene: { value: null },
    tOpticDepth: { value: null },
    tOpticGobo: { value: null },
    uOpticSize: { value: new THREE.Vector2(1, 1) },
    uOpticThickness: { value: thickness },
    uOpticFrost: { value: 0 },
    uOpticSilver: { value: 0 },
    uOpticDark: { value: 0 },
    uOpticTime: { value: 0 },
    uOpticAngle: { value: 0 },
    uOpticPrism: { value: prism ? 1 : 0 },
    uOpticLife: { value: 1 },
    uOpticGlow: { value: 1 }
  };
  material.transmission = 0;
  material.transparent = false;
  material.opacity = 1;
  material.fog = false;
  material.userData.optical = optical;
  material.customProgramCacheKey = () => 'glasshouse-ordered-transmission-v2';
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, optical);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `
      #include <common>
      varying vec3 vOpticLocal;
      varying vec3 vOpticWorld;
    `).replace('#include <project_vertex>', `
      #include <project_vertex>
      vOpticLocal = transformed;
      vOpticWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `
      #include <common>
      uniform sampler2D tOpticScene;
      uniform sampler2D tOpticDepth;
      uniform sampler2D tOpticGobo;
      uniform vec2 uOpticSize;
      uniform float uOpticThickness;
      uniform float uOpticFrost;
      uniform float uOpticSilver;
      uniform float uOpticDark;
      uniform float uOpticTime;
      uniform float uOpticAngle;
      uniform float uOpticPrism;
      uniform float uOpticLife;
      uniform float uOpticGlow;
      varying vec3 vOpticLocal;
      varying vec3 vOpticWorld;
      ${glassCausticGLSL}

      vec3 behindGlass(vec2 uv, float spread) {
        vec2 pixel = 1.0 / uOpticSize;
        // Mip diffusion integrates the whole footprint. Unlike a handful of
        // offset sharp copies, it cannot create ghost letters in frosted glass.
        return textureLod(tOpticScene, clamp(uv, pixel, 1.0 - pixel), spread).rgb;
      }
    `).replace('#include <opaque_fragment>', `
      vec2 screenUv = gl_FragCoord.xy / uOpticSize;
      float opaqueDepth = texture2D(tOpticDepth, screenUv).r;
      if (gl_FragCoord.z > opaqueDepth + 0.000025) discard;
      float incidence = clamp(abs(dot(normal, geometryViewDir)), 0.0, 1.0);
      float grazing = pow(1.0 - incidence, 3.0);
      float fresnel = .038 + .90 * grazing;
      float depthScale = 11.0 / max(5.0, vViewPosition.z);
      vec2 bend = normal.xy * uOpticThickness * .016 * depthScale;
      bend += vec2(sin(vOpticLocal.y * 1.7 + uOpticTime * .13),
                   sin(vOpticLocal.x * 1.4 - uOpticTime * .11))
              * .00035 * (1.0 - uOpticFrost);
      vec2 refractedUv = clamp(screenUv + bend, .001, .999);
      float diffusion = uOpticFrost * (4.4 + log2(max(1.0, uOpticSize.y / 900.0)));
      vec3 transmitted = behindGlass(refractedUv, diffusion);
      float separation = (grazing * .0015 + uOpticPrism * .0024) * uOpticThickness;
      if (separation > .00015 && uOpticFrost < .3) {
        transmitted.r = texture2D(tOpticScene, clamp(refractedUv + normal.xy * separation, .001, .999)).r;
        transmitted.b = texture2D(tOpticScene, clamp(refractedUv - normal.xy * separation, .001, .999)).b;
      }
      // Absorption grows with the distance travelled through the bevel.
      vec3 absorption = exp(-vec3(.052,.017,.010) * uOpticThickness);
      absorption *= mix(vec3(1.0), vec3(.12,.24,.29), pow(grazing, .42) * .92);
      transmitted *= absorption;
      transmitted = mix(transmitted, transmitted * .92 + vec3(.055), uOpticFrost * .72);
      // Keep a sequence of eight parallel interfaces from accumulating eight
      // copies of an overexposed studio window. Bevels retain an HDR highlight;
      // the front face reflects a deliberately bounded incident field.
      vec3 boundedEnvironment = min(reflectedLight.indirectSpecular, vec3(.033 + grazing * .98));
      vec3 specularGlass = (reflectedLight.directSpecular + boundedEnvironment) * (1.0 - uOpticPrism * .20);
      vec3 opticalColor = transmitted * (1.0 - fresnel * .92) + specularGlass;
      opticalColor = mix(opticalColor, totalSpecular * 1.18, uOpticSilver);
      // The narrow fold belongs to a moving light source, with most of each
      // sheet deliberately untouched. It is not an emissive outline.
      float fold = abs(vOpticWorld.x * .23 + vOpticWorld.y * .34
                     + sin(vOpticWorld.y * .85 + uOpticTime * .09) * .12 - .61);
      float softFold = exp(-fold * fold * 150.0) * .045;
      opticalColor += vec3(.76,.89,1.0) * softFold * (1.0 - uOpticSilver) * (1.0 - uOpticFrost * .7);
      vec2 projectedXZ = mat2(cos(uOpticAngle),-sin(uOpticAngle),sin(uOpticAngle),cos(uOpticAngle)) * vOpticWorld.xz;
      vec2 projectedLight = vec2(projectedXZ.x + projectedXZ.y * .48, vOpticWorld.y - projectedXZ.y * .19);
      vec2 litPoint = vec2(1.9, .85);
      vec2 opticalCoordinates = (projectedLight - litPoint) * 1.72;
      float caustic = glassCaustic(opticalCoordinates, uOpticTime);
      float secondFold = glassCaustic((projectedLight - vec2(3.5,-1.15)) * 2.2, uOpticTime + 9.0);
      vec2 goboUv = vec2(.48,.55) + (projectedLight - vec2(1.5,.7)) * .12;
      goboUv += vec2(sin(uOpticTime*.045), cos(uOpticTime*.037)) * .005;
      vec3 gobo = texture2D(tOpticGobo, goboUv).rgb;
      opticalColor += (vec3(1.0,.94,.81) * (caustic * .10 + secondFold * .025) + gobo * 2.25)
          * uOpticGlow * (1.0 - uOpticSilver) * (1.0 - uOpticFrost * .8);
      vec3 original = texture2D(tOpticScene, screenUv).rgb;
      outgoingLight = mix(original, opticalColor, uOpticLife);
      #include <opaque_fragment>
    `);
  };
  return material;
}

export function createOpticalPass(renderer, scene, camera) {
  const textureType = renderer.extensions.has('EXT_color_buffer_float') ? THREE.HalfFloatType : THREE.UnsignedByteType;
  const makeTarget = (depthTexture = false) => {
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: textureType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
      stencilBuffer: false,
      samples: 0
    });
    target.texture.colorSpace = THREE.LinearSRGBColorSpace;
    target.texture.generateMipmaps = true;
    if (depthTexture) target.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
    return target;
  };
  const base = makeTarget(true);
  const buffers = [makeTarget(), makeTarget()];
  const copyScene = new THREE.Scene();
  const copyCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const copyMaterial = new THREE.ShaderMaterial({
    uniforms: { tImage: { value: null } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
    fragmentShader: `uniform sampler2D tImage; varying vec2 vUv;
      void main(){ gl_FragColor=vec4(texture2D(tImage,vUv).rgb,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    depthTest: false,
    depthWrite: false
  });
  const copy = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), copyMaterial);
  copy.frustumCulled = false;
  copyScene.add(copy);
  const finishMaterial = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(FXAAShader.uniforms),
    vertexShader: copyMaterial.vertexShader,
    // Edge thresholds describe the displayed image. Keep all optical layers
    // linear, then tone-map each final FXAA sample exactly once before its
    // contrast comparison. No extra target or texture fetch is required.
    fragmentShader: FXAAShader.fragmentShader.replace(
      'return texture( tex2D, uv );',
      `vec4 sampleColor = texture( tex2D, uv );
       #if defined( TONE_MAPPING )
         sampleColor.rgb = toneMapping(max(sampleColor.rgb, vec3(0.0)));
       #endif
       return linearToOutputTexel(sampleColor);`
    ),
    depthTest: false,
    depthWrite: false
  });
  const position = new THREE.Vector3();
  const size = new THREE.Vector2(1, 1);
  const ordered = [];

  function resize() {
    renderer.getDrawingBufferSize(size);
    base.setSize(size.x, size.y);
    buffers.forEach(buffer => buffer.setSize(size.x, size.y));
    finishMaterial.uniforms.resolution.value.set(1 / size.x, 1 / size.y);
  }

  function render(objects) {
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    const background = scene.background;
    copy.material = copyMaterial;
    camera.layers.set(0);
    renderer.autoClear = true;
    renderer.setRenderTarget(base);
    renderer.render(scene, camera);
    ordered.length = 0;
    for (const object of objects) {
      if (!object.visible || object.scale.x < .002) continue;
      object.getWorldPosition(position).applyMatrix4(camera.matrixWorldInverse);
      ordered.push({ object, z: position.z });
    }
    ordered.sort((a, b) => a.z - b.z);
    let previous = base;
    scene.background = null;
    renderer.shadowMap.autoUpdate = false;
    for (let i = 0; i < ordered.length; i++) {
      const object = ordered[i].object;
      const next = buffers[i % 2];
      next.texture.generateMipmaps = false;
      renderer.setRenderTarget(next);
      renderer.autoClear = true;
      copyMaterial.uniforms.tImage.value = previous.texture;
      renderer.render(copyScene, copyCamera);
      renderer.autoClear = false;
      renderer.clearDepth();
      const mesh = object.isMesh ? object : object.children[0];
      const uniforms = mesh.material.userData.optical;
      uniforms.tOpticScene.value = previous.texture;
      uniforms.tOpticDepth.value = base.depthTexture;
      uniforms.uOpticSize.value.copy(size);
      camera.layers.mask = mesh.layers.mask;
      next.texture.generateMipmaps = true;
      renderer.render(scene, camera);
      previous = next;
    }
    scene.background = background;
    camera.layers.set(0);
    renderer.shadowMap.autoUpdate = true;
    renderer.autoClear = true;
    renderer.setRenderTarget(null);
    copy.material = finishMaterial;
    finishMaterial.uniforms.tDiffuse.value = previous.texture;
    renderer.render(copyScene, copyCamera);
  }

  function dispose() {
    base.dispose();
    buffers.forEach(target => target.dispose());
    copy.geometry.dispose();
    copyMaterial.dispose();
    finishMaterial.dispose();
  }
  return { render, resize, dispose };
}
