-- DB-004: Seeds
-- Загрузка начальных данных для демонстрации функционала системы

-- 1. Данные для shipping_lines
INSERT INTO shipping_lines (scac, name) VALUES 
  ('MSCU', 'Mediterranean Shipping Company'),
  ('MAEU', 'Maersk Line'),
  ('CMDU', 'CMA CGM'),
  ('HLCU', 'Hapag-Lloyd'),
  ('ONEY', 'Ocean Network Express')
ON CONFLICT (scac) DO NOTHING;

-- 2. Данные для terminals
INSERT INTO terminals (code, name, timezone) VALUES 
  ('LAX-T1', 'Los Angeles Terminal 1', 'America/Los_Angeles'),
  ('LAX-T2', 'Los Angeles Terminal 2', 'America/Los_Angeles'),
  ('LGB-T1', 'Long Beach Terminal 1', 'America/Los_Angeles'),
  ('LGB-T2', 'Long Beach Terminal 2', 'America/Los_Angeles'),
  ('OAK-T1', 'Oakland Terminal 1', 'America/Los_Angeles')
ON CONFLICT (code) DO NOTHING;

-- 3. Тестовые организации
INSERT INTO orgs (id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Demo Logistics Inc'),
  ('22222222-2222-2222-2222-222222222222', 'Test Freight Co'),
  ('33333333-3333-3333-3333-333333333333', 'Sample Shipping Ltd')
ON CONFLICT (id) DO NOTHING;

-- 4. Демо рейсы
INSERT INTO voyages (vessel_name, voyage_no, line_id, terminal_id, eta, etd, status) VALUES 
  ('MSC OSCAR', 'MSC123E', 
   (SELECT id FROM shipping_lines WHERE scac = 'MSCU'),
   (SELECT id FROM terminals WHERE code = 'LAX-T1'),
   now() + interval '2 days', now() + interval '4 days', 'scheduled'),
   
  ('MAERSK SEVILLE', 'MAE456W', 
   (SELECT id FROM shipping_lines WHERE scac = 'MAEU'),
   (SELECT id FROM terminals WHERE code = 'LGB-T1'),
   now() + interval '1 day', now() + interval '3 days', 'scheduled'),
   
  ('CMA CGM MARCO POLO', 'CMA789E', 
   (SELECT id FROM shipping_lines WHERE scac = 'CMDU'),
   (SELECT id FROM terminals WHERE code = 'LAX-T2'),
   now() - interval '1 day', now() + interval '2 days', 'arrived'),
   
  ('HAPAG-LLOYD MEXICO', 'HLC012W', 
   (SELECT id FROM shipping_lines WHERE scac = 'HLCU'),
   (SELECT id FROM terminals WHERE code = 'OAK-T1'),
   now() - interval '3 days', now() - interval '1 day', 'departed'),
   
  ('ONE HAMBURG', 'ONE345E', 
   (SELECT id FROM shipping_lines WHERE scac = 'ONEY'),
   (SELECT id FROM terminals WHERE code = 'LGB-T2'),
   now() + interval '5 days', now() + interval '7 days', 'scheduled')
ON CONFLICT (voyage_no, line_id, terminal_id) DO NOTHING;

-- 5. Демо контейнеры
INSERT INTO containers (cntr_no, iso_type, voyage_id, bill_of_lading, last_known_status, last_status_time) VALUES 
  ('MSCU1234567', '45G1', 
   (SELECT id FROM voyages WHERE voyage_no = 'MSC123E'),
   'MSC123456789', 'in_transit', now() - interval '1 hour'),
   
  ('MSCU2345678', '45G1', 
   (SELECT id FROM voyages WHERE voyage_no = 'MSC123E'),
   'MSC234567890', 'in_transit', now() - interval '30 minutes'),
   
  ('MAEU3456789', '45G1', 
   (SELECT id FROM voyages WHERE voyage_no = 'MAE456W'),
   'MAE345678901', 'in_transit', now() - interval '2 hours'),
   
  ('CMA7890123', '45G1', 
   (SELECT id FROM voyages WHERE voyage_no = 'CMA789E'),
   'CMA789012345', 'discharged', now() - interval '6 hours'),
   
  ('CMA8901234', '45G1', 
   (SELECT id FROM voyages WHERE voyage_no = 'CMA789E'),
   'CMA890123456', 'available', now() - interval '4 hours'),
   
  ('HLC0123456', '45G1', 
   (SELECT id FROM voyages WHERE voyage_no = 'HLC012W'),
   'HLC012345678', 'picked_up', now() - interval '12 hours'),
   
  ('ONE3456789', '45G1', 
   (SELECT id FROM voyages WHERE voyage_no = 'ONE345E'),
   'ONE345678901', 'in_transit', now() - interval '3 hours')
ON CONFLICT (cntr_no) DO NOTHING;

-- 6. Демо события контейнеров
INSERT INTO container_events (container_id, event_type, event_time, payload) VALUES 
  ((SELECT id FROM containers WHERE cntr_no = 'CMA7890123'), 'discharged', now() - interval '6 hours', '{"terminal": "LAX-T2"}'),
  ((SELECT id FROM containers WHERE cntr_no = 'CMA8901234'), 'discharged', now() - interval '6 hours', '{"terminal": "LAX-T2"}'),
  ((SELECT id FROM containers WHERE cntr_no = 'CMA8901234'), 'available', now() - interval '4 hours', '{"yard_location": "A12-B34"}'),
  ((SELECT id FROM containers WHERE cntr_no = 'HLC0123456'), 'discharged', now() - interval '24 hours', '{"terminal": "OAK-T1"}'),
  ((SELECT id FROM containers WHERE cntr_no = 'HLC0123456'), 'available', now() - interval '18 hours', '{"yard_location": "C45-D67"}'),
  ((SELECT id FROM containers WHERE cntr_no = 'HLC0123456'), 'picked_up', now() - interval '12 hours', '{"truck": "TRK-12345"}');

-- 7. Демо заказы
INSERT INTO orders (id, org_id, order_no, status, customer_name, customer_email, notes) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
   '11111111-1111-1111-1111-111111111111', 
   'ORD-2024-001', 'confirmed', 'Demo Logistics Inc', 'demo@logistics.com', 'Demo order for testing'),
   
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
   '22222222-2222-2222-2222-222222222222', 
   'ORD-2024-002', 'draft', 'Test Freight Co', 'test@freight.com', 'Test order for demo'),
   
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 
   '33333333-3333-3333-3333-333333333333', 
   'ORD-2024-003', 'in_progress', 'Sample Shipping Ltd', 'sample@shipping.com', 'Sample order for demonstration')
ON CONFLICT (order_no) DO NOTHING;

-- 8. Создание позиций заказов
INSERT INTO order_items (order_id, product_name, quantity, unit_price, total_price) VALUES 
  ((SELECT id FROM orders WHERE order_no = 'ORD-2024-001'), 
   'Контейнер 45G1', 2, 15000.00, 30000.00),
   
  ((SELECT id FROM orders WHERE order_no = 'ORD-2024-001'), 
   'Услуги погрузки', 1, 5000.00, 5000.00),
   
  ((SELECT id FROM orders WHERE order_no = 'ORD-2024-002'), 
   'Контейнер 45G1', 1, 15000.00, 15000.00),
   
  ((SELECT id FROM orders WHERE order_no = 'ORD-2024-003'), 
   'Контейнер 45G1', 3, 15000.00, 45000.00),
   
  ((SELECT id FROM orders WHERE order_no = 'ORD-2024-003'), 
   'Услуги доставки', 1, 8000.00, 8000.00);

-- 9. Тестовые роли пользователей
INSERT INTO user_roles (name, description) VALUES 
  ('admin', 'Администратор организации'),
  ('manager', 'Менеджер'),
  ('operator', 'Оператор'),
  ('viewer', 'Просмотрщик')
ON CONFLICT (name) DO NOTHING;

-- 10. Обновление материализованных представлений
SELECT refresh_all_mv();
