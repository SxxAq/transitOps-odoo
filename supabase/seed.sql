-- ============================================
-- TransitOps: Create Tables + Seed Data
-- Paste this ENTIRE file into Supabase SQL Editor and run
-- ============================================

-- ============================================
-- TABLES
-- ============================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'fleet_manager'
    check (role in ('fleet_manager', 'driver', 'safety_officer', 'financial_analyst')),
  created_at timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

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

create table if not exists fuel_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  litres numeric not null check (litres > 0),
  cost numeric not null check (cost >= 0),
  date date not null default current_date,
  created_at timestamptz not null default now()
);

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
-- RLS
-- ============================================

alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table drivers enable row level security;
alter table trips enable row level security;
alter table maintenance enable row level security;
alter table fuel_logs enable row level security;
alter table expenses enable row level security;

do $$ begin
  create policy "Authenticated users can read profiles" on profiles for select to authenticated using (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "Users can update own profile" on profiles for update to authenticated using (auth.uid() = id);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "Authenticated users full access on vehicles" on vehicles for all to authenticated using (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "Authenticated users full access on drivers" on drivers for all to authenticated using (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "Authenticated users full access on trips" on trips for all to authenticated using (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "Authenticated users full access on maintenance" on maintenance for all to authenticated using (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "Authenticated users full access on fuel_logs" on fuel_logs for all to authenticated using (true);
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy "Authenticated users full access on expenses" on expenses for all to authenticated using (true);
exception when duplicate_object then null;
end $$;

-- ============================================
-- INDEXES
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

-- ============================================
-- SEED DATA: Vehicles (10)
-- ============================================

insert into vehicles (registration_number, model, type, capacity, odometer, acquisition_cost, status) values
  ('VAN-01', 'Toyota HiAce', 'Van', 800, 34200, 28000, 'available'),
  ('VAN-02', 'Ford Transit', 'Van', 1000, 51000, 32000, 'available'),
  ('VAN-03', 'Mercedes Sprinter', 'Van', 1200, 28000, 45000, 'on_trip'),
  ('TRK-01', 'Volvo FH16', 'Truck', 5000, 120000, 85000, 'available'),
  ('TRK-02', 'Scania R450', 'Truck', 45000, 98000, 78000, 'in_shop'),
  ('TRK-03', 'MAN TGX', 'Truck', 6000, 75000, 72000, 'available'),
  ('BUS-01', 'Isuzu Erga Mio', 'Bus', 2000, 65000, 55000, 'retired'),
  ('TRL-01', 'Schmitz Cargobull', 'Trailer', 8000, 42000, 35000, 'available'),
  ('VAN-04', 'Nissan NV350', 'Van', 900, 19000, 26000, 'on_trip'),
  ('TRK-04', 'Hino 700', 'Truck', 5500, 88000, 68000, 'available')
on conflict (registration_number) do nothing;

-- ============================================
-- SEED DATA: Drivers (8)
-- ============================================

insert into drivers (name, license_number, license_category, license_expiry, contact, safety_score, status) values
  ('Alex Johnson', 'LIC-1001', 'B', '2027-06-15', '+1 555-0101', 95, 'available'),
  ('Maria Garcia', 'LIC-1002', 'C', '2026-11-20', '+1 555-0102', 88, 'on_trip'),
  ('David Chen', 'LIC-1003', 'B', '2025-03-10', '+1 555-0103', 72, 'available'),
  ('Sarah Williams', 'LIC-1004', 'D', '2028-01-25', '+1 555-0104', 91, 'available'),
  ('James Brown', 'LIC-1005', 'B', '2024-08-30', '+1 555-0105', 65, 'suspended'),
  ('Emily Davis', 'LIC-1006', 'C', '2027-04-18', '+1 555-0106', 82, 'off_duty'),
  ('Omar Hassan', 'LIC-1007', 'B', '2026-09-05', '+1 555-0107', 94, 'available'),
  ('Lisa Martinez', 'LIC-1008', 'B', '2027-12-01', '+1 555-0108', 89, 'on_trip')
on conflict (license_number) do nothing;

-- ============================================
-- SEED DATA: Trips (6)
-- ============================================

-- We need vehicle and driver IDs, so use subqueries
insert into trips (vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, fuel_used, final_odometer, status, dispatched_at, completed_at)
select
  (select id from vehicles where registration_number = 'VAN-03'),
  (select id from drivers where license_number = 'LIC-1002'),
  'Lahore Warehouse', 'Islamabad Hub', 850, 380, 42, 28042, 'dispatched', now() - interval '2 hours', null
where not exists (select 1 from trips where source = 'Lahore Warehouse' and destination = 'Islamabad Hub');

insert into trips (vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, fuel_used, final_odometer, status, dispatched_at, completed_at)
select
  (select id from vehicles where registration_number = 'VAN-04'),
  (select id from drivers where license_number = 'LIC-1008'),
  'Karachi Port', 'Multan Depot', 600, 520, 55, 19055, 'dispatched', now() - interval '5 hours', null
where not exists (select 1 from trips where source = 'Karachi Port' and destination = 'Multan Depot');

insert into trips (vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, fuel_used, final_odometer, status, dispatched_at, completed_at)
select
  (select id from vehicles where registration_number = 'VAN-01'),
  (select id from drivers where license_number = 'LIC-1001'),
  'Faisalabad Hub', 'Peshawar Gate', 500, 450, 38, 34238, 'completed', now() - interval '1 day', now() - interval '3 hours'
where not exists (select 1 from trips where source = 'Faisalabad Hub' and destination = 'Peshawar Gate');

insert into trips (vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, fuel_used, final_odometer, status, dispatched_at, completed_at)
select
  (select id from vehicles where registration_number = 'VAN-02'),
  (select id from drivers where license_number = 'LIC-1004'),
  'Quetta Terminal', 'Sukkur Yard', 700, 320, 0, 0, 'draft', null, null
where not exists (select 1 from trips where source = 'Quetta Terminal' and destination = 'Sukkur Yard');

insert into trips (vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, fuel_used, final_odometer, status, dispatched_at, completed_at)
select
  (select id from vehicles where registration_number = 'TRK-01'),
  (select id from drivers where license_number = 'LIC-1007'),
  'Lahore Factory', 'Gwadar Port', 4200, 1100, 120, 120120, 'completed', now() - interval '3 days', now() - interval '1 day'
where not exists (select 1 from trips where source = 'Lahore Factory' and destination = 'Gwadar Port');

insert into trips (vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, fuel_used, final_odometer, status, dispatched_at, completed_at)
select
  (select id from vehicles where registration_number = 'TRK-03'),
  (select id from drivers where license_number = 'LIC-1003'),
  'Islamabad Hub', 'Lahore Warehouse', 5500, 380, 0, 0, 'cancelled', null, null
where not exists (select 1 from trips where source = 'Islamabad Hub' and destination = 'Lahore Warehouse');

-- ============================================
-- SEED DATA: Maintenance (5)
-- ============================================

insert into maintenance (vehicle_id, title, description, cost, status)
select
  (select id from vehicles where registration_number = 'TRK-02'),
  'Engine Overhaul', 'Full engine rebuild due to high mileage', 4500, 'open'
where not exists (select 1 from maintenance where title = 'Engine Overhaul' and vehicle_id = (select id from vehicles where registration_number = 'TRK-02'));

insert into maintenance (vehicle_id, title, description, cost, status)
select
  (select id from vehicles where registration_number = 'VAN-03'),
  'Brake Pad Replacement', 'Front and rear brake pads replaced', 350, 'closed'
where not exists (select 1 from maintenance where title = 'Brake Pad Replacement' and vehicle_id = (select id from vehicles where registration_number = 'VAN-03'));

insert into maintenance (vehicle_id, title, description, cost, status)
select
  (select id from vehicles where registration_number = 'TRK-01'),
  'Oil Change', 'Regular 10000km oil change service', 120, 'closed'
where not exists (select 1 from maintenance where title = 'Oil Change' and vehicle_id = (select id from vehicles where registration_number = 'TRK-01'));

insert into maintenance (vehicle_id, title, description, cost, status)
select
  (select id from vehicles where registration_number = 'VAN-01'),
  'AC Compressor Repair', 'AC not cooling, compressor replaced', 480, 'closed'
where not exists (select 1 from maintenance where title = 'AC Compressor Repair' and vehicle_id = (select id from vehicles where registration_number = 'VAN-01'));

insert into maintenance (vehicle_id, title, description, cost, status)
select
  (select id from vehicles where registration_number = 'BUS-01'),
  'Tire Replacement', 'All 6 tires replaced - vehicle retired after', 1200, 'closed'
where not exists (select 1 from maintenance where title = 'Tire Replacement' and vehicle_id = (select id from vehicles where registration_number = 'BUS-01'));

-- ============================================
-- SEED DATA: Fuel Logs (10)
-- ============================================

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'VAN-01'), 45, 52.50, '2025-07-01'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'VAN-01') and date = '2025-07-01');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'VAN-01'), 50, 58.00, '2025-07-05'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'VAN-01') and date = '2025-07-05');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'VAN-02'), 60, 69.60, '2025-07-02'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'VAN-02') and date = '2025-07-02');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'VAN-03'), 42, 48.72, '2025-07-03'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'VAN-03') and date = '2025-07-03');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'TRK-01'), 180, 208.80, '2025-07-01'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'TRK-01') and date = '2025-07-01');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'TRK-01'), 200, 232.00, '2025-07-06'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'TRK-01') and date = '2025-07-06');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'TRK-03'), 160, 185.60, '2025-07-04'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'TRK-03') and date = '2025-07-04');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'VAN-04'), 38, 44.08, '2025-07-02'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'VAN-04') and date = '2025-07-02');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'TRK-04'), 170, 197.20, '2025-07-03'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'TRK-04') and date = '2025-07-03');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'TRK-04'), 155, 179.80, '2025-07-07'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'TRK-04') and date = '2025-07-07');

-- ============================================
-- SEED DATA: Expenses (8)
-- ============================================

insert into expenses (vehicle_id, type, amount, description, date)
select (select id from vehicles where registration_number = 'VAN-01'), 'toll', 25.00, 'Lahore-Islamabad Motorway Toll', '2025-07-01'
where not exists (select 1 from expenses where vehicle_id = (select id from vehicles where registration_number = 'VAN-01') and description = 'Lahore-Islamabad Motorway Toll');

insert into expenses (vehicle_id, type, amount, description, date)
select (select id from vehicles where registration_number = 'VAN-01'), 'maintenance', 480.00, 'AC Compressor Repair', '2025-07-03'
where not exists (select 1 from expenses where vehicle_id = (select id from vehicles where registration_number = 'VAN-01') and description = 'AC Compressor Repair');

insert into expenses (vehicle_id, type, amount, description, date)
select (select id from vehicles where registration_number = 'TRK-01'), 'toll', 65.00, 'Multan-Sukkur Highway Toll', '2025-07-01'
where not exists (select 1 from expenses where vehicle_id = (select id from vehicles where registration_number = 'TRK-01') and description = 'Multan-Sukkur Highway Toll');

insert into expenses (vehicle_id, type, amount, description, date)
select (select id from vehicles where registration_number = 'TRK-01'), 'maintenance', 120.00, 'Oil Change Service', '2025-07-04'
where not exists (select 1 from expenses where vehicle_id = (select id from vehicles where registration_number = 'TRK-01') and description = 'Oil Change Service');

insert into expenses (vehicle_id, type, amount, description, date)
select (select id from vehicles where registration_number = 'TRK-02'), 'maintenance', 4500.00, 'Engine Overhaul', '2025-07-02'
where not exists (select 1 from expenses where vehicle_id = (select id from vehicles where registration_number = 'TRK-02') and description = 'Engine Overhaul');

insert into expenses (vehicle_id, type, amount, description, date)
select (select id from vehicles where registration_number = 'VAN-03'), 'toll', 18.50, ' GT Road Toll Plaza', '2025-07-03'
where not exists (select 1 from expenses where vehicle_id = (select id from vehicles where registration_number = 'VAN-03') and description = ' GT Road Toll Plaza');

insert into expenses (vehicle_id, type, amount, description, date)
select (select id from vehicles where registration_number = 'VAN-02'), 'miscellaneous', 75.00, 'Parking fees at Quetta Terminal', '2025-07-05'
where not exists (select 1 from expenses where vehicle_id = (select id from vehicles where registration_number = 'VAN-02') and description = 'Parking fees at Quetta Terminal');

insert into expenses (vehicle_id, type, amount, description, date)
select (select id from vehicles where registration_number = 'TRK-04'), 'maintenance', 320.00, 'Suspension Alignment', '2025-07-06'
where not exists (select 1 from expenses where vehicle_id = (select id from vehicles where registration_number = 'TRK-04') and description = 'Suspension Alignment');
