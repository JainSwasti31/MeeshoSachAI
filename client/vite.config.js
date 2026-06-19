import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  define: {
    __BUNDLED_DEV__: JSON.stringify(true),
  },
  resolve: {
    alias: {
      'react-dom/client': path.resolve('./node_modules/react-dom/client.js'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
})
