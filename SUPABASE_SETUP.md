# Supabase Setup

Use this project as a cloud-backed React store with Supabase for login, signup, and admin product management.

## Environment variables

Add these to your local `.env` and the hosting provider's environment settings:

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Database tables

Run the following SQL in the Supabase SQL editor:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  address text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

alter table public.profiles enable row level security;
alter table public.products enable row level security;

create policy "Profiles are readable by owner" on public.profiles
for select using (auth.uid() = id);

create policy "Profiles are insertable by owner" on public.profiles
for insert with check (auth.uid() = id);

create policy "Profiles are updatable by owner" on public.profiles
for update using (auth.uid() = id);

create policy "Products are readable by everyone" on public.products
for select using (true);

create policy "Products are editable by admins" on public.products
for all using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
) with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
```

## Admin login

1. Create a normal Supabase auth user for the admin email.
2. Insert a matching row in `public.profiles` and set `role = 'admin'`.
3. Log in with that account in the app and open `/admin`.

## Google login

1. In Supabase, open Authentication > Providers.
2. Enable Google and paste the client ID and client secret from Google Cloud.
3. Add these redirect URLs in Supabase and Google:
  - `http://localhost:5173/profile`
  - your deployed site URL followed by `/profile`

Google login avoids the email verification limit that can affect email sign-up flows.

## Save address

The profile page now saves `full_name` and `address` into `public.profiles`.
Use the profile form after logging in to store the delivery address for future orders.

## Bulk import local products into Supabase

If you have existing products in `src/data/products.json`, use the included Node script to bulk import them into your Supabase `public.products` table.

1. Add your Supabase project URL and **service role** key (do NOT commit the service role key) to your shell:

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ... (service role key)
```

2. From the project root, run:

```bash
node tools/import_products.mjs
```

The script upserts all products and reports progress. Use the service role key only for this one-time import.

## Publishing

This app is a Vite frontend, so it can be deployed on Vercel, Netlify, or any static host.

1. Set the Supabase environment variables in the hosting dashboard.
2. Run `npm run build`.
3. Deploy the generated static output.
