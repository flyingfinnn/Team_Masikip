import { useState, useEffect } from 'react';
import '../styles/WalletPage.css';

function WalletPage({ walletState = {}, fetchTransactionHistory }) {
  const [transactions, setTransactions] = useState([]);
  const [loadingTxs, setLoadingTxs] = useState(false);
  
  const isConnected = walletState?.connected === true;
  const walletName = walletState?.walletName || 'Ledgee Vault';
  const displayAddress = walletState?.address || 'No wallet connected';
  const liveBalance = typeof walletState?.balanceAda === 'number' ? walletState.balanceAda : null;
  const spentAda = typeof walletState?.spentAda === 'number' ? walletState.spentAda : null;
  const pendingFeesAda = typeof walletState?.pendingFeesAda === 'number' ? walletState.pendingFeesAda : null;

  useEffect(() => {
    if (isConnected && walletState?.address && fetchTransactionHistory) {
      setLoadingTxs(true);
      fetchTransactionHistory(walletState.address)
        .then((txs) => {
          setTransactions(txs);
          setLoadingTxs(false);
        })
        .catch((error) => {
          console.error('Failed to load transaction history:', error);
          setTransactions([]);
          setLoadingTxs(false);
        });
    } else {
      setTransactions([]);
    }
  }, [isConnected, walletState?.address, fetchTransactionHistory]);

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
              ? 'Koios (last 40 tx)'
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
              ? 'Pending fees (Koios)'
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
          <button type="button">Export CSV</button>
        </header>

        <div className="transactions-table">
          <div className="table-head">
            <span>ID</span>
            <span>Type</span>
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
              transactions.map((txn) => (
                <div key={txn.id} className="transaction-row">
                  <span className="txn-id" title={txn.id}>
                    {txn.id.slice(0, 8)}...{txn.id.slice(-6)}
                  </span>
                  <span className={`txn-type ${txn.type}`}>{txn.type}</span>
                  <span className="txn-details">
                    <strong>{txn.label}</strong>
                    <small>{txn.description}</small>
                    <small>{new Date(txn.timestamp).toLocaleString()}</small>
                  </span>
                  <span className="txn-amount">
                    {txn.type === 'debit' ? '-' : '+'}
                    {txn.amount.toFixed(2)} {txn.currency}
                  </span>
                  <span className={`txn-status ${txn.status}`}>{txn.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default WalletPage;

