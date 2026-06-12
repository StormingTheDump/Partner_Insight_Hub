import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/Partner_Insight_Hub/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api/auth': 'http://localhost:8000',
      '/api/conversion': 'http://localhost:8000',
      '/api/errors': 'http://localhost:8000',
      '/api': 'http://localhost:3001',
    },
  },
})
