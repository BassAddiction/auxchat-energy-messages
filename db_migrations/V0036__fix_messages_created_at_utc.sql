-- Fix created_at default to use UTC in messages table
ALTER TABLE messages ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC');