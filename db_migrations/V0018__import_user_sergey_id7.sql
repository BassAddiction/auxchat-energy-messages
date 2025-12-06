-- Импорт пользователя Сергей (ID=7) из poehali.dev
INSERT INTO users (id, telegram_id, username, phone, password_hash, energy, is_admin, is_banned, last_activity, created_at) VALUES
(7, NULL, 'Сергей', '+7 (922) 131-63-34', '$2b$10$JVHmV5vZ8qF.xKqHGLYvF8uZwGQu1NqF8qF8qF8qF8qF8qF8qF8', 9810, true, false, '2025-12-04 20:25:57', '2025-11-29 16:46:48')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  phone = EXCLUDED.phone,
  energy = EXCLUDED.energy,
  is_admin = EXCLUDED.is_admin,
  is_banned = EXCLUDED.is_banned,
  last_activity = EXCLUDED.last_activity;