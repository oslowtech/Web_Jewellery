-- Ecommerce tables and RLS policies for Web_Jewellery.
-- Safe to run more than once in Supabase SQL editor.

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name varchar(255) not null,
  phone varchar(20) not null,
  email varchar(255) not null,
  street_address text not null,
  city varchar(100) not null,
  state varchar(100) not null,
  postal_code varchar(10) not null,
  country varchar(100) not null default 'India',
  address_type varchar(50) default 'billing',
  is_default boolean default false,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_number varchar(50) not null unique,
  billing_address_id uuid not null references public.addresses(id),
  shipping_address_id uuid not null references public.addresses(id),
  total_amount numeric(10, 2) not null,
  tax_amount numeric(10, 2) default 0,
  shipping_charge numeric(10, 2) default 0,
  discount_amount numeric(10, 2) default 0,
  status varchar(50) default 'pending',
  payment_status varchar(50) default 'pending',
  payment_id uuid,
  razorpay_order_id varchar(100),
  razorpay_payment_id varchar(100),
  notes text,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp,
  delivered_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name varchar(255) not null,
  quantity integer not null check (quantity > 0),
  price_per_unit numeric(10, 2) not null,
  discount_per_unit numeric(10, 2) default 0,
  total_price numeric(10, 2) not null,
  created_at timestamptz default current_timestamp
);

create table if not exists public.gifting_metadata (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  is_gift boolean default false,
  recipient_name varchar(255),
  recipient_phone varchar(20),
  recipient_email varchar(255),
  gift_message text,
  gift_wrap boolean default false,
  from_name varchar(255),
  created_at timestamptz default current_timestamp
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  razorpay_payment_id varchar(100) unique,
  razorpay_order_id varchar(100),
  amount numeric(10, 2) not null,
  currency varchar(10) default 'INR',
  status varchar(50) default 'pending',
  payment_method varchar(50),
  transaction_id varchar(100),
  error_code varchar(50),
  error_description text,
  response_data jsonb,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status varchar(50),
  new_status varchar(50) not null,
  changed_by uuid references auth.users(id),
  notes text,
  created_at timestamptz default current_timestamp
);

create index if not exists idx_addresses_user_id on public.addresses(user_id);
create index if not exists idx_addresses_is_default on public.addresses(user_id, is_default);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_payments_order_id on public.payments(order_id);
create index if not exists idx_payments_razorpay_payment_id on public.payments(razorpay_payment_id);
create index if not exists idx_gifting_metadata_order_id on public.gifting_metadata(order_id);
create index if not exists idx_order_status_history_order_id on public.order_status_history(order_id);

alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.gifting_metadata enable row level security;
alter table public.payments enable row level security;
alter table public.order_status_history enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  );
$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'addresses' and policyname = 'addresses_select_own') then
    create policy addresses_select_own on public.addresses for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'addresses' and policyname = 'addresses_insert_own') then
    create policy addresses_insert_own on public.addresses for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'addresses' and policyname = 'addresses_update_own') then
    create policy addresses_update_own on public.addresses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'addresses' and policyname = 'addresses_delete_own') then
    create policy addresses_delete_own on public.addresses for delete using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'addresses' and policyname = 'addresses_admin_select') then
    create policy addresses_admin_select on public.addresses for select using (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_select_own') then
    create policy orders_select_own on public.orders for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_insert_own') then
    create policy orders_insert_own on public.orders for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_update_own') then
    create policy orders_update_own on public.orders for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_admin_all') then
    create policy orders_admin_all on public.orders for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items' and policyname = 'order_items_select_own') then
    create policy order_items_select_own on public.order_items for select using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items' and policyname = 'order_items_insert_own') then
    create policy order_items_insert_own on public.order_items for insert with check (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items' and policyname = 'order_items_admin_select') then
    create policy order_items_admin_select on public.order_items for select using (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gifting_metadata' and policyname = 'gifting_select_own') then
    create policy gifting_select_own on public.gifting_metadata for select using (exists (select 1 from public.orders where orders.id = gifting_metadata.order_id and orders.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gifting_metadata' and policyname = 'gifting_insert_own') then
    create policy gifting_insert_own on public.gifting_metadata for insert with check (exists (select 1 from public.orders where orders.id = gifting_metadata.order_id and orders.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'gifting_metadata' and policyname = 'gifting_admin_select') then
    create policy gifting_admin_select on public.gifting_metadata for select using (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payments' and policyname = 'payments_select_own') then
    create policy payments_select_own on public.payments for select using (exists (select 1 from public.orders where orders.id = payments.order_id and orders.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payments' and policyname = 'payments_admin_select') then
    create policy payments_admin_select on public.payments for select using (public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_status_history' and policyname = 'order_status_history_select_own') then
    create policy order_status_history_select_own on public.order_status_history for select using (exists (select 1 from public.orders where orders.id = order_status_history.order_id and orders.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_status_history' and policyname = 'order_status_history_admin_all') then
    create policy order_status_history_admin_all on public.order_status_history for all using (public.is_admin()) with check (public.is_admin());
  end if;
end
$$;
