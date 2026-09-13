import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules[\\/](three|three-stdlib|three-mesh-bvh|@react-three|postprocessing|maath|gsap|@monogrid|n8ao|its-fine|suspend-react|react-use-measure)[\\/]/.test(id)) return 'vendor-three'
          if (/node_modules[\\/]/.test(id)) return 'vendor'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
