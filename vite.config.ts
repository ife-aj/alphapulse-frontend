import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/**
 * `alphapulse/src/main.ts` deliberately enables no CORS, so a browser can only
 * reach the API from the same origin. In development (and `vite preview`) the
 * dev server proxies `/api` to the NestJS process, which keeps the browser on
 * http://localhost:5173 and every request same-origin.
 */
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
    // Socket.IO listens on the same server and port, on its default path, and
    // the gateway configures no CORS — so the browser has to reach it
    // same-origin like the REST API. `ws: true` lets the dev server carry the
    // WebSocket upgrade; the polling fallback works without it.
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
