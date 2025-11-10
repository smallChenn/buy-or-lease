import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use root path for custom domains, or subdirectory for GitHub Pages
  base: process.env.VITE_BASE_PATH || '/',
})
