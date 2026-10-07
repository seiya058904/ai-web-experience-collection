/**
 * Photographic material stage. The caller owns the only animation clock.
 *
 * Image names are extensionless bases in baseUrl, with -768.webp and
 * -1536.webp variants. Focus is a normalized point in the source photograph;
 * cover fitting keeps it as close to the viewport centre as the crop allows.
 * Transparent source pixels remain transparent in the composited canvas.
 * onReady signals newly available pixels and asks the caller to render again;
 * render() returning true confirms that the requested composition was painted.
 */

const EFFECTS = Object.freeze({
  desire: 0, heat: 1, brown: 2, crust: 3, inside: 4, melt: 5,
  glaze: 6, steam: 7, plate: 8, cut: 9, end: 10,
});

const TRANSITIONS = Object.freeze({ edge: 0, fracture: 1, flow: 2, air: 3, cut: 4 });
const MAX_EDGE = 2400;
const MAX_PIXELS = 4_000_000;
const MAX_DPR = 1.25;
const ENDPOINT = 0.00001;

const VERTEX_SOURCE = `
attribute vec2 aPosition;
varying vec2 vScreen;
void main() {
  // Source photographs and vScreen both have their origin at the top left.
  vScreen = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SOURCE = `
precision __PRECISION__ float;
varying vec2 vScreen;
uniform sampler2D uCurrent;
uniform sampler2D uNext;
uniform vec2 uViewport;
uniform vec2 uCurrentSize;
uniform vec2 uNextSize;
uniform vec2 uCurrentFocus;
uniform vec2 uNextFocus;
uniform vec2 uPointer;
uniform float uCurrentZoom;
uniform float uNextZoom;
uniform float uCurrentEffect;
uniform float uNextEffect;
uniform float uCurrentValue;
uniform float uNextValue;
uniform float uCurrentLight;
uniform float uNextLight;
uniform float uBlend;
uniform float uTransition;
uniform float uTime;
uniform float uMotion;
uniform float uFlow;
uniform float uMobile;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float grain(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}

float angularGrain(float p, float seed) {
  // Linear segments retain the short, brittle corners of a fractured layer.
  // Smooth value noise would turn this edge into a waving paper curtain.
  float cell = floor(p);
  return mix(hash21(vec2(cell, seed)), hash21(vec2(cell + 1.0, seed)), fract(p));
}

float fractureNotch(float y, float start, float tip, float end) {
  // A single unequal angular chip, with no periodic or smoothed wave.
  return max(0.0, min((y - start) / (tip - start), (end - y) / (end - tip)));
}

vec2 coverUV(vec2 screen, vec2 imageSize, vec2 focus, float zoom) {
  float viewAspect = uViewport.x / max(uViewport.y, 1.0);
  float imageAspect = imageSize.x / max(imageSize.y, 1.0);
  vec2 extent = vec2(min(1.0, viewAspect / imageAspect),
                     min(1.0, imageAspect / viewAspect)) / zoom;
  vec2 centre = clamp(focus, extent * 0.5, vec2(1.0) - extent * 0.5);
  return (screen - 0.5) * extent + centre;
}

float bell(float x, float centre, float width) {
  float d = (x - centre) / width;
  return exp(-d * d);
}

vec4 samplePhotograph(sampler2D image, vec2 uv) {
  vec4 colour = texture2D(image, clamp(uv, vec2(0.0001), vec2(0.9999)));
  // Textures interpolate in premultiplied alpha to avoid dark cutout fringes.
  // Material observations use straight colour; final output is premultiplied.
  colour.rgb = colour.a > 0.0001 ? colour.rgb / colour.a : vec3(0.0);
  return colour;
}

vec4 photograph(sampler2D image, vec2 screen, vec2 imageSize, vec2 focus,
                float zoom, float effect, float value, float light) {
  vec2 uv = coverUV(screen, imageSize, focus, zoom);
  vec4 original = samplePhotograph(image, uv);
  float luma = dot(original.rgb, vec3(0.2126, 0.7152, 0.0722));
  float mobileScale = mix(1.0, 0.65, uMobile);
  bool displaced = false;

  if (uMotion > 0.5 && ((effect > 0.5 && effect < 1.5) || (effect > 6.5 && effect < 7.5))) {
    // The scallop's actual fat pool is low left. Steam has a separate region
    // at the tart's upper edge; neither effect distorts a broad food surface.
    float contact = bell(uv.x, 0.31, 0.16) * bell(uv.y, 0.875, 0.105);
    if (effect > 6.5) contact = bell(uv.x, 0.64, 0.20) * bell(uv.y, 0.475, 0.085);
    float air = 1.0 - smoothstep(0.32, 0.80, luma);
    float thermal = mix(0.35, 1.0, value) * uMotion * mobileScale;
    thermal *= effect > 6.5 ? 0.48 : 1.0;
    uv.x += sin(uv.y * 109.0 - uTime * 1.17)
            * sin(uv.x * 31.0 + uTime * 0.39)
            * contact * (0.35 + air * 0.65) * thermal * 0.00085;
    displaced = true;
  }

  if (uMotion > 0.5 && effect > 4.5 && effect < 5.5) {
    // A broad load travels DOWN the actual photographed ribbon, then settles
    // into its fold. The dark surroundings, lower mound and silhouette hold.
    // The slider changes the load's travel rate, not a global photo wobble.
    float ribbonCentre = 0.596 + 0.086 * smoothstep(0.26, 0.56, uv.y);
    float ribbon = (1.0 - smoothstep(0.048, 0.102, abs(uv.x - ribbonCentre)))
      * smoothstep(0.012, 0.11, uv.y)
      * (1.0 - smoothstep(0.48, 0.64, uv.y));
    float fold = bell(uv.x, 0.704, 0.128) * bell(uv.y, 0.558, 0.082);
    float body = smoothstep(0.018, 0.105, luma);
    float travelRate = 0.38 + uFlow * 1.12;
    float load = pow(0.5 + 0.5 * sin(uv.y * 7.7 - uTime * travelRate), 2.0);
    float weight = body * mobileScale;
    uv.y -= (ribbon * 0.0165 + fold * 0.0048) * load * weight;
    uv.x -= fold * load * weight * 0.0038;
    displaced = true;
  }

  vec4 colour = original;
  if (displaced) colour = samplePhotograph(image, uv);
  luma = dot(colour.rgb, vec3(0.2126, 0.7152, 0.0722));

  if (effect > 1.5 && effect < 2.5) {
    // Both seared faces are observed in SOURCE coordinates, so their white
    // fibrous sides and the pan remain unchanged as the camera crops closer.
    float frontTop = 0.22 + 0.43
      * pow(clamp(1.0 - (uv.x - 0.38) / 0.56, 0.0, 1.0), 1.6);
    float frontBottom = 0.626 + 0.16 * smoothstep(0.62, 0.94, uv.x);
    float frontFace = smoothstep(0.37, 0.415, uv.x)
      * smoothstep(frontTop - 0.028, frontTop + 0.02, uv.y)
      * (1.0 - smoothstep(frontBottom - 0.023, frontBottom + 0.012, uv.y));
    vec2 backFaceUV = vec2((uv.x - 0.595) / 0.33,
      (uv.y + (uv.x - 0.60) * 0.24 - 0.238) / 0.112);
    float backFace = 1.0 - smoothstep(0.72, 1.02, length(backFaceUV));
    float patches = grain(uv * vec2(15.0, 12.0)) * 0.7
      + grain(uv * vec2(47.0, 39.0)) * 0.3;
    float formed = smoothstep(patches - 0.13, patches + 0.13, value * 1.26 - 0.13);
    float toasted = max(frontFace, backFace)
      * smoothstep(0.07, 0.255, colour.r - colour.b)
      * smoothstep(0.065, 0.24, luma)
      * (1.0 - smoothstep(0.74, 0.95, luma));
    // Start with legible gold, retaining char detail and specular whites.
    // Chestnut is the unmodified source endpoint, never a sepia overlay.
    vec3 gold = colour.rgb + (1.0 - colour.rgb) * vec3(0.39, 0.27, 0.075) * toasted;
    colour.rgb = mix(gold, colour.rgb, formed);
  }

  if (effect > 3.5 && effect < 4.5) {
    // A restrained distinction between the soft cell walls and darker pores.
    float pore = 1.0 - smoothstep(0.12, 0.44, luma);
    colour.rgb *= 1.0 - pore * value * 0.025;
  }

  float gloss = 0.018;
  if (effect > 4.5 && effect < 6.5) gloss = 0.045;
  if (effect > 2.5 && effect < 4.5) gloss = 0.010;
  if (effect > 7.5) gloss = 0.011;
  float probe = 0.55 + sin(uTime * 0.10) * 0.16 * uMotion
    + (uPointer.x - 0.5) * 0.042 * uMotion;
  float highlight = bell(screen.x + screen.y * 0.16, probe, 0.072);
  float photographedHighlight = smoothstep(0.43, 0.81, luma)
    * (1.0 - smoothstep(0.94, 1.0, luma));
  // The probe brightens existing edible highlights. Dark areas stay dark.
  colour.rgb += colour.rgb * vec3(1.0, 0.93, 0.82)
    * highlight * photographedHighlight * gloss * light * 4.0;
  colour.rgb = clamp(colour.rgb, 0.0, 1.0);
  return colour;
}

vec4 premultiplied(vec4 colour) {
  return vec4(colour.rgb * colour.a, colour.a);
}

void main() {
  float t = clamp(uBlend, 0.0, 1.0);
  // Exact endpoints prevent a remaining seam or a ghost of the other food.
  if (t <= 0.00001 || (uMotion < 0.5 && t < 0.5)) {
    gl_FragColor = premultiplied(photograph(uCurrent, vScreen, uCurrentSize,
      uCurrentFocus, uCurrentZoom, uCurrentEffect, uCurrentValue, uCurrentLight));
    return;
  }
  if (t >= 0.99999 || (uMotion < 0.5 && t >= 0.5)
      || (uTransition > 0.5 && uTransition < 1.5 && t >= 0.80)) {
    gl_FragColor = premultiplied(photograph(uNext, vScreen, uNextSize,
      uNextFocus, uNextZoom, uNextEffect, uNextValue, uNextLight));
    return;
  }

  vec2 currentScreen = vScreen;
  vec2 nextFocus = uNextFocus;
  float nextZoom = uNextZoom;
  float fractureHull = -1.0;
  float fracturePullback = 1.0;
  float fractureInsideShade = 0.0;
  float reveal = 0.0;
  float edgeShade = 0.0;

  if (uTransition < 0.5) {
    float textureEdge = (grain(vScreen * vec2(23.0, 16.0)) - 0.5) * 0.044;
    float field = vScreen.x * 0.76 + (1.0 - vScreen.y) * 0.24 + textureEdge;
    float front = mix(-0.08, 1.08, t);
    reveal = 1.0 - smoothstep(front - 0.018, front + 0.018, field);
  } else if (uTransition < 1.5) {
    vec2 sourceUV = coverUV(vScreen, uCurrentSize, uCurrentFocus, uCurrentZoom);
    float leftEdge = coverUV(vec2(0.0), uCurrentSize, uCurrentFocus, uCurrentZoom).x;
    float rightEdge = coverUV(vec2(1.0), uCurrentSize, uCurrentFocus, uCurrentZoom).x;
    // The first line follows a few unequal breaks in the lamination. Broader
    // chips open on independent sides, rather than scaling a straight slit.
    float path = 0.62 + (sourceUV.y - 0.40) * 0.20
      + fractureNotch(sourceUV.y, 0.32, 0.43, 0.51) * 0.015
      - fractureNotch(sourceUV.y, 0.48, 0.555, 0.66) * 0.024
      + fractureNotch(sourceUV.y, 0.62, 0.735, 0.84) * 0.022
      - fractureNotch(sourceUV.y, 0.80, 0.885, 0.98) * 0.012
      + (angularGrain(sourceUV.y * 83.0, 8.7) - 0.5) * 0.0018;
    float side = sourceUV.x < path ? -1.0 : 1.0;
    float distanceToCrack = abs(sourceUV.x - path);
    float tip = mix(0.38, 1.12, smoothstep(0.0, 0.018, t));
    float propagated = 1.0 - smoothstep(tip - 0.008, tip + 0.008, sourceUV.y);
    float anticipation = smoothstep(0.0, 0.018, t);
    float opening = smoothstep(0.018, 0.44, t);
    float reach = side < 0.0 ? max(path - leftEdge, 0.001)
      : max(rightEdge - path, 0.001);
    // Five material-scale chips have different heights, depths and shoulders
    // on each side. Their envelope vanishes as the last outer shell departs.
    float leftChips = fractureNotch(sourceUV.y, 0.29, 0.38, 0.46) * 0.045
      - fractureNotch(sourceUV.y, 0.40, 0.47, 0.55) * 0.022
      + fractureNotch(sourceUV.y, 0.49, 0.61, 0.69) * 0.062
      - fractureNotch(sourceUV.y, 0.64, 0.72, 0.78) * 0.030
      + fractureNotch(sourceUV.y, 0.76, 0.88, 0.98) * 0.040;
    float rightChips = -fractureNotch(sourceUV.y, 0.30, 0.39, 0.50) * 0.034
      + fractureNotch(sourceUV.y, 0.47, 0.55, 0.67) * 0.071
      - fractureNotch(sourceUV.y, 0.60, 0.70, 0.79) * 0.027
      + fractureNotch(sourceUV.y, 0.74, 0.84, 0.94) * 0.042
      - fractureNotch(sourceUV.y, 0.88, 0.94, 1.04) * 0.028;
    float travel = pow(opening, side < 0.0 ? 0.72 : 0.50);
    float chips = side < 0.0 ? leftChips : rightChips;
    float flakeEdge = (angularGrain(sourceUV.y * 143.0, side < 0.0 ? 10.1 : 30.7) - 0.5) * 0.0044
      + (angularGrain(sourceUV.y * 317.0, side < 0.0 ? 41.3 : 53.9) - 0.5) * 0.0015;
    float halfWidth = 0.00065 * anticipation + travel * (reach + 0.006)
      + (chips * 0.62 + flakeEdge) * opening * (1.0 - opening) * 4.0;
    float feather = max(0.00038, 0.65 / uCurrentSize.x);
    reveal = (1.0 - smoothstep(halfWidth - feather, halfWidth + feather,
      distanceToCrack)) * propagated;
    vec4 shellSample = samplePhotograph(uCurrent, sourceUV);
    fractureHull = shellSample.a;
    reveal *= mix(0.12, 1.0, smoothstep(0.018, 0.055, t));
    // Connected edible crumb fills the opening. The inside photograph's pale
    // backdrop cannot enter the shell: hold this close crop until it departs,
    // then settle into the independently authored INSIDE composition.
    fracturePullback = smoothstep(0.44, 0.80, t);
    nextFocus = mix(vec2(0.70, 0.56), uNextFocus, fracturePullback);
    nextZoom = mix(max(1.80, uNextZoom), uNextZoom, fracturePullback);
    float separation = pow(opening, 1.25) * (side < 0.0 ? 0.013 : 0.020);
    currentScreen += vec2(-side, side * 0.14) * separation;
    float displacedAlpha = samplePhotograph(uCurrent,
      coverUV(currentScreen, uCurrentSize, uCurrentFocus, uCurrentZoom)).a;
    currentScreen = mix(vScreen, currentScreen, smoothstep(0.96, 1.0, displacedAlpha));
    edgeShade = bell(distanceToCrack, halfWidth + feather, feather * 2.5)
      * (1.0 - reveal) * propagated * 0.18;
    edgeShade += (1.0 - smoothstep(0.0002, 0.0011, distanceToCrack))
      * anticipation * propagated * (1.0 - smoothstep(0.018, 0.055, t)) * 0.21;
    // The upper-left key light gives the left shell lip a slightly deeper
    // shadow. Only a few source pixels of exposed crumb receive it; the
    // photograph's crust density modulates the lip rather than outlining it.
    float shellLuma = dot(shellSample.rgb, vec3(0.2126, 0.7152, 0.0722));
    float shellWeight = 0.65 + 0.35 * (1.0 - smoothstep(0.32, 0.77, shellLuma));
    float shadowWidth = (side < 0.0 ? 4.5 : 2.7) / uCurrentSize.x;
    float inset = max(0.0, halfWidth - distanceToCrack);
    fractureInsideShade = exp(-inset / shadowWidth) * (side < 0.0 ? 0.22 : 0.11)
      * shellWeight * reveal * smoothstep(0.018, 0.08, t)
      * (1.0 - smoothstep(0.32, 0.44, t));
  } else if (uTransition < 2.5) {
    float weightedTime = t * t * (3.0 - 2.0 * t);
    float lobes = pow(max(0.0, sin(vScreen.x * 10.2 + 0.8)), 4.0) * 0.12
      + sin(vScreen.x * 20.0 + 1.3) * 0.019;
    float front = mix(-0.19, 1.19, weightedTime)
      + lobes * sin(t * 3.14159265);
    reveal = 1.0 - smoothstep(front - 0.012, front + 0.015, vScreen.y);
    edgeShade = bell(vScreen.y, front + 0.015, 0.016) * (1.0 - reveal) * 0.055;
  } else if (uTransition < 3.5) {
    float airField = (1.0 - vScreen.y) * 0.59
      + grain(vScreen * vec2(5.0, 7.0)) * 0.28
      + grain(vScreen * vec2(14.0, 17.0)) * 0.13;
    reveal = smoothstep(airField - 0.055, airField + 0.055, t * 1.16 - 0.08);
  } else {
    float cutLine = vScreen.x + (0.5 - vScreen.y) * 0.24;
    float front = mix(-0.18, 1.18, t);
    reveal = 1.0 - smoothstep(front - 0.002, front + 0.004, cutLine);
    currentScreen.x += t * 0.015 * (1.0 - reveal);
    edgeShade = bell(cutLine, front + 0.006, 0.009) * (1.0 - reveal) * 0.13;
  }

  vec4 before = photograph(uCurrent, currentScreen, uCurrentSize,
    uCurrentFocus, uCurrentZoom, uCurrentEffect, uCurrentValue, uCurrentLight);
  vec4 after = photograph(uNext, vScreen, uNextSize,
    nextFocus, nextZoom, uNextEffect, uNextValue, uNextLight);
  if (fractureHull >= 0.0) {
    // Both planes retain the original photographic silhouette during the
    // break, including antialiased alpha and the isolated fragile flakes.
    before.a = fractureHull;
    after.a = mix(fractureHull, after.a, fracturePullback);
    after.rgb *= vec3(1.0) - vec3(0.92, 1.0, 1.10) * fractureInsideShade;
  }
  before.rgb *= 1.0 - edgeShade;
  gl_FragColor = mix(premultiplied(before), premultiplied(after), clamp(reveal, 0.0, 1.0));
  if (fractureHull >= 0.0 && fracturePullback <= 0.00001) gl_FragColor.a = fractureHull;
}
`;

function finite(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function point(value, fallback = [0.5, 0.5]) {
  return [clamp(finite(value?.[0], fallback[0]), 0, 1),
    clamp(finite(value?.[1], fallback[1]), 0, 1)];
}

function normaliseImage(spec) {
  if (!spec || typeof spec.image !== 'string' || !/^[a-z0-9][a-z0-9_-]*$/i.test(spec.image)) {
    throw new TypeError('MaterialStage requires an extensionless local image base name.');
  }
  return {
    image: spec.image,
    zoom: clamp(finite(spec.zoom, 1), 1, 3),
    focus: point(spec.focus),
    effect: Object.hasOwn(EFFECTS, spec.effect) ? EFFECTS[spec.effect] : EFFECTS.desire,
    value: clamp(finite(spec.value, 0), 0, 1),
    light: clamp(finite(spec.light, 0.5), 0, 1),
  };
}

function releaseDecoded(source) {
  if (typeof source?.close === 'function') source.close();
  else if (typeof source?.removeAttribute === 'function') source.removeAttribute('src');
}

async function decodeImage(blob, signal) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob, {
        imageOrientation: 'none', premultiplyAlpha: 'premultiply', colorSpaceConversion: 'default',
      });
    } catch (error) {
      if (signal.aborted) throw error;
      // Some Safari versions do not support every ImageBitmap option.
    }
  }
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(blob);
    const clean = () => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener('abort', abort);
      URL.revokeObjectURL(url);
    };
    const abort = () => {
      clean();
      image.removeAttribute('src');
      reject(new DOMException('Image request was superseded.', 'AbortError'));
    };
    image.onload = () => { clean(); resolve(image); };
    image.onerror = () => { clean(); reject(new Error('Unable to decode the photographic asset.')); };
    image.decoding = 'async';
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    else image.src = url;
  });
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to allocate a material shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const detail = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error.';
    gl.deleteShader(shader);
    throw new Error(detail);
  }
  return shader;
}

export class MaterialStage {
  constructor(canvas, { baseUrl = './media/', onReady = () => {}, onError = () => {} } = {}) {
    this.canvas = canvas;
    this.available = false;
    this.readyImages = new Set();
    this._onReady = typeof onReady === 'function' ? onReady : () => {};
    this._onError = typeof onError === 'function' ? onError : () => {};
    this._entries = new Map();
    this._wanted = new Set();
    this._reported = new Set();
    this._generation = 0;
    this._usage = 0;
    this._destroyed = false;
    this._readyQueued = false;
    this._needsRender = true;
    this._hasDrawn = false;
    this._lastFrame = null;
    this._cssWidth = 1;
    this._cssHeight = 1;
    this._maxEdge = MAX_EDGE;
    this._onContextLost = (event) => {
      event.preventDefault();
      if (this._destroyed) return;
      this.available = false;
      this._generation += 1;
      this._releaseAll(true);
      this._program = null;
      this._buffer = null;
      this._lastFrame = null;
      this._hasDrawn = false;
      this._notify(new Error('The photographic WebGL context was lost.'), 'WEBGL_CONTEXT_LOST', true);
    };
    this._onContextRestored = () => {
      if (this._destroyed) return;
      this._reported.clear();
      try {
        this._initialise();
        this.resize(this._cssWidth, this._cssHeight);
        this._signalReady();
      } catch (error) {
        this._fail(error, 'WEBGL_RESTORE_FAILED');
      }
    };

    try {
      if (!canvas || typeof canvas.getContext !== 'function') {
        throw new TypeError('MaterialStage requires a canvas element.');
      }
      const directory = String(baseUrl).endsWith('/') ? String(baseUrl) : `${baseUrl}/`;
      this._baseUrl = new URL(directory, document.baseURI).href;
      canvas.addEventListener('webglcontextlost', this._onContextLost);
      canvas.addEventListener('webglcontextrestored', this._onContextRestored);
      this._initialise();
      const bounds = canvas.getBoundingClientRect();
      this.resize(bounds.width || canvas.clientWidth || 1, bounds.height || canvas.clientHeight || 1);
    } catch (error) {
      this._fail(error, 'WEBGL_INIT_FAILED');
    }
  }

  _initialise() {
    const gl = this.canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      // Keeps the exact last composition while a newly requested pair decodes.
      // No additional full-resolution snapshot texture is allocated.
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL is unavailable; use the photographic DOM fallback.');
    this._gl = gl;
    const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    let vertex;
    let fragment;
    let program;
    try {
      vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SOURCE);
      fragment = compile(gl, gl.FRAGMENT_SHADER,
        FRAGMENT_SOURCE.replace('__PRECISION__', precision?.precision ? 'highp' : 'mediump'));
      program = gl.createProgram();
      if (!program) throw new Error('Unable to allocate the photographic shader program.');
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Material program failed to link.');
      }
    } catch (error) {
      if (program) gl.deleteProgram(program);
      throw error;
    } finally {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
    }

    this._program = program;
    this._buffer = gl.createBuffer();
    if (!this._buffer) throw new Error('Unable to allocate the material plane.');
    gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this._position = gl.getAttribLocation(program, 'aPosition');
    this._uniforms = Object.fromEntries([
      'Current', 'Next', 'Viewport', 'CurrentSize', 'NextSize', 'CurrentFocus', 'NextFocus',
      'Pointer', 'CurrentZoom', 'NextZoom', 'CurrentEffect', 'NextEffect', 'CurrentValue',
      'NextValue', 'CurrentLight', 'NextLight', 'Blend', 'Transition', 'Time', 'Motion',
      'Flow', 'Mobile',
    ].map((name) => [name, gl.getUniformLocation(program, `u${name}`)]));
    const viewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
    this._maxEdge = Math.min(MAX_EDGE, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      viewport[0], viewport[1]);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(0, 0, 0, 0);
    this.available = true;
  }

  resize(width, height) {
    if (this._destroyed) return;
    this._cssWidth = Math.max(1, finite(width, 1));
    this._cssHeight = Math.max(1, finite(height, 1));
    const scale = Math.min(MAX_DPR, Math.max(0.5, finite(globalThis.devicePixelRatio, 1)),
      this._maxEdge / Math.max(this._cssWidth, this._cssHeight),
      Math.sqrt(MAX_PIXELS / (this._cssWidth * this._cssHeight)));
    const bufferWidth = Math.max(1, Math.floor(this._cssWidth * scale));
    const bufferHeight = Math.max(1, Math.floor(this._cssHeight * scale));
    if (this.canvas.width === bufferWidth && this.canvas.height === bufferHeight) return;
    this.canvas.width = bufferWidth;
    this.canvas.height = bufferHeight;
    this._needsRender = true;
    if (!this.available) return;
    this._gl.viewport(0, 0, bufferWidth, bufferHeight);
    this._redrawLastFrame();
  }

  /** Returns true when the requested composition was rendered, false while loading. */
  render({ current, next = current, blend = 0, transition = 'edge', time = 0,
    motion = true, pointer = [0.5, 0.5], flow = 0.4, mobile = false } = {}) {
    if (!this.available || this._destroyed) return false;
    let frame;
    try {
      frame = {
        current: normaliseImage(current),
        next: normaliseImage(next ?? current),
        blend: clamp(finite(blend, 0), 0, 1),
        transition: Object.hasOwn(TRANSITIONS, transition) ? TRANSITIONS[transition] : 0,
        time: motion ? finite(time, 0) % 4096 : 0,
        motion: Boolean(motion),
        pointer: motion ? point(pointer) : [0.5, 0.5],
        flow: clamp(finite(flow, 0.4), 0, 1),
        mobile: Boolean(mobile),
      };
    } catch (error) {
      this._notify(error, 'INVALID_FRAME', false);
      return false;
    }

    // A tall portrait crop may need the larger source even on a phone.
    // Resolution follows the cover footprint rather than the device label.
    const resolution = Math.max(this.canvas.width, this.canvas.height * 1.5) > 900 ? 1536 : 768;
    const currentKey = `${frame.current.image}-${resolution}`;
    const nextKey = `${frame.next.image}-${resolution}`;
    this._wanted = new Set([currentKey, nextKey]);
    this._prune();
    const first = this._ensure(frame.current.image, resolution);
    const second = nextKey === currentKey ? first : this._ensure(frame.next.image, resolution);
    const firstNeeded = frame.motion ? frame.blend < 1 - ENDPOINT : frame.blend < 0.5;
    const secondNeeded = frame.motion ? frame.blend > ENDPOINT : frame.blend >= 0.5;
    if ((firstNeeded && first.state !== 'ready') || (secondNeeded && second.state !== 'ready')) {
      // The preserved drawing buffer remains unchanged while the correct pair loads.
      this._needsRender = false;
      return false;
    }
    const firstTexture = first.state === 'ready' ? first : second;
    const secondTexture = second.state === 'ready' ? second : first;
    try {
      this._draw(frame, firstTexture, secondTexture);
      firstTexture.lastUsed = ++this._usage;
      secondTexture.lastUsed = ++this._usage;
      this._lastFrame = { frame, currentKey: firstTexture.key, nextKey: secondTexture.key };
      this._hasDrawn = true;
      this._needsRender = false;
      return true;
    } catch (error) {
      this._fail(error, 'WEBGL_RENDER_FAILED');
      return false;
    }
  }

  _draw(frame, first, second) {
    const gl = this._gl;
    const u = this._uniforms;
    gl.useProgram(this._program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
    gl.enableVertexAttribArray(this._position);
    gl.vertexAttribPointer(this._position, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, first.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, second.texture);
    gl.uniform1i(u.Current, 0);
    gl.uniform1i(u.Next, 1);
    gl.uniform2f(u.Viewport, this.canvas.width, this.canvas.height);
    gl.uniform2f(u.CurrentSize, first.width, first.height);
    gl.uniform2f(u.NextSize, second.width, second.height);
    gl.uniform2f(u.CurrentFocus, ...frame.current.focus);
    gl.uniform2f(u.NextFocus, ...frame.next.focus);
    gl.uniform2f(u.Pointer, ...frame.pointer);
    gl.uniform1f(u.CurrentZoom, frame.current.zoom);
    gl.uniform1f(u.NextZoom, frame.next.zoom);
    gl.uniform1f(u.CurrentEffect, frame.current.effect);
    gl.uniform1f(u.NextEffect, frame.next.effect);
    gl.uniform1f(u.CurrentValue, frame.current.value);
    gl.uniform1f(u.NextValue, frame.next.value);
    gl.uniform1f(u.CurrentLight, frame.current.light);
    gl.uniform1f(u.NextLight, frame.next.light);
    gl.uniform1f(u.Blend, frame.blend);
    gl.uniform1f(u.Transition, frame.transition);
    gl.uniform1f(u.Time, frame.time);
    gl.uniform1f(u.Motion, frame.motion ? 1 : 0);
    gl.uniform1f(u.Flow, frame.flow);
    gl.uniform1f(u.Mobile, frame.mobile ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  _ensure(name, resolution) {
    const key = `${name}-${resolution}`;
    const present = this._entries.get(key);
    if (present) return present;
    const entry = {
      key, name, resolution, state: 'loading', texture: null, width: 0, height: 0,
      lastUsed: ++this._usage, controller: new AbortController(),
      generation: this._generation, cancelled: false,
    };
    this._entries.set(key, entry);
    void this._load(entry);
    return entry;
  }

  async _load(entry) {
    const url = new URL(`${entry.key}.webp`, this._baseUrl).href;
    let decoded;
    let texture;
    const stillWanted = () => !this._destroyed && this.available && !entry.cancelled
      && entry.generation === this._generation && this._entries.get(entry.key) === entry
      && this._wanted.has(entry.key);
    try {
      const response = await fetch(url, { signal: entry.controller.signal, cache: 'force-cache' });
      if (!response.ok) throw new Error(`Photographic asset returned HTTP ${response.status}.`);
      const blob = await response.blob();
      if (!stillWanted()) return;
      decoded = await decodeImage(blob, entry.controller.signal);
      if (!stillWanted()) return;
      const gl = this._gl;
      texture = gl.createTexture();
      if (!texture) throw new Error('Unable to allocate a photographic texture.');
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, decoded);
      const error = gl.getError();
      if (error !== gl.NO_ERROR) throw new Error(`Photographic texture upload failed (${error}).`);
      entry.texture = texture;
      texture = null;
      entry.width = decoded.width || decoded.naturalWidth;
      entry.height = decoded.height || decoded.naturalHeight;
      entry.state = 'ready';
      entry.lastUsed = ++this._usage;
      this.readyImages.add(entry.name);
      this._prune();
      this._signalReady();
    } catch (error) {
      if (stillWanted() && error?.name !== 'AbortError') {
        entry.state = 'failed';
        this._notify(error, 'IMAGE_LOAD_FAILED', false, { image: entry.name, url });
      }
    } finally {
      releaseDecoded(decoded);
      if (texture && this._gl && !this._gl.isContextLost()) this._gl.deleteTexture(texture);
    }
  }

  _prune() {
    const warm = [...this._entries.values()]
      .filter((entry) => entry.state === 'ready' && !this._wanted.has(entry.key))
      .sort((a, b) => b.lastUsed - a.lastUsed)[0];
    for (const entry of this._entries.values()) {
      if (!this._wanted.has(entry.key) && entry !== warm) this._disposeEntry(entry);
    }
  }

  _disposeEntry(entry, contextLost = false) {
    entry.cancelled = true;
    entry.controller.abort();
    if (entry.texture && !contextLost && this._gl && !this._gl.isContextLost()) {
      this._gl.deleteTexture(entry.texture);
    }
    entry.texture = null;
    this._entries.delete(entry.key);
    if (![...this._entries.values()].some((other) => other.name === entry.name && other.state === 'ready')) {
      this.readyImages.delete(entry.name);
    }
  }

  _releaseAll(contextLost = false) {
    for (const entry of this._entries.values()) this._disposeEntry(entry, contextLost);
    this._wanted.clear();
    this.readyImages.clear();
  }

  _redrawLastFrame() {
    if (!this._lastFrame || !this._hasDrawn) return;
    const { frame, currentKey, nextKey } = this._lastFrame;
    const first = this._entries.get(currentKey);
    const second = this._entries.get(nextKey);
    try {
      if (first?.state === 'ready' && second?.state === 'ready') {
        this._draw(frame, first, second);
        return;
      }
      // Resizing clears WebGL's buffer. If an old plane was evicted while a new
      // pair loads, recrop the retained warm photograph rather than show blank.
      const warm = [...this._entries.values()].filter((entry) => entry.state === 'ready')
        .sort((a, b) => b.lastUsed - a.lastUsed)[0];
      if (!warm) return;
      const spec = frame.current.image === warm.name ? frame.current
        : frame.next.image === warm.name ? frame.next : {
          image: warm.name, zoom: 1, focus: [0.5, 0.5], effect: 0, value: 0, light: 0.5,
        };
      this._draw({ ...frame, current: spec, next: spec, blend: 0, motion: false, time: 0 }, warm, warm);
    } catch (error) {
      this._fail(error, 'WEBGL_RESIZE_FAILED');
    }
  }

  _notify(error, code, fatal, details = {}) {
    const key = `${code}:${details.image || ''}`;
    if (this._reported.has(key) || this._destroyed) return;
    this._reported.add(key);
    const issue = error instanceof Error ? error : new Error(String(error));
    Object.assign(issue, { code, fatal, ...details });
    queueMicrotask(() => {
      if (!this._destroyed) this._onError(issue);
    });
  }

  _signalReady() {
    this._needsRender = true;
    if (this._readyQueued) return;
    this._readyQueued = true;
    queueMicrotask(() => {
      this._readyQueued = false;
      if (!this._destroyed && this.available) this._onReady();
    });
  }

  _fail(error, code) {
    this.available = false;
    this._generation += 1;
    this._releaseAll(this._gl?.isContextLost());
    if (this._gl && !this._gl.isContextLost()) {
      if (this._buffer) this._gl.deleteBuffer(this._buffer);
      if (this._program) this._gl.deleteProgram(this._program);
    }
    this._buffer = null;
    this._program = null;
    this._notify(error, code, true);
  }

  get stats() {
    const entries = [...this._entries.values()];
    const ready = entries.filter((entry) => entry.state === 'ready');
    return {
      available: this.available,
      residentImages: ready.length,
      pendingImages: entries.filter((entry) => entry.state === 'loading').length,
      textureBytes: ready.reduce((sum, entry) => sum + entry.width * entry.height * 4, 0),
      backingWidth: this.canvas?.width || 0,
      backingHeight: this.canvas?.height || 0,
      rendered: this._hasDrawn,
    };
  }

  /** Allows a paused/reduced-motion controller to repaint after asset readiness. */
  get needsRender() {
    return this.available && !this._destroyed && this._needsRender;
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this.available = false;
    this._generation += 1;
    this.canvas?.removeEventListener('webglcontextlost', this._onContextLost);
    this.canvas?.removeEventListener('webglcontextrestored', this._onContextRestored);
    this._releaseAll(this._gl?.isContextLost());
    if (this._gl && !this._gl.isContextLost()) {
      if (this._buffer) this._gl.deleteBuffer(this._buffer);
      if (this._program) this._gl.deleteProgram(this._program);
      this._gl.clear(this._gl.COLOR_BUFFER_BIT);
    }
    this._lastFrame = null;
    this._buffer = null;
    this._program = null;
    this._gl = null;
  }
}
