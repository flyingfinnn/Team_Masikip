const IPFS_API_KEY = import.meta.env.VITE_BLOCKFROST_IPFS_KEY
const IPFS_API_BASE = 'https://ipfs.blockfrost.io/api/v0'

class IPFSService {
    /**
     * Upload content to IPFS via Blockfrost
     * @param {string} content - The note content
     * @returns {Promise<string>} IPFS hash (CID)
     */
    async uploadToIPFS(content) {
        try {
            console.log('📤 Uploading to IPFS...')

            const formData = new FormData()
            const blob = new Blob([content], { type: 'text/plain' })
            formData.append('file', blob)

            const response = await fetch(`${IPFS_API_BASE}/ipfs/add`, {
                method: 'POST',
                headers: {
                    'project_id': IPFS_API_KEY
                },
                body: formData
            })

            if (!response.ok) {
                const error = await response.text()
                console.error('❌ IPFS upload failed:', error)
                throw new Error(`IPFS upload failed: ${response.status} - ${error}`)
            }

            const data = await response.json()
            console.log('✅ Uploaded to IPFS:', data.ipfs_hash)
            return data.ipfs_hash

        } catch (error) {
            console.error('❌ IPFS upload error:', error)
            throw error
        }
    }

    /**
     * Retrieve content from IPFS via Blockfrost
     * @param {string} ipfsHash - The IPFS hash (CID)
     * @returns {Promise<string>} The content
     */
    async retrieveFromIPFS(ipfsHash) {
        try {
            console.log('📥 Retrieving from IPFS:', ipfsHash)

            // Use Blockfrost's IPFS gateway API endpoint which supports CORS
            const response = await fetch(`${IPFS_API_BASE}/ipfs/gateway/${ipfsHash}`, {
                method: 'GET',
                headers: {
                    'project_id': IPFS_API_KEY
                }
            })

            if (!response.ok) {
                const error = await response.text()
                console.error('❌ IPFS retrieval failed:', error)
                throw new Error(`IPFS retrieval failed: ${response.status} - ${error}`)
            }

            const content = await response.text()
            console.log('✅ Retrieved from IPFS:', content.substring(0, 50) + '...')
            return content

        } catch (error) {
            console.error('❌ IPFS retrieval error:', error)
            throw error
        }
    }

    /**
     * Pin content to IPFS (optional, for persistence)
     * @param {string} ipfsHash - The IPFS hash to pin
     * @returns {Promise<boolean>} Success status
     */
    async pinToIPFS(ipfsHash) {
        try {
            console.log('📌 Pinning to IPFS:', ipfsHash)

            const response = await fetch(`${IPFS_API_BASE}/ipfs/pin/add/${ipfsHash}`, {
                method: 'POST',
                headers: {
                    'project_id': IPFS_API_KEY
                }
            })

            if (!response.ok) {
                const error = await response.text()
                console.warn('⚠️ IPFS pinning failed:', error)
                return false
            }

            console.log('✅ Pinned to IPFS')
            return true

        } catch (error) {
            console.warn('⚠️ IPFS pinning error:', error)
            return false
        }
    }
}

export default new IPFSService()
