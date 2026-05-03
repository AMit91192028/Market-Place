import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const AWS_ALB = 'http://marketplace-alb-875871802.ap-south-1.elb.amazonaws.com'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      'react-toastify': fileURLToPath(
        new URL('./src/lib/local-toastify/index.jsx', import.meta.url)
      ),
    },
  },

  server: {
    proxy: {
      '/api/auth': {
        target: AWS_ALB,
        changeOrigin: true,
        secure: false,
      },

      '/api/products': {
        target: AWS_ALB,
        changeOrigin: true,
        secure: false,
      },

      '/api/cart': {
        target: AWS_ALB,
        changeOrigin: true,
        secure: false,
      },

      '/api/orders': {
        target: AWS_ALB,
        changeOrigin: true,
        secure: false,
      },

      '/api/payments': {
        target: AWS_ALB,
        changeOrigin: true,
        secure: false,
      },

      '/api/seller': {
        target: AWS_ALB,
        changeOrigin: true,
        secure: false,
      },

      '/api/socket': {
        target: AWS_ALB,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
