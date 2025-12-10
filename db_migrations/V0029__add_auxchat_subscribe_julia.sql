-- Добавляем подписку AuxChat на Julia для тестирования уведомлений
INSERT INTO subscriptions (subscriber_id, subscribed_to_id, created_at)
VALUES (7, 9, NOW())
ON CONFLICT DO NOTHING;