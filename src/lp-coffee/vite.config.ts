import path from "node:path";
import { generatePort } from "@examples/dev";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Fixed, and derived from the folder name: the gallery points its dev iframe
// here without this file having to tell it. See packages/dev/port.mjs.
const port = generatePort(path.basename(import.meta.dirname));

// `base: './'` keeps every asset URL relative so the built dist/index.html
// also works when opened straight off disk via file://
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    target: "es2020",
    assetsInlineLimit: 8192,
  },
  server: { port, strictPort: true },
  preview: { port, strictPort: true },
});
