import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  base: './',
  
  server: {
    port: 5173,

    proxy: {
      "/api": {
        target: "http://localhost:5102",
        changeOrigin: true,
        secure: false
      }
    }
  }
})
