-- Database Migration: Add IPFS and Transaction Status Support
-- Run this script to update the notes table with new columns

-- Add ipfs_hash column
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ipfs_hash VARCHAR(255);

-- Add transaction_hash column  
ALTER TABLE notes ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(255);

-- Add status column with default value
ALTER TABLE notes ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'pending';

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);

-- Create index on transaction_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_notes_transaction_hash ON notes(transaction_hash);

-- Optional: Update existing notes to have 'confirmed' status if they don't have a transaction hash
UPDATE notes SET status = 'confirmed' WHERE transaction_hash IS NULL OR transaction_hash = '';

COMMENT ON COLUMN notes.ipfs_hash IS 'IPFS hash (CID) where note content is stored';
COMMENT ON COLUMN notes.transaction_hash IS 'Cardano blockchain transaction hash';
COMMENT ON COLUMN notes.status IS 'Transaction status: pending or confirmed';
