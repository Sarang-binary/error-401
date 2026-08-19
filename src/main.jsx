import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { UiModeProvider } from './context/UiModeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <UiModeProvider>
        <App />
      </UiModeProvider>
    </AuthProvider>
  </StrictMode>,
)