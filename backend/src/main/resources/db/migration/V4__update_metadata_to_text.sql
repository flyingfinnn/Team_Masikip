-- Update metadata column in note_transactions to TEXT type to support long content
ALTER TABLE note_transactions ALTER COLUMN metadata TYPE TEXT;


