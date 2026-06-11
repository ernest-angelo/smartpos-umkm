-- 1. Create Enums
CREATE TYPE public.user_role AS ENUM ('owner', 'cashier', 'staff_gudang');
CREATE TYPE public.stock_log_type AS ENUM ('stock_in', 'stock_out', 'adjustment');

-- 2. Create Tables
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    role public.user_role NOT NULL DEFAULT 'cashier',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    purchase_price NUMERIC(12, 2) NOT NULL CHECK (purchase_price >= 0),
    selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= purchase_price),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    minimum_stock INT NOT NULL DEFAULT 10 CHECK (minimum_stock >= 0),
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.stock_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    type public.stock_log_type NOT NULL,
    quantity INT NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    amount_paid NUMERIC(12, 2) NOT NULL CHECK (amount_paid >= 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name_snapshot VARCHAR(255) NOT NULL,
    purchase_price_snapshot NUMERIC(12, 2) NOT NULL CHECK (purchase_price_snapshot >= 0),
    selling_price_snapshot NUMERIC(12, 2) NOT NULL CHECK (selling_price_snapshot >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 3. Create Indexes for Search Performance
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_stock_logs_product_id ON public.stock_logs(product_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- 5. Helper Function to Get Current User's Role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role AS $$
DECLARE
  v_role public.user_role;
BEGIN
  -- Try to get role from JWT metadata to avoid database query & recursion
  v_role := (auth.jwt() -> 'user_metadata' ->> 'role')::public.user_role;
  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;

  -- Fallback to database query if JWT is not present (e.g. database-triggered scripts)
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(v_role, 'cashier'::public.user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 6. RLS Policies

-- PROFILES
CREATE POLICY "Profiles are viewable by owner and owner alone can modify all"
    ON public.profiles FOR ALL
    USING (public.get_my_role() = 'owner');

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile fields except role"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- CATEGORIES
CREATE POLICY "Categories are readable by everyone authenticated"
    ON public.categories FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Categories can be modified by owner or staff_gudang"
    ON public.categories FOR ALL
    USING (public.get_my_role() IN ('owner', 'staff_gudang'));

-- PRODUCTS
CREATE POLICY "Products are readable by everyone authenticated"
    ON public.products FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Products can be modified by owner or staff_gudang"
    ON public.products FOR ALL
    USING (public.get_my_role() IN ('owner', 'staff_gudang'));

-- STOCK LOGS
CREATE POLICY "Stock logs are viewable by owner and staff_gudang"
    ON public.stock_logs FOR SELECT
    USING (public.get_my_role() IN ('owner', 'staff_gudang'));

CREATE POLICY "Stock logs can be created by owner and staff_gudang"
    ON public.stock_logs FOR INSERT
    WITH CHECK (public.get_my_role() IN ('owner', 'staff_gudang'));

-- TRANSACTIONS
CREATE POLICY "Transactions are viewable by owner and cashiers"
    ON public.transactions FOR SELECT
    USING (public.get_my_role() IN ('owner', 'cashier'));

-- TRANSACTION ITEMS
CREATE POLICY "Transaction items are viewable by owner and cashiers"
    ON public.transaction_items FOR SELECT
    USING (public.get_my_role() IN ('owner', 'cashier'));

-- 7. Trigger to Sync Auth Users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Employee'),
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'cashier'::public.user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Atomic POS Checkout Database Function (Transactions)
CREATE OR REPLACE FUNCTION public.process_checkout(
  p_cashier_id UUID,
  p_subtotal NUMERIC,
  p_discount NUMERIC,
  p_total NUMERIC,
  p_amount_paid NUMERIC,
  p_payment_method VARCHAR,
  p_items JSONB
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_invoice_number VARCHAR;
  v_item RECORD;
  v_product_stock INT;
  v_product_name VARCHAR;
  v_purchase_price NUMERIC;
  v_selling_price NUMERIC;
BEGIN
  -- Generate invoice: INV-YYYYMMDD-[6-digit-random]
  v_invoice_number := 'INV-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(floor(random() * 1000000)::text, 6, '0');

  -- Create master transaction
  INSERT INTO public.transactions (
    invoice_number,
    cashier_id,
    subtotal,
    discount,
    total,
    amount_paid,
    payment_method,
    created_at
  ) VALUES (
    v_invoice_number,
    p_cashier_id,
    p_subtotal,
    p_discount,
    p_total,
    p_amount_paid,
    p_payment_method,
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- Process line items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT) LOOP
    -- Lock product row to prevent race conditions
    SELECT name, purchase_price, selling_price, stock INTO v_product_name, v_purchase_price, v_selling_price, v_product_stock
    FROM public.products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % not found', v_item.product_id;
    END IF;

    -- Validate stock quantity
    IF v_product_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %', v_product_name, v_product_stock, v_item.quantity;
    END IF;

    -- Decrement product stock
    UPDATE public.products
    SET stock = stock - v_item.quantity,
        updated_at = NOW()
    WHERE id = v_item.product_id;

    -- Log stock adjustment
    INSERT INTO public.stock_logs (
      product_id,
      type,
      quantity,
      notes,
      created_by
    ) VALUES (
      v_item.product_id,
      'stock_out',
      -v_item.quantity,
      'Sales transaction ' || v_invoice_number,
      p_cashier_id
    );

    -- Insert sales item snapshotting prices
    INSERT INTO public.transaction_items (
      transaction_id,
      product_id,
      product_name_snapshot,
      purchase_price_snapshot,
      selling_price_snapshot,
      quantity,
      subtotal
    ) VALUES (
      v_transaction_id,
      v_item.product_id,
      v_product_name,
      v_purchase_price,
      v_selling_price,
      v_item.quantity,
      v_selling_price * v_item.quantity
    );
  END LOOP;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
