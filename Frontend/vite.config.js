import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
