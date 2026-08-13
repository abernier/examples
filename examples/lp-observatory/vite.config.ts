import path from 'node:path'
import { generatePort } from '@examples/dev'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Chrome refuses to load `type="module"` scripts (and `crossorigin` stylesheets)
 * over file:// — they trip the CORS check with a null origin. Combined with an
 * IIFE bundle below, stripping those two attributes makes the built
 * dist/index.html open straight off disk with no server.
 */
function fileProtocolFriendly(): Plugin {
  return {
    name: 'file-protocol-friendly',
    enforce: 'post',
    transformIndexHtml(html) {
      return (
        html
          .replace(/\s+type="module"/g, '')
          .replace(/\s+crossorigin(=".*?")?/g, '')
          .replace(/<link[^>]+rel="modulepreload"[^>]*>/g, '')
          // A classic script is not deferred the way a module is, so say so
          // explicitly — it sits in <head> and must wait for #root.
          .replace(/<script(?![^>]*\bdefer\b)\s+src=/g, '<script defer src=')
      )
    },
  }
}

// Fixed, and derived from the folder name: the gallery points its dev iframe
// here without this file having to tell it. See packages/dev/port.mjs.
const port = generatePort(path.basename(import.meta.dirname))

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built dist/index.html also works from file://
  base: './',
  plugins: [react(), fileProtocolFriendly()],
  build: {
    target: 'es2020',
    modulePreload: false,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1800,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
  },
  server: { port, strictPort: true },
  preview: { port, strictPort: true },
})
