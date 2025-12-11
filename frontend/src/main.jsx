import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { WalletProvider } from './contexts/WalletContext'
import { formatContent } from './services/formatContent'
import paymentService from './services/paymentService'

// Expose for manual testing
window.formatContent = formatContent
window.paymentService = paymentService

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </StrictMode>,
)
