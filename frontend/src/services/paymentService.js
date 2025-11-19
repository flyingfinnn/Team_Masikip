import { Transaction } from '@meshsdk/core'

const PAYMENT_AMOUNTS = {
  CREATE: 2.0, // 2 ADA to create a note
  UPDATE: 1.0, // 1 ADA to update a note
  DELETE: 0.5, // 0.5 ADA to delete a note
}

const ADA_TO_LOVELACE = 1_000_000

class PaymentService {
  /**
   * Send a payment transaction for a note operation
   * @param {Object} wallet - The Mesh SDK wallet instance
   * @param {string} operation - 'CREATE', 'UPDATE', or 'DELETE'
   * @param {string} recipientAddress - Address to send payment to (your backend/service address)
   * @returns {Promise<string>} Transaction hash
   */
  async sendPayment(wallet, operation, recipientAddress) {
    if (!wallet) {
      throw new Error('Wallet not connected')
    }

    const amountAda = PAYMENT_AMOUNTS[operation]
    if (!amountAda) {
      throw new Error(`Invalid operation: ${operation}`)
    }

    const amountLovelace = Math.floor(amountAda * ADA_TO_LOVELACE)

    try {
      // Use Mesh SDK Transaction builder
      const tx = new Transaction({ initiator: wallet })
      
      // Send ADA to recipient
      tx.sendLovelace(recipientAddress, amountLovelace.toString())
      
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
      throw new Error(`Payment failed: ${error.message}`)
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

