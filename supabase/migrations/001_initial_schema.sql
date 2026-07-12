-- TransitOps Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- ============================================
-- 1. PROFILES (linked to auth.users)
-- ============================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text
    check (role is null or role in ('fleet_manager', 'driver', 'safety_officer', 'financial_analyst')),
  created_at timestamptz not null default now()
);

-- Profiles are created by the app after signup (no trigger needed)

-- ============================================
-- 2. VEHICLES
-- ============================================
create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  registration_number text not null unique,
  model text not null,
  type text not null default 'Van',
  capacity numeric not null check (capacity > 0),
  odometer numeric not null default 0 check (odometer >= 0),
  acquisition_cost numeric not null default 0 check (acquisition_cost >= 0),
  status text not null default 'available'
    check (status in ('available', 'on_trip', 'in_shop', 'retired')),
  created_at timestamptz not null default now()
);

-- ============================================
-- 3. DRIVERS
-- ============================================
create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  license_number text not null unique,
  license_category text not null default 'B',
  license_expiry date not null,
  contact text not null default '',
  safety_score numeric not null default 100 check (safety_score >= 0 and safety_score <= 100),
  status text not null default 'available'
    check (status in ('available', 'on_trip', 'off_duty', 'suspended')),
  created_at timestamptz not null default now()
);

-- ============================================
-- 4. TRIPS
-- ============================================
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  driver_id uuid not null references drivers(id) on delete restrict,
  source text not null,
  destination text not null,
  cargo_weight numeric not null check (cargo_weight > 0),
  planned_distance numeric not null check (planned_distance > 0),
  fuel_used numeric default 0,
  final_odometer numeric default 0,
  status text not null default 'draft'
    check (status in ('draft', 'dispatched', 'completed', 'cancelled')),
  dispatched_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================
-- 5. MAINTENANCE
-- ============================================
create table if not exists maintenance (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  title text not null,
  description text not null default '',
  cost numeric not null default 0 check (cost >= 0),
  status text not null default 'open'
    check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

-- ============================================
-- 6. FUEL LOGS
-- ============================================
create table if not exists fuel_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  litres numeric not null check (litres > 0),
  cost numeric not null check (cost >= 0),
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ============================================
-- 7. EXPENSES
-- ============================================
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  trip_id uuid references trips(id) on delete set null,
  type text not null
    check (type in ('toll', 'maintenance', 'miscellaneous')),
  amount numeric not null check (amount > 0),
  description text not null default '',
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table drivers enable row level security;
alter table trips enable row level security;
alter table maintenance enable row level security;
alter table fuel_logs enable row level security;
alter table expenses enable row level security;

-- Allow authenticated users full access (hackathon - keep simple)
do $$ begin
  create policy "Authenticated users can read profiles"
    on profiles for select to authenticated using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can insert own profile"
    on profiles for insert to authenticated with check (auth.uid() = id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update own profile"
    on profiles for update to authenticated using (auth.uid() = id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Authenticated users full access on vehicles"
    on vehicles for all to authenticated using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Authenticated users full access on drivers"
    on drivers for all to authenticated using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Authenticated users full access on trips"
    on trips for all to authenticated using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Authenticated users full access on maintenance"
    on maintenance for all to authenticated using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Authenticated users full access on fuel_logs"
    on fuel_logs for all to authenticated using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Authenticated users full access on expenses"
    on expenses for all to authenticated using (true);
exception when duplicate_object then null;
end $$;

-- ============================================
-- INDEXES for performance
-- ============================================
create index if not exists idx_vehicles_status on vehicles(status);
create index if not exists idx_vehicles_reg_number on vehicles(registration_number);
create index if not exists idx_drivers_status on drivers(status);
create index if not exists idx_drivers_license on drivers(license_number);
create index if not exists idx_trips_status on trips(status);
create index if not exists idx_trips_vehicle on trips(vehicle_id);
create index if not exists idx_trips_driver on trips(driver_id);
create index if not exists idx_maintenance_vehicle on maintenance(vehicle_id);
create index if not exists idx_fuel_logs_vehicle on fuel_logs(vehicle_id);
create index if not exists idx_expenses_vehicle on expenses(vehicle_id);
