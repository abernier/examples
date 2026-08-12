import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative base so the build works under /examples/lp-synth/ and file://
  base: './',
  plugins: [react()],
  server: { port: 5175, strictPort: true },
  preview: { port: 5175, strictPort: true },
})
