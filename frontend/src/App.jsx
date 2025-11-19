import { useState } from 'react'
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

  const detectWalletProvider = () => {
    if (typeof window === 'undefined' || !window.cardano) return null
    const preferredOrder = ['eternl', 'nami', 'flint', 'lace', 'gerowallet', 'typhoncip30']
    for (const key of preferredOrder) {
      if (window.cardano[key]) {
        const provider = window.cardano[key]
        return {
          key,
          provider,
          label: provider?.name || key.charAt(0).toUpperCase() + key.slice(1),
        }
      }
    }

    const dynamicKeys = Object.keys(window.cardano).filter(
      (key) => typeof window.cardano[key] === 'object',
    )

    if (dynamicKeys.length > 0) {
      const key = dynamicKeys[0]
      const provider = window.cardano[key]
      return {
        key,
        provider,
        label: provider?.name || key,
      }
    }

    return null
  }

  const handleWalletButtonClick = async () => {
    if (walletState.connected) {
      setWalletState(initialWalletState)
      return
    }

    if (typeof window === 'undefined') {
      setWalletState((prev) => ({
        ...prev,
        error: 'Wallet connections are only available in the browser.',
      }))
      return
    }

    const walletHandle = detectWalletProvider()
    if (!walletHandle || !walletHandle.provider?.enable) {
      setWalletState((prev) => ({
        ...prev,
        error: 'No CIP-30 compatible Cardano wallet detected.',
      }))
      return
    }

    try {
      setWalletState((prev) => ({
        ...prev,
        connecting: true,
        error: null,
      }))

      const api = await walletHandle.provider.enable()
      const rewardAddresses = (await api.getRewardAddresses?.()) || []
      const usedAddresses = rewardAddresses.length
        ? rewardAddresses
        : (await api.getUsedAddresses?.()) || []
      const changeAddress = await api.getChangeAddress?.()
      const resolvedAddress = rewardAddresses[0] || usedAddresses[0] || changeAddress || ''

      setWalletState({
        connected: true,
        connecting: false,
        address: resolvedAddress,
        walletName: walletHandle.label,
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
      return walletState.address || 'No wallet address'
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
