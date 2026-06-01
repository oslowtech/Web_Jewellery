-- Supabase initialization SQL for Web_Jewellery
-- Paste this into the Supabase SQL editor (SQL > New query) and run.
-- It creates `public.profiles` and `public.products` and the recommended RLS policies.

-- 1) Profiles table: stores user metadata and delivery address
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  address text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Products table: stores catalog items editable by admins
create table if not exists public.products (
  id text primary key,
  name text not null,
  price numeric not null,
  discount_price numeric,
  category text not null,
  sub_category text,
  gender text,
  description text,
  material text,
  stock boolean not null default true,
  featured boolean not null default false,
  is_new boolean not null default false,
  best_seller boolean not null default false,
  tags text[] not null default '{}',
  image_files text[] not null default '{}',
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.products enable row level security;

-- Policies for profiles: owner-only access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_owner'
  ) THEN
    EXECUTE 'CREATE POLICY profiles_select_owner ON public.profiles FOR SELECT USING (auth.uid() = id);';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_insert_owner'
  ) THEN
    EXECUTE 'CREATE POLICY profiles_insert_owner ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_owner'
  ) THEN
    EXECUTE 'CREATE POLICY profiles_update_owner ON public.profiles FOR UPDATE USING (auth.uid() = id);';
  END IF;
END
$$;

-- Products: public read, admin write
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'products_select_public'
  ) THEN
    EXECUTE 'CREATE POLICY products_select_public ON public.products FOR SELECT USING (true);';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'products_admin_full'
  ) THEN
    EXECUTE 'CREATE POLICY products_admin_full ON public.products FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = ''admin''
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = ''admin''
      )
    );';
  END IF;
END
$$;

-- Optional: Add a sample product (uncomment to insert)
-- insert into public.products (id, name, price, discount_price, category, sub_category, gender, description)
-- values ('JW_SAMPLE1', 'Sample Pendant', 999, 799, 'Pendant', 'Chain', 'unisex', 'Sample product for testing');

-- Notes for admin setup:
-- 1) Create a Supabase Auth user for the admin email via the Supabase Auth > Users UI.
-- 2) Copy the user's `id` (UUID) and insert a row into `public.profiles` with role = 'admin':
--    insert into public.profiles (id, email, full_name, role) values ('<USER_UUID>', 'admin@example.com', 'Admin Name', 'admin');
-- 3) Alternatively, use the Supabase SQL editor to run the above insert.

-- End of init.sql

-- ============================================================================
-- ORDERS SYSTEM SCHEMA (Added for order management, payments, and tracking)
-- ============================================================================

-- 1. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  street_address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  address_type VARCHAR(50) DEFAULT 'billing', -- 'billing', 'shipping', or 'both'
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  billing_address_id uuid NOT NULL REFERENCES public.addresses(id),
  shipping_address_id uuid NOT NULL REFERENCES public.addresses(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_charge DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_id uuid,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- 3. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_unit DECIMAL(10, 2) NOT NULL,
  discount_per_unit DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. GIFTING METADATA TABLE
CREATE TABLE IF NOT EXISTS public.gifting_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  is_gift BOOLEAN DEFAULT FALSE,
  recipient_name VARCHAR(255),
  recipient_phone VARCHAR(20),
  recipient_email VARCHAR(255),
  gift_message TEXT,
  gift_wrap BOOLEAN DEFAULT FALSE,
  from_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  razorpay_payment_id VARCHAR(100) UNIQUE,
  razorpay_order_id VARCHAR(100),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  error_code VARCHAR(50),
  error_description TEXT,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ORDER STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON public.addresses(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON public.payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_gifting_metadata_order_id ON public.gifting_metadata(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);

-- ROW LEVEL SECURITY
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifting_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- ADDRESSES RLS POLICIES
CREATE POLICY addresses_select_own ON public.addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY addresses_insert_own ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY addresses_update_own ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY addresses_delete_own ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

-- ORDERS RLS POLICIES
CREATE POLICY orders_select_own ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY orders_insert_own ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY orders_update_own ON public.orders
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ORDER_ITEMS RLS POLICIES
CREATE POLICY order_items_select_own ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE public.orders.id = order_items.order_id AND public.orders.user_id = auth.uid())
  );

CREATE POLICY order_items_insert_own ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE public.orders.id = order_items.order_id AND public.orders.user_id = auth.uid())
  );

-- GIFTING_METADATA RLS POLICIES
CREATE POLICY gifting_select_own ON public.gifting_metadata
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE public.orders.id = gifting_metadata.order_id AND public.orders.user_id = auth.uid())
  );

CREATE POLICY gifting_insert_own ON public.gifting_metadata
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE public.orders.id = gifting_metadata.order_id AND public.orders.user_id = auth.uid())
  );

CREATE POLICY gifting_update_own ON public.gifting_metadata
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.orders WHERE public.orders.id = gifting_metadata.order_id AND public.orders.user_id = auth.uid())
  );

-- PAYMENTS RLS POLICIES
CREATE POLICY payments_select_own ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE public.orders.id = payments.order_id AND public.orders.user_id = auth.uid())
  );

-- ORDER_STATUS_HISTORY RLS POLICIES
CREATE POLICY order_status_history_select_own ON public.order_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE public.orders.id = order_status_history.order_id AND public.orders.user_id = auth.uid())
  );

-- ADMIN RLS POLICIES
-- These allow profiles.role = 'admin' users to manage ecommerce operations.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'addresses' AND policyname = 'addresses_admin_select'
  ) THEN
    EXECUTE 'CREATE POLICY addresses_admin_select ON public.addresses FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ''admin'')
    );';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'orders_admin_all'
  ) THEN
    EXECUTE 'CREATE POLICY orders_admin_all ON public.orders FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ''admin'')
    ) WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ''admin'')
    );';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'order_items_admin_select'
  ) THEN
    EXECUTE 'CREATE POLICY order_items_admin_select ON public.order_items FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ''admin'')
    );';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'gifting_metadata' AND policyname = 'gifting_admin_select'
  ) THEN
    EXECUTE 'CREATE POLICY gifting_admin_select ON public.gifting_metadata FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ''admin'')
    );';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'payments_admin_select'
  ) THEN
    EXECUTE 'CREATE POLICY payments_admin_select ON public.payments FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ''admin'')
    );';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_status_history' AND policyname = 'order_status_history_admin_all'
  ) THEN
    EXECUTE 'CREATE POLICY order_status_history_admin_all ON public.order_status_history FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ''admin'')
    ) WITH CHECK (
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = ''admin'')
    );';
  END IF;
END
$$;

-- TRIGGERS FOR TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
