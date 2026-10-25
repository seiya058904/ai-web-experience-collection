import { fillEnvironment } from './environment-data.js';

/** Compute the original fields without occupying the input/rendering thread. */
export async function prepareEnvironments() {
  if (typeof Worker === 'function') {
    try {
      return await new Promise((resolve, reject) => {
        const worker = new Worker(new URL('./environment-worker.js', import.meta.url), { type: 'module' });
        const finish = (value, error) => {
          clearTimeout(timeout);
          worker.terminate();
          if (error) reject(error); else resolve(value);
        };
        const timeout = setTimeout(() => finish(null, new Error('Environment worker unavailable')), 15000);
        worker.onmessage = event => finish(event.data);
        worker.onerror = event => { event.preventDefault(); finish(null, new Error(event.message)); };
      });
    } catch { /* A worker-restricted environment retains the same artwork. */ }
  }
  const fields = [new Float32Array(1024 * 512 * 4), new Float32Array(1024 * 512 * 4)];
  for (let field = 0; field < fields.length; field++) {
    for (let row = 0; row < 512; row += 8) {
      fillEnvironment(fields[field], field === 1, row, row + 8);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  return fields;
}
