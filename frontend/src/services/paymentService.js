import { Transaction } from '@meshsdk/core'

const PAYMENT_AMOUNTS = {
  CREATE: 0.176985, // 0.176985 ADA to create a note
  UPDATE: 0.176985, // 0.176985 ADA to update a note
  DELETE: 0.176985, // 0.176985 ADA to delete a note
}

const ADA_TO_LOVELACE = 1_000_000

class PaymentService {
  /**
   * Send a payment transaction for a note operation
   * @param {Object} wallet - The Mesh SDK wallet instance
   * @param {string} operation - 'CREATE', 'UPDATE', or 'DELETE'
   * @param {string} recipientAddress - Address to send payment to (your backend/service address)
   * @param {Object} metadata - Optional metadata object containing note information
   * @returns {Promise<string>} Transaction hash
   */
  async sendPayment(wallet, operation, recipientAddress, metadata = {}) {
    if (!wallet) {
      throw new Error('Wallet not connected')
    }

    const amountAda = PAYMENT_AMOUNTS[operation]
    if (!amountAda) {
      throw new Error(`Invalid operation: ${operation}`)
    }

    let amountLovelace = Math.floor(amountAda * ADA_TO_LOVELACE)

    try {
      // Validate recipient address
      if (!recipientAddress || recipientAddress.includes('...')) {
        throw new Error('Invalid recipient address. Please configure a valid service address.')
      }

      // Get wallet address to check if sending to self
      let walletAddress = null
      try {
        const walletAddresses = await wallet.getUsedAddresses()
        walletAddress = walletAddresses?.[0]
        
        // If sending to self, we need to handle it differently to avoid minimum UTXO issues
        if (walletAddress && recipientAddress === walletAddress) {
          console.warn('Sending payment to own address (testing mode)')
          
          // When sending to self with a small amount (like 0.5 ADA for DELETE), 
          // we need to ensure there's enough for fees without creating a dust UTXO
          // Minimum UTXO is typically 1 ADA, so for small amounts sent to self,
          // we need to adjust the amount to meet minimum UTXO requirements
          // The change output (what comes back to us) must be at least 1 ADA
          if (amountAda < 1.0) {
            // For small amounts sent to self, increase to at least 1 ADA to meet minimum UTXO
            // This ensures the change output meets the minimum UTXO requirement
            const minAmountLovelace = 1_000_000 // At least 1 ADA for minimum UTXO
            if (minAmountLovelace > amountLovelace) {
              console.log(`Adjusting payment amount from ${amountAda} ADA to ${minAmountLovelace / ADA_TO_LOVELACE} ADA to meet minimum UTXO requirements for self-payment`)
              amountLovelace = minAmountLovelace
            }
          }
        }
      } catch (addrError) {
        // If we can't get wallet address, continue anyway
        console.warn('Could not verify wallet address:', addrError)
      }

      // Use Mesh SDK Transaction builder
      const tx = new Transaction({ initiator: wallet })
      
      // Send ADA to recipient
      tx.sendLovelace(recipientAddress, amountLovelace.toString())
      
      // Attach metadata to transaction (label 674 is commonly used for custom metadata per CIP-20)
      if (metadata && Object.keys(metadata).length > 0) {
        const metadataPayload = {
          operation: operation, // CREATE, UPDATE, DELETE
          timestamp: new Date().toISOString(),
          ...metadata, // Include any additional metadata (noteId, contentBefore, contentAfter, etc.)
        }
        
        // Use Mesh SDK's metadataValue method with label 674 (standard for custom metadata)
        try {
          // Mesh SDK uses metadataValue(label, metadataObject) method
          if (typeof tx.metadataValue === 'function') {
            tx.metadataValue(674, metadataPayload)
            console.log('Metadata attached to transaction:', metadataPayload)
          } else {
            // Fallback: try alternative method names if available
            if (typeof tx.setMetadata === 'function') {
              tx.setMetadata(674, metadataPayload)
            } else if (typeof tx.setAuxiliaryData === 'function') {
              tx.setAuxiliaryData({ 674: metadataPayload })
            } else {
              console.warn('Metadata attachment method not found, transaction will proceed without metadata')
            }
          }
        } catch (metadataError) {
          // If metadata attachment fails, continue without it (metadata is optional)
          console.warn('Failed to attach metadata to transaction:', metadataError)
          // Don't throw - metadata is optional, transaction should still succeed
        }
      }
      
      // Build and sign the transaction
      const unsignedTx = await tx.build()
      const signedTx = await wallet.signTx(unsignedTx)
      const txHash = await wallet.submitTx(signedTx)

      console.log(`${operation} payment sent:`, {
        txHash,
        amount: amountAda,
        recipient: recipientAddress,
      })

      return txHash
    } catch (error) {
      console.error(`Failed to send ${operation} payment:`, error)
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
      
      // Extract more useful error message from various error formats
      let errorMessage = 'Payment transaction failed'
      
      // TxSendError from Mesh SDK might have different structure
      // Try to extract from various possible locations
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.error?.message) {
        errorMessage = error.error.message
      } else if (error?.info) {
        // Mesh SDK TxSendError might have info property
        if (typeof error.info === 'string') {
          errorMessage = error.info
        } else if (error.info?.message) {
          errorMessage = error.info.message
        } else if (error.info?.error) {
          errorMessage = error.info.error
        } else if (error.info?.cause) {
          errorMessage = error.info.cause
        }
      } else if (error?.cause) {
        if (typeof error.cause === 'string') {
          errorMessage = error.cause
        } else if (error.cause?.message) {
          errorMessage = error.cause.message
        }
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.toString) {
        const errorStr = error.toString()
        // Extract meaningful part from error string
        if (errorStr.includes('Error:')) {
          errorMessage = errorStr.split('Error:')[1]?.trim() || errorMessage
        } else if (errorStr.includes('TxSendError')) {
          // Try to extract details after TxSendError
          const match = errorStr.match(/TxSendError[:\s]+(.+)/i)
          if (match && match[1]) {
            errorMessage = match[1].trim()
          }
        } else {
          errorMessage = errorStr
        }
      }
      
      // Check for common error types and provide user-friendly messages
      const lowerMessage = errorMessage.toLowerCase()
      
      if (lowerMessage.includes('insufficient') || lowerMessage.includes('balance') || lowerMessage.includes('not enough')) {
        errorMessage = 'Insufficient balance for transaction (including fees). Please ensure you have enough ADA.'
      } else if (lowerMessage.includes('address') || lowerMessage.includes('invalid address') || lowerMessage.includes('serializing outputs')) {
        errorMessage = 'Invalid address format. Please check the service address configuration.'
      } else if (lowerMessage.includes('utxo') || lowerMessage.includes('select') || lowerMessage.includes('min ada') || lowerMessage.includes('outputtoosmall')) {
        // Check if this is a self-payment issue
        if (operation === 'DELETE' && isSelfPayment) {
          errorMessage = 'Transaction requires more ADA when sending to yourself. DELETE operations need at least 1 ADA for self-payments to meet minimum UTXO requirements.'
        } else {
          errorMessage = 'Unable to select UTXOs for transaction. Your wallet may need more ADA for fees and minimum UTXO requirements.'
        }
      } else if (lowerMessage.includes('rejected') || lowerMessage.includes('cancelled') || lowerMessage.includes('user')) {
        errorMessage = 'Transaction was rejected or cancelled by wallet'
      } else if (lowerMessage.includes('evaluate') || lowerMessage.includes('redeemer') || lowerMessage.includes('validation')) {
        errorMessage = 'Transaction validation failed. Please check your wallet and try again.'
      } else if (lowerMessage.includes('txsenderror') || lowerMessage.includes('send error') || lowerMessage.includes('babbageoutputtoosmall') || lowerMessage.includes('utxofailure')) {
        // Generic TxSendError - try to provide helpful message
        if (operation === 'DELETE') {
          if (isSelfPayment) {
            errorMessage = 'DELETE transaction failed: Output too small. When sending to yourself, DELETE operations need at least 1 ADA to meet minimum UTXO requirements (currently 0.5 ADA is too small).'
          } else {
            errorMessage = 'DELETE transaction failed. This may be due to insufficient balance for fees or minimum UTXO requirements. Try ensuring you have at least 1.5 ADA available.'
          }
        } else {
          errorMessage = 'Transaction failed. Please check your wallet balance and try again.'
        }
      }
      
      // If we still have a generic message, try to include original error details
      if (errorMessage === 'Payment transaction failed' && error?.message) {
        errorMessage = `Transaction failed: ${error.message}`
      } else if (errorMessage === 'Payment transaction failed') {
        // Last resort - show the operation type
        errorMessage = `${operation} transaction failed. Please check your wallet and try again.`
      }
      
      throw new Error(errorMessage)
    }
  }

  /**
   * Check if user has sufficient balance for an operation
   * @param {number} balanceAda - Current wallet balance in ADA
   * @param {string} operation - 'CREATE', 'UPDATE', or 'DELETE'
   * @returns {boolean}
   */
  hasSufficientBalance(balanceAda, operation) {
    if (!balanceAda || balanceAda <= 0) return false
    const requiredAmount = PAYMENT_AMOUNTS[operation]
    return balanceAda >= requiredAmount
  }

  /**
   * Get the required payment amount for an operation
   * @param {string} operation - 'CREATE', 'UPDATE', or 'DELETE'
   * @returns {number} Amount in ADA
   */
  getRequiredAmount(operation) {
    return PAYMENT_AMOUNTS[operation] || 0
  }

  /**
   * Get all payment amounts
   * @returns {Object} Payment amounts for each operation
   */
  getPaymentAmounts() {
    return { ...PAYMENT_AMOUNTS }
  }
}

export default new PaymentService()

