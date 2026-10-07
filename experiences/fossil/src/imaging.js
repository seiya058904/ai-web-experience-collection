/* FOSSIL — interpretive imaging. Classic script; no fetch, imports, or RAF.
 * All sections, outlines and reconstruction geometry consume FOSSIL_VOLUME.
 * This is authored illustrative data, never a real CT or scientific model.
 */
(function (global) {
  'use strict';

  const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, Number.isFinite(x) ? x : lo));
  const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
  const makeCanvas = (w, h) => {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    return canvas;
  };
  function decode(value) {
    const text = global.atob(value);
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
    return bytes;
  }
  function rotation(x, y) {
    const sx = Math.sin(x), cx = Math.cos(x), sy = Math.sin(y), cy = Math.cos(y);
    return new Float32Array([cy, 0, -sy, sy * sx, cx, cy * sx, sy * cx, -sx, cy * cx]);
  }

  class FossilImaging {
    constructor({ scanCanvas, volumeCanvas, thumbs = [], onReady } = {}) {
      this.ready = false;
      this.sectionCount = 72;
      this.scanCanvas = scanCanvas;
      this.volumeCanvas = volumeCanvas;
      this.thumbs = Array.from(thumbs);
      this.width = 1; this.height = 1; this.dpr = 1;
      this.renderer = 'canvas';
      this.error = null;
      this._disposed = false;
      this._sliceCache = new Map();
      this._lineCache = new Map();
      this._resources = { buffers: [], textures: [], programs: [] };
      this._scanCtx = scanCanvas && scanCanvas.getContext('2d', { alpha: true });
      this._volumeCtx = volumeCanvas && volumeCanvas.getContext('2d', { alpha: true });
      this._reduced = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
      const data = global.FOSSIL_VOLUME;
      if (!data || !data.densityBase64 || !data.mesh) {
        this.error = new Error('Load data/fossil-volume.js before constructing FossilImaging.');
        if (onReady) Promise.resolve().then(() => onReady(this));
        return;
      }
      this.data = data;
      this.nx = data.nx; this.ny = data.ny; this.nz = data.nz;
      this.sectionCount = this.nz;
      this.thumbSections = data.thumbSections.slice();
      this.density = decode(data.densityBase64);
      this._meshPositions = new Int16Array(decode(data.mesh.positionsBase64).buffer);
      this._meshNormals = new Int8Array(decode(data.mesh.normalsBase64).buffer);
      const indexBytes = decode(data.mesh.indicesBase64);
      this._meshIndices = data.mesh.indexType === 'uint32' ? new Uint32Array(indexBytes.buffer) : new Uint16Array(indexBytes.buffer);
      this._slicePoints = [];
      this._makeExtents();
      this._makeSurface();
      this._makePlaneGeometry();
      this.ready = true;
      this.resize(global.innerWidth || 1200, global.innerHeight || 800, global.devicePixelRatio || 1);
      this._paintThumbs();
      if (onReady) Promise.resolve().then(() => { if (!this._disposed) onReady(this); });
    }

    resize(width, height, dpr = 1) {
      this.width = Math.max(1, Number(width) || 1);
      this.height = Math.max(1, Number(height) || 1);
      this.dpr = clamp(Number(dpr) || 1, .25, 2);
      const w = Math.round(this.width * this.dpr), h = Math.round(this.height * this.dpr);
      for (const canvas of [this.scanCanvas, this.volumeCanvas, this._glCanvas]) {
        if (canvas && (canvas.width !== w || canvas.height !== h)) {
          canvas.width = w; canvas.height = h;
        }
      }
      if (this.ready) this._paintThumbs();
    }

    _clear(ctx, canvas) {
      if (!ctx || !canvas) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }

    _rect(rect) {
      return rect && rect.width > 0 && rect.height > 0 ? rect : { x: 0, y: 0, width: this.width, height: this.height };
    }

    _fitDataRect(rect) {
      const r=this._rect(rect),b=this._mipBounds;
      const width=(b[2]-b[0])/(this.nx-1)*(this.data.bounds.x[1]-this.data.bounds.x[0]);
      const height=(b[3]-b[1])/(this.ny-1)*(this.data.bounds.y[1]-this.data.bounds.y[0]);
      const scale=Math.min(r.width/width,r.height/height);
      return {x:r.x+(r.width-width*scale)/2,y:r.y+(r.height-height*scale)/2,width:width*scale,height:height*scale};
    }

    _sliceImage(section, lines = false) {
      const cache = lines ? this._lineCache : this._sliceCache;
      if (cache.has(section)) return cache.get(section);
      const canvas = makeCanvas(this.nx, this.ny), ctx = canvas.getContext('2d');
      const image = ctx.createImageData(this.nx, this.ny);
      const plane = this.nx * this.ny, offset = section * plane, src = this.density, dst = image.data;
      for (let y = 0; y < this.ny; y++) {
        for (let x = 0; x < this.nx; x++) {
          const i = y * this.nx + x, d = src[offset + i];
          if (d <= 4) continue;
          const left = src[offset + y * this.nx + Math.max(0, x - 1)];
          const right = src[offset + y * this.nx + Math.min(this.nx - 1, x + 1)];
          const up = src[offset + Math.max(0, y - 1) * this.nx + x];
          const down = src[offset + Math.min(this.ny - 1, y + 1) * this.nx + x];
          const edge = Math.min(1, Math.hypot(right - left, down - up) / 235);
          const j = i * 4;
          if (lines) {
            dst[j] = 240; dst[j + 1] = 238; dst[j + 2] = 227;
            dst[j + 3] = Math.round(clamp(edge * 1.15 + (d > 135 ? .075 : 0)) * 255);
          } else {
            const tone = clamp(13 + Math.pow(d / 255, .79) * 226 + edge * 16, 0, 255);
            dst[j] = tone; dst[j + 1] = tone; dst[j + 2] = tone;
            dst[j + 3] = Math.round(clamp((d - 3) / 13) * 250);
          }
        }
      }
      ctx.putImageData(image, 0, 0);
      cache.set(section, canvas);
      // Keep a small scan cache; the full volume remains the source of truth.
      if (!lines && cache.size > 12) {
        const first = Array.from(cache.keys()).find(value => !this.thumbSections.includes(value));
        if (first !== undefined) cache.delete(first);
      }
      return canvas;
    }

    _makeExtents() {
      const { nx, ny, nz, density, data } = this;
      const x0 = data.bounds.x[0], xr = data.bounds.x[1] - x0;
      const y0 = data.bounds.y[0], yr = data.bounds.y[1] - y0;
      const z0 = data.bounds.z[0], zr = data.bounds.z[1] - z0;
      let bx0 = nx, by0 = ny, bx1 = 0, by1 = 0;
      for (let z = 0; z < nz; z++) {
        const points = [], base = z * nx * ny;
        for (let y = 0; y < ny; y++) {
          let left = nx, right = -1;
          for (let x = 0; x < nx; x++) {
            if (density[base + y * nx + x] > 5) { left = Math.min(left, x); right = x; }
          }
          if (right < 0) continue;
          const py = -(y0 + y / (ny - 1) * yr), pz = z0 + z / (nz - 1) * zr;
          points.push(x0 + left / (nx - 1) * xr, py, pz, x0 + right / (nx - 1) * xr, py, pz);
          bx0 = Math.min(bx0, left); bx1 = Math.max(bx1, right + 1);
          by0 = Math.min(by0, y); by1 = Math.max(by1, y + 1);
        }
        this._slicePoints.push(new Float32Array(points));
      }
      this._mipBounds = [bx0, by0, bx1, by1];
    }

    _makeSurface() {
      // A full-resolution software raster of the SAME indexed mesh used by
      // WebGL. It is deliberately not a magnified 192-pixel density preview.
      // Fixed pose avoids costly re-rasterization under reduced motion; section
      // planes continue to assemble as precise vector contours around it.
      const positions = this._meshPositions, normals = this._meshNormals, indices = this._meshIndices;
      const count = positions.length / 3, rot = rotation(-.08, -.40);
      const projected = new Float32Array(positions.length), shades = new Float32Array(count);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const scale = this.data.mesh.positionScale / 32767;
      for (let vertex = 0; vertex < count; vertex++) {
        const i = vertex * 3, x = positions[i] * scale, y = positions[i+1] * scale, z = positions[i+2] * scale;
        const rx = rot[0]*x + rot[3]*y + rot[6]*z, ry = rot[1]*x + rot[4]*y + rot[7]*z, rz = rot[2]*x + rot[5]*y + rot[8]*z;
        const perspective = 1/(1-rz*.18), px = rx*perspective, py = ry*perspective;
        projected[i] = px; projected[i+1] = py; projected[i+2] = rz;
        minX = Math.min(minX,px); maxX = Math.max(maxX,px); minY = Math.min(minY,py); maxY = Math.max(maxY,py);
        const nx = normals[i]/127, ny = normals[i+1]/127, nz = normals[i+2]/127;
        let gx = rot[0]*nx + rot[3]*ny + rot[6]*nz, gy = rot[1]*nx + rot[4]*ny + rot[7]*nz, gz = rot[2]*nx + rot[5]*ny + rot[8]*nz;
        const magnitude = Math.hypot(gx,gy,gz) || 1; gx/=magnitude; gy/=magnitude; gz/=magnitude;
        const key = Math.max(0,gx*-.4794 + gy*.5993 + gz*.6421), fill = Math.max(0,gx*.8033 + gy*.1607 + gz*.5738);
        const hash = ((positions[i]*73856093 ^ positions[i+1]*19349663 ^ positions[i+2]*83492791) >>> 0) % 1024;
        shades[vertex] = clamp(.48 + .43*Math.pow(key,.88) + .065*fill + (hash/1024-.5)*.018, .38, 1);
      }
      const width = 768, height = Math.max(1,Math.round(width*(maxY-minY)/(maxX-minX)));
      const canvas = makeCanvas(width,height), ctx = canvas.getContext('2d'), image = ctx.createImageData(width,height);
      const depth = new Float32Array(width*height); depth.fill(-Infinity);
      for (let i=0;i<projected.length;i+=3) {
        projected[i]=(projected[i]-minX)/(maxX-minX)*(width-1);
        projected[i+1]=(maxY-projected[i+1])/(maxY-minY)*(height-1);
      }
      const pixels = image.data;
      for (let face=0;face<indices.length;face+=3) {
        const ia=indices[face],ib=indices[face+1],ic=indices[face+2],a=ia*3,b=ib*3,c=ic*3;
        const ax=projected[a],ay=projected[a+1],bx=projected[b],by=projected[b+1],cx=projected[c],cy=projected[c+1];
        const area=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
        if(Math.abs(area)<1e-7) continue;
        const x0=Math.max(0,Math.ceil(Math.min(ax,bx,cx)-.5)),x1=Math.min(width-1,Math.floor(Math.max(ax,bx,cx)-.5));
        const y0=Math.max(0,Math.ceil(Math.min(ay,by,cy)-.5)),y1=Math.min(height-1,Math.floor(Math.max(ay,by,cy)-.5));
        if(x0>x1||y0>y1) continue;
        const inverse=1/area,daX=(by-cy)*inverse,daY=(cx-bx)*inverse,dbX=(cy-ay)*inverse,dbY=(ax-cx)*inverse;
        let rowA=((by-cy)*(x0+.5-cx)+(cx-bx)*(y0+.5-cy))*inverse;
        let rowB=((cy-ay)*(x0+.5-cx)+(ax-cx)*(y0+.5-cy))*inverse;
        const za=projected[a+2],zb=projected[b+2],zc=projected[c+2],sa=shades[ia],sb=shades[ib],sc=shades[ic];
        for(let y=y0;y<=y1;y++) {
          let wa=rowA,wb=rowB,index=y*width+x0;
          for(let x=x0;x<=x1;x++,index++,wa+=daX,wb+=dbX) {
            const wc=1-wa-wb;
            if(wa<-.000001||wb<-.000001||wc<-.000001) continue;
            const z=wa*za+wb*zb+wc*zc;
            if(z<=depth[index]) continue;
            depth[index]=z;
            const shade=wa*sa+wb*sb+wc*sc,p=index*4;
            pixels[p]=237.4*shade;pixels[p+1]=234.3*shade;pixels[p+2]=222.6*shade;pixels[p+3]=255;
          }
          rowA+=daY;rowB+=dbY;
        }
      }
      ctx.putImageData(image,0,0);
      this._surface=canvas;this._softwareBounds=[minX,minY,maxX,maxY];this._softwareRotation=rot;
    }

    _paintThumbs() {
      if (!this.ready) return;
      this.thumbs.forEach((canvas, index) => {
        if (!canvas || !canvas.getContext) return;
        const section = this.thumbSections[index % this.thumbSections.length];
        const ctx = canvas.getContext('2d');
        const width = canvas.clientWidth || 120, height = canvas.clientHeight || 100;
        canvas.width = Math.round(width * this.dpr); canvas.height = Math.round(height * this.dpr);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const b = this.data.sliceBounds[section], bw = b[2] - b[0], bh = b[3] - b[1];
        if (!bw || !bh) return;
        const scale = Math.min(canvas.width / bw, canvas.height / bh) * .92;
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(this._sliceImage(section), b[0], b[1], bw, bh,
          (canvas.width - bw * scale) / 2, (canvas.height - bh * scale) / 2, bw * scale, bh * scale);
        canvas.dataset.section = String(section);
      });
    }

    renderScan({ progress = 1, section = 36, alpha = 1, rect, motion = true, time = 0 } = {}) {
      const ctx = this._scanCtx;
      this._clear(ctx, this.scanCanvas);
      if (!this.ready || !ctx || this._disposed || alpha <= 0) return;
      section = Math.round(clamp(Number(section), 0, this.nz - 1));
      const r = this._fitDataRect(rect), b = this._mipBounds;
      const bw = b[2] - b[0], bh = b[3] - b[1];
      if (!bw || !bh) return;
      ctx.save();
      ctx.globalAlpha = clamp(alpha);
      // Every section uses the SAME volume bounds and aspect-preserving fit.
      // Empty margins and smaller outer sections never trigger a zoom or warp.
      // The host controls the photographic handoff, slider and scan rule.
      ctx.drawImage(this._sliceImage(section), b[0], b[1], bw, bh, r.x, r.y, r.width, r.height);
      ctx.restore();
      this.currentSection = section;
    }

    _initGL() {
      if (this._gl || this._glFailed) return !!this._gl;
      const canvas = makeCanvas(Math.round(this.width * this.dpr), Math.round(this.height * this.dpr));
      const gl = canvas.getContext('webgl', { alpha: true, antialias: true, depth: true, premultipliedAlpha: true, preserveDrawingBuffer: false });
      if (!gl) { this._glFailed = true; return false; }
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      const rendererName = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : '';
      if (/swiftshader|llvmpipe|softpipe|software rasterizer/i.test(rendererName) && !this._allowSoftwareGL) {
        this.rendererReason = 'software graphics device; using high-resolution mesh raster';
        const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
        this._glFailed = true; return false;
      }
      const uint32 = gl.getExtension('OES_element_index_uint');
      if (this._meshIndices instanceof Uint32Array && !uint32) { this._glFailed = true; return false; }
      this._glCanvas = canvas; this._gl = gl;
      canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); this._glFailed = true; this._releaseGL(gl); });
      const projection = `
        uniform mat3 uRotation;
        uniform vec4 uBounds;
        uniform vec4 uRect;
        uniform vec2 uViewport;
        vec4 projectPoint(vec3 p) {
          vec3 r = uRotation * p;
          vec2 xy = r.xy / (1.0 - r.z * 0.18);
          vec2 t = (xy - uBounds.xy) / max(uBounds.zw - uBounds.xy, vec2(0.001));
          vec2 screen = vec2(uRect.x + t.x * uRect.z, uRect.y + (1.0 - t.y) * uRect.w);
          return vec4(screen.x / uViewport.x * 2.0 - 1.0, 1.0 - screen.y / uViewport.y * 2.0, -r.z / 4.0, 1.0);
        }`;
      const meshVS = `
        attribute vec3 aPosition; attribute vec3 aNormal;
        uniform float uPositionScale;
        varying vec3 vNormal; varying vec3 vPosition;
        ${projection}
        void main() {
          vec3 p = aPosition * uPositionScale;
          vPosition = p; vNormal = uRotation * aNormal;
          gl_Position = projectPoint(p);
        }`;
      const meshFS = `
        precision highp float;
        varying vec3 vNormal; varying vec3 vPosition;
        uniform float uAlpha; uniform float uGhost;
        float grain(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        void main() {
          vec3 n = normalize(vNormal);
          float key = max(dot(n, normalize(vec3(-0.56, 0.70, 0.75))), 0.0);
          float fill = max(dot(n, normalize(vec3(0.7, 0.14, 0.5))), 0.0);
          float rim = pow(1.0 - abs(n.z), 2.0);
          float material = (grain(vPosition * 350.0) - 0.5) * 0.048;
          float shade = 0.48 + 0.43 * pow(key, 0.88) + 0.065 * fill + rim * 0.018 + material;
          vec3 chalk = vec3(0.931, 0.919, 0.873) * shade;
          float opacity = uAlpha * mix(1.0, 0.14 + rim * 0.13, uGhost);
          gl_FragColor = vec4(chalk, opacity);
        }`;
      const planeVS = `
        attribute vec3 aPosition;
        uniform float uShift;
        ${projection}
        void main() { gl_Position = projectPoint(aPosition + vec3(0.0, 0.0, uShift)); }`;
      const planeFS = `
        precision mediump float;
        uniform float uPlaneAlpha;
        void main() {
          gl_FragColor = vec4(0.956, 0.95, 0.916, uPlaneAlpha);
        }`;
      try {
        this._meshProgram = this._program(meshVS, meshFS);
        this._planeProgram = this._program(planeVS, planeFS);
        this._positionBuffer = this._buffer(gl.ARRAY_BUFFER, this._meshPositions);
        this._normalBuffer = this._buffer(gl.ARRAY_BUFFER, this._meshNormals);
        this._indexBuffer = this._buffer(gl.ELEMENT_ARRAY_BUFFER, this._meshIndices);
        this._buildPlanes();
        return true;
      } catch (error) {
        this.error = error; this._glFailed = true; this._releaseGL(gl);
        return false;
      }
    }

    _program(vertex, fragment) {
      const gl = this._gl;
      const shaders = [];
      const compile = (type, source) => {
        const shader = gl.createShader(type); shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Imaging shader failed.');
        return shader;
      };
      let program;
      try {
        const vs = compile(gl.VERTEX_SHADER, vertex), fs = compile(gl.FRAGMENT_SHADER, fragment);
        program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Imaging shader link failed.');
      } catch (error) {
        if (program) gl.deleteProgram(program);
        throw error;
      } finally {
        shaders.forEach(shader => gl.deleteShader(shader));
      }
      this._resources.programs.push(program);
      const result = { program, uniforms: {}, attributes: {} };
      ['uRotation', 'uBounds', 'uRect', 'uViewport', 'uPositionScale', 'uAlpha', 'uGhost', 'uShift', 'uAtlas', 'uTexel', 'uPlaneAlpha'].forEach(name => result.uniforms[name] = gl.getUniformLocation(program, name));
      ['aPosition', 'aNormal', 'aUV'].forEach(name => result.attributes[name] = gl.getAttribLocation(program, name));
      return result;
    }

    _buffer(target, value) {
      const gl = this._gl, buffer = gl.createBuffer();
      gl.bindBuffer(target, buffer); gl.bufferData(target, value, gl.STATIC_DRAW);
      this._resources.buffers.push(buffer);
      return buffer;
    }

    _releaseGL(gl = this._gl) {
      if (gl) {
        this._resources.buffers.forEach(x => gl.deleteBuffer(x));
        this._resources.textures.forEach(x => gl.deleteTexture(x));
        this._resources.programs.forEach(x => gl.deleteProgram(x));
      }
      this._resources = { buffers: [], textures: [], programs: [] };
      this._gl = null; this._glCanvas = null;
    }

    _buildPlanes() {
      this._makePlaneGeometry();
      this._planeBuffer = this._buffer(this._gl.ARRAY_BUFFER, this._planeVertices);
    }

    _makePlaneGeometry() {
      if (this._planeVertices) return;
      const { nx, ny, nz, data, density } = this, iso = data.mesh.iso;
      // Marching squares at the mesh isovalue yields genuine section contours.
      // Lines draw only evidence-bearing edges instead of dozens of enormous
      // mostly transparent textured quads. This keeps the plane stack crisp.
      const table = {1:[3,0],2:[0,1],3:[3,1],4:[1,2],5:[3,0,1,2],6:[0,2],7:[3,2],
        8:[2,3],9:[2,0],10:[0,1,2,3],11:[2,1],12:[1,3],13:[1,0],14:[0,3]};
      const edgeCorners = [[0,1],[1,2],[2,3],[3,0]], cornerX = [0,1,1,0], cornerY = [0,0,1,1];
      const vertices = [], stride = nx * ny;
      this._planeRanges = [];
      for (let z = 0; z < nz; z++) {
        const start = vertices.length / 3, offset = z * stride;
        const pz = data.bounds.z[0] + z / (nz - 1) * (data.bounds.z[1] - data.bounds.z[0]);
        for (let y = 0; y < ny - 1; y++) {
          for (let x = 0; x < nx - 1; x++) {
            const index = offset + y * nx + x;
            const values = [density[index], density[index+1], density[index+nx+1], density[index+nx]];
            const mask = (values[0] >= iso ? 1 : 0) | (values[1] >= iso ? 2 : 0) | (values[2] >= iso ? 4 : 0) | (values[3] >= iso ? 8 : 0);
            let edges = table[mask];
            if (!edges) continue;
            if ((mask === 5 || mask === 10) && (values[0]+values[1]+values[2]+values[3])/4 >= iso) edges = mask === 5 ? [0,1,2,3] : [3,0,1,2];
            for (const edge of edges) {
              const [a,b] = edgeCorners[edge], t = (iso - values[a]) / (values[b] - values[a]);
              const vx = x + cornerX[a] + (cornerX[b] - cornerX[a]) * t;
              const vy = y + cornerY[a] + (cornerY[b] - cornerY[a]) * t;
              vertices.push(data.bounds.x[0] + vx/(nx-1)*(data.bounds.x[1]-data.bounds.x[0]),
                -(data.bounds.y[0] + vy/(ny-1)*(data.bounds.y[1]-data.bounds.y[0])), pz);
            }
          }
        }
        this._planeRanges.push([start, vertices.length / 3 - start]);
      }
      this._planeVertices = new Float32Array(vertices);
    }

    _planes(count) {
      const result = [];
      for (let i = 0; i < count; i++) result.push(Math.round(i * (this.nz - 1) / (count - 1)));
      return result;
    }

    _projectBounds(rot, explode, planes) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const add = (points, shift) => {
        for (let i = 0; i < points.length; i += 3) {
          const x = points[i], y = points[i + 1], z = points[i + 2] + shift;
          const rx = rot[0] * x + rot[3] * y + rot[6] * z;
          const ry = rot[1] * x + rot[4] * y + rot[7] * z;
          const rz = rot[2] * x + rot[5] * y + rot[8] * z;
          const perspective = 1 / (1 - rz * .18), px = rx * perspective, py = ry * perspective;
          minX = Math.min(minX, px); maxX = Math.max(maxX, px);
          minY = Math.min(minY, py); maxY = Math.max(maxY, py);
        }
      };
      for (const z of planes) add(this._slicePoints[z], -(1 - z / (this.nz - 1)) * explode);
      // Include unshifted material: the specimen stays readable throughout.
      for (let z = 0; z < this.nz; z += 2) add(this._slicePoints[z], 0);
      return [minX, minY, maxX, maxY];
    }

    _uniforms(program, rot, bounds, rect) {
      const gl = this._gl, u = program.uniforms;
      gl.useProgram(program.program);
      gl.uniformMatrix3fv(u.uRotation, false, rot);
      gl.uniform4fv(u.uBounds, bounds);
      gl.uniform4f(u.uRect, rect.x, rect.y, rect.width, rect.height);
      gl.uniform2f(u.uViewport, this.width, this.height);
    }

    _renderGL({ rect, mode, alpha, assembly, motion, time, pointer }) {
      const gl = this._gl;
      const seconds = Number(time) || 0;
      const px = motion && pointer ? clamp(Number(pointer.x) || 0, -1, 1) : 0;
      const py = motion && pointer ? clamp(Number(pointer.y) || 0, -1, 1) : 0;
      const drift = motion ? Math.sin(seconds * .18) * .014 : 0;
      const rot = rotation(-.08 + py * .024, -.40 + px * .038 + drift);
      const explode = .60 + (1 - assembly) * .66;
      const planes = this._planes(this.width < 760 ? 16 : 48);
      const bounds = this._projectBounds(rot, explode, planes);
      gl.viewport(0, 0, this._glCanvas.width, this._glCanvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE);
      const mesh = this._meshProgram, ma = mesh.attributes, mu = mesh.uniforms;
      this._uniforms(mesh, rot, bounds, rect);
      gl.uniform1f(mu.uPositionScale, this.data.mesh.positionScale);
      gl.uniform1f(mu.uAlpha, alpha * (.97 + .03 * assembly));
      gl.uniform1f(mu.uGhost, mode === 'outline' ? 1 : 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
      gl.enableVertexAttribArray(ma.aPosition); gl.vertexAttribPointer(ma.aPosition, 3, gl.SHORT, true, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
      gl.enableVertexAttribArray(ma.aNormal); gl.vertexAttribPointer(ma.aNormal, 3, gl.BYTE, true, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
      gl.depthMask(true);
      if (mode === 'outline') {
        // Establish the nearest retained surface before blending the ghost;
        // internal chamber triangles must not accumulate into an opaque mass.
        gl.colorMask(false, false, false, false);
        gl.drawElements(gl.TRIANGLES, this._meshIndices.length, this._meshIndices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
        gl.colorMask(true, true, true, true);
        gl.depthMask(false);
      }
      gl.drawElements(gl.TRIANGLES, this._meshIndices.length, this._meshIndices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
      gl.disableVertexAttribArray(ma.aNormal);
      const plane = this._planeProgram, pa = plane.attributes, pu = plane.uniforms;
      this._uniforms(plane, rot, bounds, rect);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._planeBuffer);
      gl.enableVertexAttribArray(pa.aPosition); gl.vertexAttribPointer(pa.aPosition, 3, gl.FLOAT, false, 12, 0);
      gl.lineWidth(1);
      gl.depthMask(false);
      if (mode === 'outline') gl.disable(gl.DEPTH_TEST);
      for (let planeIndex = 0; planeIndex < planes.length; planeIndex++) {
        const z = planes[planeIndex];
        const range = this._planeRanges[z];
        if (!range[1]) continue;
        const fraction = z / (this.nz - 1);
        gl.uniform1f(pu.uShift, -(1 - fraction) * explode);
        const emphasis = planeIndex % 4 === 0 ? (mode === 'outline' ? .44 : .46) : (mode === 'outline' ? .09 : .06);
        gl.uniform1f(pu.uPlaneAlpha, alpha * emphasis * (.48 + fraction * .52));
        gl.drawArrays(gl.LINES, range[0], range[1]);
      }
      gl.depthMask(true);
      this._volumeCtx.drawImage(this._glCanvas, 0, 0, this.width, this.height);
    }

    _renderCanvas({ rect, mode, alpha, assembly }) {
      const ctx=this._volumeCtx,rot=this._softwareRotation,planes=this._planes(16),explode=.60+(1-assembly)*.66;
      const bounds=this._projectBounds(rot,explode,planes),b=this._softwareBounds;
      const xScale=rect.width/(bounds[2]-bounds[0]),yScale=rect.height/(bounds[3]-bounds[1]);
      const body={x:rect.x+(b[0]-bounds[0])*xScale,y:rect.y+(bounds[3]-b[3])*yScale,width:(b[2]-b[0])*xScale,height:(b[3]-b[1])*yScale};
      const vertices=this._planeVertices;
      ctx.save();
      if(mode==='volume') {
        ctx.save();ctx.globalAlpha=alpha*.15;ctx.filter='brightness(0) blur(12px)';
        ctx.drawImage(this._surface,body.x+body.width*.05,body.y+body.height*.97,body.width*.92,body.height*.04);ctx.restore();
      }
      for(let planeIndex=0;planeIndex<planes.length;planeIndex++) {
        const z=planes[planeIndex],range=this._planeRanges[z],fraction=z/(this.nz-1),shift=-(1-fraction)*explode;
        if(!range[1])continue;
        ctx.beginPath();
        for(let i=range[0]*3,end=(range[0]+range[1])*3;i<end;i+=3) {
          const x=vertices[i],y=vertices[i+1],pz=vertices[i+2]+shift;
          const rx=rot[0]*x+rot[3]*y+rot[6]*pz,ry=rot[1]*x+rot[4]*y+rot[7]*pz,rz=rot[2]*x+rot[5]*y+rot[8]*pz,perspective=1/(1-rz*.18);
          const sx=rect.x+(rx*perspective-bounds[0])*xScale,sy=rect.y+(bounds[3]-ry*perspective)*yScale;
          if((i/3-range[0])%2===0)ctx.moveTo(sx,sy);else ctx.lineTo(sx,sy);
        }
        ctx.strokeStyle='#f8f7ef';ctx.lineWidth=.85;
        const emphasis=planeIndex%3===0?(mode==='outline'?1.0:.66):(mode==='outline'?.43:.24);
        ctx.globalAlpha=alpha*emphasis*(.46+.54*fraction);ctx.stroke();
      }
      ctx.globalAlpha=alpha*(mode==='outline'?.12:1);
      ctx.drawImage(this._surface,body.x,body.y,body.width,body.height);
      ctx.restore();
    }

    renderVolume({ progress = 1, mode = 'volume', alpha = 1, rect, motion = true, time = 0, pointer = null } = {}) {
      this._clear(this._volumeCtx, this.volumeCanvas);
      if (!this.ready || !this._volumeCtx || this._disposed || alpha <= 0) return;
      const r = this._rect(rect), activeMotion = motion !== false && !this._reduced.matches;
      const args = { rect: r, mode: mode === 'outline' ? 'outline' : 'volume', alpha: clamp(alpha),
        assembly: activeMotion ? easeOut(.13 + clamp(progress) * .87) : 1,
        motion: activeMotion, time, pointer };
      // A private GL surface keeps the supplied DOM canvas available for a
      // genuine same-data fallback, including after graphics-context loss.
      if (this.width >= 760 && activeMotion && this._initGL()) {
        try {
          this._renderGL(args); this.renderer = 'webgl'; return;
        } catch (error) {
          this.error = error; this._glFailed = true; this._releaseGL();
          this._clear(this._volumeCtx, this.volumeCanvas);
        }
      }
      this.renderer = 'canvas';
      this._renderCanvas(args);
    }

    drawContour(ctx, { x = 0, y = 0, size = 400, rect = null, progress = 1, color = '#e9e3d6', alpha = 1 } = {}) {
      if (!this.ready || !ctx || this._disposed) return;
      const paths = this.data.contours;
      if (!paths || !paths.length) return;
      const path = paths[0], b = this._mipBounds;
      const fitted = this._fitDataRect(rect || {x,y,width:size,height:size});
      const minX = b[0] / (this.nx - 1), minY = b[1] / (this.ny - 1);
      const maxX = b[2] / (this.nx - 1), maxY = b[3] / (this.ny - 1);
      let total = 0;
      const lengths = [];
      for (let i = 1; i < path.length; i++) { const len = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); lengths.push(len); total += len; }
      let remain = total * clamp(progress);
      ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha *= clamp(alpha); ctx.lineWidth = Math.max(.7, Math.min(fitted.width,fitted.height) / 850);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath();
      const project = point => [fitted.x + (point[0] - minX) / (maxX - minX) * fitted.width, fitted.y + (point[1] - minY) / (maxY - minY) * fitted.height];
      const start = project(path[0]); ctx.moveTo(start[0], start[1]);
      for (let i = 1; i < path.length && remain > 0; i++) {
        const t = Math.min(1, remain / (lengths[i - 1] || 1));
        const point = [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * t, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * t];
        const p = project(point); ctx.lineTo(p[0], p[1]); remain -= lengths[i - 1];
      }
      ctx.stroke(); ctx.restore();
    }

    dispose() {
      this._disposed = true; this.ready = false;
      this._clear(this._scanCtx, this.scanCanvas); this._clear(this._volumeCtx, this.volumeCanvas);
      this._releaseGL();
      this._sliceCache.clear(); this._lineCache.clear();
      this._surface = null; this._gl = null; this._glCanvas = null;
      this.density = null; this._meshPositions = null; this._meshNormals = null; this._meshIndices = null;
      this._slicePoints = [];
      this._planeVertices = null;
    }
  }

  global.FossilImaging = FossilImaging;
})(window);
