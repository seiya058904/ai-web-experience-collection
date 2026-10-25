import { fillEnvironment } from './environment-data.js';

const studio = fillEnvironment(new Float32Array(1024 * 512 * 4));
const architecture = fillEnvironment(new Float32Array(1024 * 512 * 4), true);
self.postMessage([studio, architecture], [studio.buffer, architecture.buffer]);
