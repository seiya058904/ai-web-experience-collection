/** Original HDR studio arithmetic; shared by the worker and bounded fallback. */
export function fillEnvironment(data, architectural = false, firstRow = 0, lastRow = 512) {
  const envWidth = 1024, envHeight = 512;
  const windows = [[-2.70, 0.27, 3.7], [-1.53, 0.24, 5.8], [-0.88, 0.20, 5.0], [-0.37, 0.18, 3.3], [0.67, 0.31, 5.3], [1.75, 0.26, 4.4], [2.67, 0.17, 6.2]];
  const architecturalWindows = [[-2.70, 0.12, 3.2], [-1.52, 0.09, 2.7], [-0.90, 0.14, 3.7], [0.63, 0.17, 3.5], [1.78, 0.11, 3.0], [2.71, 0.09, 2.8]];
  for (let y = firstRow; y < lastRow; y++) {
    const v = (y + 0.5) / envHeight;
    const elevation = Math.cos(v * Math.PI);
    const vertical = Math.exp(-Math.pow((v - 0.47) / 0.30, 2));
    for (let x = 0; x < envWidth; x++) {
      const phi = ((x + 0.5) / envWidth - 0.5) * Math.PI * 2;
      if (architectural) {
        // Chrome sees limestone walls and framed skylights. The broad dark
        // flags interrupt the bright panels before tone mapping, preserving
        // directional charcoal/silver gradients within each physical facet.
        let reflectionLight = 0.014 + 0.035 * Math.max(0, elevation);
        let frameShade = 0;
        for (const [centre, spread, strength] of architecturalWindows) {
          const delta = Math.atan2(Math.sin(phi - centre), Math.cos(phi - centre)) + (v - 0.5) * 0.7;
          const window = Math.exp(-Math.pow(delta / spread, 4));
          const mullion = Math.exp(-Math.pow(delta / 0.050, 4));
          const crossbar = Math.exp(-Math.pow((v - 0.47 - Math.sin(phi) * 0.035) / 0.008, 4));
          reflectionLight += window * (1 - 0.97 * mullion) * (1 - 0.95 * crossbar) * strength * 0.58 * vertical;
          frameShade = Math.max(frameShade, window * Math.max(mullion, crossbar * 0.92));
        }
        reflectionLight += 0.85 * Math.exp(-Math.pow((v - 0.14) / 0.037, 4));
        // Clerestory ribbons span the room, not just the narrow side windows.
        // A cut face covers only a small angular range: slender transverse
        // frames keep a reflected dark/light boundary visible within a facet.
        const upperClerestory = 0.455 + Math.sin(phi + 0.4) * 0.017;
        const lowerClerestory = 0.535 + Math.sin(phi - 0.7) * 0.016;
        reflectionLight += 1.20 * Math.exp(-Math.pow((v - upperClerestory) / 0.020, 4));
        reflectionLight += 1.55 * Math.exp(-Math.pow((v - lowerClerestory) / 0.024, 4));
        const transverseFrame = Math.max(
          Math.exp(-Math.pow((v - upperClerestory - 0.003) / 0.006, 4)),
          Math.exp(-Math.pow((v - lowerClerestory + 0.006) / 0.008, 4)),
        );
        reflectionLight *= 1 - 0.98 * transverseFrame;
        frameShade = Math.max(frameShade, transverseFrame);
        const wallFill = (0.035 + 0.18 * Math.exp(-Math.pow((v - 0.56) / 0.30, 2))) * (1 - 0.78 * frameShade);
        const floorFill = 0.12 * Math.max(0, -elevation) * (1 - 0.60 * frameShade);
        const i = (y * envWidth + x) * 4;
        data[i] = reflectionLight * 0.98 + wallFill * 1.02 + floorFill * 0.95;
        data[i + 1] = reflectionLight + wallFill * 0.87 + floorFill * 0.78;
        data[i + 2] = reflectionLight * 1.025 + wallFill * 0.70 + floorFill * 0.59;
        data[i + 3] = 1;
        continue;
      }
      let illumination = 0.055 + 0.065 * Math.max(0, elevation);
      for (const [centre, spread, strength] of windows) {
        const delta = Math.atan2(Math.sin(phi - centre), Math.cos(phi - centre)) + (v - 0.5) * 0.7;
        const window = Math.exp(-Math.pow(delta / spread, 4));
        const mullion = 1 - 0.985 * Math.exp(-Math.pow(delta / 0.065, 4));
        illumination += window * mullion * strength * 0.58 * vertical;
      }
      illumination += 1.4 * Math.exp(-Math.pow((v - 0.14) / 0.075, 4));
      const floorWarmth = Math.max(0, -elevation) * 0.065;
      const i = (y * envWidth + x) * 4;
      data[i] = illumination * 0.98 + floorWarmth;
      data[i + 1] = illumination * 1.015 + floorWarmth * 0.82;
      data[i + 2] = illumination * 1.055 + floorWarmth * 0.60;
      data[i + 3] = 1;
    }
  }
  return data;
}
