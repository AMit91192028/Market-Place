import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-toastify': fileURLToPath(new URL('./src/lib/local-toastify/index.jsx', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api/auth': 'http://localhost:3000',
      '/api/products': 'http://localhost:3001',
      '/api/cart': 'http://localhost:3002',
      '/api/orders': 'http://localhost:3003',
      '/api/seller':'http://localhost:3007',
      '/api/payments':'http://localhost:3004'
    },
  },
})
