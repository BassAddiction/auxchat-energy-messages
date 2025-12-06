-- Импорт подписок из poehali.dev
INSERT INTO subscriptions (id, subscriber_id, subscribed_to_id, created_at) VALUES
(2, 7, 8, '2025-12-02T16:09:34.505637'),
(3, 8, 7, '2025-12-02T16:51:27.994132')
ON CONFLICT (id) DO NOTHING;