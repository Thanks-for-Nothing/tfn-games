import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/2026/cannon-fire/',
  build: {
    outDir: '../../../dist/2026/cannon-fire',
    emptyOutDir: true,
  },
})
