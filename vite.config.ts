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
      '/api/metrics':         'http://localhost:8000',
      '/api/auth':            'http://localhost:8000',
      '/api/conversion':      'http://localhost:8000',
      '/api/errors':          'http://localhost:8000',
      '/api/channel-mapping': 'http://localhost:8000',
      '/api/channel-config':  'http://localhost:8000',
      '/api/hot-sales':       'http://localhost:8000',
      '/api/order-logs':      'http://localhost:8000',
      '/api/admin':           'http://localhost:8000',
      '/api/contacts':        'http://localhost:8000',
      '/api/integration':     'http://localhost:8000',
      '/api/chat':            'http://localhost:8000',
      '/api':                 'http://localhost:3001',
    },
  },
})
