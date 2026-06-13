import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
import './index.css'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import App from './App.tsx'

dayjs.locale('zh-cn')

async function boot() {
  if (import.meta.env.VITE_STATIC_MODE === 'true') {
    const { installStaticFetch } = await import('./lib/static-fetch')
    installStaticFetch()
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

boot()
