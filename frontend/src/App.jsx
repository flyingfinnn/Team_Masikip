import { useState, useEffect } from 'react'
import { BrowserWallet } from '@meshsdk/core'
import { Address } from '@emurgo/cardano-serialization-lib-asmjs'
import NotesPage from './pages/NotesPage'
import WalletPage from './pages/WalletPage'
import './App.css'

const ADA_DIVISOR = 1_000_000
const KOIOS_ENDPOINTS = {
  mainnet: ['https://api.koios.rest/api/v1'],
  testnet: ['https://preprod.koios.rest/api/v1', 'https://preview.koios.rest/api/v1'],
}

const toBech32Address = (raw) => {
  if (!raw) return ''
  if (raw.startsWith('addr') || raw.startsWith('stake')) return raw
  try {
    return Address.from_bytes(Buffer.from(raw, 'hex')).to_bech32()
  } catch (error) {
    console.warn('Failed to convert address to bech32:', error)
    return raw
  }
}

const Lovelace = {
  toAda(value) {
    try {
      if (value === null || value === undefined) return 0
      const bigintValue = typeof value === 'bigint' ? value : BigInt(value)
      return Number(bigintValue) / ADA_DIVISOR
    } catch (error) {
      console.warn('Failed to convert lovelace to ADA:', error)
      return 0
    }
  },
}

const resolveKoiosBases = (address) =>
  address?.startsWith('addr1') || address?.startsWith('stake1')
    ? KOIOS_ENDPOINTS.mainnet
    : KOIOS_ENDPOINTS.testnet

async function postKoiosJson(baseUrl, path, payload) {
  // Use CORS proxy for browser requests
  const proxyUrl = 'https://corsproxy.io/?'
  const targetUrl = `${baseUrl}${path}`
  const fullUrl = `${proxyUrl}${encodeURIComponent(targetUrl)}`
  
  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Koios API error (${response.status}):`, errorText)
      throw new Error(`Koios request failed for ${path} (${response.status})`)
    }
    return response.json()
  } catch (error) {
    // If it's a network/CORS error, try without proxy as fallback
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
      console.warn('CORS proxy failed, trying direct request (may fail due to CORS)')
      try {
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        })
        if (!response.ok) {
          throw new Error(`Koios request failed for ${path} (${response.status})`)
        }
        return response.json()
      } catch (directError) {
        throw error // Throw original error
      }
    }
    throw error
  }
}

async function fetchKoiosMetrics(address) {
  try {
    if (!address) return { spentAda: null, pendingFeesAda: null }
    const candidateBases = resolveKoiosBases(address)
    let selectedBase = null
    let txList = null

    for (const baseUrl of candidateBases) {
      try {
        // Try /address_tx_history first (newer endpoint)
        try {
          txList = await postKoiosJson(baseUrl, '/address_tx_history', {
            _addresses: [address],
          })
          if (Array.isArray(txList) && txList.length > 0) {
            selectedBase = baseUrl
            break
          }
        } catch (e1) {
          // Fall back to /address_txs
          txList = await postKoiosJson(baseUrl, '/address_txs', {
            _addresses: [address],
          })
          if (Array.isArray(txList) && txList.length > 0) {
            selectedBase = baseUrl
            break
          }
        }
        // Limit to 40 most recent
        if (Array.isArray(txList) && txList.length > 40) {
          txList = txList.slice(0, 40)
        }
      } catch (error) {
        // Silently fail - Koios endpoints may not be available
        // Don't log errors to avoid console noise
      }
    }

    if (!selectedBase || !Array.isArray(txList)) {
      // Return null values silently - will fall back to local transactions only
      return { spentAda: null, pendingFeesAda: null }
    }

    const txHashes = txList
      .map((tx) => tx.tx_hash || tx.hash || tx.txHash || tx.id)
      .filter(Boolean)
    if (txHashes.length === 0) {
      return { spentAda: 0, pendingFeesAda: 0 }
    }

    const [txInfos, txStatuses] = await Promise.all([
      postKoiosJson(selectedBase, '/tx_info', { _tx_hashes: txHashes }),
      postKoiosJson(selectedBase, '/tx_status', { _tx_hashes: txHashes }),
    ])

    const statusMap = {}
    txStatuses?.forEach?.((tx) => {
      statusMap[tx.tx_hash] = tx.status
    })

    let spentLovelace = 0n
    let pendingFeeLovelace = 0n

    txInfos?.forEach?.((tx) => {
      tx?.inputs?.forEach?.((input) => {
        if (input?.payment_addr?.bech32 === address) {
          spentLovelace += BigInt(input?.value || 0)
        }
      })
      const txStatus = statusMap[tx.tx_hash]
      if (txStatus && txStatus !== 'confirmed') {
        pendingFeeLovelace += BigInt(tx?.fee || 0)
      }
    })

    return {
      spentAda: Lovelace.toAda(spentLovelace),
      pendingFeesAda: Lovelace.toAda(pendingFeeLovelace),
    }
  } catch (error) {
    console.error('Koios metrics fetch failed:', error)
    return { spentAda: null, pendingFeesAda: null }
  }
}

async function fetchTransactionHistory(address) {
  try {
    if (!address) return []
    const candidateBases = resolveKoiosBases(address)
    let selectedBase = null
    let txList = null

    for (const baseUrl of candidateBases) {
      try {
        // Try /address_tx_history first (newer endpoint)
        try {
          txList = await postKoiosJson(baseUrl, '/address_tx_history', {
            _addresses: [address],
          })
          if (Array.isArray(txList) && txList.length > 0) {
            selectedBase = baseUrl
            break
          }
        } catch (e1) {
          // Fall back to /address_txs
          try {
            txList = await postKoiosJson(baseUrl, '/address_txs', {
              _addresses: [address],
            })
            if (Array.isArray(txList) && txList.length > 0) {
              selectedBase = baseUrl
              break
            }
          } catch (e2) {
            // Silently fail - Koios endpoints may not be available
          }
        }
        // Limit to 50 most recent
        if (Array.isArray(txList) && txList.length > 50) {
          txList = txList.slice(0, 50)
        }
      } catch (error) {
        console.warn(`Koios base failed (${baseUrl}):`, error?.message || error)
      }
    }

    if (!selectedBase || !Array.isArray(txList) || txList.length === 0) {
      return []
    }

    const txHashes = txList
      .map((tx) => tx.tx_hash || tx.hash || tx.txHash || tx.id)
      .filter(Boolean)
    if (txHashes.length === 0) return []

    const [txInfos, txStatuses] = await Promise.all([
      postKoiosJson(selectedBase, '/tx_info', { _tx_hashes: txHashes }),
      postKoiosJson(selectedBase, '/tx_status', { _tx_hashes: txHashes }),
    ])

    const statusMap = {}
    txStatuses?.forEach?.((tx) => {
      statusMap[tx.tx_hash] = tx.status
    })

    const transactions = txInfos
      ?.map((tx) => {
        // Determine if this is a send (debit) or receive (credit)
        let amountLovelace = 0n
        let isDebit = false

        // Check outputs - if any output goes to our address, it's a receive
        const hasOutputToUs = tx?.outputs?.some(
          (output) => output?.payment_addr?.bech32 === address
        )

        // Check inputs - if any input is from our address, we're spending
        const hasInputFromUs = tx?.inputs?.some(
          (input) => input?.payment_addr?.bech32 === address
        )

        if (hasInputFromUs && !hasOutputToUs) {
          // Pure send - calculate total sent
          isDebit = true
          tx?.inputs?.forEach((input) => {
            if (input?.payment_addr?.bech32 === address) {
              amountLovelace += BigInt(input?.value || 0)
            }
          })
        } else if (hasOutputToUs && !hasInputFromUs) {
          // Pure receive
          isDebit = false
          tx?.outputs?.forEach((output) => {
            if (output?.payment_addr?.bech32 === address) {
              amountLovelace += BigInt(output?.value || 0)
            }
          })
        } else if (hasInputFromUs && hasOutputToUs) {
          // Mixed - calculate net change
          let inputTotal = 0n
          let outputTotal = 0n
          tx?.inputs?.forEach((input) => {
            if (input?.payment_addr?.bech32 === address) {
              inputTotal += BigInt(input?.value || 0)
            }
          })
          tx?.outputs?.forEach((output) => {
            if (output?.payment_addr?.bech32 === address) {
              outputTotal += BigInt(output?.value || 0)
            }
          })
          const netChange = outputTotal - inputTotal
          isDebit = netChange < 0
          amountLovelace = netChange < 0 ? -netChange : netChange
        }

        const amountAda = Lovelace.toAda(amountLovelace)
        // Determine status: confirmed if has block_time or status is confirmed
        let status = statusMap[tx.tx_hash] || 'unknown'
        if (tx.block_time) {
          status = 'confirmed' // If transaction has block_time, it's confirmed
        } else if (status === 'unknown' && !tx.block_time) {
          // If no status from Koios and no block_time, check if recent (might be pending)
          const txTime = tx.block_time ? new Date(tx.block_time * 1000) : null
          if (!txTime) {
            status = 'pending' // Likely pending if no block_time
          }
        }

        // Try to extract metadata from transaction
        let label = isDebit ? 'Payment Sent' : 'Payment Received'
        let description = `Transaction ${tx.tx_hash.slice(0, 8)}...`

        // Check if this looks like a note operation payment
        let actionType = null
        if (amountAda >= 0.5 && amountAda <= 2.5) {
          if (amountAda >= 1.9 && amountAda <= 2.1) {
            actionType = 'CREATE'
            label = 'Note Creation Payment'
            description = 'Payment for creating a new note'
          } else if (amountAda >= 0.9 && amountAda <= 1.1) {
            actionType = 'UPDATE'
            label = 'Note Update Payment'
            description = 'Payment for updating a note'
          } else if (amountAda >= 0.4 && amountAda <= 0.6) {
            actionType = 'DELETE'
            label = 'Note Deletion Payment'
            description = 'Payment for deleting a note'
          }
        }

        const txHash = tx.tx_hash || tx.hash || tx.txHash || tx.id
        if (!txHash) {
          return null // Skip transactions without hash
        }
        
        return {
          id: txHash,
          type: isDebit ? 'debit' : 'credit',
          actionType: actionType, // CREATE, UPDATE, DELETE, or null
          label: label || (isDebit ? 'Payment Sent' : 'Payment Received'),
          description: description || `Transaction ${txHash.slice(0, 8)}...`,
          amount: amountAda || 0,
          currency: 'ADA',
          timestamp: tx?.block_time ? new Date(tx.block_time * 1000).toISOString() : new Date().toISOString(),
          status: status, // Use determined status from above
          block_time: tx?.block_time, // Store block_time for confirmation checks
        }
      })
      .filter((tx) => tx && tx.id && tx.amount > 0) // Filter out null, zero-amount, or missing id transactions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Sort by newest first

    return transactions || []
  } catch (error) {
    console.error('Failed to fetch transaction history:', error)
    return []
  }
}

const getWalletBalanceAda = async (wallet) => {
  try {
    // Get UTXOs - this is the most reliable method
    const utxos = await wallet.getUtxos()
    console.log('UTXOs received:', utxos?.length, 'samples:', utxos?.slice(0, 2))
    
    if (!Array.isArray(utxos) || utxos.length === 0) {
      console.warn('No UTXOs found')
      return null
    }
    
    let totalLovelace = 0n
    
    for (const utxo of utxos) {
      // Log first UTXO structure for debugging
      if (totalLovelace === 0n) {
        console.log('Sample UTXO structure:', JSON.stringify(utxo, null, 2))
      }
      
      // Try different UTXO formats
      let lovelace = 0n
      
      // Format 1: utxo.output.amount is an array of objects [{unit: "lovelace", quantity: "..."}, ...]
      if (utxo?.output?.amount && Array.isArray(utxo.output.amount)) {
        // Find the lovelace entry in the array
        const lovelaceEntry = utxo.output.amount.find(
          (item) => item?.unit === 'lovelace' || item?.unit === undefined
        )
        if (lovelaceEntry?.quantity) {
          lovelace = BigInt(lovelaceEntry.quantity)
        } else if (typeof utxo.output.amount[0] === 'number' || typeof utxo.output.amount[0] === 'string') {
          // Fallback: first element is directly a number/string
          lovelace = BigInt(utxo.output.amount[0] || 0)
        }
      }
      // Format 2: utxo.output.amount is an object with quantity
      else if (utxo?.output?.amount?.quantity) {
        lovelace = BigInt(utxo.output.amount.quantity)
      }
      // Format 3: utxo.amount is an array
      else if (utxo?.amount && Array.isArray(utxo.amount)) {
        const lovelaceEntry = utxo.amount.find(
          (item) => item?.unit === 'lovelace' || (typeof item === 'object' && item?.quantity)
        )
        if (lovelaceEntry?.quantity) {
          lovelace = BigInt(lovelaceEntry.quantity)
        } else {
          lovelace = BigInt(utxo.amount[0] || 0)
        }
      }
      // Format 4: utxo.amount is a number/string
      else if (utxo?.amount) {
        lovelace = BigInt(utxo.amount)
      }
      // Format 5: utxo.value
      else if (utxo?.value) {
        lovelace = BigInt(utxo.value)
      }
      // Format 6: utxo.output.value
      else if (utxo?.output?.value) {
        lovelace = BigInt(utxo.output.value)
      }
      
      totalLovelace += lovelace
    }
    
    const balanceAda = Lovelace.toAda(totalLovelace)
    console.log('Total lovelace:', totalLovelace.toString(), 'ADA:', balanceAda)
    return balanceAda
  } catch (error) {
    console.error('Unable to fetch wallet balance:', error)
    return null
  }
}

// Transaction storage key for localStorage
const TRANSACTION_STORAGE_KEY = 'masikip_transactions'

// Load transactions from localStorage
const loadStoredTransactions = (address) => {
  if (!address) return []
  try {
    const stored = localStorage.getItem(TRANSACTION_STORAGE_KEY)
    if (!stored) return []
    const allTransactions = JSON.parse(stored)
    return allTransactions[address] || []
  } catch (error) {
    console.error('Failed to load stored transactions:', error)
    return []
  }
}

// Save transaction to localStorage
const saveTransaction = (address, transaction) => {
  if (!address) return
  try {
    const stored = localStorage.getItem(TRANSACTION_STORAGE_KEY)
    const allTransactions = stored ? JSON.parse(stored) : {}
    if (!allTransactions[address]) {
      allTransactions[address] = []
    }
    allTransactions[address].unshift(transaction) // Add to beginning
    // Keep only last 100 transactions per address
    if (allTransactions[address].length > 100) {
      allTransactions[address] = allTransactions[address].slice(0, 100)
    }
    localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(allTransactions))
  } catch (error) {
    console.error('Failed to save transaction:', error)
  }
}

const initialWalletState = {
  connected: false,
  connecting: false,
  address: null,
  walletName: null,
  error: null,
  balanceAda: null,
  spentAda: null,
  pendingFeesAda: null,
  walletInstance: null, // Store the actual wallet instance for payments
  localTransactions: [], // Store local payment transactions
}

function App() {
  const [activeView, setActiveView] = useState(() => {
    // Restore active view from localStorage
    return localStorage.getItem('ledgee_activeView') || 'notes'
  })
  const [walletState, setWalletState] = useState(initialWalletState)
  const [searchTerm, setSearchTerm] = useState('')

  // Function to recalculate spent/pending from local transactions
  const recalculateSpentPending = (localTxs, koiosMetrics) => {
    // Calculate spent from confirmed debit transactions
    const localSpent = (localTxs || [])
      .filter((tx) => tx.type === 'debit' && tx.status === 'confirmed')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0)

    // Calculate pending from pending transactions (both debit amounts and fees)
    const localPending = (localTxs || [])
      .filter((tx) => tx.status === 'pending')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0)

    // Combine Koios and local metrics
    const totalSpent = (koiosMetrics?.spentAda ?? 0) + localSpent
    const totalPending = (koiosMetrics?.pendingFeesAda ?? 0) + localPending

    return {
      spentAda: totalSpent > 0 ? totalSpent : null,
      pendingFeesAda: totalPending > 0 ? totalPending : null,
    }
  }

  // Periodically check and update transaction statuses
  useEffect(() => {
    if (!walletState.connected || !walletState.address) return

    const checkTransactionStatuses = async () => {
      try {
        // Reload local transactions from storage to get latest
        const storedLocalTxs = loadStoredTransactions(walletState.address)
        
        // Check for pending transactions older than 2 minutes
        const updatedTxs = storedLocalTxs.map((tx) => {
          if (tx.status === 'pending' && tx.timestamp) {
            const txAge = Date.now() - new Date(tx.timestamp).getTime()
            // If transaction is older than 2 minutes, likely confirmed (Cardano blocks ~20 seconds)
            if (txAge > 120000) {
              return { ...tx, status: 'confirmed' }
            }
          }
          return tx
        })

        // Check if any transactions were updated
        const hasUpdates = updatedTxs.some((tx, idx) => 
          tx.status === 'confirmed' && storedLocalTxs[idx]?.status === 'pending'
        )

        if (hasUpdates) {
          // Update localStorage
          const stored = localStorage.getItem(TRANSACTION_STORAGE_KEY)
          const allTransactions = stored ? JSON.parse(stored) : {}
          allTransactions[walletState.address] = updatedTxs
          localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(allTransactions))

          // Recalculate spent/pending with updated statuses
          const koiosMetrics = await (walletState.address ? fetchKoiosMetrics(walletState.address).catch(() => ({})) : Promise.resolve({}))
          const { spentAda, pendingFeesAda } = recalculateSpentPending(updatedTxs, koiosMetrics)

          // Update wallet state with recalculated values
          setWalletState((prev) => ({
            ...prev,
            localTransactions: updatedTxs,
            spentAda,
            pendingFeesAda,
          }))
        } else {
          // Even if no updates, recalculate to ensure consistency
          const koiosMetrics = await (walletState.address ? fetchKoiosMetrics(walletState.address).catch(() => ({})) : Promise.resolve({}))
          const { spentAda, pendingFeesAda } = recalculateSpentPending(storedLocalTxs, koiosMetrics)
          
          // Only update if values changed
          setWalletState((prev) => {
            if (prev.spentAda !== spentAda || prev.pendingFeesAda !== pendingFeesAda) {
              return {
                ...prev,
                localTransactions: storedLocalTxs,
                spentAda,
                pendingFeesAda,
              }
            }
            return prev
          })
        }
      } catch (error) {
        console.error('Failed to check transaction statuses:', error)
      }
    }

    // Check immediately
    checkTransactionStatuses()

    // Check every 30 seconds for status updates
    const interval = setInterval(checkTransactionStatuses, 30000)

    return () => clearInterval(interval)
  }, [walletState.connected, walletState.address])

  // Save active view to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ledgee_activeView', activeView)
  }, [activeView])

  // Restore wallet connection on mount
  useEffect(() => {
    const restoreWalletConnection = async () => {
      const savedWalletName = localStorage.getItem('ledgee_walletName')
      const savedAddress = localStorage.getItem('ledgee_walletAddress')
      
      if (!savedWalletName || !savedAddress) return

      try {
        setWalletState((prev) => ({
          ...prev,
          connecting: true,
        }))

        const wallet = await BrowserWallet.enable(savedWalletName)
        const addresses = await wallet.getUsedAddresses()
        const changeAddresses = await wallet.getChangeAddress()
        const resolvedAddress = toBech32Address(addresses[0] || changeAddresses || '')

        // Verify the address matches what we saved
        if (resolvedAddress !== savedAddress) {
          // Address changed, clear saved data
          localStorage.removeItem('ledgee_walletName')
          localStorage.removeItem('ledgee_walletAddress')
          setWalletState(initialWalletState)
          return
        }

        const [balanceAda, koiosMetrics] = await Promise.all([
          getWalletBalanceAda(wallet),
          resolvedAddress ? fetchKoiosMetrics(resolvedAddress) : Promise.resolve({}),
        ])

        setWalletState({
          connected: true,
          connecting: false,
          address: resolvedAddress,
          walletName: savedWalletName,
          balanceAda,
          spentAda: koiosMetrics?.spentAda ?? null,
          pendingFeesAda: koiosMetrics?.pendingFeesAda ?? null,
          walletInstance: wallet,
          error: null,
        })
      } catch (error) {
        console.error('Failed to restore wallet connection:', error)
        // Clear saved data if restore fails
        localStorage.removeItem('ledgee_walletName')
        localStorage.removeItem('ledgee_walletAddress')
        setWalletState(initialWalletState)
      }
    }

    restoreWalletConnection()
  }, [])

  const handleWalletButtonClick = async () => {
    if (walletState.connected) {
      // Clear saved wallet data
      localStorage.removeItem('ledgee_walletName')
      localStorage.removeItem('ledgee_walletAddress')
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
      const resolvedAddress = toBech32Address(addresses[0] || changeAddresses || '')

      // Load stored local transactions
      const localTransactions = loadStoredTransactions(resolvedAddress)

      const [balanceAda, koiosMetrics] = await Promise.all([
        getWalletBalanceAda(wallet),
        resolvedAddress ? fetchKoiosMetrics(resolvedAddress) : Promise.resolve({}),
      ])

      // Calculate spent and pending from local transactions
      const { spentAda, pendingFeesAda } = recalculateSpentPending(localTransactions, koiosMetrics)

      // Save wallet info to localStorage for session persistence
      localStorage.setItem('ledgee_walletName', walletName)
      localStorage.setItem('ledgee_walletAddress', resolvedAddress)

      setWalletState({
        connected: true,
        connecting: false,
        address: resolvedAddress,
        walletName: walletName,
        balanceAda,
        spentAda,
        pendingFeesAda,
        walletInstance: wallet,
        localTransactions,
        error: null,
      })
    } catch (error) {
      console.error('Wallet connection failed:', error)
      setWalletState({
        connected: false,
        connecting: false,
        address: null,
        walletName: null,
        balanceAda: null,
        spentAda: null,
        pendingFeesAda: null,
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
          <div className="brand-info">
            <div className="brand-title">
              <span className="brand-dot" />
              Ledgee
            </div>
            <div className="brand-tagline">All blockchain-backed notes at a glance.</div>
          </div>
          <div className="nav-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
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
          <WalletPage 
            walletState={walletState} 
            fetchTransactionHistory={fetchTransactionHistory}
            onTransactionRecorded={async (transaction) => {
              // Update local transactions in state
              const updatedLocal = [transaction, ...(walletState.localTransactions || [])]
              
              // Save to localStorage first
              if (walletState.address) {
                saveTransaction(walletState.address, transaction)
              }
              
              // Recalculate spent/pending with updated transactions
              const koiosMetrics = walletState.address ? await fetchKoiosMetrics(walletState.address).catch(() => ({})) : {}
              const { spentAda, pendingFeesAda } = recalculateSpentPending(updatedLocal, koiosMetrics)
              
              setWalletState((prev) => ({
                ...prev,
                localTransactions: updatedLocal,
                spentAda,
                pendingFeesAda,
              }))
            }}
            onStatusUpdate={async (updatedTransactions) => {
              // Called when WalletPage detects status updates - immediately recalculate
              const koiosMetrics = walletState.address ? await fetchKoiosMetrics(walletState.address).catch(() => ({})) : {}
              const { spentAda, pendingFeesAda } = recalculateSpentPending(updatedTransactions, koiosMetrics)
              
              setWalletState((prev) => ({
                ...prev,
                localTransactions: updatedTransactions,
                spentAda,
                pendingFeesAda,
              }))
            }}
          />
        ) : (
          <NotesPage 
            walletState={walletState} 
            onWalletButtonClick={handleWalletButtonClick}
            walletInstance={walletState.walletInstance}
            searchTerm={searchTerm}
            onTransactionRecorded={async (transaction) => {
              // Update local transactions in state
              const updatedLocal = [transaction, ...(walletState.localTransactions || [])]
              
              // Save to localStorage first
              if (walletState.address) {
                saveTransaction(walletState.address, transaction)
              }
              
              // Recalculate spent/pending with updated transactions
              const koiosMetrics = walletState.address ? await fetchKoiosMetrics(walletState.address).catch(() => ({})) : {}
              const { spentAda, pendingFeesAda } = recalculateSpentPending(updatedLocal, koiosMetrics)
              
              setWalletState((prev) => ({
                ...prev,
                localTransactions: updatedLocal,
                spentAda,
                pendingFeesAda,
              }))
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
