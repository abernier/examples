import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { NuqsAdapter } from 'nuqs/adapters/react'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* No router here — the plain-React adapter drives history itself. It only
        ever rewrites the query string, so the hash the selection lives in is
        left alone. */}
    <NuqsAdapter>
      <App />
    </NuqsAdapter>
  </StrictMode>,
)
