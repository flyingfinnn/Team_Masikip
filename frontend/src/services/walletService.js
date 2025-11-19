import { BrowserWallet } from '@meshsdk/core'
import { Address } from '@emurgo/cardano-serialization-lib-asmjs'

const ADA_DIVISOR = 1_000_000
const KOIOS_ENDPOINTS = {
  mainnet: ['https://api.koios.rest/api/v1'],
  testnet: ['https://preprod.koios.rest/api/v1', 'https://preview.koios.rest/api/v1'],
}

const TRANSACTION_STORAGE_KEY = 'masikip_transactions'

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
      throw new Error(`Koios request failed for ${path} (${response.status})`)
    }
    return response.json()
  } catch (error) {
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
      console.warn('CORS proxy failed, trying direct request')
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
        throw error
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
        try {
          txList = await postKoiosJson(baseUrl, '/address_tx_history', {
            _addresses: [address],
          })
          if (Array.isArray(txList) && txList.length > 0) {
            selectedBase = baseUrl
            break
          }
        } catch (e1) {
          try {
            txList = await postKoiosJson(baseUrl, '/address_txs', {
              _addresses: [address],
            })
            if (Array.isArray(txList) && txList.length > 0) {
              selectedBase = baseUrl
              break
            }
          } catch (e2) {
            console.warn(`Koios endpoints failed for ${baseUrl}:`, e2?.message || e2)
          }
        }
      } catch (error) {
        console.warn(`Koios base failed (${baseUrl}):`, error?.message || error)
      }
    }

    if (!selectedBase || !Array.isArray(txList)) {
      return { spentAda: null, pendingFeesAda: null }
    }

    const txHashes = txList
      .map((tx) => tx.tx_hash || tx.hash || tx.txHash || tx.id)
      .filter(Boolean)

    if (txHashes.length === 0) return { spentAda: 0, pendingFeesAda: 0 }

    const txInfos = await postKoiosJson(selectedBase, '/tx_info', {
      _tx_hashes: txHashes,
    })

    let spentLovelace = 0n
    let pendingFeeLovelace = 0n

    txInfos?.forEach?.((tx) => {
      tx?.inputs?.forEach?.((input) => {
        if (input?.payment_addr?.bech32 === address) {
          spentLovelace += BigInt(input?.value || 0)
        }
      })
      if (tx?.fee) pendingFeeLovelace += BigInt(tx.fee || 0)
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
        try {
          txList = await postKoiosJson(baseUrl, '/address_tx_history', {
            _addresses: [address],
          })
          if (Array.isArray(txList) && txList.length > 0) {
            selectedBase = baseUrl
            break
          }
        } catch (e1) {
          try {
            txList = await postKoiosJson(baseUrl, '/address_txs', {
              _addresses: [address],
            })
            if (Array.isArray(txList) && txList.length > 0) {
              selectedBase = baseUrl
              break
            }
          } catch (e2) {
            try {
              const accountInfo = await postKoiosJson(baseUrl, '/account_addresses', {
                _addresses: [address],
              })
              if (Array.isArray(accountInfo) && accountInfo.length > 0) {
                console.warn(`Account info retrieved but no tx list from ${baseUrl}`)
              }
            } catch (e3) {
              console.warn(`All Koios endpoints failed for ${baseUrl}`)
            }
          }
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
        let amountLovelace = 0n
        let isDebit = false

        const hasOutputToUs = tx?.outputs?.some(
          (output) => output?.payment_addr?.bech32 === address
        )

        const hasInputFromUs = tx?.inputs?.some(
          (input) => input?.payment_addr?.bech32 === address
        )

        if (hasInputFromUs && !hasOutputToUs) {
          isDebit = true
          tx?.inputs?.forEach((input) => {
            if (input?.payment_addr?.bech32 === address) {
              amountLovelace += BigInt(input?.value || 0)
            }
          })
        } else if (hasOutputToUs && !hasInputFromUs) {
          isDebit = false
          tx?.outputs?.forEach((output) => {
            if (output?.payment_addr?.bech32 === address) {
              amountLovelace += BigInt(output?.value || 0)
            }
          })
        } else if (hasInputFromUs && hasOutputToUs) {
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
        const status = statusMap[tx.tx_hash] || 'unknown'

        let label = isDebit ? 'Payment Sent' : 'Payment Received'
        let description = `Transaction ${tx.tx_hash.slice(0, 8)}...`

        if (amountAda >= 0.5 && amountAda <= 2.5) {
          if (amountAda >= 1.9 && amountAda <= 2.1) {
            label = 'Note Creation Payment'
            description = 'Payment for creating a new note'
          } else if (amountAda >= 0.9 && amountAda <= 1.1) {
            label = 'Note Update Payment'
            description = 'Payment for updating a note'
          } else if (amountAda >= 0.4 && amountAda <= 0.6) {
            label = 'Note Deletion Payment'
            description = 'Payment for deleting a note'
          }
        }

        return {
          id: tx.tx_hash,
          type: isDebit ? 'debit' : 'credit',
          label,
          description,
          amount: amountAda,
          currency: 'ADA',
          timestamp: tx?.block_time ? new Date(tx.block_time * 1000).toISOString() : new Date().toISOString(),
          status: status === 'confirmed' ? 'confirmed' : 'pending',
        }
      })
      .filter((tx) => tx.amount > 0)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    return transactions || []
  } catch (error) {
    console.error('Failed to fetch transaction history:', error)
    return []
  }
}

async function getWalletBalanceAda(wallet) {
  try {
    const utxos = await wallet.getUtxos()
    if (!Array.isArray(utxos) || utxos.length === 0) {
      return null
    }
    let totalLovelace = 0n

    for (const utxo of utxos) {
      let lovelace = 0n
      if (utxo?.output?.amount && Array.isArray(utxo.output.amount)) {
        const lovelaceEntry = utxo.output.amount.find(
          (item) => item?.unit === 'lovelace' || item?.unit === undefined
        )
        if (lovelaceEntry?.quantity) {
          lovelace = BigInt(lovelaceEntry.quantity)
        } else if (typeof utxo.output.amount[0] === 'number' || typeof utxo.output.amount[0] === 'string') {
          lovelace = BigInt(utxo.output.amount[0] || 0)
        }
      } else if (utxo?.output?.amount?.quantity) {
        lovelace = BigInt(utxo.output.amount.quantity)
      } else if (utxo?.amount && Array.isArray(utxo.amount)) {
        const lovelaceEntry = utxo.amount.find(
          (item) => item?.unit === 'lovelace' || (typeof item === 'object' && item?.quantity)
        )
        if (lovelaceEntry?.quantity) {
          lovelace = BigInt(lovelaceEntry.quantity)
        } else {
          lovelace = BigInt(utxo.amount[0] || 0)
        }
      } else if (utxo?.amount) {
        lovelace = BigInt(utxo.amount)
      } else if (utxo?.value) {
        lovelace = BigInt(utxo.value)
      } else if (utxo?.output?.value) {
        lovelace = BigInt(utxo.output.value)
      }

      totalLovelace += lovelace
    }

    return Lovelace.toAda(totalLovelace)
  } catch (error) {
    console.error('Unable to fetch wallet balance:', error)
    return null
  }
}

function loadStoredTransactions(address) {
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

function saveTransaction(address, transaction) {
  if (!address) return
  try {
    const stored = localStorage.getItem(TRANSACTION_STORAGE_KEY)
    const allTransactions = stored ? JSON.parse(stored) : {}
    if (!allTransactions[address]) {
      allTransactions[address] = []
    }
    allTransactions[address].unshift(transaction)
    if (allTransactions[address].length > 100) {
      allTransactions[address] = allTransactions[address].slice(0, 100)
    }
    localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(allTransactions))
  } catch (error) {
    console.error('Failed to save transaction:', error)
  }
}

async function connectWallet() {
  try {
    const availableWallets = BrowserWallet.getInstalledWallets()
    if (!availableWallets || availableWallets.length === 0) {
      return {
        connected: false,
        connecting: false,
        address: null,
        walletName: null,
        error: 'No Cardano wallet detected. Please install a wallet extension.',
      }
    }

    const walletName = availableWallets[0].name
    const wallet = await BrowserWallet.enable(walletName)
    const addresses = await wallet.getUsedAddresses()
    const changeAddress = await wallet.getChangeAddress()
    const resolvedAddress = toBech32Address(addresses[0] || changeAddress || '')

    const localTransactions = loadStoredTransactions(resolvedAddress)

    const [balanceAda, koiosMetrics] = await Promise.all([
      getWalletBalanceAda(wallet),
      resolvedAddress ? fetchKoiosMetrics(resolvedAddress) : Promise.resolve({}),
    ])

    const localSpent = localTransactions
      .filter((tx) => {
        const meta = tx.metadata || tx
        return meta.type === 'debit' && (meta.status === 'confirmed' || tx.status === 'confirmed')
      })
      .reduce((sum, tx) => {
        const meta = tx.metadata || tx
        return sum + (meta.amount || tx.amount || 0)
      }, 0)

    const localPending = localTransactions
      .filter((tx) => {
        const meta = tx.metadata || tx
        return meta.status === 'pending' || tx.status === 'pending'
      })
      .reduce((sum, tx) => {
        const meta = tx.metadata || tx
        return sum + (meta.amount || tx.amount || 0)
      }, 0)

    const totalSpent = (koiosMetrics?.spentAda ?? 0) + localSpent
    const totalPending = (koiosMetrics?.pendingFeesAda ?? 0) + localPending

    return {
      connected: true,
      connecting: false,
      address: resolvedAddress,
      walletName: walletName,
      balanceAda,
      spentAda: totalSpent > 0 ? totalSpent : null,
      pendingFeesAda: totalPending > 0 ? totalPending : null,
      walletInstance: wallet,
      localTransactions,
      error: null,
    }
  } catch (error) {
    console.error('Wallet connection failed:', error)
    return {
      connected: false,
      connecting: false,
      address: null,
      walletName: null,
      balanceAda: null,
      spentAda: null,
      pendingFeesAda: null,
      error: error?.message || 'Wallet connection failed. Please try again.',
    }
  }
}

function disconnectWallet() {
  return {
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
}

export default {
  connectWallet,
  disconnectWallet,
  fetchTransactionHistory,
  fetchKoiosMetrics,
  getWalletBalanceAda,
  saveTransaction,
  loadStoredTransactions,
}
