-- Fix for existing notes: Make status column nullable and set defaults
-- Run this script manually in your PostgreSQL database

-- First, update all existing notes to have a default status
UPDATE notes SET status = 'confirmed' WHERE status IS NULL;

-- Then alter the column to remove NOT NULL constraint
ALTER TABLE notes ALTER COLUMN status DROP NOT NULL;

-- Verify the changes
SELECT note_id, title, status, ipfs_hash, transaction_hash 
FROM notes 
LIMIT 5;
