import { FOCAL, RIBBONS, cameraAt, geoMatrix, noise1, writeRibbons, clamp } from './model.js';
import { VERT, SKY_FRAG, SPACE_FRAG } from './shaders.js';

const MAX_PIXELS = 1.7e6;
const rad = (d) => (d * Math.PI) / 180;

// Skyline as elevation angles: distant ridges in R, framing conifers in G.
function buildSkyline(width = 2048) {
  const data = new Float32Array(width * 2);
  const near = new Float32Array(width);
  for (let i = 0; i < width; i += 1) {
    const az = (i / width) * 2 * Math.PI - Math.PI;
    const a = Math.cos(az) * 9 + 40;
    const b = Math.sin(az) * 9 + 40;
    const ridge = 1.5 + 3.4 * noise1(a * 0.42 + b * 0.31) + 1.5 * Math.abs(noise1(a * 1.9 + b * 1.4) - 0.5) * 2 + 0.34 * noise1(a * 7 + b * 6);
    data[i * 2] = rad(ridge);
    near[i] = rad(-1);
  }
  // Each conifer is a tapered, serrated spike; the frame stays open to the north.
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let n = 0; n < 2200; n += 1) {
    const az = (random() * 2 - 1) * Math.PI;
    const side = clamp((Math.abs(az) - 0.42) / 0.5);
    if (side <= 0 || random() > 0.25 + side) continue;
    const tall = (1.7 + side * side * 13) * (0.5 + 0.5 * random());
    const half = tall * 0.0034 * (0.7 + 0.5 * random());
    const from = Math.floor(((az - half + Math.PI) / (2 * Math.PI)) * width);
    const to = Math.ceil(((az + half + Math.PI) / (2 * Math.PI)) * width);
    for (let i = from; i <= to; i += 1) {
      const wrap = ((i % width) + width) % width;
      const x = ((i / width) * 2 * Math.PI - Math.PI - az) / half;
      const taper = 1 - Math.abs(x);
      if (taper <= 0) continue;
      const serration = 0.9 + 0.1 * Math.abs(Math.sin(x * 16 + n));
      near[wrap] = Math.max(near[wrap], rad(tall * taper ** 0.82 * serration));
    }
  }
  for (let i = 0; i < width; i += 1) data[i * 2 + 1] = near[i];
  return data;
}

export class AuroraRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.kind = 'webgl2';
    this.scale = 1;
    this.base = 1;
    this.smoothed = 16;
    this.sinceChange = 0;
    this.earthAsset = `${import.meta.env.BASE_URL}orbital/media/earth-texture.png`;
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.ribbonData = new Float32Array(RIBBONS.width * RIBBONS.count * 4);
    this.onLost = (event) => {
      event.preventDefault();
      this.lost = true;
    };
    this.onRestored = () => {
      this.lost = false;
      this.build();
      this.resize(this.width, this.height);
    };
    canvas.addEventListener('webglcontextlost', this.onLost);
    canvas.addEventListener('webglcontextrestored', this.onRestored);
    this.build();
  }

  program(fragment) {
    const { gl } = this;
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Shader failed');
      return shader;
    };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Link failed');
    const uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i += 1) {
      const { name } = gl.getActiveUniform(program, i);
      uniforms[name] = gl.getUniformLocation(program, name);
    }
    return { program, uniforms };
  }

  build() {
    const { gl } = this;
    this.sky = this.program(SKY_FRAG);
    this.space = this.program(SPACE_FRAG);
    this.vao = gl.createVertexArray();
    const texture = (w, h, internal, format, data, wrapS) => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.FLOAT, data);
      return t;
    };
    this.ribbon = texture(RIBBONS.width, RIBBONS.count, gl.RGBA16F, gl.RGBA, this.ribbonData, gl.CLAMP_TO_EDGE);
    this.skyline = texture(2048, 1, gl.RG16F, gl.RG, buildSkyline(), gl.REPEAT);
    this.earth = gl.createTexture();
    this.hasEarth = false;
    gl.bindTexture(gl.TEXTURE_2D, this.earth);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([5, 12, 28, 255]));
    gl.disable(gl.DEPTH_TEST);
  }

  // Load Earth only when the film first reaches space.
  requestEarth() {
    if (this.earthRequested) return;
    this.earthRequested = true;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (this.disposed || this.lost) return;
      const { gl } = this;
      gl.bindTexture(gl.TEXTURE_2D, this.earth);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      this.hasEarth = true;
      this.onChange?.();
    };
    image.src = this.earthAsset;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    this.base = Math.min(dpr, Math.sqrt(MAX_PIXELS / Math.max(1, width * height)));
    this.apply();
  }

  apply() {
    const w = Math.max(2, Math.round(this.width * this.base * this.scale));
    const h = Math.max(2, Math.round(this.height * this.base * this.scale));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
  }

  // Trades resolution for steady frames; the HTML layer above stays sharp.
  adapt(delta) {
    this.smoothed += (delta - this.smoothed) * 0.08;
    this.sinceChange += delta;
    if (this.sinceChange < 900) return;
    let next = this.scale;
    if (this.smoothed > 27) next = Math.max(0.5, this.scale - 0.12);
    else if (this.smoothed < 15 && this.scale < 1) next = Math.min(1, this.scale + 0.06);
    if (next !== this.scale) {
      this.scale = next;
      this.sinceChange = 0;
      this.apply();
    }
  }

  drawSky(frame, alpha) {
    const { gl, sky } = this;
    const u = sky.uniforms;
    gl.useProgram(sky.program);
    writeRibbons(this.ribbonData, frame.time, frame.view.kp);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.ribbon);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, RIBBONS.width, RIBBONS.count, gl.RGBA, gl.FLOAT, this.ribbonData);
    gl.uniform1i(u.uRibbon, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.skyline);
    gl.uniform1i(u.uSkyline, 1);
    const aspect = this.width / this.height;
    const verticalFov = aspect < 1 ? 74 : 58;
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, frame.time);
    gl.uniform1f(u.uExposure, 1.05);
    gl.uniform1f(u.uPitch, rad(frame.scene.pitch));
    gl.uniform1f(u.uYaw, frame.yaw);
    gl.uniform1f(u.uFocal, 1 / Math.tan(rad(verticalFov / 2)));
    gl.uniform1f(u.uDistance, frame.view.distanceKm);
    gl.uniform1f(u.uKp, frame.view.kp);
    gl.uniform1f(u.uDip, 0.21);
    gl.uniform3fv(u.uIso, frame.view.iso);
    const reach = clamp(1 - frame.view.distanceKm / 1500);
    const g = reach * (0.2 + frame.view.kp * 0.12) * Math.max(frame.view.iso[0], 0.1);
    gl.uniform3f(u.uGlow, 0.15 * g, g, 0.4 * g);
    gl.uniform1i(u.uSteps, this.scale < 0.65 ? 28 : this.scale < 0.85 ? 36 : 46);
    gl.uniform1i(u.uRibbons, frame.view.kp < 1.5 ? 1 : frame.view.kp < 3 ? 2 : 3);
    this.quad(alpha);
  }

  drawSpace(frame, alpha) {
    const { gl, space } = this;
    const u = space.uniforms;
    const v = frame.view;
    const cam = cameraAt(frame.scene, v.equator + 3);
    gl.useProgram(space.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.earth);
    gl.uniform1i(u.uEarth, 0);
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, frame.time);
    gl.uniform1f(u.uExposure, 1.05);
    gl.uniform3fv(u.uPos, cam.pos);
    gl.uniform3fv(u.uRight, cam.right);
    gl.uniform3fv(u.uUp, cam.up);
    gl.uniform3fv(u.uFwd, cam.fwd);
    gl.uniform1f(u.uFocal, FOCAL);
    gl.uniform1f(u.uR0, v.r0);
    gl.uniform1f(u.uAlpha, v.alpha);
    gl.uniform1f(u.uBow, v.r0 * 1.3);
    gl.uniform1f(u.uDiagram, frame.scene.diagram);
    gl.uniform1f(u.uOpen, v.open);
    gl.uniform1f(u.uKp, v.kp);
    gl.uniform1f(u.uOvalEq, v.equator);
    gl.uniform1f(u.uObserver, v.latitude);
    gl.uniform1f(u.uRing, frame.scene.ring);
    gl.uniform1f(u.uHasEarth, this.hasEarth ? 1 : 0);
    gl.uniform1f(u.uWind, v.speed / 900);
    const cos = Math.cos(rad(v.equator + 2));
    gl.uniform1f(u.uLc, 1 / (cos * cos));
    gl.uniformMatrix3fv(u.uGeo, false, geoMatrix(1.9 + frame.time * 0.03));
    this.quad(alpha);
  }

  quad(alpha) {
    const { gl } = this;
    if (alpha < 1) {
      gl.enable(gl.BLEND);
      gl.blendColor(0, 0, 0, alpha);
      gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
    } else gl.disable(gl.BLEND);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  draw(frame) {
    if (this.lost) return;
    const { sky } = frame.scene;
    if (sky < 1) {
      this.requestEarth();
      this.drawSpace(frame, 1);
      if (sky > 0) this.drawSky(frame, sky);
    } else {
      this.drawSky(frame, 1);
      if (frame.preload) this.requestEarth();
    }
  }

  dispose() {
    this.disposed = true;
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onRestored);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
