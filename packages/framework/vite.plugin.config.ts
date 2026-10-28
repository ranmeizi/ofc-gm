import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const pkgRoot = __dirname

const external = (id: string) =>
  id === 'simple-peer' || id === 'vite' || id.startsWith('node:')

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(pkgRoot, 'vite.ts'),
      formats: ['es'],
      fileName: 'vite',
    },
    rollupOptions: {
      external,
    },
  },
  plugins: [
    dts({
      entryRoot: pkgRoot,
      include: ['vite.ts', 'src/simple-peer/vite-plugin.ts'],
      outDir: resolve(pkgRoot, 'dist'),
      insertTypesEntry: false,
      copyDtsFiles: true,
    }),
  ],
})
