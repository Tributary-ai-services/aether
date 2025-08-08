import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:8080', 
        changeOrigin: true,
        secure: false,
      },
      '/realms': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/admin': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    port: 3000
  }
})