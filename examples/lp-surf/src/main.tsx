import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

// No StrictMode here on purpose: drei's <Scroll html> creates its own React
// root during render, and the double-invoked render would create it twice.
createRoot(document.getElementById('root')!).render(<App />)
