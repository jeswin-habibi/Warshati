import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, persister } from '@/lib/queryClient'
import { SessionProvider } from '@/app/session'
import App from '@/app/App'
import '@/lib/i18n'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
)
