-- Fix created_at default to use UTC in private_messages table
ALTER TABLE private_messages ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');