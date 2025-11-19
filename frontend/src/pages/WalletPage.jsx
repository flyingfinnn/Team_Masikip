import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/WalletPage.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function WalletPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/wallet/transactions`);
        setTransactions(response.data);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
    // Poll for new transactions every 5 seconds
    const interval = setInterval(fetchTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

  const { totalSpent, totalReceived, netBalance } = useMemo(() => {
    // For this demo, we'll simulate amounts based on action types since our backend doesn't store amounts yet
    return transactions.reduce(
      (totals, txn) => {
        let amount = 0;
        let type = 'credit';

        // Simulate amounts based on action
        switch (txn.actionType) {
          case 'CREATE_NOTE':
            amount = 5.00;
            type = 'debit'; // Cost to create
            break;
          case 'UPDATE_NOTE':
            amount = 1.50;
            type = 'debit'; // Cost to update
            break;
          case 'DELETE_NOTE':
            amount = 0.50;
            type = 'debit';
            break;
          case 'SET_PRIORITY':
            amount = 2.00;
            type = 'debit';
            break;
          default:
            amount = 0;
        }

        // Add some random incoming transactions for demo purposes if list is short
        // (This logic is just for display if we don't have enough real data)
        
        if (type === 'debit') {
          totals.totalSpent += amount;
        } else {
          totals.totalReceived += amount;
        }
        totals.netBalance = 1000 - totals.totalSpent; // Assume initial balance of 1000
        return totals;
      },
      { totalSpent: 0, totalReceived: 0, netBalance: 1000 }
    );
  }, [transactions]);

  return (
    <div className="wallet-page">
      <div className="wallet-page__header">
        <div>
          <p className="wallet-label">Active Wallet</p>
          <h1>Masikip Vault</h1>
          <p className="wallet-address">addr1qxy...8f4d</p>
        </div>
        <div className="wallet-net">
          <span>Net Balance</span>
          <strong>{netBalance.toFixed(2)} ADA</strong>
        </div>
      </div>

      <div className="wallet-metrics">
        <div className="metric-card">
          <span>Received</span>
          <p>1000.00 ADA</p>
          <small>Initial Funding</small>
        </div>
        <div className="metric-card warning">
          <span>Spent</span>
          <p>{totalSpent.toFixed(2)} ADA</p>
          <small>Network Fees & Storage</small>
        </div>
        <div className="metric-card outline">
          <span>Total Transactions</span>
          <p>{transactions.length}</p>
          <small>On-chain operations</small>
        </div>
      </div>

      <section className="wallet-transactions">
        <header>
          <div>
            <h2>Blockchain Ledger</h2>
            <p>Live feed from the Masikip Private Chain</p>
          </div>
          <button type="button">Export CSV</button>
        </header>

        <div className="transactions-table">
          <div className="table-head">
            <span>Block Hash</span>
            <span>Action</span>
            <span>Details</span>
            <span>Timestamp</span>
            <span>Status</span>
          </div>

          <div className="table-body">
            {loading ? (
              <div className="loading-row">Loading blockchain data...</div>
            ) : (
              transactions.map((txn) => (
                <div key={txn.transactionId} className="transaction-row">
                  <div className="txn-hash-col">
                    <span className="txn-hash" title={txn.blockHash}>
                      {txn.blockHash ? txn.blockHash.substring(0, 16) + '...' : 'Pending...'}
                    </span>
                    <small className="txn-prev-hash" title={txn.previousHash}>
                      Prev: {txn.previousHash ? txn.previousHash.substring(0, 12) + '...' : 'Genesis'}
                    </small>
                  </div>
                  <span className={`txn-type ${txn.actionType.toLowerCase()}`}>
                    {txn.actionType.replace('_', ' ')}
                  </span>
                  <span className="txn-details">
                    <strong>Note ID: {txn.noteId}</strong>
                    <small>{txn.metadata}</small>
                  </span>
                  <span className="txn-time">
                    {new Date(txn.timestamp).toLocaleString()}
                  </span>
                  <span className="txn-status confirmed">Confirmed</span>
                </div>
              ))
            )}
            {transactions.length === 0 && !loading && (
              <div className="empty-row">No transactions found on chain.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default WalletPage;

