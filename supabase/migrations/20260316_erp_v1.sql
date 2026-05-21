create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'ventas', 'finanzas', 'bodega', 'rrhh');
  end if;

  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type public.invoice_status as enum ('draft', 'issued', 'partially_paid', 'paid', 'cancelled', 'overdue');
  end if;

  if not exists (select 1 from pg_type where typname = 'receivable_status') then
    create type public.receivable_status as enum ('open', 'partial', 'settled', 'overdue');
  end if;

  if not exists (select 1 from pg_type where typname = 'cash_movement_status') then
    create type public.cash_movement_status as enum ('pending', 'confirmed', 'reversed');
  end if;

  if not exists (select 1 from pg_type where typname = 'cash_movement_kind') then
    create type public.cash_movement_kind as enum ('income', 'expense');
  end if;
end $$;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  email text not null,
  full_name text not null,
  role public.app_role not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  name text not null,
  rut text not null,
  email text,
  phone text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, rut)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  name text not null,
  sku text not null,
  description text,
  unit_price numeric(14,2) not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, sku)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  name text not null,
  rut text not null,
  category text,
  email text,
  phone text,
  pending_balance numeric(14,2) not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  full_name text not null,
  role_name text not null,
  department text not null,
  email text,
  status text not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  number text not null,
  issue_date date not null,
  due_date date not null,
  currency text not null default 'CLP',
  notes text,
  subtotal numeric(14,2) not null,
  tax numeric(14,2) not null,
  total numeric(14,2) not null,
  status public.invoice_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, number)
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  qty numeric(14,2) not null,
  unit_price numeric(14,2) not null,
  line_total numeric(14,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounts_receivable (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  invoice_id uuid not null unique references public.invoices(id) on delete cascade,
  balance numeric(14,2) not null,
  status public.receivable_status not null default 'open',
  due_date date not null,
  last_payment_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  source_type text not null,
  source_id uuid,
  kind public.cash_movement_kind not null,
  amount numeric(14,2) not null,
  movement_date date not null,
  reference text,
  payment_method text,
  status public.cash_movement_status not null default 'confirmed',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_tenant on public.profiles(tenant_id);
create index if not exists idx_customers_tenant on public.customers(tenant_id);
create index if not exists idx_invoices_tenant on public.invoices(tenant_id);
create index if not exists idx_invoices_status on public.invoices(tenant_id, status);
create index if not exists idx_invoice_items_invoice on public.invoice_items(invoice_id);
create index if not exists idx_receivable_tenant on public.accounts_receivable(tenant_id, status);
create index if not exists idx_cash_movements_tenant on public.cash_movements(tenant_id, movement_date desc);
