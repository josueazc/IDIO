import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Headers de aislamiento (COOP/COEP) requeridos por el backend multihilo de
// bb.js (SharedArrayBuffer) y exclusión de bb.js del pre-bundle de Vite.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@noir-lang/noir_js', '@aztec/bb.js'],
  },
})
