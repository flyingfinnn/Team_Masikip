import React, { createContext, useContext, useState } from 'react'
import walletService from '../services/walletService'
import { BrowserWallet } from '@meshsdk/core'

const initialState = {
  connected: false,
  connecting: false,
  address: null,
  walletName: null,
  balanceAda: null,
  spentAda: null,
  pendingFeesAda: null,
  walletInstance: null,
  localTransactions: [],
  error: null,
}

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const [state, setState] = useState(initialState)

  const connectWallet = async () => {
    setState((s) => ({ ...s, connecting: true, error: null }))
    try {
      const result = await walletService.connectWallet()
      if (result && result.connected) {
        setState(result)
      } else {
        setState((s) => ({ ...initialState, error: result?.error || 'Failed to connect wallet' }))
      }
      return result
    } catch (err) {
      console.error('connectWallet error:', err)
      setState((s) => ({ ...initialState, error: err?.message || String(err) }))
      return { connected: false, error: err }
    }
  }

  const disconnectWallet = () => {
    setState(initialState)
  }

  const getAvailableWallets = () => BrowserWallet.getInstalledWallets()

  const fetchTransactionHistory = async (address) => {
    return walletService.fetchTransactionHistory(address)
  }

  const saveLocalTransaction = (address, tx) => {
    try {
      walletService.saveTransaction(address, tx)
      // update local state
      setState((prev) => ({
        ...prev,
        localTransactions: [tx, ...(prev.localTransactions || [])]
      }))
    } catch (err) {
      console.error('saveLocalTransaction failed:', err)
    }
  }

  const refreshBalance = async () => {
    try {
      if (!state.walletInstance && state.address) {
        const fetched = await walletService.fetchKoiosMetrics(state.address)
        setState((s) => ({ ...s, balanceAda: fetched?.spentAda ?? s.balanceAda }))
        return
      }
      if (state.walletInstance) {
        const balance = await walletService.getWalletBalanceAda(state.walletInstance)
        setState((s) => ({ ...s, balanceAda: balance }))
      }
    } catch (err) {
      console.error('refreshBalance failed:', err)
    }
  }

  return (
    <WalletContext.Provider value={{
      walletState: state,
      connectWallet,
      disconnectWallet,
      getAvailableWallets,
      fetchTransactionHistory,
      saveLocalTransaction,
      refreshBalance,
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}

export default WalletContext
