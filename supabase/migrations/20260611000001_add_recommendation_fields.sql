-- 1. Alter products table to add decision support columns
ALTER TABLE public.products 
ADD COLUMN lead_time_days INT NOT NULL DEFAULT 3 CHECK (lead_time_days >= 0),
ADD COLUMN safety_stock INT NOT NULL DEFAULT 5 CHECK (safety_stock >= 0),
ADD COLUMN last_sold_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Update the process_checkout function to update last_sold_at on checkout
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

    -- Decrement product stock and update last_sold_at and updated_at
    UPDATE public.products
    SET stock = stock - v_item.quantity,
        last_sold_at = NOW(),
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
