import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    devSourcemap: true
  },
  define: {
    'global': 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      'node-fetch': 'isomorphic-fetch',
      buffer: 'buffer',
      events: 'events',
      util: 'util',
      stream: 'stream-browserify',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      define: {
        global: 'globalThis'
      }
    },
    include: ['buffer', 'events', 'util', 'stream'],
  },
  server: {
    proxy: {
      '/koios-mainnet': {
        target: 'https://api.koios.rest/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/koios-mainnet/, ''),
      },
      '/koios-preprod': {
        target: 'https://preprod.koios.rest/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/koios-preprod/, ''),
      },
      '/koios-preview': {
        target: 'https://preview.koios.rest/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/koios-preview/, ''),
      },
    },
  },
})
