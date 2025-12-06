-- Импорт фотографий профилей из poehali.dev
INSERT INTO user_photos (id, user_id, photo_url, created_at, display_order) VALUES
(11, 7, 'https://i.ibb.co/G47V990b/ba3e4d66e0e1.jpg', '2025-11-30T20:12:32.864578', 999),
(12, 7, 'https://i.ibb.co/SXxBWyY0/6b5519ac84a2.jpg', '2025-11-30T20:13:55.008064', 999),
(4, 7, 'https://pic.rutubelist.ru/user/bc/0a/bc0ae4630eb9a120b7850b13672d5c03.jpg', '2025-11-30T17:25:40.759361', 0),
(17, 8, 'https://i.ibb.co/S41DPjM7/41ab6e443cf4.jpg', '2025-12-01T12:54:59.838112', 0)
ON CONFLICT (id) DO NOTHING;