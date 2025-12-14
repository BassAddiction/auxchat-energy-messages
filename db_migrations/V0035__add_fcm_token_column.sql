-- Добавляем колонку для хранения FCM токена (для push-уведомлений)
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Индекс для быстрого поиска по токену
CREATE INDEX IF NOT EXISTS idx_users_fcm_token ON users(fcm_token);
