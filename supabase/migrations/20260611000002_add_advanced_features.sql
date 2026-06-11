-- 1. Create Suppliers Table
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    contact_info VARCHAR(255),
    typical_lead_time_days INT NOT NULL DEFAULT 3 CHECK (typical_lead_time_days >= 0),
    reliability_score INT NOT NULL DEFAULT 100 CHECK (reliability_score BETWEEN 0 AND 100),
    avg_pricing_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.00 CHECK (avg_pricing_multiplier >= 0.50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Bind Products to Suppliers
ALTER TABLE public.products
ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- 3. Update Transactions Status
ALTER TABLE public.transactions
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'voided'));

-- 4. Create Suspicious/Anomaly Activity Log
CREATE TABLE public.suspicious_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'excessive_voids', 'high_value_refund', 'mismatch_adjustment', 'off_hours_sale'
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'warning', 'normal')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspicious_logs ENABLE ROW LEVEL SECURITY;

-- 6. Apply RLS Policies
CREATE POLICY "Suppliers are viewable by all authenticated users"
    ON public.suppliers FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Suppliers can be modified by owner or staff_gudang"
    ON public.suppliers FOR ALL USING (public.get_my_role() IN ('owner', 'staff_gudang'));

CREATE POLICY "Suspicious logs are viewable by owner only"
    ON public.suspicious_logs FOR SELECT USING (public.get_my_role() = 'owner');

CREATE POLICY "Suspicious logs can be written by anyone"
    ON public.suspicious_logs FOR INSERT WITH CHECK (true);
