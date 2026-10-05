import type { Rect } from "./scenes";

export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
export const mix = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;
export const smooth = (value: number) => {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
};
export const range = (value: number, start: number, end: number) =>
  clamp((value - start) / (end - start));

export interface Cover {
  width: number;
  height: number;
  left: number;
  top: number;
}
export function imageCover(
  width: number,
  height: number,
  ratio: number,
  focalX = 0.5,
): Cover {
  const imageWidth = Math.max(width, height * ratio);
  const imageHeight = imageWidth / ratio;
  return {
    width: imageWidth,
    height: imageHeight,
    left: (width - imageWidth) * focalX,
    top: (height - imageHeight) * 0.5,
  };
}

export function mapRect(
  rect: Rect,
  cover: Cover,
): [number, number, number, number] {
  return [
    rect[0] * cover.width + cover.left,
    rect[1] * cover.height + cover.top,
    rect[2] * cover.width + cover.left,
    rect[3] * cover.height + cover.top,
  ];
}

export interface Camera {
  scale: number;
  x: number;
  y: number;
}
export function doorwayCamera(
  rect: Rect,
  width: number,
  height: number,
  progress: number,
  baseScale: number,
): Camera {
  const [left, top, right, bottom] = rect;
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const maxScale =
    Math.max(
      width / Math.max(8, right - left),
      height / Math.max(8, bottom - top),
    ) * 1.065;
  const depth = Math.pow(clamp(progress), 1.35);
  const scale = baseScale * Math.pow(maxScale / baseScale, depth);
  const centerX = mix(cx, width / 2, smooth(progress));
  const centerY = mix(cy, height / 2, smooth(progress));
  return { scale, x: centerX - cx * scale, y: centerY - cy * scale };
}

export function transformedRect(
  rect: Rect,
  camera: Camera,
): [number, number, number, number] {
  return [
    rect[0] * camera.scale + camera.x,
    rect[1] * camera.scale + camera.y,
    rect[2] * camera.scale + camera.x,
    rect[3] * camera.scale + camera.y,
  ];
}

export function apertureClip(
  rect: Rect,
  width: number,
  height: number,
): string {
  return `inset(${Math.max(0, rect[1]).toFixed(2)}px ${Math.max(0, width - rect[2]).toFixed(2)}px ${Math.max(0, height - rect[3]).toFixed(2)}px ${Math.max(0, rect[0]).toFixed(2)}px)`;
}
