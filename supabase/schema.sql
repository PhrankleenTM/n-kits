/* ============================================================
   N-KITS – Supabase database architecture
   ============================================================
   HOW TO USE
   1. Create a project at https://supabase.com
   2. Open  SQL Editor  ->  New query  ->  paste this file  ->  Run
   3. Project Settings -> API  ->  copy the Project URL and the
      anon/public key into  js/config.js
    4. Create the admin user in Supabase Dashboard -> Authentication -> Users,
       then run the "GRANT ADMIN" statement at the bottom of this file.
   5. Storage bucket "product-images" is created below and is
      used by the admin panel's image uploader.

   TABLES
      profiles    – one row per auth user, holds is_admin
      categories  – listing/filter options (shop sidebar, home grid)
      products    – the jerseys (title, price, images, sizes, …)
      settings    – key/value store (WhatsApp number, store settings, …)
      orders      – created on WhatsApp checkout; payment is confirmed manually

    SECURITY
      Row Level Security is enabled everywhere:
      · everyone can READ products / categories / settings
      · only admins (profiles.is_admin = true) can write
      · anyone can INSERT orders, only admins can read/manage them
      · customers are guests; there are no customer accounts or OTP flows
   ============================================================ */

-- ------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id         bigint generated always as identity primary key,
  slug       text not null unique,
  name       text not null,
  icon       text default '',                 -- inline <svg> markup
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id          bigint generated always as identity primary key,
  name        text not null,
  club        text default '',
  league      text default '',
  category    text references public.categories (slug) on delete set null,
  price       integer not null default 0 check (price >= 0),
  badge       text default '',                -- Retro / Classic / Limited / ''
  description text default '',
  images      text[] not null default '{}',   -- first image = cover
  sizes       text[] not null default '{M,L,XL}',
  featured    boolean not null default false, -- shows in "New Arrivals"
  in_stock    boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.settings (
  key        text primary key,                -- whatsapp_number, store_name, …
  value      text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id                bigint generated always as identity primary key,
  customer_name     text default '',
  customer_email    text default '',
  phone             text default '',
  address           text default '',
  city              text default '',
  items             jsonb not null default '[]'::jsonb,
  total             integer not null default 0,
  status            text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_status    text not null default 'unpaid'
                    check (payment_status in ('unpaid', 'paid', 'failed', 'refunded')),
  payment_reference text unique,               -- optional manual payment reference
  payment_channel   text default '',           -- manual method; WhatsApp orders use 'whatsapp'
  paid_at           timestamptz,
  note              text default '',
  created_at        timestamptz not null default now()
);

-- Idempotent upgrade: safe to re-run on a database created from an
-- older version of this file (adds any missing columns).
alter table public.orders add column if not exists phone             text default '';
alter table public.orders add column if not exists address           text default '';
alter table public.orders add column if not exists city              text default '';
alter table public.orders add column if not exists payment_status    text not null default 'unpaid';
alter table public.orders add column if not exists payment_reference text unique;
alter table public.orders add column if not exists payment_channel   text default '';
alter table public.orders add column if not exists paid_at           timestamptz;
alter table public.orders drop column if exists user_id;
-- re-apply the check if it was missing on old tables
do $$
begin
  alter table public.orders
    drop constraint if exists orders_payment_status_check;
  alter table public.orders
    add constraint orders_payment_status_check
    check (payment_status in ('unpaid', 'paid', 'failed', 'refunded'));
exception when others then null;
end $$;

create table if not exists public.order_track_attempts (
  key               text primary key,
  attempts          integer not null default 0,
  window_started_at timestamptz not null default now()
);

create index if not exists products_category_idx   on public.products (category);
create index if not exists products_created_idx    on public.products (created_at desc);
create index if not exists orders_created_idx      on public.orders (created_at desc);
create index if not exists orders_status_idx       on public.orders (status);
create index if not exists orders_payment_status_idx on public.orders (payment_status);

-- ------------------------------------------------------------
-- 2. HELPERS & TRIGGERS
-- ------------------------------------------------------------

-- SECURITY DEFINER so policies can check admin status without
-- the "infinite recursion" problem of querying profiles
-- inside a profiles policy.
create or replace function public.is_admin ()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((auth.jwt() #>> '{app_metadata,is_admin}')::boolean, false)
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and is_admin = true
      );
$$;

grant execute on function public.is_admin () to anon, authenticated;

create or replace function public.track_order(
  p_order_id bigint,
  p_match text,
  p_client text default ''
)
returns table (
  id bigint,
  customer_name text,
  customer_email text,
  phone text,
  address text,
  city text,
  items jsonb,
  total integer,
  status text,
  payment_status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_headers jsonb := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  v_ip text := split_part(coalesce(v_headers ->> 'x-forwarded-for', v_headers ->> 'cf-connecting-ip', v_headers ->> 'x-real-ip', 'guest'), ',', 1);
  v_key text := md5(trim(v_ip) || ':' || coalesce(nullif(trim(p_client), ''), 'guest'));
  v_attempts integer;
  v_started_at timestamptz;
  v_digits text := regexp_replace(coalesce(p_match, ''), '\D', '', 'g');
  v_email text := lower(trim(coalesce(p_match, '')));
begin
  delete from public.order_track_attempts where window_started_at < now() - interval '1 day';

  select attempts, window_started_at into v_attempts, v_started_at
  from public.order_track_attempts
  where key = v_key;

  if found and v_started_at > now() - interval '10 minutes' then
    if v_attempts >= 5 then
      raise exception 'Too many tracking attempts. Please try again in a few minutes.' using errcode = 'P0001';
    end if;
    update public.order_track_attempts
      set attempts = attempts + 1
      where key = v_key;
  else
    insert into public.order_track_attempts (key, attempts, window_started_at)
    values (v_key, 1, now())
    on conflict (key) do update
      set attempts = 1, window_started_at = now();
  end if;

  return query
  select o.id, o.customer_name, o.customer_email, o.phone, o.address, o.city, o.items, o.total, o.status, o.payment_status, o.created_at
  from public.orders o
  where o.id = p_order_id
    and (
      (v_digits <> '' and regexp_replace(coalesce(o.phone, ''), '\D', '', 'g') = v_digits)
      or (v_email <> '' and lower(coalesce(o.customer_email, '')) = v_email)
    );
end;
$$;

revoke all on function public.track_order(bigint, text, text) from public;
grant execute on function public.track_order(bigint, text, text) to anon, authenticated;

create or replace function public.create_guest_order(p_order jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  insert into public.orders (
    customer_name,
    customer_email,
    phone,
    address,
    city,
    items,
    total,
    status,
    payment_status,
    payment_reference,
    payment_channel,
    paid_at,
    note
  )
  values (
    coalesce(p_order ->> 'customer_name', ''),
    coalesce(p_order ->> 'customer_email', ''),
    coalesce(p_order ->> 'phone', ''),
    coalesce(p_order ->> 'address', ''),
    coalesce(p_order ->> 'city', ''),
    coalesce(p_order -> 'items', '[]'::jsonb),
    coalesce((p_order ->> 'total')::integer, 0),
    'pending',
    coalesce(p_order ->> 'payment_status', 'unpaid'),
    nullif(p_order ->> 'payment_reference', ''),
    coalesce(p_order ->> 'payment_channel', ''),
    nullif(p_order ->> 'paid_at', '')::timestamptz,
    coalesce(p_order ->> 'note', '')
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_guest_order(jsonb) from public;
grant execute on function public.create_guest_order(jsonb) to anon, authenticated;

create or replace function public.set_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- Create a profile row automatically on signup
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table public.profiles  enable row level security;
alter table public.categories enable row level security;
alter table public.products  enable row level security;
alter table public.settings  enable row level security;
alter table public.orders    enable row level security;
alter table public.order_track_attempts enable row level security;

revoke all on table public.order_track_attempts from anon, authenticated;

-- profiles ----------------------------------------------------
drop policy if exists "profiles read own"        on public.profiles;
drop policy if exists "profiles admin read all"  on public.profiles;
drop policy if exists "profiles update own"      on public.profiles;

create policy "profiles read own"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "profiles admin read all"
  on public.profiles for select to authenticated
  using (public.is_admin ());

revoke update on table public.profiles from anon, authenticated;

-- categories --------------------------------------------------
drop policy if exists "categories public read"  on public.categories;
drop policy if exists "categories admin write"  on public.categories;

create policy "categories public read"
  on public.categories for select
  using (true);

create policy "categories admin write"
  on public.categories for all to authenticated
  using (public.is_admin ())
  with check (public.is_admin ());

-- products ----------------------------------------------------
drop policy if exists "products public read"    on public.products;
drop policy if exists "products admin write"    on public.products;

create policy "products public read"
  on public.products for select
  using (true);

create policy "products admin write"
  on public.products for all to authenticated
  using (public.is_admin ())
  with check (public.is_admin ());

-- settings ----------------------------------------------------
drop policy if exists "settings public read"    on public.settings;
drop policy if exists "settings admin write"    on public.settings;

create policy "settings public read"
  on public.settings for select
  using (true);

create policy "settings admin write"
  on public.settings for all to authenticated
  using (public.is_admin ())
  with check (public.is_admin ());

-- orders ------------------------------------------------------
drop policy if exists "orders insert public"    on public.orders;
drop policy if exists "orders read own"         on public.orders;
drop policy if exists "orders admin read"       on public.orders;
drop policy if exists "orders admin update"     on public.orders;
drop policy if exists "orders admin delete"     on public.orders;

create policy "orders insert public"
  on public.orders for insert
  with check (true);

create policy "orders admin read"
  on public.orders for select to authenticated
  using (public.is_admin ());

create policy "orders admin update"
  on public.orders for update to authenticated
  using (public.is_admin ())
  with check (public.is_admin ());

create policy "orders admin delete"
  on public.orders for delete to authenticated
  using (public.is_admin ());

grant usage on schema public to anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant select on table public.products to anon, authenticated;
grant select on table public.settings to anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert, update, delete on table public.categories to authenticated;
grant insert, update, delete on table public.products to authenticated;
grant insert, update, delete on table public.settings to authenticated;
grant insert on table public.orders to anon;
grant select, insert, update, delete on table public.orders to authenticated;

-- ------------------------------------------------------------
-- 4. STORAGE (jersey uploads)
--     If your project rejects policy creation on storage.objects
--     from the SQL editor, create the bucket and these four
--     policies in  Dashboard -> Storage  instead: bucket
--     "product-images" (public), read for everyone, and
--     insert/update/delete allowed only for admins.
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product images public read"   on storage.objects;
drop policy if exists "product images admin insert"  on storage.objects;
drop policy if exists "product images admin update"  on storage.objects;
drop policy if exists "product images admin delete"  on storage.objects;

create policy "product images public read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product images admin insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin ());

create policy "product images admin update"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin ())
  with check (bucket_id = 'product-images' and public.is_admin ());

create policy "product images admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin ());

-- ------------------------------------------------------------
-- 5. SEED – categories, settings, sample jerseys
-- ------------------------------------------------------------

insert into public.categories (slug, name, icon, sort_order) values
  ('all',             'All Jerseys',
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20"/><path d="M12 2a15 15 0 0 0 0 20"/><path d="M2 12h20"/></svg>', 0),
  ('premier-league',  'Premier League',
    '<img src="assets/categories/premier-league.svg" alt="">', 1),
  ('la-liga',         'La Liga',
    '<img src="assets/categories/la-liga.svg" alt="">', 2),
  ('serie-a',         'Serie A',
    '<img src="assets/categories/serie-a.svg" alt="">', 3),
  ('international',   'International',
    '<span class="flag-stack"><img src="assets/categories/ng.png" alt="Nigeria"><img src="assets/categories/br.png" alt="Brazil"><img src="assets/categories/ar.png" alt="Argentina"></span>', 4)
on conflict (slug) do nothing;

insert into public.settings (key, value) values
  ('store_name',        'N-KITS'),
  ('whatsapp_number',   '2348012345678'),
  ('whatsapp_prefill',  ''),
  ('contact_email',     ''),
  ('instagram',         ''),
  ('customization_fee', '3000')
on conflict (key) do nothing;

insert into public.products
  (name, club, league, category, price, badge, description, images, sizes, featured, in_stock)
values
  ('Manchester United 09/10 Home', 'Manchester United', 'Premier League', 'premier-league', 85000, 'Retro',
   'The iconic AON-sponsored home jersey worn during the 2009/10 season. Classic red with white and black trim.',
   array['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=720&fit=crop'],
   array['S','M','L','XL','XXL'], true, true),

  ('Arsenal 05/06 Highbury', 'Arsenal', 'Premier League', 'premier-league', 78000, 'Classic',
   'The final Highbury season jersey. Redcurrant kit that marked the end of an era.',
   array['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=720&fit=crop'],
   array['S','M','L','XL'], true, true),

  ('Barcelona 10/11 Home', 'FC Barcelona', 'La Liga', 'la-liga', 82000, 'Retro',
   'Messi''s peak years. The famous blaugrana kit from the 2010/11 Champions League campaign.',
   array['https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600&h=720&fit=crop'],
   array['S','M','L','XL','XXL'], true, true),

  ('Nigeria 1994 World Cup', 'Nigeria', 'International', 'international', 92000, 'Limited',
   'The legendary green eagle jersey from USA 94. Worn by the Super Eagles during their most memorable World Cup run.',
   array['https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&h=720&fit=crop'],
   array['M','L','XL','XXL'], true, true),

  ('AC Milan 06/07 Home', 'AC Milan', 'Serie A', 'serie-a', 80000, 'Retro',
   'The red and black stripes that conquered Europe. Champions League winners kit.',
   array['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=720&fit=crop&sat=-30'],
   array['S','M','L','XL'], false, true),

  ('Real Madrid 01/02 Away', 'Real Madrid', 'La Liga', 'la-liga', 88000, 'Classic',
   'Zidane''s famous black away kit. The season of the volley in Glasgow.',
   array['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=720&fit=crop&sat=-20'],
   array['S','M','L','XL','XXL'], false, true),

  ('Liverpool 08/09 Home', 'Liverpool', 'Premier League', 'premier-league', 79000, 'Retro',
   'Carlsberg-sponsored classic red. Gerrard''s era at its peak.',
   array['https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600&h=720&fit=crop&sat=-40'],
   array['S','M','L','XL'], false, true),

  ('Brazil 2002 Home', 'Brazil', 'International', 'international', 95000, 'Limited',
   'The yellow of the five-time champions. Ronaldo, Rivaldo and Ronaldinho''s World Cup kit.',
   array['https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&h=720&fit=crop&sat=-10'],
   array['S','M','L','XL','XXL'], true, true),

  ('Juventus 96/97 Home', 'Juventus', 'Serie A', 'serie-a', 76000, 'Classic',
   'The black and white stripes of the Champions League winners.',
   array['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=720&fit=crop&sat=-50'],
   array['M','L','XL'], false, true),

  ('Chelsea 03/04 Away', 'Chelsea', 'Premier League', 'premier-league', 74000, 'Retro',
   'The white away kit from the first Mourinho season.',
   array['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=720&fit=crop&sat=-60'],
   array['S','M','L','XL','XXL'], false, true),

  ('Inter Milan 09/10 Home', 'Inter Milan', 'Serie A', 'serie-a', 81000, 'Retro',
   'Treble-winning kit. The last great Inter side under Mourinho.',
   array['https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600&h=720&fit=crop&sat=-25'],
   array['S','M','L','XL'], false, true),

  ('Argentina 1986 Home', 'Argentina', 'International', 'international', 98000, 'Limited',
   'Maradona''s hand of God and goal of the century kit.',
   array['https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&h=720&fit=crop&sat=-5'],
   array['S','M','L','XL','XXL'], true, true);

-- ------------------------------------------------------------
-- 6. GRANT ADMIN
-- ------------------------------------------------------------
-- Create the admin user in Supabase Dashboard -> Authentication -> Users,
-- then run:
--   update public.profiles
--     set is_admin = true
--     where id = (select id from auth.users where email = 'you@example.com');
--
-- Verify with:
--   select email, is_admin from public.profiles
--     join auth.users on auth.users.id = profiles.id;
