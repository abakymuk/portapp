-- Обновление схемы таблицы orders для UI
-- Добавляем поля customer_name, customer_email, notes
-- Удаляем поля requested_pickup_at, note

-- Добавляем новые поля
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;

-- Удаляем старые поля (если они существуют)
ALTER TABLE orders DROP COLUMN IF EXISTS requested_pickup_at;
ALTER TABLE orders DROP COLUMN IF EXISTS note;

-- Обновляем check constraint для status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('draft', 'confirmed', 'in_progress', 'completed', 'cancelled'));

-- Обновляем order_items для добавления полей product_name, quantity, unit_price, total_price
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name text;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price decimal(10,2) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_price decimal(10,2) DEFAULT 0;

-- Удаляем старые поля из order_items
ALTER TABLE order_items DROP COLUMN IF EXISTS cntr_no;
ALTER TABLE order_items DROP COLUMN IF EXISTS container_id;
ALTER TABLE order_items DROP COLUMN IF EXISTS bill_of_lading;
ALTER TABLE order_items DROP COLUMN IF EXISTS service_type;
ALTER TABLE order_items DROP COLUMN IF EXISTS status;

-- Обновляем check constraint для order_items
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_service_type_check;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_status_check;
