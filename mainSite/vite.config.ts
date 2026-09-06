import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo hay dos procesos: Vite sirve el frontend y el Node de
    // server/ la API. Esto hace que /api salga del segundo, igual que en
    // producción, donde es un solo proceso y no hace falta proxy.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: false, // que la cookie de sesión siga siendo del mismo host
      },
    },
  },
})
