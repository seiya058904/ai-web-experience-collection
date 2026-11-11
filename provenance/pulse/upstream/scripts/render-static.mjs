import { writeFile } from 'node:fs/promises';
import { renderPage } from '../src/render.ts';
await writeFile(new URL('../index.html', import.meta.url), renderPage());
console.log('Rendered all 11 chapters, 22 content beats and 10 transition sections into static HTML.');
