import { FRAMES, normalizeFrame, sanitizeConfig, type SpacingPreset } from './timeline.ts';
import type { Camera, FramesProvider } from './export.ts';

export type { Camera } from './export.ts';

// Inside the Collection the work is served below <base>frame/; outside Vite (tests) the root is kept.
const viteBase = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL;
const baseURL = viteBase ? `${viteBase}frame/` : '/';
let embeddedElement:Element|null=null;
let embeddedManifest:Record<string,unknown>|null=null;
let embeddedDocument:Document|null=null;
let detachedManifest=false;

function compactEmbeddedImages(manifest:Record<string,unknown>):void{
  const converted=new Map<string,string>();
  for(const [key,value]of Object.entries(manifest)){
    if(typeof value!=='string')continue;
    const match=/^data:(image\/(?:png|jpeg|webp|gif|avif|bmp|x-icon|vnd\.microsoft\.icon));base64,([A-Za-z0-9+/=\s]+)$/i.exec(value);
    if(!match)continue;
    let url=converted.get(value);
    if(!url){
      try{
        const binary=atob(match[2]),bytes=new Uint8Array(binary.length);
        for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
        url=URL.createObjectURL(new Blob([bytes],{type:match[1].toLowerCase()}));
        converted.set(value,url);
      }catch{continue;}
    }
    manifest[key]=url;
  }
  // URLs intentionally live for this document's lifetime. Revoking on pagehide
  // would break restored BFCache pages, cached images and an in-flight export.
}

/** Optional single-file build support. The normal packaged path is unchanged. */
export function resolveLocalAsset(path:string):string{
  if(typeof document==='undefined'||typeof document.getElementById!=='function'
    ||/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path))return path;
  if(embeddedDocument!==document){embeddedDocument=document;embeddedElement=null;embeddedManifest=null;detachedManifest=false;}
  const element=document.getElementById('frame-embedded-assets');
  if(!element&&!detachedManifest)return path;
  // The packer's JSON script is immutable. Cache its parsed contents by element,
  // rather than copying and parsing a multi-megabyte text node on every frame.
  if(element&&element!==embeddedElement){
    embeddedElement=element;embeddedManifest=null;
    try{const parsed:unknown=JSON.parse(element.textContent??'');if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))embeddedManifest=parsed as Record<string,unknown>;}catch{/* A malformed optional map must not prevent a normal build from loading. */}
    if(embeddedManifest&&typeof window!=='undefined'&&typeof Blob!=='undefined'
      &&typeof URL!=='undefined'&&typeof URL.createObjectURL==='function'&&typeof atob==='function'){
      compactEmbeddedImages(embeddedManifest);
      // Keep the compact map privately; repeated full base64 strings no longer
      // belong in image attributes or in a large inspectable DOM text node.
      element.textContent='';element.remove();embeddedElement=null;detachedManifest=true;
    }
  }
  if(!embeddedManifest)return path;
  const raw=path.split(/[?#]/,1)[0];
  const withoutBase=baseURL&&raw.startsWith(baseURL)?raw.slice(baseURL.length):raw;
  const key=withoutBase.replace(/^(?:\.\/)+/,'').replace(/^\/+/, '');
  for(const candidate of [path,raw,key]){
    if(!Object.prototype.hasOwnProperty.call(embeddedManifest,candidate))continue;
    const value=embeddedManifest[candidate];if(typeof value==='string'&&value.length)return value;
  }
  return path;
}

/** Only the four intermediate push poses need distinct baked take assets. */
export function assetPath(frame: number, preset: SpacingPreset = 'even', camera: Camera = 'landscape'): string {
  const validFrame = normalizeFrame(frame);
  const validPreset = sanitizeConfig({ preset }).preset;
  const take = validFrame >= 8 && validFrame <= 11 ? validPreset : 'even';
  const view = camera === 'portrait' ? 'portrait' : 'landscape';
  return `${baseURL.endsWith('/') ? baseURL : `${baseURL}/`}frames/${view}/${take}-${String(validFrame).padStart(2, '0')}.webp`;
}

export function assetURL(frame: number, preset: SpacingPreset = 'even', camera: Camera = 'landscape'): string {
  return resolveLocalAsset(assetPath(frame,preset,camera));
}

export interface FrameAssetsOptions {
  /** Both caches are bounded; 64 covers all32 unique poses in both cameras. */
  maxDecoded?: number;
  maxEncoded?: number;
  createImage?: () => HTMLImageElement;
  fetch?: typeof globalThis.fetch;
  /** Optional packaged-source mapping, captured by a scene-specific provider. */
  resolveURL?: (frame: number, preset: SpacingPreset, camera: Camera) => string;
}

function boundedSize(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(1, Math.min(128, Math.round(value))) : 64;
}

function rasterType(bytes: Uint8Array): 'image/webp' | 'image/png' | 'image/jpeg' {
  if (bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP') return 'image/webp';
  if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71
    && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  throw new Error('The downloaded frame is not a readable raster image. Please retry.');
}

/** Local packaged-frame access. It never chooses or changes a scene's target. */
export class FrameAssets implements FramesProvider {
  private readonly decoded = new Map<string, HTMLImageElement>();
  private readonly encoded = new Map<string, string>();
  private readonly loading = new Map<string, Promise<HTMLImageElement>>();
  private readonly encoding = new Map<string, Promise<string>>();
  private readonly maxDecoded: number;
  private readonly maxEncoded: number;
  private readonly createImage: () => HTMLImageElement;
  private readonly fetchResource: typeof globalThis.fetch;
  private readonly resolveURL: (frame: number, preset: SpacingPreset, camera: Camera) => string;
  private generation = 0;
  private disposed = false;

  constructor(options: FrameAssetsOptions = {}) {
    this.maxDecoded = boundedSize(options.maxDecoded);
    this.maxEncoded = boundedSize(options.maxEncoded);
    this.createImage = options.createImage ?? (() => new Image());
    this.fetchResource = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.resolveURL = options.resolveURL ?? assetURL;
  }

  get stats() {
    return Object.freeze({
      decoded: this.decoded.size, encoded: this.encoded.size,
      loading: this.loading.size, encoding: this.encoding.size,
    });
  }

  private cached<T>(cache: Map<string, T>, key: string): T | undefined {
    const value = cache.get(key);
    if (value !== undefined) { cache.delete(key); cache.set(key, value); }
    return value;
  }

  private remember<T>(cache: Map<string, T>, key: string, value: T, limit: number) {
    cache.delete(key);
    cache.set(key, value);
    while (cache.size > limit) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) break;
      cache.delete(oldest);
    }
  }

  getCached(frame: number, preset: SpacingPreset = 'even', camera: Camera = 'landscape'): HTMLImageElement | undefined {
    return this.disposed ? undefined : this.cached(this.decoded, this.resolveURL(frame, preset, camera));
  }

  load(frame: number, preset: SpacingPreset = 'even', camera: Camera = 'landscape'): Promise<HTMLImageElement> {
    if (this.disposed) return Promise.reject(new Error('The frame loader has been closed.'));
    const key = this.resolveURL(frame, preset, camera);
    const cached = this.cached(this.decoded, key);
    if (cached) return Promise.resolve(cached);
    const active = this.loading.get(key);
    if (active) return active;
    const generation = this.generation;
    const request = new Promise<HTMLImageElement>((resolve, reject) => {
      let image: HTMLImageElement;
      try { image = this.createImage(); }
      catch (error) { reject(error); return; }
      let completed = false;
      const finish = async () => {
        if (completed) return;
        completed = true;
        image.onload = null;
        image.onerror = null;
        try {
          if (!image.naturalWidth || !image.naturalHeight) throw new Error('The image is empty.');
          if (typeof image.decode === 'function') await image.decode();
          resolve(image);
        } catch (error) {
          reject(new Error(`Frame ${normalizeFrame(frame)} could not be decoded. Please retry.`, { cause: error }));
        }
      };
      image.decoding = 'async';
      image.onload = () => { void finish(); };
      image.onerror = () => {
        if (completed) return;
        completed = true;
        image.onload = null;
        image.onerror = null;
        reject(new Error(`Frame ${normalizeFrame(frame)} could not be loaded. Please retry.`));
      };
      image.src = key;
      if (image.complete && image.naturalWidth) void finish();
    }).then(image => {
      if (!this.disposed && generation === this.generation) this.remember(this.decoded, key, image, this.maxDecoded);
      return image;
    }).finally(() => {
      if (this.loading.get(key) === request) this.loading.delete(key);
    });
    this.loading.set(key, request);
    return request;
  }

  async preload(frames: readonly number[], preset: SpacingPreset = 'even', camera: Camera = 'landscape'): Promise<void> {
    let cursor = 0;
    const unique = [...new Set(frames.map(normalizeFrame))];
    const worker = async () => {
      while (cursor < unique.length) {
        const index = cursor++;
        await this.load(unique[index], preset, camera);
      }
    };
    await Promise.all(Array.from({ length: Math.min(6, unique.length) }, worker));
  }

  preloadAll(config: unknown, camera: Camera = 'landscape'): Promise<void> {
    const snapshot = sanitizeConfig(config);
    return this.preload(Array.from({ length: FRAMES }, (_, index) => index + 1), snapshot.preset, camera);
  }

  /** Original raster bytes, suitable for a completely self-contained export. */
  dataURL(frame: number, preset: SpacingPreset = 'even', camera: Camera = 'landscape'): Promise<string> {
    if (this.disposed) return Promise.reject(new Error('The frame loader has been closed.'));
    const key = this.resolveURL(frame, preset, camera);
    const cached = this.cached(this.encoded, key);
    if (cached) return Promise.resolve(cached);
    const active = this.encoding.get(key);
    if (active) return active;
    const generation = this.generation;
    const request = this.fetchResource(key, { cache: 'force-cache' }).then(async response => {
      if (!response.ok) throw new Error(`Frame ${normalizeFrame(frame)} could not be downloaded (${response.status}). Please retry.`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      const type = rasterType(bytes);
      let binary = '';
      for (let index = 0; index < bytes.length; index += 32768) binary += String.fromCharCode(...bytes.subarray(index, index + 32768));
      const result = `data:${type};base64,${btoa(binary)}`;
      if (!this.disposed && generation === this.generation) this.remember(this.encoded, key, result, this.maxEncoded);
      return result;
    }).finally(() => {
      if (this.encoding.get(key) === request) this.encoding.delete(key);
    });
    this.encoding.set(key, request);
    return request;
  }

  /** Old in-flight requests may resolve to their callers but cannot refill a cleared cache. */
  clear(): void {
    this.generation += 1;
    this.decoded.clear();
    this.encoded.clear();
    this.loading.clear();
    this.encoding.clear();
  }

  dispose(): void {
    this.disposed = true;
    this.clear();
  }
}
