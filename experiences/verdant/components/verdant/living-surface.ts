/** Two-dimensional photographic refraction. The journey owns the only clock. */
export class LivingSurface {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private buffer: WebGLBuffer | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private loaded = false;
  private disposed = false;
  private width = 1;
  private height = 1;
  private uploadHandler: () => void;

  constructor(private canvas: HTMLCanvasElement, private photo: HTMLImageElement, private kind: "water" | "reflection" | "wind") {
    this.uploadHandler = () => this.upload();
    try {
      const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power", preserveDrawingBuffer: false });
      if (!gl) return;
      this.gl = gl;
      const compile = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) throw new Error("Shader unavailable");
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); throw new Error("Shader compilation failed"); }
        return shader;
      };
      const vertex = compile(gl.VERTEX_SHADER, `attribute vec2 a_position; varying vec2 v_uv; void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`);
      const fragment = compile(gl.FRAGMENT_SHADER, `
        precision highp float;
        varying vec2 v_uv;
        uniform sampler2D u_image;
        uniform vec2 u_crop;
        uniform float u_time;
        uniform float u_kind;
        void main(){
          vec2 uv=(v_uv-.5)*u_crop+.5;
          float t=u_time;
          if(u_kind<1.5){
            float water=u_kind<.5 ? 1. : 1.-smoothstep(.255,.315,uv.y);
            float wave=sin(uv.y*180.+t*.72)+sin(uv.y*310.-t*.48);
            uv.x+=wave*.00065*water;
            uv.y+=sin(uv.x*66.+uv.y*110.-t*.56)*.00042*water;
          }else{
            float grass=1.-smoothstep(.28,.56,uv.y);
            uv.x+=sin(t*.43+uv.x*6.+uv.y*7.)*.0018*grass;
            uv.y+=sin(t*.36+uv.x*9.)*.0005*grass;
          }
          gl_FragColor=texture2D(u_image,clamp(uv,vec2(.001),vec2(.999)));
        }
      `);
      const program = gl.createProgram();
      if (!program) throw new Error("Program unavailable");
      this.program = program;
      gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
      gl.deleteShader(vertex); gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Program link failed");
      gl.useProgram(program);
      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      for (const name of ["u_image", "u_crop", "u_time", "u_kind"]) this.uniforms[name] = gl.getUniformLocation(program, name);
      gl.uniform1i(this.uniforms.u_image, 0);
      gl.uniform1f(this.uniforms.u_kind, kind === "reflection" ? 0 : kind === "water" ? 1 : 2);
      photo.addEventListener("load", this.uploadHandler);
      canvas.addEventListener("webglcontextlost", this.onLost);
      canvas.addEventListener("webglcontextrestored", this.onRestored);
      if (photo.complete && photo.naturalWidth) this.upload();
    } catch { this.release(); }
  }

  private onLost = (event: Event) => {
    event.preventDefault();
    this.photo.removeEventListener("load", this.uploadHandler);
    this.release();
  };

  // A lost context safely falls back to the same photograph for this visit.
  private onRestored = () => { this.loaded = false; delete this.canvas.dataset.loaded; };

  private upload() {
    if (this.disposed || !this.gl || !this.photo.naturalWidth) return;
    const gl = this.gl;
    try {
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.photo);
      this.loaded = true;
      this.resize(this.width, this.height);
      this.render(0);
      this.canvas.dataset.loaded = "true";
    } catch { this.loaded = false; delete this.canvas.dataset.loaded; }
  }

  resize(width: number, height: number) {
    this.width = Math.max(1, width); this.height = Math.max(1, height);
    const gl = this.gl;
    if (!gl) return;
    const cap = window.matchMedia("(pointer:coarse)").matches ? 1_000_000 : 3_200_000;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.35, Math.sqrt(cap / (this.width * this.height)));
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    const imageRatio = (this.photo.naturalWidth || 1672) / (this.photo.naturalHeight || 941);
    const screenRatio = this.width / this.height;
    gl.useProgram(this.program);
    gl.uniform2f(this.uniforms.u_crop, Math.min(1, screenRatio / imageRatio), Math.min(1, imageRatio / screenRatio));
  }

  render(time: number) {
    if (!this.loaded || !this.gl || this.disposed) return;
    this.gl.useProgram(this.program);
    this.gl.uniform1f(this.uniforms.u_time, time);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  private release() {
    const gl = this.gl;
    if (gl) { gl.deleteTexture(this.texture); gl.deleteBuffer(this.buffer); gl.deleteProgram(this.program); }
    this.gl = null; this.loaded = false;
    delete this.canvas.dataset.loaded;
  }

  destroy() {
    this.disposed = true;
    this.photo.removeEventListener("load", this.uploadHandler);
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onRestored);
    this.release();
  }
}
