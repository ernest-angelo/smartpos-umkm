-- Enable uuid-ossp if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean existing data (safe for local development seeding)
TRUNCATE public.transaction_items CASCADE;
TRUNCATE public.transactions CASCADE;
TRUNCATE public.stock_logs CASCADE;
TRUNCATE public.products CASCADE;
TRUNCATE public.categories CASCADE;
DELETE FROM public.profiles;
DELETE FROM auth.users WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- 1. Seed Mock Users in auth.users (triggers will sync to public.profiles)
-- Note: In local Supabase, passwords are encrypted. 'password123' is:
-- '$2a$10$tZptz5vj.g3mDR0LqP56x.9b7n9Uf63nC5rZ8QvS2s6Y8/0iH1U8y'
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  aud,
  role
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'owner@smartpos.com',
  '$2a$10$tZptz5vj.g3mDR0LqP56x.9b7n9Uf63nC5rZ8QvS2s6Y8/0iH1U8y',
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Pak Budi (Owner)", "role": "owner"}',
  false,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
),
(
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'cashier@smartpos.com',
  '$2a$10$tZptz5vj.g3mDR0LqP56x.9b7n9Uf63nC5rZ8QvS2s6Y8/0iH1U8y',
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Siti (Cashier)", "role": "cashier"}',
  false,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
),
(
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'gudang@smartpos.com',
  '$2a$10$tZptz5vj.g3mDR0LqP56x.9b7n9Uf63nC5rZ8QvS2s6Y8/0iH1U8y',
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Anto (Gudang Staff)", "role": "staff_gudang"}',
  false,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
);

-- Force updates to verify profiles synced correctly with their proper role
UPDATE public.profiles SET role = 'owner' WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET role = 'cashier' WHERE id = '00000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET role = 'staff_gudang' WHERE id = '00000000-0000-0000-0000-000000000003';

-- 2. Seed Categories
INSERT INTO public.categories (id, name, description) VALUES
('10000000-0000-0000-0000-000000000001', 'Sembako', 'Bahan pokok makanan sehari-hari seperti beras, minyak, gula.'),
('10000000-0000-0000-0000-000000000002', 'Minuman', 'Minuman ringan, air mineral, teh, kopi kemasan.'),
('10000000-0000-0000-0000-000000000003', 'Makanan Ringan', 'Snack, biskuit, mie instan, cokelat.'),
('10000000-0000-0000-0000-000000000004', 'Kebutuhan Rumah Tangga', 'Sabun, pasta gigi, detergen, pewangi pakaian.');

-- 3. Seed Products
INSERT INTO public.products (id, sku, name, category_id, purchase_price, selling_price, stock, minimum_stock) VALUES
('20000000-0000-0000-0000-000000000001', 'SKU-SEM-001', 'Minyak Goreng Filma 2L', '10000000-0000-0000-0000-000000000001', 28000.00, 34000.00, 45, 10),
('20000000-0000-0000-0000-000000000002', 'SKU-SEM-002', 'Beras Ramos 5kg', '10000000-0000-0000-0000-000000000001', 58000.00, 68000.00, 30, 8),
('20000000-0000-0000-0000-000000000003', 'SKU-SEM-003', 'Gula Pasir Gulaku 1kg', '10000000-0000-0000-0000-000000000001', 12500.00, 16000.00, 5, 15), -- Trigger low stock alert (5 <= 15)
('20000000-0000-0000-0000-000000000004', 'SKU-MIN-001', 'Aqua 600ml', '10000000-0000-0000-0000-000000000002', 2000.00, 3500.00, 120, 24),
('20000000-0000-0000-0000-000000000005', 'SKU-MIN-002', 'Teh Botol Sosro 350ml', '10000000-0000-0000-0000-000000000002', 3000.00, 4500.00, 48, 12),
('20000000-0000-0000-0000-000000000006', 'SKU-MAC-001', 'Indomie Goreng Spesial', '10000000-0000-0000-0000-000000000003', 2500.00, 3100.00, 150, 40),
('20000000-0000-0000-0000-000000000007', 'SKU-KEB-001', 'Sabun Lifebuoy Merah 85g', '10000000-0000-0000-0000-000000000004', 3200.00, 4200.00, 8, 10), -- Trigger low stock alert (8 <= 10)
('20000000-0000-0000-0000-000000000008', 'SKU-KEB-002', 'Rinso Anti Noda 800g', '10000000-0000-0000-0000-000000000004', 18000.00, 22500.00, 14, 5);

-- 4. Seed Initial Stock Logs (Stock In)
INSERT INTO public.stock_logs (product_id, type, quantity, notes, created_by) VALUES
('20000000-0000-0000-0000-000000000001', 'stock_in', 50, 'Initial setup import', '00000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000002', 'stock_in', 40, 'Initial setup import', '00000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000003', 'stock_in', 25, 'Initial setup import', '00000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000004', 'stock_in', 150, 'Initial setup import', '00000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000005', 'stock_in', 60, 'Initial setup import', '00000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000006', 'stock_in', 200, 'Initial setup import', '00000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000007', 'stock_in', 30, 'Initial setup import', '00000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000008', 'stock_in', 20, 'Initial setup import', '00000000-0000-0000-0000-000000000003');

-- 5. Seed Historical Sales (Transactions & Transaction Items) over the last 30 days
-- Using a PL/pgSQL block to simulate highly realistic sales metrics
DO $$
DECLARE
  v_day INT;
  v_num_transactions INT;
  v_transaction_idx INT;
  v_hour INT;
  v_minute INT;
  v_second INT;
  v_tx_date TIMESTAMPTZ;
  v_tx_id UUID;
  v_invoice VARCHAR;
  
  -- Product lists
  p_ids UUID[] := ARRAY[
    '20000000-0000-0000-0000-000000000001'::UUID, -- Minyak Filma
    '20000000-0000-0000-0000-000000000002'::UUID, -- Beras Ramos
    '20000000-0000-0000-0000-000000000003'::UUID, -- Gula Pasir
    '20000000-0000-0000-0000-000000000004'::UUID, -- Aqua 600ml
    '20000000-0000-0000-0000-000000000005'::UUID, -- Teh Botol
    '20000000-0000-0000-0000-000000000006'::UUID, -- Indomie
    '20000000-0000-0000-0000-000000000007'::UUID, -- Lifebuoy
    '20000000-0000-0000-0000-000000000008'::UUID  -- Rinso 800g
  ];
  
  p_names VARCHAR[] := ARRAY[
    'Minyak Goreng Filma 2L',
    'Beras Ramos 5kg',
    'Gula Pasir Gulaku 1kg',
    'Aqua 600ml',
    'Teh Botol Sosro 350ml',
    'Indomie Goreng Spesial',
    'Sabun Lifebuoy Merah 85g',
    'Rinso Anti Noda 800g'
  ];
  
  p_purchases NUMERIC[] := ARRAY[28000.00, 58000.00, 12500.00, 2000.00, 3000.00, 2500.00, 3200.00, 18000.00];
  p_sellings NUMERIC[] := ARRAY[34000.00, 68000.00, 16000.00, 3500.00, 4500.00, 3100.00, 4200.00, 22500.00];

  -- Loop variables
  v_num_items INT;
  v_item_idx INT;
  v_prod_idx INT;
  v_quantity INT;
  v_line_subtotal NUMERIC;
  v_tx_subtotal NUMERIC;
  v_discount NUMERIC;
  v_total NUMERIC;
  v_payment_method VARCHAR;
  
  -- Peak distributions
  v_dow INT;
  v_random_factor NUMERIC;
BEGIN
  -- Loop through the past 30 days (from 30 days ago to today)
  FOR v_day IN REVERSE 30..0 LOOP
    -- Base date for this loop step
    v_tx_date := CURRENT_DATE - (v_day || ' days')::INTERVAL;
    v_dow := EXTRACT(ISODOW FROM v_tx_date); -- 1 (Mon) to 7 (Sun)
    
    -- Weekends (Saturday=6, Sunday=7) should have significantly more transactions
    -- Peak Day Detection: Saturday (6) and Sunday (7) are busiest, Friday (5) is medium, others are normal.
    IF v_dow IN (6, 7) THEN
      v_num_transactions := floor(random() * 12) + 15; -- 15 to 26 transactions
    ELSIF v_dow = 5 THEN
      v_num_transactions := floor(random() * 8) + 10;  -- 10 to 17 transactions
    ELSE
      v_num_transactions := floor(random() * 6) + 6;   -- 6 to 11 transactions
    END IF;
    
    -- Loop through transactions of the day
    FOR v_transaction_idx IN 1..v_num_transactions LOOP
      -- Peak Hour Distribution:
      -- We want bimodal peaks around Lunch (10:00 - 13:00) and Evening (17:00 - 20:00)
      v_random_factor := random();
      IF v_random_factor < 0.35 THEN
        -- Lunch Peak: Hour between 10 and 12
        v_hour := floor(random() * 3) + 10;
      ELSIF v_random_factor < 0.75 THEN
        -- Evening Peak: Hour between 17 and 19
        v_hour := floor(random() * 3) + 17;
      ELSE
        -- Off peak: between 08:00 and 21:00 (excluding peak times)
        IF random() < 0.5 THEN
          v_hour := floor(random() * 2) + 8; -- 8-9
        ELSE
          v_hour := floor(random() * 4) + 13; -- 13-16
        END IF;
      END IF;
      
      v_minute := floor(random() * 60);
      v_second := floor(random() * 60);
      
      -- Create absolute timestamp for this transaction
      v_tx_date := v_tx_date::DATE + (v_hour || ' hours ' || v_minute || ' minutes ' || v_second || ' seconds')::INTERVAL;
      
      -- Generate invoice number
      v_invoice := 'INV-' || to_char(v_tx_date, 'YYYYMMDD') || '-' || lpad((v_day * 1000 + v_transaction_idx * 10 + floor(random()*9))::text, 6, '0');
      
      -- Payment methods
      IF random() < 0.75 THEN
        v_payment_method := 'cash';
      ELSIF random() < 0.90 THEN
        v_payment_method := 'qris';
      ELSE
        v_payment_method := 'transfer';
      END IF;
      
      v_tx_subtotal := 0;
      v_tx_id := gen_random_uuid();
      
      -- 1 to 4 items in cart
      v_num_items := floor(random() * 4) + 1;
      
      -- Insert Transaction Shell first
      INSERT INTO public.transactions (
        id,
        invoice_number,
        cashier_id,
        subtotal,
        discount,
        total,
        amount_paid,
        payment_method,
        created_at
      ) VALUES (
        v_tx_id,
        v_invoice,
        '00000000-0000-0000-0000-000000000002', -- siti cashier
        0,
        0,
        0,
        0,
        v_payment_method,
        v_tx_date
      );
      
      -- Insert items and accumulate prices
      -- Keep track of chosen indexes to avoid duplicate items in same cart
      FOR v_item_idx IN 1..v_num_items LOOP
        -- Select random product index
        v_prod_idx := floor(random() * 8) + 1;
        
        -- Minyak or Beras: Quantity 1-2. Indomie/Aqua: Quantity 2-10
        IF v_prod_idx IN (1, 2, 8) THEN
          v_quantity := floor(random() * 2) + 1;
        ELSIF v_prod_idx IN (4, 6) THEN
          v_quantity := floor(random() * 6) + 2;
        ELSE
          v_quantity := floor(random() * 3) + 1;
        END IF;
        
        v_line_subtotal := p_sellings[v_prod_idx] * v_quantity;
        v_tx_subtotal := v_tx_subtotal + v_line_subtotal;
        
        INSERT INTO public.transaction_items (
          transaction_id,
          product_id,
          product_name_snapshot,
          purchase_price_snapshot,
          selling_price_snapshot,
          quantity,
          subtotal
        ) VALUES (
          v_tx_id,
          p_ids[v_prod_idx],
          p_names[v_prod_idx],
          p_purchases[v_prod_idx],
          p_sellings[v_prod_idx],
          v_quantity,
          v_line_subtotal
        );
      END LOOP;
      
      -- Determine discount: 5% discount on totals over 100k (with 40% probability)
      IF v_tx_subtotal > 100000 AND random() < 0.40 THEN
        v_discount := floor(v_tx_subtotal * 0.05);
      ELSE
        v_discount := 0;
      END IF;
      
      v_total := v_tx_subtotal - v_discount;
      
      -- Update Transaction totals and amount paid
      UPDATE public.transactions
      SET subtotal = v_tx_subtotal,
          discount = v_discount,
          total = v_total,
          amount_paid = CASE 
            WHEN v_payment_method = 'cash' THEN ceil(v_total / 10000.0) * 10000 -- Round up to nearest 10k for cash
            ELSE v_total
          END
      WHERE id = v_tx_id;
      
    END LOOP;
  END LOOP;
END $$;
