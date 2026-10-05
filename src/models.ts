/** Relative teaching model. Coefficients are illustrative, not team telemetry. */
export function aerodynamicForces(speed: number, mode: "corner" | "straight") {
  const boundedSpeed = Math.max(
    100,
    Math.min(340, Number.isFinite(speed) ? speed : 240),
  );
  const squared = (boundedSpeed / 240) ** 2;
  return {
    downforce: squared * (mode === "straight" ? 0.58 : 1),
    drag: squared * (mode === "straight" ? 0.53 : 1),
  };
}

export const RACE_LAPS = 52;
export const PIT_LOSS = 22;

/** One stop, medium -> hard. Age zero is the first lap of each stint. */
export function raceStrategy(pitLap: number) {
  const stop = Math.round(
    Math.max(10, Math.min(38, Number.isFinite(pitLap) ? pitLap : 20)),
  );
  const laps = Array.from({ length: RACE_LAPS }, (_, index) => {
    const medium = index < stop;
    const age = medium ? index : index - stop;
    return medium
      ? 89.8 + 0.06 * age + 0.0095 * age ** 2
      : 90.3 + 0.045 * age + 0.0045 * age ** 2;
  });
  return {
    pitLap: stop,
    laps,
    total: laps.reduce((sum, lap) => sum + lap, 0) + PIT_LOSS,
  };
}

/** Longitude scale corrected at the circuit latitude; uniform fit, no distortion. */
export function projectCircuit(
  coordinates: number[][],
  width = 720,
  height = 440,
  padding = 44,
  rotation = 0,
) {
  if (coordinates.length < 2)
    throw new Error("A circuit needs at least two coordinates.");
  const latitude =
    coordinates.reduce((sum, p) => sum + p[1], 0) / coordinates.length;
  const cosLatitude = Math.cos((latitude * Math.PI) / 180);
  const angle = (rotation * Math.PI) / 180;
  const projected = coordinates.map(([lng, lat]) => {
    const x = lng * cosLatitude;
    const y = -lat;
    return [
      x * Math.cos(angle) - y * Math.sin(angle),
      x * Math.sin(angle) + y * Math.cos(angle),
    ];
  });
  const minX = Math.min(...projected.map((p) => p[0]));
  const maxX = Math.max(...projected.map((p) => p[0]));
  const minY = Math.min(...projected.map((p) => p[1]));
  const maxY = Math.max(...projected.map((p) => p[1]));
  const scale = Math.min(
    (width - 2 * padding) / (maxX - minX || 1),
    (height - 2 * padding) / (maxY - minY || 1),
  );
  const xOffset = (width - (maxX - minX) * scale) / 2;
  const yOffset = (height - (maxY - minY) * scale) / 2;
  return projected.map(([x, y]) => [
    (x - minX) * scale + xOffset,
    (y - minY) * scale + yOffset,
  ]);
}
