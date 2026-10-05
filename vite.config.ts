import { defineConfig } from "vite";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  build: {
    license: { fileName: "third-party-licenses.md" },
    rolldownOptions: {
      input: ["index.html", "credits.html", "f1/index.html", "verdant/index.html", "orbital/index.html"],
      onwarn(warning, defaultHandler) {
        // All entrypoints are client documents; React's server boundary
        // directives have no meaning in this static multi-page build.
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
        defaultHandler(warning);
      },
      output: {
        // Keep upstream notices without changing runtime code or minification.
        comments: { legal: true, annotation: false, jsdoc: false },
      },
    },
  },
});
