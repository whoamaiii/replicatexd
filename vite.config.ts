import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { ServerResponse } from 'node:http'

function isServerResponse(value: unknown): value is ServerResponse {
  return (
    !!value &&
    typeof value === 'object' &&
    'writeHead' in value &&
    typeof (value as { writeHead?: unknown }).writeHead === 'function' &&
    'end' in value &&
    typeof (value as { end?: unknown }).end === 'function'
  )
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5174',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            void req
            console.error('[vite proxy] /api -> http://127.0.0.1:5174 error', err)

            if (!isServerResponse(res)) return
            if (res.headersSent) return

            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(
              JSON.stringify({
                message:
                  'API server not reachable (expected http://127.0.0.1:5174). Start it (npm run dev) and try again.',
              }),
            )
          })
        },
      },
    },
  },
})


