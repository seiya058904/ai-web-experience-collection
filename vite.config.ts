import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'pages',
  publicDir: '../public',
  esbuild: { jsx: 'automatic' },
  plugins: [{
    name: 'collection-sitemap',
    generateBundle() {
      const base = this.environment.config.base;
      const origin = `https://seiya058904.github.io${base}`;
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source:
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
        ['', 'f1/', 'verdant/', 'orbital/', 'glaze/', 'kage/', 'chronos/', 'interval/', 'credits.html'].map(route => `<url><loc>${origin}${route}</loc></url>`).join('') + '</urlset>' });
    },
  }],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    license: { fileName: 'third-party-licenses.md' },
    rolldownOptions: {
      input: ['index.html', 'credits.html', ...['f1', 'verdant', 'orbital', 'glaze', 'kage', 'chronos', 'interval'].map(route => `${route}/index.html`)].map(file => resolve('pages', file)),
      onwarn(warning, defaultHandler) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        defaultHandler(warning);
      },
      output: { comments: { legal: true, annotation: false, jsdoc: false } },
    },
  },
});
