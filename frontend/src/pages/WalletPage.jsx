import { useMemo } from 'react';
import '../styles/WalletPage.css';

const mockTransactions = [
  {
    id: 'txn-1',
    type: 'credit',
    label: 'Note Publish Reward',
    description: 'Reward for publishing note #452',
    amount: 24.83,
    currency: 'ADA',
    timestamp: '2025-09-19T09:24:00Z',
    status: 'confirmed',
  },
  {
    id: 'txn-2',
    type: 'debit',
    label: 'Storage Fee',
    description: 'Monthly IPFS storage settlement',
    amount: 6.15,
    currency: 'ADA',
    timestamp: '2025-09-18T13:11:00Z',
    status: 'confirmed',
  },
  {
    id: 'txn-3',
    type: 'credit',
    label: 'Collaboration Tip',
    description: 'Tip received from @masikip-core',
    amount: 12.5,
    currency: 'ADA',
    timestamp: '2025-09-17T21:02:00Z',
    status: 'pending',
  },
  {
    id: 'txn-4',
    type: 'debit',
    label: 'Priority Compute',
    description: 'GPU burst for AI summarizer',
    amount: 3.85,
    currency: 'ADA',
    timestamp: '2025-09-17T08:44:00Z',
    status: 'confirmed',
  },
];

function WalletPage() {
  const { totalSpent, totalReceived, netBalance } = useMemo(() => {
    return mockTransactions.reduce(
      (totals, txn) => {
        if (txn.type === 'debit') {
          totals.totalSpent += txn.amount;
        } else {
          totals.totalReceived += txn.amount;
        }
        totals.netBalance = totals.totalReceived - totals.totalSpent;
        return totals;
      },
      { totalSpent: 0, totalReceived: 0, netBalance: 0 },
    );
  }, []);

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
          <p>{totalReceived.toFixed(2)} ADA</p>
          <small>Across {mockTransactions.filter((t) => t.type === 'credit').length} inflows</small>
        </div>
        <div className="metric-card warning">
          <span>Spent</span>
          <p>{totalSpent.toFixed(2)} ADA</p>
          <small>Auto-synced from network fees</small>
        </div>
        <div className="metric-card outline">
          <span>Pending</span>
          <p>
            {mockTransactions
              .filter((txn) => txn.status === 'pending')
              .reduce((sum, txn) => sum + txn.amount, 0)
              .toFixed(2)}{' '}
            ADA
          </p>
          <small>Awaiting 2 confirmations</small>
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
            {mockTransactions.map((txn) => (
              <div key={txn.id} className="transaction-row">
                <span className="txn-id">{txn.id}</span>
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default WalletPage;

