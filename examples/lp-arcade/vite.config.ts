import path from 'node:path'
import { generatePort } from '@examples/dev'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Fixed, and derived from the folder name: the gallery points its dev iframe
// here without this file having to tell it. See packages/dev/port.mjs.
const port = generatePort(path.basename(import.meta.dirname))

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built dist/index.html works when opened over file://
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
  },
  server: { port, strictPort: true },
  preview: { port, strictPort: true },
})
