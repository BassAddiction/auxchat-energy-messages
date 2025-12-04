-- =====================================================
-- ПОЛНЫЙ ЭКСПОРТ БАЗЫ ДАННЫХ AUXCHAT
-- Сгенерировано: 2025-12-04
-- Назначение: Импорт в Timeweb PostgreSQL
-- =====================================================

-- Установка кодировки
SET client_encoding = 'UTF8';

-- =====================================================
-- СОЗДАНИЕ ТАБЛИЦ
-- =====================================================

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT,
    username VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    avatar_url TEXT,
    energy INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_banned BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    bio TEXT,
    status VARCHAR(50) DEFAULT 'online',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица сообщений в общем чате
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    voice_url TEXT,
    voice_duration INTEGER
);

-- Таблица личных сообщений
CREATE TABLE IF NOT EXISTS private_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    voice_url TEXT,
    voice_duration INTEGER
);

-- Таблица фотографий пользователей
CREATE TABLE IF NOT EXISTS user_photos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    display_order INTEGER DEFAULT 0
);

-- Таблица подписок
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    subscriber_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscribed_to_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subscriber_id, subscribed_to_id),
    CHECK (subscriber_id != subscribed_to_id)
);

-- Таблица SMS-кодов
CREATE TABLE IF NOT EXISTS sms_codes (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE
);

-- Таблица черного списка
CREATE TABLE IF NOT EXISTS blacklist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, blocked_user_id)
);

-- Таблица реакций на сообщения
CREATE TABLE IF NOT EXISTS reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

-- Таблица реакций на сообщения (альтернативная)
CREATE TABLE IF NOT EXISTS message_reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- СОЗДАНИЕ ИНДЕКСОВ
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_receiver ON private_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_conversation ON private_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_user_photos_user_id ON user_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber ON subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscribed_to ON subscriptions(subscribed_to_id);
CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_codes(phone);
CREATE INDEX IF NOT EXISTS idx_sms_codes_expires_at ON sms_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_blacklist_user_id ON blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_blocked_user_id ON blacklist(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON reactions(message_id);

-- =====================================================
-- ВСТАВКА ДАННЫХ
-- =====================================================

-- ПОЛЬЗОВАТЕЛИ (2 строки)
INSERT INTO users (id, telegram_id, username, phone, avatar_url, energy, created_at, updated_at, is_banned, password_hash, is_admin, bio, status, last_activity) VALUES
(7, NULL, 'AuxChat', '+79221316334', NULL, 900, '2025-11-30 13:11:43.580231', '2025-11-30 13:11:43.580231', FALSE, '474c621afa5cee313834ea20ec966db7325af549e60684a22d7b92972d58af77', FALSE, NULL, 'online', '2025-12-03 19:36:03.264059');

-- Примечание: avatar_url пользователя id=8 содержит большой base64 изображения (~974287 символов)
-- Для корректного импорта используйте один из методов:
-- 1. Импортируйте через psql с увеличенным буфером
-- 2. Или загрузите аватар отдельно после импорта
-- 3. Или используйте COPY FROM для больших полей

-- Вставка пользователя с большим avatar_url (Лена)
-- ВАЖНО: Эта строка содержит ~974KB данных изображения в base64
-- Если возникнут проблемы, закомментируйте эту строку и добавьте аватар позже
INSERT INTO users (id, telegram_id, username, phone, avatar_url, energy, created_at, updated_at, is_banned, password_hash, is_admin, bio, status, last_activity) VALUES
(8, NULL, 'Лена', '+79999999999', 'data:image/jpeg;base64,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

[... 974287 symbols truncated]...', 900, '2025-11-30 21:12:58.453076', '2025-11-30 21:12:58.453076', FALSE, 'c2429058fcd3d65aa1d94dc42f8e6e6766e607ea9d1a28a32ce8e9dda3ad8bc5', FALSE, NULL, 'online', '2025-12-02 18:17:18.039871');

-- =====================================================
-- СООБЩЕНИЯ В ОБЩЕМ ЧАТЕ (88 строк)
-- =====================================================

INSERT INTO messages (id, user_id, text, created_at, voice_url, voice_duration) VALUES
(9, 7, 'эй привет пацики на моциках!!!', '2025-11-30 13:17:56.586002', NULL, NULL),
(10, 7, 'Всем доброго вечера', '2025-11-30 13:46:22.115458', NULL, NULL),
(11, 7, 'Эй', '2025-11-30 14:45:31.490686', NULL, NULL),
(12, 7, 'Есть кто?', '2025-11-30 14:49:41.060492', NULL, NULL),
(13, 7, 'Есть кто из ЕКБ дружба общение', '2025-11-30 14:51:06.185540', NULL, NULL),
(14, 7, 'Есть красивые девушки которые не ведут плохой образ жизни?', '2025-11-30 14:54:25.423837', NULL, NULL),
(15, 7, 'Я из екб пообщаемся', '2025-11-30 14:58:12.126456', NULL, NULL),
(16, 7, 'Ок', '2025-11-30 14:58:32.179327', NULL, NULL),
(17, 7, 'Тук тук тук', '2025-11-30 15:44:44.887965', NULL, NULL),
(18, 7, 'Эй додики', '2025-11-30 15:44:57.112178', NULL, NULL),
(19, 7, 'Ауууу', '2025-11-30 15:45:02.846159', NULL, NULL),
(20, 7, 'суки', '2025-11-30 15:55:07.524539', NULL, NULL),
(21, 7, 'сука', '2025-11-30 16:01:49.718175', NULL, NULL),
(22, 7, 'блядь', '2025-11-30 16:02:43.756009', NULL, NULL),
(23, 7, 'Эй', '2025-11-30 16:24:12.440694', NULL, NULL),
(24, 7, 'Скачать сто так', '2025-11-30 16:26:56.904282', NULL, NULL),
(25, 7, 'Скачать тебя в зад', '2025-11-30 16:31:41.178498', NULL, NULL),
(26, 7, 'ппп', '2025-11-30 17:10:25.358263', NULL, NULL),
(27, 7, 'ррр', '2025-11-30 17:10:34.190307', NULL, NULL),
(28, 7, 'нехуя', '2025-11-30 17:12:49.291256', NULL, NULL),
(29, 7, 'эй', '2025-11-30 17:17:38.417639', NULL, NULL),
(30, 7, 'эй', '2025-11-30 17:17:48.248932', NULL, NULL),
(31, 7, 'блядь', '2025-11-30 17:18:20.692931', NULL, NULL),
(32, 7, 'сука когда ты', '2025-11-30 17:22:53.680384', NULL, NULL),
(33, 7, 'что то не так', '2025-11-30 17:23:27.624236', NULL, NULL),
(34, 7, 'проверка связи', '2025-11-30 17:31:31.282056', NULL, NULL),
(35, 7, 'эй', '2025-11-30 17:34:21.104152', NULL, NULL),
(36, 7, 'сучка ебама', '2025-11-30 17:35:23.280729', NULL, NULL),
(37, 7, 'сука я тебя', '2025-11-30 17:39:30.577113', NULL, NULL),
(38, 7, 'эй', '2025-11-30 17:44:37.190711', NULL, NULL),
(39, 7, 'Тест смотри сообщение', '2025-11-30 17:45:38.082809', NULL, NULL),
(40, 7, 'часовой пояс', '2025-11-30 18:04:47.415475', NULL, NULL),
(41, 7, 'оооо', '2025-11-30 18:09:12.895085', NULL, NULL),
(42, 7, 'и не хуя время не поменялось', '2025-11-30 18:09:54.442805', NULL, NULL),
(43, 7, 'бля ты издеваешся время сделай', '2025-11-30 18:11:54.352317', NULL, NULL),
(44, 7, 'yte;tkb', '2025-11-30 18:16:29.527555', NULL, NULL),
(45, 7, 'проверка звука', '2025-11-30 18:20:40.395220', NULL, NULL),
(46, 7, 'ттт', '2025-11-30 18:23:16.549966', NULL, NULL),
(47, 7, 'ррр', '2025-11-30 18:23:32.673979', NULL, NULL),
(48, 7, 'орррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррррр', '2025-11-30 18:29:55.712676', NULL, NULL),
(49, 7, '«Hello, world!» — программа, результатом работы которой является вывод на экран или иное устройство фразы «Hello, world!» (в дословном переводе с английского — «Здравствуй, мир!»; представляет собой распространённое неформальное приветствие, близкое к русскому «всем привет!»). Также используются вариации с другой пунктуацией или регистром — например, «Hello World». Обычно это первый пример программы в учебниках по программированию, и для многих студентов такая программа является первым опытом при изучении нового языка.   Пример «Hello world» с графическим интерфейсом на GTK+. На заднем плане gedit с исходным кодом на Perl Такая постановка задачи обращает внимание учащегося сразу на несколько ключевых моментов языка программирования, главным из которых является базовая структура программы.  Хотя небольшие проверочные примеры использовались с тех самых пор, как появились компьютеры, традиция использования фразы «Hello, world!» в качестве тестового сообщения была введена в книге «Язык программирования Си» Брайана Кернигана и Денниса Ритчи, опубликованной в 1978 году.  В среде программирования микроконтроллеров при отсутствии дисплея простейшей программой «Hello, world» является программа «blink», реализующая мигание светодиода на одном из выходов микроконтроллера. Цель такой программы является успешная компиляция программы (', '2025-11-30 18:31:16.643785', NULL, NULL),
(50, 7, '«Hello, world!» — программа, результатом работы которой является вывод на экран или иное устройство фразы «Hello, world!» (в дословном перев', '2025-11-30 18:33:54.570380', NULL, NULL),
(51, 7, '«Hello, world!» — программа, результатом работы которой является вывод на экран или иное устройство фразы «Hello, world!» (в дословном пер', '2025-11-30 18:34:26.260803', NULL, NULL),
(52, 7, 'эй', '2025-11-30 18:35:08.665857', NULL, NULL),
(53, 7, 'бля', '2025-11-30 18:37:05.849059', NULL, NULL),
(54, 7, 'ддд', '2025-11-30 18:37:19.759927', NULL, NULL),
(55, 7, 'ппппп', '2025-11-30 18:37:39.658017', NULL, NULL),
(56, 7, 'ррр', '2025-11-30 18:37:55.089051', NULL, NULL),
(57, 7, 'Всем привет я создатель AuxChat общаемся ищем новые знакомства или просто так проводим время все это не важно будь с нами будь собой и мы', '2025-11-30 18:46:39.731775', NULL, NULL),
(58, 7, 'Лайк', '2025-11-30 18:55:38.587268', NULL, NULL),
(59, 7, 'Шлюха', '2025-11-30 18:58:46.489227', NULL, NULL),
(60, 7, 'Ауру шлюшка', '2025-11-30 18:59:22.992758', NULL, NULL),
(61, 7, 'Дырка', '2025-11-30 18:59:54.194110', NULL, NULL),
(62, 7, 'Блядь', '2025-11-30 19:00:25.524358', NULL, NULL),
(63, 7, 'Сучка', '2025-11-30 20:13:06.921196', NULL, NULL),
(64, 7, 'Питушка', '2025-11-30 20:13:24.222236', NULL, NULL),
(65, 7, 'Спокойной ночи всем 😀', '2025-11-30 20:28:19.346719', NULL, NULL),
(66, 7, 'Не скучай😘', '2025-11-30 20:29:01.830530', NULL, NULL),
(67, 7, 'Суки спать быстро', '2025-11-30 20:34:21.314302', NULL, NULL),
(68, 8, 'Всем приветик', '2025-11-30 21:14:15.424562', NULL, NULL),
(69, 8, 'Эй', '2025-11-30 21:24:24.997752', NULL, NULL),
(70, 7, 'бля', '2025-11-30 21:24:41.758895', NULL, NULL),
(71, 7, 'Блядь', '2025-11-30 21:43:11.543653', NULL, NULL),
(72, 8, 'ой', '2025-11-30 21:50:48.343997', NULL, NULL),
(73, 8, 'ор', '2025-11-30 22:09:33.043605', NULL, NULL),
(74, 7, 'ввв', '2025-11-30 22:54:14.231506', NULL, NULL),
(75, 7, 'Эй бубль', '2025-12-01 12:48:59.401382', NULL, NULL),
(76, 7, 'Привет', '2025-12-01 13:08:42.040708', NULL, NULL),
(77, 7, 'Привет', '2025-12-01 13:21:44.436178', NULL, NULL),
(78, 7, 'Сучки', '2025-12-01 13:22:36.204698', NULL, NULL),
(79, 8, 'привет пообщаемся что ты на тишине', '2025-12-01 13:22:55.829091', NULL, NULL),
(80, 8, 'так', '2025-12-01 13:23:05.768451', NULL, NULL),
(81, 7, 'Привет Лена все норм', '2025-12-01 13:24:14.082839', NULL, NULL),
(82, 7, 'С меня пошла работа', '2025-12-01 13:24:58.056773', NULL, NULL),
(83, 7, 'Щас сложно будет общаться', '2025-12-01 13:25:44.717078', NULL, NULL),
(84, 7, 'Привет', '2025-12-01 14:55:38.226780', NULL, NULL),
(85, 8, 'Всем привет', '2025-12-02 16:57:33.037653', NULL, NULL),
(86, 7, 'Привет всем 👋', '2025-12-02 16:59:04.458976', NULL, NULL),
(87, 7, 'Эй', '2025-12-02 17:21:45.313683', NULL, NULL),
(88, 7, 'привет', '2025-12-03 19:36:03.264059', NULL, NULL),
(89, 7, 'ххх', '2025-12-03 19:36:24.324046', NULL, NULL),
(90, 7, 'Вечерни чай', '2025-12-03 19:36:52.486169', NULL, NULL),
(91, 7, 'Ййй', '2025-12-03 19:37:11.176717', NULL, NULL),
(92, 7, 'ллл', '2025-12-03 19:37:20.856833', NULL, NULL),
(93, 7, 'ззз', '2025-12-03 19:37:28.761621', NULL, NULL),
(94, 7, 'ввв', '2025-12-03 19:37:37.152637', NULL, NULL),
(95, 7, 'ччч', '2025-12-03 19:37:44.569655', NULL, NULL),
(96, 7, 'ггг', '2025-12-03 19:37:53.048751', NULL, NULL);

-- =====================================================
-- ЛИЧНЫЕ СООБЩЕНИЯ (71 строка)
-- =====================================================

INSERT INTO private_messages (id, sender_id, receiver_id, text, is_read, created_at, voice_url, voice_duration) VALUES
(8, 8, 7, 'Привет', TRUE, '2025-11-30 21:15:19.474835', NULL, NULL),
(9, 7, 8, 'Привет', TRUE, '2025-11-30 21:16:21.528343', NULL, NULL),
(10, 7, 8, 'как дела', TRUE, '2025-11-30 21:22:32.230801', NULL, NULL),
(11, 8, 7, 'Норм', TRUE, '2025-11-30 21:23:47.415512', NULL, NULL),
(12, 7, 8, 'эй', TRUE, '2025-11-30 21:23:56.999736', NULL, NULL),
(13, 7, 8, 'какты', TRUE, '2025-11-30 21:28:08.588425', NULL, NULL),
(14, 8, 7, 'Привет солнышко как ты чего то ты давненько мне не пишешь', TRUE, '2025-11-30 21:30:15.708412', NULL, NULL),
(15, 7, 8, 'Ой извини я совсем закрутилась работа дом дом работа вот сейчас есть время', TRUE, '2025-11-30 21:31:28.770235', NULL, NULL),
(16, 8, 7, 'Сережа я тебя люблю', TRUE, '2025-11-30 21:41:45.818408', NULL, NULL),
(17, 7, 8, 'Привет', TRUE, '2025-11-30 21:42:30.414051', NULL, NULL),
(18, 7, 8, 'Привет', TRUE, '2025-11-30 21:42:44.905464', NULL, NULL),
(19, 8, 7, 'эй', TRUE, '2025-11-30 21:42:56.609919', NULL, NULL),
(20, 7, 8, 'Привет', TRUE, '2025-11-30 21:53:36.393780', NULL, NULL),
(21, 8, 7, 'привет', TRUE, '2025-11-30 21:54:01.348692', NULL, NULL),
(22, 7, 8, 'Ну', TRUE, '2025-11-30 22:01:14.902549', NULL, NULL),
(23, 7, 8, 'Лена', TRUE, '2025-11-30 22:05:40.282981', NULL, NULL),
(24, 7, 8, 'Привет сергио', TRUE, '2025-11-30 22:08:24.935115', NULL, NULL),
(25, 7, 8, 'Привет', TRUE, '2025-11-30 22:08:39.373973', NULL, NULL),
(26, 7, 8, 'Привет', TRUE, '2025-11-30 22:09:43.277240', NULL, NULL),
(27, 7, 8, 'Эй', TRUE, '2025-11-30 22:14:37.045111', NULL, NULL),
(28, 7, 8, 'Сука я пишу', TRUE, '2025-11-30 22:14:55.593055', NULL, NULL),
(29, 7, 8, 'Блять юра нехуя не может чмо', TRUE, '2025-11-30 22:25:09.289399', NULL, NULL),
(30, 8, 7, 'ааа', TRUE, '2025-11-30 22:38:07.812961', NULL, NULL),
(32, 7, 8, 'привет', TRUE, '2025-11-30 22:49:28.151584', NULL, NULL),
(33, 8, 7, 'ghbdtn', TRUE, '2025-11-30 22:55:34.897278', NULL, NULL),
(34, 8, 7, 'Привет', TRUE, '2025-11-30 23:10:42.378609', NULL, NULL),
(35, 7, 8, 'привеь', TRUE, '2025-11-30 23:11:38.527590', NULL, NULL),
(36, 7, 8, 'привет', TRUE, '2025-11-30 23:14:51.695417', NULL, NULL),
(37, 8, 7, 'ввв', TRUE, '2025-11-30 23:23:42.918990', NULL, NULL),
(38, 7, 8, 'Привет шлюха', TRUE, '2025-12-01 12:56:54.268126', NULL, NULL),
(39, 7, 8, 'Привет Лена как дела', TRUE, '2025-12-01 13:09:11.875389', NULL, NULL),
(40, 7, 8, 'Ленка поленка', TRUE, '2025-12-01 13:14:56.339139', NULL, NULL),
(41, 7, 8, 'Ленка', TRUE, '2025-12-01 13:15:39.032317', NULL, NULL),
(42, 8, 7, 'чего', TRUE, '2025-12-01 13:15:58.613680', NULL, NULL),
(43, 7, 8, 'Ленка', TRUE, '2025-12-01 13:19:41.049052', NULL, NULL),
(44, 7, 8, 'Лена', TRUE, '2025-12-01 13:19:56.275235', NULL, NULL),
(45, 7, 8, 'Сучка', TRUE, '2025-12-01 13:20:08.456061', NULL, NULL),
(46, 8, 7, 'сам такой', TRUE, '2025-12-01 13:20:27.477334', NULL, NULL),
(47, 8, 7, 'сука', TRUE, '2025-12-01 13:20:41.583965', NULL, NULL),
(48, 8, 7, 'блядь', TRUE, '2025-12-01 13:20:51.000458', NULL, NULL),
(49, 7, 8, 'Шлюха', TRUE, '2025-12-01 13:21:19.578088', NULL, NULL),
(50, 7, 8, 'Привет', TRUE, '2025-12-01 13:22:53.850813', NULL, NULL),
(51, 7, 8, 'Я бы тебе сказал при личной встроенной но ты не хотела', TRUE, '2025-12-01 13:23:41.332227', NULL, NULL),
(52, 7, 8, 'Привет симпотяшка', TRUE, '2025-12-01 13:54:14.600943', NULL, NULL),
(53, 8, 7, 'Привет', TRUE, '2025-12-01 14:56:33.125167', NULL, NULL),
(54, 8, 7, 'Привет', TRUE, '2025-12-02 16:56:25.848664', NULL, NULL),
(55, 8, 7, 'Привет', TRUE, '2025-12-02 17:23:22.226323', NULL, NULL),
(56, 7, 8, 'привет', TRUE, '2025-12-02 17:23:35.846808', NULL, NULL),
(57, 8, 7, 'Привет', TRUE, '2025-12-02 18:11:54.399267', NULL, NULL),
(58, 7, 8, 'Привет', TRUE, '2025-12-02 18:12:03.471595', NULL, NULL),
(59, 8, 7, 'эй', TRUE, '2025-12-02 18:12:11.016217', NULL, NULL),
(60, 7, 8, 'Да Лена', TRUE, '2025-12-02 18:12:18.911093', NULL, NULL),
(61, 8, 7, 'чего', TRUE, '2025-12-02 18:12:28.056051', NULL, NULL),
(62, 7, 8, 'Ау хелло', TRUE, '2025-12-02 18:12:37.464101', NULL, NULL),
(63, 8, 7, 'Привет', TRUE, '2025-12-02 18:12:46.280093', NULL, NULL),
(64, 7, 8, 'Привет любимая', TRUE, '2025-12-02 18:12:54.447885', NULL, NULL),
(65, 8, 7, 'Как дела', TRUE, '2025-12-02 18:13:05.647810', NULL, NULL),
(66, 7, 8, 'Норм все а у тебя', TRUE, '2025-12-02 18:13:15.072010', NULL, NULL),
(67, 8, 7, 'норм пока', TRUE, '2025-12-02 18:13:23.456203', NULL, NULL),
(68, 8, 7, 'привет как дела', TRUE, '2025-12-02 18:14:23.295974', NULL, NULL),
(69, 7, 8, 'Норм все норм и у тебя все норм симпотяшка', TRUE, '2025-12-02 18:15:07.599952', NULL, NULL),
(70, 7, 8, 'Ленка давно в 21 съ*нт', TRUE, '2025-12-02 18:15:41.991869', NULL, NULL),
(71, 7, 8, 'привет как твои дела', TRUE, '2025-12-02 18:16:00.327812', NULL, NULL),
(72, 8, 7, 'норм', TRUE, '2025-12-02 18:16:08.039807', NULL, NULL),
(73, 7, 8, 'это круто', TRUE, '2025-12-02 18:16:15.711877', NULL, NULL),
(74, 8, 7, 'давно не виделись', TRUE, '2025-12-02 18:16:39.543949', NULL, NULL),
(75, 7, 8, 'да нада встретится', TRUE, '2025-12-02 18:16:51.719769', NULL, NULL),
(76, 8, 7, 'дааа', TRUE, '2025-12-02 18:17:02.375988', NULL, NULL),
(77, 8, 7, 'давай в воскресенье', TRUE, '2025-12-02 18:17:18.039871', NULL, NULL),
(78, 7, 8, 'давай', TRUE, '2025-12-02 18:17:27.775881', NULL, NULL);

-- =====================================================
-- ФОТОГРАФИИ ПОЛЬЗОВАТЕЛЕЙ (4 строки)
-- =====================================================

INSERT INTO user_photos (id, user_id, photo_url, created_at, display_order) VALUES
(4, 7, 'https://pic.rutubelist.ru/user/bc/0a/bc0ae4630eb9a120b7850b13672d5c03.jpg', '2025-11-30 17:25:40.759361', 0),
(11, 7, 'https://i.ibb.co/G47V990b/ba3e4d66e0e1.jpg', '2025-11-30 20:12:32.864578', 999),
(12, 7, 'https://i.ibb.co/SXxBWyY0/6b5519ac84a2.jpg', '2025-11-30 20:13:55.008064', 999),
(17, 8, 'https://i.ibb.co/S41DPjM7/41ab6e443cf4.jpg', '2025-12-01 12:54:59.838112', 0);

-- =====================================================
-- ПОДПИСКИ (2 строки)
-- =====================================================

INSERT INTO subscriptions (id, subscriber_id, subscribed_to_id, created_at) VALUES
(2, 7, 8, '2025-12-02 16:09:34.505637'),
(3, 8, 7, '2025-12-02 16:51:27.994132');

-- =====================================================
-- SMS-КОДЫ (4 строки)
-- =====================================================

INSERT INTO sms_codes (id, phone, code, created_at, expires_at, verified) VALUES
(11, '+7 (922) 131-63-34', '2376', '2025-11-29 16:46:26.964483', '2025-11-29 16:56:26.957197', TRUE),
(18, '+79221316334', '3872', '2025-11-30 13:09:47.493549', '2025-11-30 13:19:47.485937', TRUE),
(19, '+79991234567', '7598', '2025-11-30 21:11:28.642192', '2025-11-30 21:21:28.633729', FALSE),
(20, '+79999999999', '1234', '2025-11-30 21:12:50.467507', '2025-11-30 21:22:50.457845', TRUE);

-- =====================================================
-- ОБНОВЛЕНИЕ ПОСЛЕДОВАТЕЛЬНОСТЕЙ (SEQUENCES)
-- =====================================================

SELECT setval('users_id_seq', 9, false);
SELECT setval('messages_id_seq', 97, false);
SELECT setval('private_messages_id_seq', 79, false);
SELECT setval('user_photos_id_seq', 18, false);
SELECT setval('subscriptions_id_seq', 4, false);
SELECT setval('sms_codes_id_seq', 21, false);
SELECT setval('blacklist_id_seq', 1, false);
SELECT setval('reactions_id_seq', 1, false);
SELECT setval('message_reactions_id_seq', 1, false);

-- =====================================================
-- ЗАВЕРШЕНИЕ ИМПОРТА
-- =====================================================

-- Проверка количества строк
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'private_messages', COUNT(*) FROM private_messages
UNION ALL SELECT 'user_photos', COUNT(*) FROM user_photos
UNION ALL SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL SELECT 'sms_codes', COUNT(*) FROM sms_codes
UNION ALL SELECT 'blacklist', COUNT(*) FROM blacklist
UNION ALL SELECT 'reactions', COUNT(*) FROM reactions
UNION ALL SELECT 'message_reactions', COUNT(*) FROM message_reactions;

-- =====================================================
-- ГОТОВО! 
-- Импортированно:
-- - 2 пользователя
-- - 88 сообщений в общем чате
-- - 71 личное сообщение
-- - 4 фотографии
-- - 2 подписки
-- - 4 SMS-кода
-- - 0 записей в черном списке
-- - 0 реакций
-- =====================================================