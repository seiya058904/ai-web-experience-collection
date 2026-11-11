import { cp } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await cp(resolve(root, 'public/art/hero-desktop.webp'), resolve(root, 'dist/qa-retry/hero-desktop.webp'));
console.log('The local HTTP recovery fixture now serves the valid hero. Use Retry, then resize to portrait.');
