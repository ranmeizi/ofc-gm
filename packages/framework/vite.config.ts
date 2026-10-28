import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { createOfcFrameworkVitePlugin } from './src/simple-peer/vite-plugin'

const pkgRoot = __dirname

export default defineConfig({
  root: resolve(pkgRoot, 'playground'),
  plugins: [createOfcFrameworkVitePlugin()],
  resolve: {
    alias: {
      '@ofc-gm/framework': resolve(pkgRoot, 'src/index.ts'),
      '@ofc-gm/framework/vite': resolve(pkgRoot, 'vite.ts'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    open: true,
  },
  optimizeDeps: {
    exclude: ['@ofc-gm/framework'],
  },
})
