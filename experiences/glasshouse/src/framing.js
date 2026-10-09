/** Composition is independent of the narrow-phone rendering budget. */
export function isPortraitComposition(width, height) {
  return width <= 760 || (width <= 1100 && height >= width);
}
