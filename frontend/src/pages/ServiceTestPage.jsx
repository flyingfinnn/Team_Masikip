import React, { useState } from 'react';
import ipfsService from '../services/ipfsService';
import blockfrostService from '../services/blockfrostService';
import './ServiceTestPage.css';

const ServiceTestPage = (props) => {
    const [ipfsContent, setIpfsContent] = useState('');
    const [ipfsHash, setIpfsHash] = useState('');
    const [retrievedContent, setRetrievedContent] = useState('');
    const [txHash, setTxHash] = useState('');
    const [txStatus, setTxStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Test IPFS Upload
    const handleIPFSUpload = async () => {
        if (!ipfsContent.trim()) {
            setError('Please enter content to upload');
            return;
        }

        setLoading(true);
        setError('');
        try {
            console.log('Uploading to IPFS:', ipfsContent);
            const hash = await ipfsService.uploadToIPFS(ipfsContent);
            setIpfsHash(hash);
            console.log('✅ Upload successful! Hash:', hash);
        } catch (err) {
            console.error('❌ Upload failed:', err);
            setError(`Upload failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Test IPFS Retrieval
    const handleIPFSRetrieve = async () => {
        if (!ipfsHash.trim()) {
            setError('Please enter an IPFS hash to retrieve');
            return;
        }

        setLoading(true);
        setError('');
        try {
            console.log('Retrieving from IPFS:', ipfsHash);
            const content = await ipfsService.retrieveFromIPFS(ipfsHash);
            setRetrievedContent(content);
            console.log('✅ Retrieval successful! Content:', content);
        } catch (err) {
            console.error('❌ Retrieval failed:', err);
            setError(`Retrieval failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Test Transaction Status Check
    const handleCheckTxStatus = async () => {
        if (!txHash.trim()) {
            setError('Please enter a transaction hash');
            return;
        }

        setLoading(true);
        setError('');
        try {
            console.log('Checking transaction status:', txHash);
            const status = await blockfrostService.checkTransactionStatus(txHash);
            setTxStatus(status);
            console.log('✅ Status check successful! Status:', status);
        } catch (err) {
            console.error('❌ Status check failed:', err);
            setError(`Status check failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Blockchain Restoration
    const [restoreStatus, setRestoreStatus] = useState('');
    const [restoredCount, setRestoredCount] = useState(0);

    const handleSyncFromBlockchain = async () => {
        const walletAddress = props.walletState?.address;
        if (!walletAddress) {
            setError('Please connect a wallet first');
            return;
        }

        setLoading(true);
        setError('');
        setRestoreStatus('Starting sync...');

        try {
            // Handle API URL construction robustly
            let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
            // Remove trailing slash if present
            baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            // Remove trailing /api if present to avoid duplication, or just ensure we don't duplicate
            // If baseUrl ends with /api, we should not append /api/restore, just /restore
            const endpoint = baseUrl.endsWith('/api')
                ? `${baseUrl}/restore`
                : `${baseUrl}/api/restore`;

            console.log('Syncing from blockchain for:', walletAddress);
            console.log('Using endpoint:', endpoint);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ walletAddress }),
            });

            const data = await response.json();

            if (response.ok) {
                setRestoreStatus('Sync Complete');
                setRestoredCount(data.restoredCount || 0);
                console.log('✅ Restoration successful:', data);
            } else {
                throw new Error(data.error || 'Restoration failed');
            }
        } catch (err) {
            console.error('❌ Restoration failed:', err);
            setError(`Restoration failed: ${err.message}`);
            setRestoreStatus('Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="service-test-page">
            <h1>🧪 Service Testing Dashboard</h1>
            <p className="subtitle">Test IPFS and Blockfrost services</p>

            {/* Blockchain Restoration */}
            <section className="test-section">
                <h2>♻️ Blockchain Restoration (Source of Truth)</h2>
                <div className="test-controls">
                    <p>Simulate a "Fresh Install" by restoring notes from the blockchain history.</p>
                    <div className="config-item" style={{ marginBottom: '1rem' }}>
                        <strong>Connected Wallet:</strong>
                        <code>{props.walletState?.address || 'Not Connected'}</code>
                    </div>

                    <button
                        onClick={handleSyncFromBlockchain}
                        disabled={loading || !props.walletState?.address}
                        className="btn-primary"
                        style={{ background: '#35c695' }}
                    >
                        {loading ? '⏳ Syncing...' : '🔄 Sync from Chain'}
                    </button>

                    {restoreStatus && (
                        <div className="result-box">
                            <strong>Status:</strong> {restoreStatus} <br />
                            <strong>Restored Notes:</strong> {restoredCount}
                        </div>
                    )}
                </div>
            </section>

            {error && (
                <div className="error-banner">
                    ⚠️ {error}
                </div>
            )}

            {/* IPFS Upload Test */}
            <section className="test-section">
                <h2>📤 IPFS Upload Test</h2>
                <div className="test-controls">
                    <textarea
                        placeholder="Enter content to upload to IPFS..."
                        value={ipfsContent}
                        onChange={(e) => setIpfsContent(e.target.value)}
                        rows={4}
                    />
                    <button
                        onClick={handleIPFSUpload}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? '⏳ Uploading...' : '📤 Upload to IPFS'}
                    </button>
                    {ipfsHash && (
                        <div className="result-box">
                            <strong>✅ IPFS Hash:</strong>
                            <code>{ipfsHash}</code>
                            <button
                                onClick={() => navigator.clipboard.writeText(ipfsHash)}
                                className="btn-copy"
                            >
                                📋 Copy
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* IPFS Retrieval Test */}
            <section className="test-section">
                <h2>📥 IPFS Retrieval Test</h2>
                <div className="test-controls">
                    <input
                        type="text"
                        placeholder="Enter IPFS hash (e.g., QmXyz123...)"
                        value={ipfsHash}
                        onChange={(e) => setIpfsHash(e.target.value)}
                    />
                    <button
                        onClick={handleIPFSRetrieve}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? '⏳ Retrieving...' : '📥 Retrieve from IPFS'}
                    </button>
                    {retrievedContent && (
                        <div className="result-box">
                            <strong>✅ Retrieved Content:</strong>
                            <pre>{retrievedContent}</pre>
                        </div>
                    )}
                </div>
            </section>

            {/* Transaction Status Test */}
            <section className="test-section">
                <h2>🔍 Transaction Status Test</h2>
                <div className="test-controls">
                    <input
                        type="text"
                        placeholder="Enter transaction hash..."
                        value={txHash}
                        onChange={(e) => setTxHash(e.target.value)}
                    />
                    <button
                        onClick={handleCheckTxStatus}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? '⏳ Checking...' : '🔍 Check Status'}
                    </button>
                    {txStatus && (
                        <div className="result-box">
                            <strong>✅ Transaction Status:</strong>
                            <span className={`status-badge status-${txStatus}`}>
                                {txStatus.toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>
            </section>

            {/* Quick Test Examples */}
            <section className="test-section examples">
                <h2>💡 Quick Test Examples</h2>
                <div className="example-grid">
                    <div className="example-card">
                        <h3>Test IPFS Upload</h3>
                        <ol>
                            <li>Enter some text in the upload box</li>
                            <li>Click "Upload to IPFS"</li>
                            <li>Copy the returned hash</li>
                            <li>Use it in the retrieval test</li>
                        </ol>
                    </div>
                    <div className="example-card">
                        <h3>Test Transaction Status</h3>
                        <ol>
                            <li>Create a note in the app</li>
                            <li>Copy the transaction hash</li>
                            <li>Paste it in the status check</li>
                            <li>See if it's confirmed or pending</li>
                        </ol>
                    </div>
                </div>
            </section>

            {/* Environment Check */}
            <section className="test-section">
                <h2>⚙️ Environment Configuration</h2>
                <div className="config-check">
                    <div className="config-item">
                        <span className={import.meta.env.VITE_BLOCKFROST_IPFS_KEY ? '✅' : '❌'}>
                            {import.meta.env.VITE_BLOCKFROST_IPFS_KEY ? '✅' : '❌'}
                        </span>
                        <strong>IPFS Key:</strong>
                        <code>{import.meta.env.VITE_BLOCKFROST_IPFS_KEY ? '***configured***' : 'NOT SET'}</code>
                    </div>
                    <div className="config-item">
                        <span className={import.meta.env.VITE_BLOCKFROST_PROJECT_ID ? '✅' : '❌'}>
                            {import.meta.env.VITE_BLOCKFROST_PROJECT_ID ? '✅' : '❌'}
                        </span>
                        <strong>Project ID:</strong>
                        <code>{import.meta.env.VITE_BLOCKFROST_PROJECT_ID ? '***configured***' : 'NOT SET'}</code>
                    </div>
                    <div className="config-item">
                        <span className={import.meta.env.VITE_IPFS_GATEWAY ? '✅' : '❌'}>
                            {import.meta.env.VITE_IPFS_GATEWAY ? '✅' : '❌'}
                        </span>
                        <strong>IPFS Gateway:</strong>
                        <code>{import.meta.env.VITE_IPFS_GATEWAY || 'NOT SET'}</code>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ServiceTestPage;
