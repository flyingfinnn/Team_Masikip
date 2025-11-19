import { useState } from 'react'
import { BrowserWallet } from '@meshsdk/core'
import NotesPage from './pages/NotesPage'
import WalletPage from './pages/WalletPage'
import './App.css'

const initialWalletState = {
  connected: false,
  connecting: false,
  address: null,
  walletName: null,
  error: null,
}

function App() {
  const [activeView, setActiveView] = useState('notes')
  const [walletState, setWalletState] = useState(initialWalletState)

  const handleWalletButtonClick = async () => {
    if (walletState.connected) {
      setWalletState(initialWalletState)
      return
    }

    try {
      setWalletState((prev) => ({
        ...prev,
        connecting: true,
        error: null,
      }))

      // Get available wallets
      const availableWallets = BrowserWallet.getInstalledWallets()
      
      if (availableWallets.length === 0) {
        setWalletState({
          connected: false,
          connecting: false,
          address: null,
          walletName: null,
          error: 'No Cardano wallet detected. Please install a wallet extension.',
        })
        return
      }

      // Connect to the first available wallet
      const walletName = availableWallets[0].name
      const wallet = await BrowserWallet.enable(walletName)
      
      // Get the address in bech32 format (addr_test...)
      const addresses = await wallet.getUsedAddresses()
      const changeAddresses = await wallet.getChangeAddress()
      const resolvedAddress = addresses[0] || changeAddresses || ''

      setWalletState({
        connected: true,
        connecting: false,
        address: resolvedAddress,
        walletName: walletName,
        error: null,
      })
    } catch (error) {
      console.error('Wallet connection failed:', error)
      setWalletState({
        connected: false,
        connecting: false,
        address: null,
        walletName: null,
        error: error?.message || 'Wallet connection failed. Please try again.',
      })
    }
  }

  const walletButtonLabel = () => {
    if (walletState?.connecting) return 'Connecting...'
    if (walletState?.connected) {
      const address = walletState.address || ''
      const shortAddress =
        address.length > 14 ? `${address.slice(0, 8)}...${address.slice(-6)}` : address
      return `${walletState.walletName || 'Wallet'} · ${shortAddress}`
    }
    return 'Connect Wallet'
  }

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
            className={`nav-btn wallet-connect ${walletState?.connected ? 'connected' : ''}`}
            title={
              walletState?.connected
                ? walletState.address
                : walletState?.error || 'Connect your Cardano wallet'
            }
            onClick={handleWalletButtonClick}
            disabled={walletState?.connecting}
          >
            {walletButtonLabel()}
          </button>

          <div className="nav-switch">
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
        </div>
      </nav>

      <main className="app-content">
        {activeView === 'wallet' ? (
          <WalletPage walletState={walletState} />
        ) : (
          <NotesPage walletState={walletState} onWalletButtonClick={handleWalletButtonClick} />
        )}
      </main>
    </div>
  )
}

export default App
