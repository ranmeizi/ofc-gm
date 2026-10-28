import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const pkgRoot = __dirname

export default defineConfig({
  root: resolve(pkgRoot, 'dev'),
  plugins: [react()],
  resolve: {
    alias: {
      '@ofc-gm/components': resolve(pkgRoot, 'src/index.ts'),
      '@ofc-gm/components/react': resolve(pkgRoot, 'src/react/index.tsx'),
      '@ofc-gm/framework': resolve(pkgRoot, '../framework/src/index.ts'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5181,
    open: '/index.html',
  },
})
