import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@ofc-gm/framework': resolve(__dirname, '../framework/src/index.ts'),
      '@ofc-gm/ws/protocol': resolve(__dirname, '../ws/src/protocol.ts'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5180,
    open: true,
    proxy: {
      '/signal': {
        target: 'http://127.0.0.1:8787',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
