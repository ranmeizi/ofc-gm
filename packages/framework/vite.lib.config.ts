import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const pkgRoot = __dirname

const external = (id: string) =>
  id === 'simple-peer' || id === 'vite' || id.startsWith('node:')

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: resolve(pkgRoot, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external,
    },
  },
  plugins: [
    dts({
      entryRoot: resolve(pkgRoot, 'src'),
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      outDir: resolve(pkgRoot, 'dist'),
      rollupTypes: true,
      tsconfigPath: resolve(pkgRoot, 'tsconfig.json'),
    }),
  ],
})
