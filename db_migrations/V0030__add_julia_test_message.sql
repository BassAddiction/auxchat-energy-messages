-- Добавляем тестовое сообщение от Julia в главный чат
INSERT INTO messages (user_id, text, created_at)
VALUES (9, 'Привет тест1', NOW());