/** Offline resource transport, reconstructed after workspace loss.
 * The original GeoJSON and deterministic generator remain in the source package.
 * Canonical content hashes are verified by check:optics; runtime validates lengths.
 */
function aborted(signal: AbortSignal, error?: unknown): boolean {
  return signal.aborted || (error instanceof Error && error.name === "AbortError");
}
function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw signal.reason ?? new DOMException("The operation was aborted", "AbortError");
}
function requireLength(buffer: ArrayBuffer, expectedBytes: number, filename: string): Uint8Array {
  if (buffer.byteLength !== expectedBytes) {
    throw new Error(`ATLAS globe: ${filename} has ${buffer.byteLength} bytes; expected ${expectedBytes}.`);
  }
  return new Uint8Array(buffer);
}
async function request(url: string, signal: AbortSignal): Promise<Response> {
  throwIfAborted(signal);
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`ATLAS globe: resource failed to load (${response.status}): ${url}`);
  return response;
}

/** Prefer compressed bytes; a missing/invalid compressed copy falls back to raw.
 * Abort is never transformed into a retry, including AbortError from the stream.
 */
export async function loadOpticsBytes(
  prefix: string,
  filename: string,
  expectedBytes: number,
  signal: AbortSignal,
): Promise<Uint8Array> {
  throwIfAborted(signal);
  if (typeof DecompressionStream === "function") {
    try {
      const response = await request(prefix + filename + ".gz", signal);
      if (!response.body) throw new Error("ATLAS globe: compressed response has no body.");
      const decoded = response.body.pipeThrough(new DecompressionStream("gzip"));
      const buffer = await new Response(decoded).arrayBuffer();
      throwIfAborted(signal);
      return requireLength(buffer, expectedBytes, filename + ".gz");
    } catch (error) {
      if (aborted(signal, error)) throw error;
      // Fetch, unsupported gzip decoder, malformed stream or wrong decoded length:
      // the equal-resolution original binary is the explicit recovery path.
    }
  }
  const response = await request(prefix + filename, signal);
  const buffer = await response.arrayBuffer();
  throwIfAborted(signal);
  return requireLength(buffer, expectedBytes, filename);
}

/** Canonical coastline files are little-endian even on a big-endian host. */
export function decodeFloat32LE(bytes: Uint8Array): Float32Array {
  if (bytes.byteLength % 4) throw new Error("ATLAS globe: misaligned float32 coastline data.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const values = new Float32Array(bytes.byteLength / 4);
  for (let i = 0; i < values.length; i++) {
    const value = view.getFloat32(i * 4, true);
    if (!Number.isFinite(value)) throw new Error("ATLAS globe: non-finite coastline coordinate.");
    values[i] = value;
  }
  return values;
}
