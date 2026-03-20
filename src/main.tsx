import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Core styles
import './index.css'
import './styles/crt-effects.css'
import './styles/animations.css'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
