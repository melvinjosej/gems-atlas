import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Restored to universal relative pathing, supporting both x20 and github.io subfolder deployments smoothly
  plugins: [
    react(),
    tailwindcss()
  ],
})
