-- Fix existing timestamps: convert UTC+3 to UTC by subtracting 3 hours (RETRY)
-- This corrects timestamps that were written before DEFAULT was changed to UTC

UPDATE private_messages 
SET created_at = created_at - INTERVAL '3 hours'
WHERE created_at > '2025-12-01' AND created_at < '2025-12-15';

UPDATE messages 
SET created_at = created_at - INTERVAL '3 hours'
WHERE created_at > '2025-12-01' AND created_at < '2025-12-15';

UPDATE users 
SET last_activity = last_activity - INTERVAL '3 hours'
WHERE last_activity > '2025-12-01' AND last_activity < '2025-12-15';