import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// BillFlow is served from hashplayground.in/billflow/ — the same Render static
// site as the main app. frontend's build copies this app's dist/ into its own
// dist/billflow/, so every asset URL must be rooted at /billflow/.
// In dev, the main frontend (5173) proxies /billflow to this server, so
// http://localhost:5173/billflow/ behaves like production.
export default defineConfig({
  base: '/billflow/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
