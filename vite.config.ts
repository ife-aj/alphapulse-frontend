import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/** Local dev/preview proxy; Netlify production calls Render directly. */
export default defineConfig(({ mode }) => {
  // The empty prefix loads every variable, not just `VITE_*`, so the proxy
  // target stays server-side and is never inlined into the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')
  const target = (env.API_PROXY_TARGET || '').trim() || 'http://localhost:3000'

  const proxy = {
    '/api': {
      target,
      changeOrigin: true,
    },
    // Proxy both polling and WebSocket upgrades locally.
    '/socket.io': {
      target,
      changeOrigin: true,
      ws: true,
    },
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy,
    },
    preview: {
      port: 4173,
      proxy,
    },
  }
})
