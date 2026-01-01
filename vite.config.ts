import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/react-3d-slideshow/',
  resolve: {
    alias: {
      'react-3d-slideshow': resolve(__dirname, './src/lib/index.ts'),
    },
  },
})
