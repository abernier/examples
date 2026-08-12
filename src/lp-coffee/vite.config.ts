import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base: './'` keeps every asset URL relative so the built dist/index.html
// also works when opened straight off disk via file://
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    target: "es2020",
    assetsInlineLimit: 8192,
  },
});
