import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/apollo/v4/',
  server: {
    proxy: {
      '/reth': {
        target: 'https://app.functori.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
