import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Preferred port. NOT strictPort: another local project may already hold
    // 5173, and blocking startup is worse than Vite choosing 5174. This is safe
    // now because the proxy below makes every API call same-origin, so CORS
    // does not depend on which port Vite ends up on.
    port: 5173,
    proxy: {
      // Route /api through the dev server to the FastAPI backend so the browser
      // makes a same-origin request and the CORS preflight never happens. This
      // removes the whole class of "Cross-Origin Request Blocked" failures that
      // occur when the backend CORS allowlist and the frontend port disagree.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
