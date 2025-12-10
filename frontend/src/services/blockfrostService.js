const BLOCKFROST_PROJECT_ID = import.meta.env.VITE_BLOCKFROST_PROJECT_ID
const BLOCKFROST_API_URL = import.meta.env.VITE_BLOCKFROST_API_URL

class BlockfrostService {
    /**
     * Check if transaction is confirmed on blockchain
     * @param {string} txHash - Transaction hash
     * @returns {Promise<string>} Status: 'confirmed', 'pending', or 'unknown'
     */
    async checkTransactionStatus(txHash) {
        try {
            const response = await fetch(`${BLOCKFROST_API_URL}/txs/${txHash}`, {
                headers: {
                    'project_id': BLOCKFROST_PROJECT_ID
                }
            })

            if (response.ok) {
                console.log(`✅ Transaction ${txHash.substring(0, 8)}... is CONFIRMED`)
                return 'confirmed'
            } else if (response.status === 404) {
                console.log(`⏳ Transaction ${txHash.substring(0, 8)}... is PENDING`)
                return 'pending'
            } else {
                console.warn(`❓ Transaction ${txHash.substring(0, 8)}... status UNKNOWN`)
                return 'unknown'
            }
        } catch (error) {
            console.error('Blockfrost API error:', error)
            return 'unknown'
        }
    }

    /**
     * Check multiple transactions at once
     * @param {Array<string>} txHashes - Array of transaction hashes
     * @returns {Promise<Array<{hash: string, status: string}>>}
     */
    async checkMultipleTransactions(txHashes) {
        const results = await Promise.all(
            txHashes.map(async (hash) => ({
                hash,
                status: await this.checkTransactionStatus(hash)
            }))
        )
        return results
    }
}

export default new BlockfrostService()
