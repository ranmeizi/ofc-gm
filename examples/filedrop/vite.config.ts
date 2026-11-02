import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 相对路径，dist 可丢到任意静态目录 / 子路径
  base: './',
  server: {
    port: 5177,
    host: true,
  },
  preview: {
    port: 4177,
    host: true,
  },
})
