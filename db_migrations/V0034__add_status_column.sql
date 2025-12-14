-- Add status column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '';