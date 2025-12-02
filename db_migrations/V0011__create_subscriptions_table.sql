-- Таблица подписок пользователей
CREATE TABLE IF NOT EXISTS t_p53416936_auxchat_energy_messa.subscriptions (
  id SERIAL PRIMARY KEY,
  subscriber_id INTEGER NOT NULL,
  subscribed_to_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subscriber_id, subscribed_to_id),
  CHECK (subscriber_id != subscribed_to_id)
);

CREATE INDEX idx_subscriptions_subscriber ON t_p53416936_auxchat_energy_messa.subscriptions(subscriber_id);
CREATE INDEX idx_subscriptions_subscribed_to ON t_p53416936_auxchat_energy_messa.subscriptions(subscribed_to_id);