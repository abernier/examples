import path from 'node:path'
import { generatePort } from '@examples/dev'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Fixed, and derived from the folder name: the gallery points its dev iframe
// here without this file having to tell it. See packages/dev/port.mjs.
const port = generatePort(path.basename(import.meta.dirname))

export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: { assetsInlineLimit: 100000000, chunkSizeWarningLimit: 100000, cssCodeSplit: false },
  server: { port, strictPort: true },
  preview: { port, strictPort: true },
})
