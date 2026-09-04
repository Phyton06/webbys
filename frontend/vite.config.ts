/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages base path: /webbys/
// For local dev, set BASE_URL=/ in .env or leave empty
const base = process.env.GITHUB_ACTIONS ? '/webbys/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
  ],
  server: {
    port: 5173
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
