import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built dist/index.html works when opened via file://
  base: './',
  plugins: [react()],
})
