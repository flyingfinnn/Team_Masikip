import React, { useState } from 'react';
import ipfsService from '../services/ipfsService';
import blockfrostService from '../services/blockfrostService';
import './ServiceTestPage.css';

const ServiceTestPage = () => {
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

    return (
        <div className="service-test-page">
            <h1>🧪 Service Testing Dashboard</h1>
            <p className="subtitle">Test IPFS and Blockfrost services</p>

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
