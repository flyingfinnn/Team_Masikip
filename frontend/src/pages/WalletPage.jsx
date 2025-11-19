import { useState, useEffect } from 'react';
import '../styles/WalletPage.css';

const SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  AMOUNT_HIGH: 'amount_high',
  AMOUNT_LOW: 'amount_low',
  STATUS: 'status',
  ACTION: 'action',
}

function WalletPage({ walletState = {}, fetchTransactionHistory, onTransactionRecorded, onStatusUpdate }) {
  const [transactions, setTransactions] = useState([]);
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NEWEST);
  
  const isConnected = walletState?.connected === true;
  const walletName = walletState?.walletName || 'Ledgee Vault';
  const displayAddress = walletState?.address || 'No wallet connected';
  const liveBalance = typeof walletState?.balanceAda === 'number' ? walletState.balanceAda : null;
  const spentAda = typeof walletState?.spentAda === 'number' ? walletState.spentAda : null;
  const pendingFeesAda = typeof walletState?.pendingFeesAda === 'number' ? walletState.pendingFeesAda : null;
  const localTransactions = walletState?.localTransactions || [];

  useEffect(() => {
    if (isConnected && walletState?.address && fetchTransactionHistory) {
      setLoadingTxs(true);
      fetchTransactionHistory(walletState.address)
        .then((koiosTxs) => {
          // Merge Koios transactions with local transactions
          // Local transactions take priority (they're more recent and accurate for our app)
          const localTxMap = new Map();
          localTransactions.forEach((tx) => {
            localTxMap.set(tx.id, tx);
          });
          
          // Update local transactions with status from Koios and add new ones
          koiosTxs.forEach((tx) => {
            if (localTxMap.has(tx.id)) {
              // Update status of local transaction if it's confirmed
              const localTx = localTxMap.get(tx.id);
              // If Koios says it's confirmed, or it has block_time, it's confirmed
              const isConfirmed = tx.status === 'confirmed' || tx.block_time
              
              if (localTx.status === 'pending' && isConfirmed) {
                localTx.status = 'confirmed';
                localTxMap.set(tx.id, localTx);
                // Update localStorage
                if (walletState?.address) {
                  const stored = localStorage.getItem('masikip_transactions');
                  if (stored) {
                    try {
                      const allTransactions = JSON.parse(stored);
                      if (allTransactions[walletState.address]) {
                        const index = allTransactions[walletState.address].findIndex(t => t.id === tx.id);
                        if (index !== -1) {
                          allTransactions[walletState.address][index].status = 'confirmed';
                          localStorage.setItem('masikip_transactions', JSON.stringify(allTransactions));
                        }
                      }
                    } catch (e) {
                      console.error('Failed to update transaction status:', e);
                    }
                  }
                }
              }
            } else {
              // Add new Koios transaction
              localTxMap.set(tx.id, tx);
            }
          });
          
          // Also check pending local transactions - if they're older than 2 minutes, likely confirmed
          let hasStatusUpdates = false;
          localTransactions.forEach((localTx) => {
            if (localTx.status === 'pending' && localTx.timestamp) {
              const txAge = Date.now() - new Date(localTx.timestamp).getTime();
              // If transaction is older than 2 minutes, likely confirmed (Cardano blocks ~20 seconds)
              if (txAge > 120000) {
                const koiosTx = koiosTxs.find(ktx => ktx.id === localTx.id);
                // If not in Koios (might be confirmed but not indexed yet) or Koios confirms it, mark as confirmed
                if (!koiosTx || koiosTx.status === 'confirmed' || koiosTx.block_time) {
                  if (localTxMap.has(localTx.id)) {
                    localTxMap.get(localTx.id).status = 'confirmed';
                  } else {
                    localTx.status = 'confirmed';
                    localTxMap.set(localTx.id, localTx);
                  }
                  hasStatusUpdates = true;
                  
                  // Update localStorage
                  if (walletState?.address) {
                    const stored = localStorage.getItem('masikip_transactions');
                    if (stored) {
                      try {
                        const allTransactions = JSON.parse(stored);
                        if (allTransactions[walletState.address]) {
                          const index = allTransactions[walletState.address].findIndex(t => t.id === localTx.id);
                          if (index !== -1) {
                            allTransactions[walletState.address][index].status = 'confirmed';
                            localStorage.setItem('masikip_transactions', JSON.stringify(allTransactions));
                          }
                        }
                      } catch (e) {
                        console.error('Failed to update transaction status:', e);
                      }
                    }
                  }
                }
              }
            }
          });
          
          // If statuses were updated, trigger a refresh by updating state
          if (hasStatusUpdates) {
            const updatedArray = Array.from(localTxMap.values())
            // Update wallet state directly - this will trigger parent recalculation
            if (walletState?.address) {
              const stored = localStorage.getItem('masikip_transactions')
              if (stored) {
                try {
                  const allTransactions = JSON.parse(stored)
                  allTransactions[walletState.address] = updatedArray
                  localStorage.setItem('masikip_transactions', JSON.stringify(allTransactions))
                  
                  // Trigger parent to recalculate spent/pending immediately
                  if (onStatusUpdate) {
                    onStatusUpdate(updatedArray)
                  }
                } catch (e) {
                  console.error('Failed to update transactions:', e)
                }
              }
            }
          }
          
          // Convert to array, filter out credit transactions, and apply sorting
          const merged = Array.from(localTxMap.values())
            .filter((tx) => tx.type !== 'credit') // Only show debit transactions (payments sent)
          const sorted = sortTransactions(merged, sortBy);
          
          setTransactions(sorted);
          setLoadingTxs(false);
        })
        .catch((error) => {
          console.error('Failed to load transaction history:', error);
          // Still show local transactions even if Koios fails
          // Check and update pending transactions older than 2 minutes
          const updatedLocal = localTransactions.map(tx => {
            if (tx.status === 'pending' && tx.timestamp) {
              const txAge = Date.now() - new Date(tx.timestamp).getTime();
              if (txAge > 120000) {
                return { ...tx, status: 'confirmed' };
              }
            }
            return tx;
          });
          
          // Update localStorage with confirmed statuses
          const hasUpdates = updatedLocal.some((tx, idx) => 
            tx.status === 'confirmed' && localTransactions[idx]?.status === 'pending'
          );
          if (hasUpdates && walletState?.address) {
            const stored = localStorage.getItem('masikip_transactions');
            if (stored) {
              try {
                const allTransactions = JSON.parse(stored);
                if (allTransactions[walletState.address]) {
                  updatedLocal.forEach(updatedTx => {
                    const index = allTransactions[walletState.address].findIndex(t => t.id === updatedTx.id);
                    if (index !== -1 && updatedTx.status === 'confirmed') {
                      allTransactions[walletState.address][index].status = 'confirmed';
                    }
                  });
                  localStorage.setItem('masikip_transactions', JSON.stringify(allTransactions));
                }
              } catch (e) {
                console.error('Failed to update transaction status:', e);
              }
            }
          }
          
          // Filter out credit transactions (only show debit/payments sent)
          const filteredLocal = updatedLocal.filter((tx) => tx.type !== 'credit')
          const sortedLocal = sortTransactions(filteredLocal, sortBy);
          setTransactions(sortedLocal);
          setLoadingTxs(false);
        });
    } else if (localTransactions.length > 0) {
      // Show local transactions even if not connected to Koios
      // Update pending transactions older than 2 minutes
      const updatedLocal = localTransactions.map(tx => {
        if (tx.status === 'pending' && tx.timestamp) {
          const txAge = Date.now() - new Date(tx.timestamp).getTime();
          if (txAge > 120000) {
            return { ...tx, status: 'confirmed' };
          }
        }
        return tx;
      });
      // Filter out credit transactions (only show debit/payments sent)
      const filteredLocal = updatedLocal.filter((tx) => tx.type !== 'credit')
      const sortedLocal = sortTransactions(filteredLocal, sortBy);
      setTransactions(sortedLocal);
    } else {
      setTransactions([]);
    }
  }, [isConnected, walletState?.address, fetchTransactionHistory, localTransactions, sortBy]);

  // Sort function
  function sortTransactions(txs, sortOption) {
    const sorted = [...txs];
    
    switch (sortOption) {
      case SORT_OPTIONS.NEWEST:
        return sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      case SORT_OPTIONS.OLDEST:
        return sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      case SORT_OPTIONS.AMOUNT_HIGH:
        return sorted.sort((a, b) => (b.amount || 0) - (a.amount || 0));
      case SORT_OPTIONS.AMOUNT_LOW:
        return sorted.sort((a, b) => (a.amount || 0) - (b.amount || 0));
      case SORT_OPTIONS.STATUS:
        return sorted.sort((a, b) => {
          const statusOrder = { confirmed: 1, pending: 2, unknown: 3 };
          return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        });
      case SORT_OPTIONS.ACTION:
        return sorted.sort((a, b) => {
          const actionOrder = { CREATE: 1, UPDATE: 2, DELETE: 3 };
          const aAction = a.actionType || '';
          const bAction = b.actionType || '';
          return (actionOrder[aAction] || 99) - (actionOrder[bAction] || 99);
        });
      default:
        return sorted;
    }
  }

  return (
    <div className="wallet-page">
      <div className="wallet-page__header">
        <div>
          <p className="wallet-label">Active Wallet</p>
          <h1>{walletName}</h1>
          <p className="wallet-address">{displayAddress}</p>
        </div>
        <div className="wallet-net">
          <span>Net Balance</span>
          <strong>
            {isConnected && liveBalance != null
              ? `${liveBalance.toFixed(2)} ADA`
              : 'N/A'}
          </strong>
        </div>
      </div>

      <div className="wallet-metrics">
        <div className="metric-card warning">
          <span>Spent</span>
          <p>
            {isConnected && spentAda != null
              ? `${spentAda.toFixed(2)} ADA`
              : 'N/A'}
          </p>
          <small>
            {isConnected && spentAda != null
              ? 'Total spent (Koios + App payments)'
              : isConnected
              ? 'Loading...'
              : 'Connect wallet to view'}
          </small>
        </div>
        <div className="metric-card outline">
          <span>Pending</span>
          <p>
            {isConnected && pendingFeesAda != null
              ? `${pendingFeesAda.toFixed(2)} ADA`
              : 'N/A'}
          </p>
          <small>
            {isConnected && pendingFeesAda != null
              ? 'Pending fees (Koios + App payments)'
              : isConnected
              ? 'Loading...'
              : 'Connect wallet to view'}
          </small>
        </div>
      </div>

      <section className="wallet-transactions">
        <header>
          <div>
            <h2>Transaction History</h2>
            <p>Live feed from the Cardano settlement layer</p>
          </div>
          <div className="transaction-controls">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
              title="Sort transactions"
            >
              <option value={SORT_OPTIONS.NEWEST}>Newest First</option>
              <option value={SORT_OPTIONS.OLDEST}>Oldest First</option>
              <option value={SORT_OPTIONS.AMOUNT_HIGH}>Amount: High to Low</option>
              <option value={SORT_OPTIONS.AMOUNT_LOW}>Amount: Low to High</option>
              <option value={SORT_OPTIONS.STATUS}>By Status</option>
              <option value={SORT_OPTIONS.ACTION}>By Action</option>
            </select>
            <button type="button">Export CSV</button>
          </div>
        </header>

        <div className="transactions-table">
          <div className="table-head">
            <span>Transaction ID</span>
            <span>Action</span>
            <span>Details</span>
            <span>Amount</span>
            <span>Status</span>
          </div>

          <div className="table-body">
            {loadingTxs ? (
              <div className="transaction-row">
                <span colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  Loading transaction history...
                </span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="transaction-row">
                <span colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.5)' }}>
                  {isConnected ? 'No transactions found' : 'Connect wallet to view transactions'}
                </span>
              </div>
            ) : (
              transactions
                .filter((txn) => txn && txn.id) // Filter out transactions without id
                .map((txn) => {
                  const id = txn.id || 'unknown'
                  const type = txn.type || 'debit'
                  const actionType = txn.actionType || null // CREATE, UPDATE, DELETE, or null
                  const label = txn.label || 'Transaction'
                  const description = txn.description || ''
                  const amount = txn.amount || 0
                  const currency = txn.currency || 'ADA'
                  const status = txn.status || 'unknown'
                  const timestamp = txn.timestamp || new Date().toISOString()
                  
                  // Determine CardanoScan URL based on address network
                  const isTestnet = walletState?.address?.startsWith('addr_test')
                  const cardanoscanBase = isTestnet 
                    ? 'https://preview.cardanoscan.io'
                    : 'https://cardanoscan.io'
                  const cardanoscanUrl = id && id !== 'unknown' 
                    ? `${cardanoscanBase}/transaction/${id}`
                    : null
                  
                  return (
                    <div key={id} className="transaction-row">
                      <span className="txn-id" title={id}>
                        {cardanoscanUrl ? (
                          <a 
                            href={cardanoscanUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="txn-link"
                            onClick={(e) => e.stopPropagation()}
                            title="View on CardanoScan"
                          >
                            {typeof id === 'string' && id.length > 14
                              ? `${id.slice(0, 8)}...${id.slice(-6)}`
                              : id}
                            <span className="txn-link-icon">🔗</span>
                          </a>
                        ) : (
                          typeof id === 'string' && id.length > 14
                            ? `${id.slice(0, 8)}...${id.slice(-6)}`
                            : id
                        )}
                      </span>
                      <span className={`txn-action ${actionType ? actionType.toLowerCase() : ''}`}>
                        {actionType || type}
                      </span>
                      <span className="txn-details">
                        <strong>{label}</strong>
                        <small>{description}</small>
                        <small>{new Date(timestamp).toLocaleString()}</small>
                      </span>
                      <span className="txn-amount">
                        {type === 'debit' ? '-' : '+'}
                        {typeof amount === 'number' ? amount.toFixed(2) : amount} {currency}
                      </span>
                      <span className={`txn-status ${status}`}>{status}</span>
                    </div>
                  )
                })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default WalletPage;

