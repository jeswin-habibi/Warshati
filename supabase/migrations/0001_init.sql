-- Warshati — Phase 1 schema (multi-tenant mechanic-shop management)
-- Run this whole file in your Supabase project's SQL Editor (a fresh project).
-- Multi-tenant: every business-scoped row is isolated by business_id via RLS.

create extension if not exists pgcrypto;

-- ───────────────────────── core / tenancy ─────────────────────────
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  currency text not null default 'KWD',
  language text not null default 'ar',
  logo_url text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists business_users (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','mechanic','cashier')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

-- ───────────────────────── helpers (defined after business_users so SQL bodies validate) ─────────────────────────
create or replace function public.is_member(bid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from business_users bu where bu.business_id = bid and bu.user_id = auth.uid());
$$;

create or replace function public.has_role(bid uuid, variadic roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from business_users bu
    where bu.business_id = bid and bu.user_id = auth.uid() and bu.role = any(roles)
  );
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ───────────────────────── customers & vehicles ─────────────────────────
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  phone text,
  alt_phone text,
  civil_id text,
  notes text,
  voice_note_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  plate_number text,
  make text,
  model text,
  year int,
  color text,
  vin text,
  mileage_last_seen numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────────────────── services catalog ─────────────────────────
create table if not exists service_types (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name_ar text not null,
  name_en text,
  default_price numeric not null default 0,
  default_duration_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────────────────── inventory & purchasing ─────────────────────────
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name_ar text not null,
  name_en text,
  sku text,
  category text,
  current_stock numeric not null default 0,
  min_stock_alert numeric,
  cost_price numeric not null default 0,
  sell_price numeric not null default 0,
  track_stock boolean not null default true,
  has_expiry boolean not null default false,
  photo_url text,
  voice_note_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  item_id uuid not null references inventory_items(id) on delete cascade,
  type text not null check (type in ('in','out','adjustment')),
  quantity numeric not null default 0,
  unit_cost numeric,
  reason text,
  related_invoice_id uuid,
  related_purchase_id uuid,
  expiry_date date,
  batch_number text,
  created_at timestamptz not null default now()
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete set null,
  total numeric not null default 0,
  payment_status text not null default 'paid' check (payment_status in ('paid','partial','credit')),
  paid_amount numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchase_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  purchase_id uuid not null references purchases(id) on delete cascade,
  item_id uuid references inventory_items(id) on delete set null,
  quantity numeric not null default 0,
  unit_cost numeric not null default 0,
  expiry_date date
);

-- ───────────────────────── jobs / invoices (revenue core) ─────────────────────────
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  vehicle_id uuid references vehicles(id) on delete set null,
  status text not null default 'estimate' check (status in ('estimate','in_progress','completed','cancelled')),
  mileage_at_visit numeric,
  complaint_text text,
  complaint_voice_url text,
  diagnosis_text text,
  diagnosis_voice_url text,
  assigned_to_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists job_line_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  type text not null check (type in ('labor','part','service','resale')),
  description text not null default '',
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  cost_price numeric,
  inventory_item_id uuid references inventory_items(id) on delete set null,
  total numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists job_attachments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  type text not null check (type in ('photo','audio','document')),
  url text not null,
  caption text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  invoice_number text,
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  total numeric not null default 0,
  payment_method text check (payment_method in ('cash','knet','credit','mixed')),
  paid_amount numeric not null default 0,
  balance numeric not null default 0,
  issued_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, invoice_number)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric not null default 0,
  method text check (method in ('cash','knet','credit')),
  paid_at timestamptz not null default now(),
  notes text
);

-- ───────────────────────── expenses ─────────────────────────
create table if not exists expense_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name_ar text not null,
  name_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  category text not null default 'other',
  amount numeric not null default 0,
  description text,
  paid_to text,
  expense_date date not null default current_date,
  attachment_url text,
  recurring boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────────────────── audit ─────────────────────────
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

-- ───────────────────────── indexes ─────────────────────────
create index if not exists idx_customers_business on customers (business_id);
create index if not exists idx_customers_phone on customers (business_id, phone);
create index if not exists idx_vehicles_customer on vehicles (customer_id);
create index if not exists idx_vehicles_plate on vehicles (business_id, plate_number);
create index if not exists idx_inventory_business on inventory_items (business_id);
create index if not exists idx_movements_item on inventory_movements (item_id);
create index if not exists idx_jobs_business_status on jobs (business_id, status);
create index if not exists idx_jobs_customer on jobs (customer_id);
create index if not exists idx_line_items_job on job_line_items (job_id);
create index if not exists idx_attachments_job on job_attachments (job_id);
create index if not exists idx_invoices_business on invoices (business_id, issued_at);
create index if not exists idx_payments_invoice on payments (invoice_id);
create index if not exists idx_expenses_business_date on expenses (business_id, expense_date);
create index if not exists idx_business_users_user on business_users (user_id);

-- ───────────────────────── updated_at triggers ─────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'businesses','profiles','customers','vehicles','service_types','suppliers',
    'inventory_items','purchases','jobs','job_line_items','invoices','expenses','expense_categories'
  ] loop
    execute format('drop trigger if exists trg_updated_at on %I', t);
    execute format('create trigger trg_updated_at before update on %I for each row execute function set_updated_at()', t);
  end loop;
end $$;

-- ───────────────────────── RLS ─────────────────────────
-- Business-member full access (every role in the business).
do $$
declare t text;
begin
  foreach t in array array[
    'customers','vehicles','service_types','suppliers','inventory_items','inventory_movements',
    'purchases','purchase_items','jobs','job_line_items','job_attachments','activity_log'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists member_all on %I', t);
    execute format('create policy member_all on %I for all to authenticated using (is_member(business_id)) with check (is_member(business_id))', t);
  end loop;
end $$;

-- businesses: members read; any authed user can create; owners manage.
alter table businesses enable row level security;
drop policy if exists biz_select on businesses;
drop policy if exists biz_insert on businesses;
drop policy if exists biz_modify on businesses;
create policy biz_select on businesses for select to authenticated using (is_member(id));
create policy biz_insert on businesses for insert to authenticated with check (auth.uid() is not null);
create policy biz_modify on businesses for update to authenticated using (has_role(id,'owner')) with check (has_role(id,'owner'));

-- business_users: members read; self-join allowed (onboarding); owners manage staff.
alter table business_users enable row level security;
drop policy if exists bu_select on business_users;
drop policy if exists bu_insert on business_users;
drop policy if exists bu_modify on business_users;
drop policy if exists bu_delete on business_users;
create policy bu_select on business_users for select to authenticated using (is_member(business_id));
create policy bu_insert on business_users for insert to authenticated with check (user_id = auth.uid() or has_role(business_id,'owner'));
create policy bu_modify on business_users for update to authenticated using (has_role(business_id,'owner')) with check (has_role(business_id,'owner'));
create policy bu_delete on business_users for delete to authenticated using (has_role(business_id,'owner'));

-- profiles: each user manages their own.
alter table profiles enable row level security;
drop policy if exists prof_all on profiles;
create policy prof_all on profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- invoices & payments: owners + cashiers (mechanics excluded).
alter table invoices enable row level security;
drop policy if exists inv_all on invoices;
create policy inv_all on invoices for all to authenticated using (has_role(business_id,'owner','cashier')) with check (has_role(business_id,'owner','cashier'));

alter table payments enable row level security;
drop policy if exists pay_all on payments;
create policy pay_all on payments for all to authenticated using (has_role(business_id,'owner','cashier')) with check (has_role(business_id,'owner','cashier'));

-- expenses & categories: owners only.
alter table expenses enable row level security;
drop policy if exists exp_all on expenses;
create policy exp_all on expenses for all to authenticated using (has_role(business_id,'owner')) with check (has_role(business_id,'owner'));

alter table expense_categories enable row level security;
drop policy if exists expcat_all on expense_categories;
create policy expcat_all on expense_categories for all to authenticated using (has_role(business_id,'owner')) with check (has_role(business_id,'owner'));

-- ───────────────────────── Storage (private 'media' bucket) ─────────────────────────
-- Files are stored under '<business_id>/...'; access is gated by membership of that business.
insert into storage.buckets (id, name, public) values ('media','media', false) on conflict (id) do nothing;

drop policy if exists media_member_all on storage.objects;
create policy media_member_all on storage.objects for all to authenticated
  using (bucket_id = 'media' and is_member(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'media' and is_member(((storage.foldername(name))[1])::uuid));
