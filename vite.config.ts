import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:8787', changeOrigin: true } },
  },
  preview: {
    port: 4173,
    proxy: { '/api': { target: 'http://localhost:8787', changeOrigin: true } },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Long-lived vendor chunks stay cached across deploys; the course data
        // (which changes every time a day is edited) lives in its own chunk so
        // editing content never invalidates React/framer-motion.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler|@remix-run)[\\/]/.test(id)) return 'react'
            if (id.includes('framer-motion')) return 'motion'
            return 'vendor'
          }
          if (/[\\/]src[\\/]data[\\/]/.test(id)) return 'course'
        },
      },
    },
  },
})
