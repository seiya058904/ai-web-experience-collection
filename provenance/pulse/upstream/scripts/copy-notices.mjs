import { cp } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await cp(resolve(root, 'docs/licenses'), resolve(root, 'dist/licenses'), { recursive: true });
console.log('Copied third-party notices into the distributable build.');
