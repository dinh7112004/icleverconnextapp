-- Clear existing menus for the school to start fresh
DELETE FROM menus WHERE school_id = '36823d22-8a46-48fd-a260-6a5ccbd202ca';

-- Insert menus for the last 7 days including today (2026-04-18 to 2026-04-24)
INSERT INTO menus (id, school_id, date, meal_type, dish_name, image_url, created_at, updated_at)
VALUES
-- 2026-04-24 (Today)
(gen_random_uuid(), '36823d22-8a46-48fd-a260-6a5ccbd202ca', '2026-04-24', 'BREAKFAST', 'Phở bò tái lăn', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=1000', NOW(), NOW()),
(gen_random_uuid(), '36823d22-8a46-48fd-a260-6a5ccbd202ca', '2026-04-24', 'LUNCH', 'Cơm trắng, Sườn xào chua ngọt', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=1000', NOW(), NOW()),
(gen_random_uuid(), '36823d22-8a46-48fd-a260-6a5ccbd202ca', '2026-04-24', 'AFTERNOON_SNACK', 'Váng sữa Monte', 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=1000', NOW(), NOW()),

-- 2026-04-23
(gen_random_uuid(), '36823d22-8a46-48fd-a260-6a5ccbd202ca', '2026-04-23', 'BREAKFAST', 'Bún mọc sườn non', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000', NOW(), NOW()),
(gen_random_uuid(), '36823d22-8a46-48fd-a260-6a5ccbd202ca', '2026-04-23', 'LUNCH', 'Cơm tấm, Chả trứng, Thịt nướng', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000', NOW(), NOW()),
(gen_random_uuid(), '36823d22-8a46-48fd-a260-6a5ccbd202ca', '2026-04-23', 'AFTERNOON_SNACK', 'Chè dưỡng nhan', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000', NOW(), NOW()),

-- 2026-04-22
(gen_random_uuid(), '36823d22-8a46-48fd-a260-6a5ccbd202ca', '2026-04-22', 'BREAKFAST', 'Bánh mì chảo', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1000', NOW(), NOW()),
(gen_random_uuid(), '36823d22-8a46-48fd-a260-6a5ccbd202ca', '2026-04-22', 'LUNCH', 'Bún chả Hà Nội, Nem rán', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1000', NOW(), NOW()),
(gen_random_uuid(), '36823d22-8a46-48fd-a260-6a5ccbd202ca', '2026-04-22', 'AFTERNOON_SNACK', 'Sữa tươi TH True Milk', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1000', NOW(), NOW()),

-- 2026-04-21
(gen_random_uuid(), '36823d22-8a46-48fd-a260-6a5ccbd202ca', '2026-04-21', 'BREAKFAST', 'Xôi xéo mỡ hành', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000', NOW(), NOW()),
(gen_random_uuid(), '36823d22-8a46-48fd-a260-6a5ccbd202ca', '2026-04-21', 'LUNCH', 'Cơm, Cá thu sốt cà chua', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000', NOW(), NOW()),
(gen_random_uuid(), '36823d22-8a46-48fd-a260-6a5ccbd202ca', '2026-04-21', 'AFTERNOON_SNACK', 'Thạch rau câu', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000', NOW(), NOW()),

-- 2026-04-20
(gen_random_uuid(), '36823d22-8a46-48fd-a260-6a5ccbd202ca', '2026-04-20', 'BREAKFAST', 'Mì Quảng tôm thịt', 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1000', NOW(), NOW()),
(gen_random_uuid(), '36823d22-8a46-48fd-a260-6a5ccbd202ca', '2026-04-20', 'LUNCH', 'Cơm, Thịt gà kho sả ớt', 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1000', NOW(), NOW()),
(gen_random_uuid(), '36823d22-8a46-48fd-a260-6a5ccbd202ca', '2026-04-20', 'AFTERNOON_SNACK', 'Sữa ngũ cốc', 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1000', NOW(), NOW());
