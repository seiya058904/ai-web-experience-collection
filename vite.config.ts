import { defineConfig } from "vite";

export default defineConfig({
  build: {
    license: { fileName: "third-party-licenses.md" },
    rolldownOptions: {
      output: {
        // Keep upstream notices without changing runtime code or minification.
        comments: { legal: true, annotation: false, jsdoc: false },
      },
    },
  },
});
