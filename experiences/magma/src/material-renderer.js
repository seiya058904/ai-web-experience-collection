import { stateAt, clamp } from './material-state.js';
import { createSplitSurface, createSeamData } from './fracture-geometry.js';
import { vertexSource, fragmentSource } from './shaders/material.js';

const ATTRIBUTES = ['aPosition', 'aSide', 'aDistance', 'aSeamNormal', 'aHeight', 'aNormal'];
const UNIFORMS = [
  'uImageA', 'uImageB', 'uSeams', 'uCoverA', 'uCoverB', 'uMaterialA',
  'uMaterialB', 'uTexel', 'uModes', 'uMix', 'uTime', 'uMotion', 'uZoom', 'uCamera',
  'uPointer', 'uGlass', 'uMeshPass', 'uSurfaceMode', 'uSplit', 'uRelief', 'uQuality',
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = async () => {
      try { await image.decode(); } catch { /* onload already confirms decoded availability. */ }
      image.onload = null;
      image.onerror = null;
      resolve(image);
    };
    image.onerror = () => {
      image.onload = null;
      image.onerror = null;
      reject(new Error(`Material image could not be loaded: ${src}`));
    };
    image.src = src;
  });
}

/**
 * Single-context 2.5D renderer. The host owns the only RAF and all scroll input.
 * ready resolves to true after a real first draw, false for the image fallback.
 */
export class MaterialRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.assets = options.assets || [];
    this.options = options;
    this.disposed = false;
    this.suspended = Boolean(options.suspended);
    this.lost = false;
    this.failed = false;
    this._firstDraw = false;
    this._restorePending = false;
    this._images = new Map();
    this._descriptors = new Map();
    this._loading = new Map();
    this._queue = [];
    this._needed = new Set();
    this._lastKeys = [];
    this._clock = 0;
    this.mobile = false;
    this.portrait = false;
    this._reported = new Set();
    this._lastFrame = { position: 0, time: 0, reducedMotion: false, pointer: { x: 0, y: 0 }, interaction: 0, velocity: 0 };
    this.ready = new Promise((resolve) => { this._resolveReady = resolve; });
    this._onLost = this._onLost.bind(this);
    this._onRestored = this._onRestored.bind(this);
    canvas.addEventListener('webglcontextlost', this._onLost, false);
    canvas.addEventListener('webglcontextrestored', this._onRestored, false);
    try {
      if (this.assets.length !== 9) throw new Error('MAGMA requires its nine material plates.');
      this.gl = canvas.getContext('webgl', {
        alpha: true, premultipliedAlpha: false, antialias: false,
        depth: false, stencil: false, preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
      });
      if (!this.gl) throw new Error('WebGL is unavailable; the image edition remains available.');
      this._initializeGL();
      this.resize();
      this.render(this._lastFrame);
    } catch (error) {
      this._fatal(error);
    }
  }

  _fatal(error) {
    this.failed = true;
    this._resolveReady(false);
    // Callbacks are asynchronous so callers can finish assigning the renderer.
    queueMicrotask(() => {
      if (!this.disposed) this.options.onError?.(error);
    });
  }

  _initializeGL() {
    const gl = this.gl;
    const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    const highPrecision = precision && precision.precision > 0;
    const fragment = highPrecision ? fragmentSource
      : fragmentSource.replace('precision highp float;', 'precision mediump float;');
    const vertexText = highPrecision ? vertexSource
      : vertexSource.replace('precision highp float;', 'precision mediump float;');
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexText);
    const frag = compile(gl.FRAGMENT_SHADER, fragment);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, frag);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const details = [gl.getProgramInfoLog(program), gl.getShaderInfoLog(vertex), gl.getShaderInfoLog(frag)].filter(Boolean).join('\n');
      gl.deleteShader(vertex);
      gl.deleteShader(frag);
      gl.deleteProgram(program);
      throw new Error(`Material shader initialization failed. ${details}`);
    }
    gl.deleteShader(vertex);
    gl.deleteShader(frag);
    this.program = program;
    this.attributes = Object.fromEntries(ATTRIBUTES.map((name) => [name, gl.getAttribLocation(program, name)]));
    this.uniforms = Object.fromEntries(UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]));
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    this.meshes = new Map();
    this._buildMeshes();
    const seam = createSeamData();
    this.seamTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.seamTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, seam.width, seam.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, seam.data);
    this.maxBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DITHER);
    gl.clearColor(0.025, 0.027, 0.027, 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  }

  _buildMeshes() {
    const gl = this.gl;
    for (const previous of this.meshes.values()) {
      gl.deleteBuffer(previous.vertex);
      gl.deleteBuffer(previous.index);
    }
    this.meshes.clear();
    for (const type of ['crack', 'fracture']) {
      const data = createSplitSurface(type, this.mobile ? 26 : 40, this.mobile ? 36 : 56);
      const vertex = gl.createBuffer();
      const index = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertex);
      gl.bufferData(gl.ARRAY_BUFFER, data.vertices, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW);
      this.meshes.set(type, { vertex, index, count: data.indices.length, stride: data.stride * 4 });
    }
  }

  resize(width = window.innerWidth, height = window.innerHeight) {
    if (this.disposed || this.failed) return;
    this.width = Math.max(1, Number(width) || window.innerWidth || 1);
    this.height = Math.max(1, Number(height) || window.innerHeight || 1);
    const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    const wasMobile = this.mobile;
    // Match the host's (max-width: 700px) composition breakpoint. Rendering
    // quality remains independent so wider touch devices retain landscape art.
    this.portrait = this.width <= 700;
    this.mobile = this.width < 768 || (coarse && this.width < 1024);
    const cap = this.mobile ? 1.25 : 1.5;
    const budget = this.mobile ? 1100000 : 3200000;
    const dpr = Math.min(window.devicePixelRatio || 1, cap,
      Math.sqrt(budget / (this.width * this.height)),
      (this.maxBufferSize || 4096) / Math.max(this.width, this.height));
    this.dpr = dpr;
    const w = Math.max(1, Math.floor(this.width * dpr));
    const h = Math.max(1, Math.floor(this.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    if (!this.lost) {
      this.gl.viewport(0, 0, w, h);
      if (wasMobile !== this.mobile && this.meshes) this._buildMeshes();
    }
  }

  _descriptor(index) {
    const asset = this.assets[index];
    const mobile = this.portrait && Boolean(asset.mobileSrc);
    const descriptorKey = `${index}:${mobile ? 'mobile' : 'desktop'}`;
    if (this._descriptors.has(descriptorKey)) return this._descriptors.get(descriptorKey);
    const src = mobile ? asset.mobileSrc : asset.src;
    const descriptor = {
      key: new URL(src, document.baseURI).href,
      index, src, mobile,
      focal: (mobile ? asset.mobileFocal : asset.focal) || asset.focal || [0.5, 0.5],
    };
    this._descriptors.set(descriptorKey, descriptor);
    return descriptor;
  }

  _cover(entry, descriptor) {
    const imageAspect = entry.image.naturalWidth / entry.image.naturalHeight;
    const viewportAspect = this.width / this.height;
    const x = viewportAspect < imageAspect ? viewportAspect / imageAspect : 1;
    const y = viewportAspect > imageAspect ? imageAspect / viewportAspect : 1;
    return [x, y, (1 - x) * clamp(descriptor.focal[0]), (1 - y) * clamp(descriptor.focal[1])];
  }

  _prepare(state) {
    const planKey = `${this.portrait}:${state.from}:${state.to}:${state.complete}`;
    if (this._planKey === planKey) return this._plan;
    const from = this._descriptor(state.from);
    const to = this._descriptor(state.to);
    const nextIndex = state.scene >= 7 ? 8 : Math.min(8, state.scene + 2);
    const priority = state.complete ? [to] : [from, to, this._descriptor(nextIndex)];
    const descriptors = [...new Map(priority.map((item) => [item.key, item])).values()];
    this._needed = new Set(descriptors.map((item) => item.key));
    this._queue = descriptors.filter((item) => !this._images.has(item.key) && !this._loading.has(item.key) && !this._reported.has(item.key));
    this._planKey = planKey;
    this._plan = { from, to };
    this._drainQueue();
    return this._plan;
  }

  _drainQueue() {
    if (this.disposed || this.failed) return;
    while (this._loading.size < 2 && this._queue.length) {
      const descriptor = this._queue.shift();
      if (this._images.has(descriptor.key) || this._loading.has(descriptor.key)) continue;
      const promise = loadImage(descriptor.key);
      this._loading.set(descriptor.key, promise);
      promise.then((image) => {
        if (this.disposed) return;
        if (!this._needed.has(descriptor.key)) {
          image.src = '';
          return;
        }
        const entry = { image, texture: null, used: ++this._clock, descriptor };
        this._images.set(descriptor.key, entry);
        // Release the previous plate before allocating a new GPU image. There
        // are never four photographic textures, even during a handoff.
        this._evict();
        if (!this.lost && this._images.has(descriptor.key)) this._upload(entry);
        this.render(this._lastFrame);
      }).catch((error) => {
        if (this.disposed) return;
        this._reported.add(descriptor.key);
        if (this._needed.has(descriptor.key)) this._fatal(error);
      }).finally(() => {
        this._loading.delete(descriptor.key);
        this._drainQueue();
      });
    }
  }

  _upload(entry) {
    const gl = this.gl;
    if (entry.texture) return;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, entry.image);
    entry.texture = texture;
  }

  _evict() {
    while (this._images.size > 3) {
      let candidates = [...this._images.entries()].filter(([key]) => !this._needed.has(key));
      if (!candidates.length) candidates = [...this._images.entries()];
      candidates.sort((a, b) => a[1].used - b[1].used);
      const [key, entry] = candidates[0];
      if (entry.texture && !this.lost) this.gl.deleteTexture(entry.texture);
      entry.image.src = '';
      this._images.delete(key);
    }
  }

  _quadAttributes() {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    for (const name of ATTRIBUTES) {
      const location = this.attributes[name];
      if (location < 0) continue;
      if (name === 'aPosition') {
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
      } else {
        gl.disableVertexAttribArray(location);
        gl.vertexAttrib4f(location, 0, 0, 0, 1);
      }
    }
  }

  _meshAttributes(mesh) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertex);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.index);
    const sizes = [2, 1, 1, 2, 1, 2];
    const offsets = [0, 2, 3, 4, 6, 7];
    ATTRIBUTES.forEach((name, i) => {
      const location = this.attributes[name];
      if (location < 0) return;
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, sizes[i], gl.FLOAT, false, mesh.stride, offsets[i] * 4);
    });
  }

  render(frame = {}) {
    if (this.disposed || this.failed) return false;
    this._lastFrame = { ...this._lastFrame, ...frame };
    if (this.lost || this.suspended) return false;
    const current = this._lastFrame;
    const state = stateAt(current.position, current.interaction);
    this.state = state;
    const descriptors = this._prepare(state);
    let a = this._images.get(descriptors.from.key);
    let b = this._images.get(descriptors.to.key);
    if (state.complete && b) a = b;
    if (!a?.texture) return false;
    let mix = state.mix;
    if (!b?.texture) { b = a; mix = 0; }
    a.used = ++this._clock;
    b.used = this._clock;
    const gl = this.gl;
    const u = this.uniforms;
    const reduced = Boolean(current.reducedMotion);
    const motion = reduced || state.complete ? 0 : 1;
    const pointer = {
      x: motion ? clamp(Number(current.pointer?.x) || 0, -1, 1) : 0,
      y: motion ? clamp(Number(current.pointer?.y) || 0, -1, 1) : 0,
    };
    const coverA = this._cover(a, state.complete ? descriptors.to : descriptors.from);
    const coverB = this._cover(b, b === a ? (state.complete ? descriptors.to : descriptors.from) : descriptors.to);
    // User-directed scroll and material actions still reveal geometry in the
    // reduced-motion edition; autonomous camera, light and pulse stay off.
    const surfaceMode = state.from === 4 || state.from === 6 ? state.from : 0;
    const split = surfaceMode ? state.source.split * (1 - mix) : 0;
    const relief = surfaceMode ? state.source.relief * (1 - mix) : 0;
    const materialA = state.complete ? state.destination : state.source;
    const materialB = b === a && !state.complete ? materialA : state.destination;
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, a.texture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, b.texture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.seamTexture);
    gl.uniform1i(u.uImageA, 0);
    gl.uniform1i(u.uImageB, 1);
    gl.uniform1i(u.uSeams, 2);
    gl.uniform4fv(u.uCoverA, coverA);
    gl.uniform4fv(u.uCoverB, coverB);
    gl.uniform4f(u.uMaterialA, materialA.retention, materialA.front, materialA.flow, materialA.pulse);
    gl.uniform4f(u.uMaterialB, materialB.retention, materialB.front, materialB.flow, materialB.pulse);
    gl.uniform4f(u.uTexel, 1 / a.image.naturalWidth, 1 / a.image.naturalHeight,
      1 / b.image.naturalWidth, 1 / b.image.naturalHeight);
    gl.uniform2f(u.uModes, state.complete ? 8 : state.from, b === a && !state.complete ? state.from : state.to);
    gl.uniform1f(u.uMix, mix);
    gl.uniform1f(u.uTime, Number.isFinite(current.time) ? current.time % 4096 : 0);
    gl.uniform1f(u.uMotion, motion);
    gl.uniform1f(u.uZoom, 1 + (reduced ? 0 : state.camera));
    gl.uniform2f(u.uCamera, reduced ? 0 : state.driftX, reduced ? 0 : state.driftY);
    gl.uniform2f(u.uPointer, pointer.x, pointer.y);
    gl.uniform1f(u.uGlass, reduced ? 0 : state.glass);
    gl.uniform1f(u.uSurfaceMode, surfaceMode);
    gl.uniform1f(u.uSplit, split);
    gl.uniform1f(u.uRelief, relief);
    gl.uniform1f(u.uQuality, this.mobile ? 0.6 : 1);
    gl.uniform1f(u.uMeshPass, 0);
    this._quadAttributes();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (surfaceMode && (split > 0.0001 || relief > 0.0001)) {
      const mesh = this.meshes.get(surfaceMode === 4 ? 'crack' : 'fracture');
      gl.uniform1f(u.uMeshPass, 1);
      this._meshAttributes(mesh);
      gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    }
    this._lastKeys = [descriptors.from.key, descriptors.to.key];
    if (!this._firstDraw) {
      this._firstDraw = true;
      this._resolveReady(true);
      queueMicrotask(() => { if (!this.disposed) this.options.onReady?.(); });
    }
    if (this._restorePending) {
      this._restorePending = false;
      queueMicrotask(() => { if (!this.disposed) this.options.onContextRestored?.(); });
    }
    return true;
  }

  _onLost(event) {
    event.preventDefault();
    if (this.disposed) return;
    this.lost = true;
    for (const entry of this._images.values()) entry.texture = null;
    this.options.onContextLost?.();
  }

  _onRestored() {
    if (this.disposed) return;
    try {
      this.lost = false;
      this._initializeGL();
      for (const entry of this._images.values()) this._upload(entry);
      this.resize();
      this._restorePending = true;
      this.render(this._lastFrame);
    } catch (error) { this._fatal(error); }
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this._resolveReady(false);
    this.canvas.removeEventListener('webglcontextlost', this._onLost);
    this.canvas.removeEventListener('webglcontextrestored', this._onRestored);
    this._queue = [];
    if (this.gl && !this.lost) {
      for (const entry of this._images.values()) {
        if (entry.texture) this.gl.deleteTexture(entry.texture);
      }
      for (const mesh of this.meshes?.values() || []) {
        this.gl.deleteBuffer(mesh.vertex);
        this.gl.deleteBuffer(mesh.index);
      }
      if (this.quad) this.gl.deleteBuffer(this.quad);
      if (this.seamTexture) this.gl.deleteTexture(this.seamTexture);
      if (this.program) this.gl.deleteProgram(this.program);
    }
    for (const entry of this._images.values()) entry.image.src = '';
    this._images.clear();
  }
}
