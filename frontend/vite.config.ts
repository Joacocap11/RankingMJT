import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-server-only proxy target. NEVER baked into the client bundle — the
// browser app calls same-origin relative paths like /api/v1/... and
// /uploads/... which this dev server (and, in Docker/prod, the reverse
// proxy) forwards to the backend.
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:8003'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3003,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
})
