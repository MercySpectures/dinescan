create extension if not exists "pgcrypto";

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  address text,
  phone text,
  is_published boolean not null default false,
  theme_color text default '#22C55E',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_veg boolean not null default true,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scan_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  user_agent text
);

create table if not exists public.restaurant_memberships (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('manager', 'viewer')),
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_code text,
  session_id text,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'paid', 'cancelled')),
  subtotal numeric(10,2) not null default 0,
  service_charge numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  price numeric(10,2) not null,
  qty int not null check (qty > 0),
  note text,
  created_at timestamptz not null default now()
);

alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.scan_events enable row level security;
alter table public.restaurant_memberships enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "restaurants_owner_crud" on public.restaurants;
create policy "restaurants_owner_crud" on public.restaurants
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "restaurants_public_select" on public.restaurants;
create policy "restaurants_public_select" on public.restaurants
for select using (is_published = true);

drop policy if exists "categories_owner_crud" on public.categories;
create policy "categories_owner_crud" on public.categories
for all using (
  exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = auth.uid()
  )
);

drop policy if exists "categories_manager_crud" on public.categories;
create policy "categories_manager_crud" on public.categories
for all using (
  exists (
    select 1 from public.restaurant_memberships rm
    where rm.restaurant_id = categories.restaurant_id
      and rm.user_id = auth.uid()
      and rm.role = 'manager'
  )
)
with check (
  exists (
    select 1 from public.restaurant_memberships rm
    where rm.restaurant_id = categories.restaurant_id
      and rm.user_id = auth.uid()
      and rm.role = 'manager'
  )
);

drop policy if exists "categories_public_select" on public.categories;
create policy "categories_public_select" on public.categories
for select using (
  exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.is_published = true
  )
);

drop policy if exists "menu_items_owner_crud" on public.menu_items;
create policy "menu_items_owner_crud" on public.menu_items
for all using (
  exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = auth.uid()
  )
);

drop policy if exists "menu_items_manager_crud" on public.menu_items;
create policy "menu_items_manager_crud" on public.menu_items
for all using (
  exists (
    select 1 from public.restaurant_memberships rm
    where rm.restaurant_id = menu_items.restaurant_id
      and rm.user_id = auth.uid()
      and rm.role = 'manager'
  )
)
with check (
  exists (
    select 1 from public.restaurant_memberships rm
    where rm.restaurant_id = menu_items.restaurant_id
      and rm.user_id = auth.uid()
      and rm.role = 'manager'
  )
);

drop policy if exists "menu_items_public_select" on public.menu_items;
create policy "menu_items_public_select" on public.menu_items
for select using (
  is_available = true and exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.is_published = true
  )
);

drop policy if exists "scan_events_owner_select" on public.scan_events;
create policy "scan_events_owner_select" on public.scan_events
for select using (
  exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and r.owner_id = auth.uid()
  )
);

drop policy if exists "scan_events_member_select" on public.scan_events;
create policy "scan_events_member_select" on public.scan_events
for select using (
  exists (
    select 1 from public.restaurant_memberships rm
    where rm.restaurant_id = scan_events.restaurant_id
      and rm.user_id = auth.uid()
  )
);

drop policy if exists "scan_events_public_insert" on public.scan_events;
create policy "scan_events_public_insert" on public.scan_events
for insert with check (true);

drop policy if exists "orders_public_insert" on public.orders;
create policy "orders_public_insert" on public.orders
for insert with check (true);

drop policy if exists "orders_owner_select" on public.orders;
create policy "orders_owner_select" on public.orders
for select using (
  exists (
    select 1 from public.restaurants r
    where r.id = orders.restaurant_id and r.owner_id = auth.uid()
  )
);

drop policy if exists "orders_member_select" on public.orders;
create policy "orders_member_select" on public.orders
for select using (
  exists (
    select 1 from public.restaurant_memberships rm
    where rm.restaurant_id = orders.restaurant_id and rm.user_id = auth.uid()
  )
);

drop policy if exists "order_items_public_insert" on public.order_items;
create policy "order_items_public_insert" on public.order_items
for insert with check (true);

drop policy if exists "order_items_owner_select" on public.order_items;
create policy "order_items_owner_select" on public.order_items
for select using (
  exists (
    select 1 from public.orders o
    join public.restaurants r on r.id = o.restaurant_id
    where o.id = order_items.order_id and r.owner_id = auth.uid()
  )
);

drop policy if exists "order_items_member_select" on public.order_items;
create policy "order_items_member_select" on public.order_items
for select using (
  exists (
    select 1 from public.orders o
    join public.restaurant_memberships rm on rm.restaurant_id = o.restaurant_id
    where o.id = order_items.order_id and rm.user_id = auth.uid()
  )
);

drop policy if exists "restaurant_memberships_owner_manage" on public.restaurant_memberships;
create policy "restaurant_memberships_owner_manage" on public.restaurant_memberships
for all using (
  exists (
    select 1 from public.restaurants r
    where r.id = restaurant_memberships.restaurant_id and r.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.restaurants r
    where r.id = restaurant_memberships.restaurant_id and r.owner_id = auth.uid()
  )
);

drop policy if exists "restaurant_memberships_self_read" on public.restaurant_memberships;
create policy "restaurant_memberships_self_read" on public.restaurant_memberships
for select using (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

drop policy if exists "menu_images_public_read" on storage.objects;
create policy "menu_images_public_read" on storage.objects
for select using (bucket_id = 'menu-images');

drop policy if exists "menu_images_owner_write" on storage.objects;
create policy "menu_images_owner_write" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'menu-images'
  and split_part(name, '/', 1) in (
    select id::text from public.restaurants where owner_id = auth.uid()
  )
);

drop policy if exists "menu_images_owner_update" on storage.objects;
create policy "menu_images_owner_update" on storage.objects
for update to authenticated
using (
  bucket_id = 'menu-images'
  and split_part(name, '/', 1) in (
    select id::text from public.restaurants where owner_id = auth.uid()
  )
);

drop policy if exists "menu_images_owner_delete" on storage.objects;
create policy "menu_images_owner_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'menu-images'
  and split_part(name, '/', 1) in (
    select id::text from public.restaurants where owner_id = auth.uid()
  )
);
