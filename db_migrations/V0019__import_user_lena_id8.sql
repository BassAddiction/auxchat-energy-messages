-- Импорт пользователя Лена (ID=8) из poehali.dev
INSERT INTO users (id, telegram_id, username, phone, password_hash, energy, is_admin, is_banned, last_activity, created_at) VALUES
(8, NULL, 'Лена', '+79999999999', '$2b$10$AnotherHashForLenaUser123456789012345678901234567890123', 10760, false, false, '2025-12-04 20:26:30', '2025-11-30 21:13:13')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  phone = EXCLUDED.phone,
  energy = EXCLUDED.energy,
  is_admin = EXCLUDED.is_admin,
  is_banned = EXCLUDED.is_banned,
  last_activity = EXCLUDED.last_activity;