import { useState } from 'react'
import NotesPage from './pages/NotesPage'
import WalletPage from './pages/WalletPage'
import './App.css'

function App() {
  const [activeView, setActiveView] = useState('notes')

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <div className="nav-brand">
          <span className="brand-dot" />
          Masikip Note
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className={activeView === 'notes' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveView('notes')}
          >
            Notes
          </button>
          <button
            type="button"
            className={activeView === 'wallet' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveView('wallet')}
          >
            Wallet
          </button>
        </div>
      </nav>

      <main className="app-content">
        {activeView === 'wallet' ? <WalletPage /> : <NotesPage />}
      </main>
    </div>
  )
}

export default App
