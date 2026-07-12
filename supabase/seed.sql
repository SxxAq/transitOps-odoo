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
  ('MH-01-AB-1234', 'Tata Ace Gold', 'Van', 800, 34200, 850000, 'available'),
  ('MH-02-CD-5678', 'Eicher Pro 2049', 'Van', 1000, 51000, 1200000, 'available'),
  ('DL-03-EF-9012', 'Mahindra Bolero Pickup', 'Truck', 1200, 28000, 950000, 'on_trip'),
  ('KA-04-GH-3456', 'Tata Prima 2525.K', 'Truck', 5000, 120000, 2500000, 'available'),
  ('GJ-05-IJ-7890', 'Ashok Leyland Dost+', 'Truck', 4500, 98000, 800000, 'in_shop'),
  ('TN-06-KL-2345', 'BharatBenz 1613', 'Truck', 6000, 75000, 1800000, 'available'),
  ('UP-07-MN-6789', 'Force Traveller 26', 'Bus', 2000, 65000, 1500000, 'retired'),
  ('RJ-08-OP-0123', 'Tata Ultra 1012', 'Trailer', 8000, 42000, 1600000, 'available'),
  ('MH-09-QR-4567', 'Maruti Suzuki Eeco', 'Van', 900, 19000, 550000, 'on_trip'),
  ('AP-10-ST-8901', 'Tata LPT 1613', 'Truck', 5500, 88000, 1400000, 'available')
on conflict (registration_number) do nothing;

-- ============================================
-- SEED DATA: Drivers (8)
-- ============================================

insert into drivers (name, license_number, license_category, license_expiry, contact, safety_score, status) values
  ('Rajesh Kumar', 'MH-2024-1001', 'B', '2027-06-15', '+91 98765 43210', 95, 'available'),
  ('Priya Sharma', 'DL-2024-1002', 'C', '2026-11-20', '+91 98123 45678', 88, 'on_trip'),
  ('Amit Patel', 'GJ-2024-1003', 'B', '2025-03-10', '+91 99876 54321', 72, 'available'),
  ('Sneha Reddy', 'KA-2024-1004', 'D', '2028-01-25', '+91 87654 32109', 91, 'available'),
  ('Vikram Singh', 'UP-2024-1005', 'B', '2024-08-30', '+91 76543 21098', 65, 'suspended'),
  ('Deepa Nair', 'TN-2024-1006', 'C', '2027-04-18', '+91 65432 10987', 82, 'off_duty'),
  ('Mohammed Irfan', 'MH-2024-1007', 'B', '2026-09-05', '+91 54321 09876', 94, 'available'),
  ('Kavitha Menon', 'AP-2024-1008', 'B', '2027-12-01', '+91 43210 98765', 89, 'on_trip')
on conflict (license_number) do nothing;

-- ============================================
-- SEED DATA: Trips (6)
-- ============================================

insert into trips (vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, fuel_used, final_odometer, status, dispatched_at, completed_at)
select
  (select id from vehicles where registration_number = 'DL-03-EF-9012'),
  (select id from drivers where license_number = 'DL-2024-1002'),
  'Mumbai Warehouse', 'Delhi Hub', 850, 1400, 145, 28145, 'dispatched', now() - interval '2 hours', null
where not exists (select 1 from trips where source = 'Mumbai Warehouse' and destination = 'Delhi Hub');

insert into trips (vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, fuel_used, final_odometer, status, dispatched_at, completed_at)
select
  (select id from vehicles where registration_number = 'MH-09-QR-4567'),
  (select id from drivers where license_number = 'AP-2024-1008'),
  'Chennai Port', 'Hyderabad Depot', 600, 800, 82, 19800, 'dispatched', now() - interval '5 hours', null
where not exists (select 1 from trips where source = 'Chennai Port' and destination = 'Hyderabad Depot');

insert into trips (vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, fuel_used, final_odometer, status, dispatched_at, completed_at)
select
  (select id from vehicles where registration_number = 'MH-01-AB-1234'),
  (select id from drivers where license_number = 'MH-2024-1001'),
  'Pune Hub', 'Bangalore Gate', 500, 850, 92, 34238, 'completed', now() - interval '1 day', now() - interval '3 hours'
where not exists (select 1 from trips where source = 'Pune Hub' and destination = 'Bangalore Gate');

insert into trips (vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, fuel_used, final_odometer, status, dispatched_at, completed_at)
select
  (select id from vehicles where registration_number = 'MH-02-CD-5678'),
  (select id from drivers where license_number = 'KA-2024-1004'),
  'Ahmedabad Terminal', 'Jaipur Yard', 700, 680, 0, 0, 'draft', null, null
where not exists (select 1 from trips where source = 'Ahmedabad Terminal' and destination = 'Jaipur Yard');

insert into trips (vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, fuel_used, final_odometer, status, dispatched_at, completed_at)
select
  (select id from vehicles where registration_number = 'KA-04-GH-3456'),
  (select id from drivers where license_number = 'MH-2024-1007'),
  'Kolkata Factory', 'Mumbai Port', 4200, 2100, 245, 120120, 'completed', now() - interval '3 days', now() - interval '1 day'
where not exists (select 1 from trips where source = 'Kolkata Factory' and destination = 'Mumbai Port');

insert into trips (vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, fuel_used, final_odometer, status, dispatched_at, completed_at)
select
  (select id from vehicles where registration_number = 'TN-06-KL-2345'),
  (select id from drivers where license_number = 'GJ-2024-1003'),
  'Delhi Hub', 'Chennai Warehouse', 5500, 2200, 0, 0, 'cancelled', null, null
where not exists (select 1 from trips where source = 'Delhi Hub' and destination = 'Chennai Warehouse');

-- ============================================
-- SEED DATA: Maintenance (5)
-- ============================================

insert into maintenance (vehicle_id, title, description, cost, status)
select
  (select id from vehicles where registration_number = 'GJ-05-IJ-7890'),
  'Engine Overhaul', 'Full engine rebuild due to high mileage', 125000, 'open'
where not exists (select 1 from maintenance where title = 'Engine Overhaul' and vehicle_id = (select id from vehicles where registration_number = 'GJ-05-IJ-7890'));

insert into maintenance (vehicle_id, title, description, cost, status)
select
  (select id from vehicles where registration_number = 'DL-03-EF-9012'),
  'Brake Pad Replacement', 'Front and rear brake pads replaced', 8500, 'closed'
where not exists (select 1 from maintenance where title = 'Brake Pad Replacement' and vehicle_id = (select id from vehicles where registration_number = 'DL-03-EF-9012'));

insert into maintenance (vehicle_id, title, description, cost, status)
select
  (select id from vehicles where registration_number = 'KA-04-GH-3456'),
  'Oil Change', 'Regular 10000km oil change service', 3500, 'closed'
where not exists (select 1 from maintenance where title = 'Oil Change' and vehicle_id = (select id from vehicles where registration_number = 'KA-04-GH-3456'));

insert into maintenance (vehicle_id, title, description, cost, status)
select
  (select id from vehicles where registration_number = 'MH-01-AB-1234'),
  'AC Compressor Repair', 'AC not cooling, compressor replaced', 12000, 'closed'
where not exists (select 1 from maintenance where title = 'AC Compressor Repair' and vehicle_id = (select id from vehicles where registration_number = 'MH-01-AB-1234'));

insert into maintenance (vehicle_id, title, description, cost, status)
select
  (select id from vehicles where registration_number = 'UP-07-MN-6789'),
  'Tire Replacement', 'All 6 tires replaced - vehicle retired after', 36000, 'closed'
where not exists (select 1 from maintenance where title = 'Tire Replacement' and vehicle_id = (select id from vehicles where registration_number = 'UP-07-MN-6789'));

-- ============================================
-- SEED DATA: Fuel Logs (10)
-- ============================================

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'MH-01-AB-1234'), 45, 4680, '2025-07-01'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'MH-01-AB-1234') and date = '2025-07-01');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'MH-01-AB-1234'), 50, 5200, '2025-07-05'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'MH-01-AB-1234') and date = '2025-07-05');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'MH-02-CD-5678'), 60, 6240, '2025-07-02'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'MH-02-CD-5678') and date = '2025-07-02');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'DL-03-EF-9012'), 42, 4368, '2025-07-03'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'DL-03-EF-9012') and date = '2025-07-03');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'KA-04-GH-3456'), 180, 18720, '2025-07-01'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'KA-04-GH-3456') and date = '2025-07-01');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'KA-04-GH-3456'), 200, 20800, '2025-07-06'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'KA-04-GH-3456') and date = '2025-07-06');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'TN-06-KL-2345'), 160, 16640, '2025-07-04'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'TN-06-KL-2345') and date = '2025-07-04');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'MH-09-QR-4567'), 38, 3952, '2025-07-02'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'MH-09-QR-4567') and date = '2025-07-02');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'AP-10-ST-8901'), 170, 17680, '2025-07-03'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'AP-10-ST-8901') and date = '2025-07-03');

insert into fuel_logs (vehicle_id, litres, cost, date)
select (select id from vehicles where registration_number = 'AP-10-ST-8901'), 155, 16120, '2025-07-07'
where not exists (select 1 from fuel_logs where vehicle_id = (select id from vehicles where registration_number = 'AP-10-ST-8901') and date = '2025-07-07');

-- ============================================
-- SEED DATA: Expenses (8)
-- ============================================

insert into expenses (vehicle_id, type, amount, description, date)
select (select id from vehicles where registration_number = 'MH-01-AB-1234'), 'toll', 1850, 'Mumbai-Pune Expressway Toll', '2025-07-01'
where not exists (select 1 from expenses where vehicle_id = (select id from vehicles where registration_number = 'MH-01-AB-1234') and description = 'Mumbai-Pune Expressway Toll');

insert into expenses (vehicle_id, type, amount, description, date)
select (select id from vehicles where registration_number = 'MH-01-AB-1234'), 'maintenance', 12000, 'AC Compressor Repair', '2025-07-03'
where not exists (select 1 from expenses where vehicle_id = (select id from vehicles where registration_number = 'MH-01-AB-1234') and description = 'AC Compressor Repair');

insert into expenses (vehicle_id, type, amount, description, date)
select (select id from vehicles where registration_number = 'KA-04-GH-3456'), 'toll', 2200, 'Delhi-Agra Toll Plaza', '2025-07-01'
where not exists (select 1 from expenses where vehicle_id = (select id from vehicles where registration_number = 'KA-04-GH-3456') and description = 'Delhi-Agra Toll Plaza');

insert into expenses (vehicle_id, type, amount, description, date)
select (select id from vehicles where registration_number = 'KA-04-GH-3456'), 'maintenance', 3500, 'Oil Change Service', '2025-07-04'
where not exists (select 1 from expenses where vehicle_id = (select id from vehicles where registration_number = 'KA-04-GH-3456') and description = 'Oil Change Service');

insert into expenses (vehicle_id, type, amount, description, date)
select (select id from vehicles where registration_number = 'GJ-05-IJ-7890'), 'maintenance', 125000, 'Engine Overhaul', '2025-07-02'
where not exists (select 1 from expenses where vehicle_id = (select id from vehicles where registration_number = 'GJ-05-IJ-7890') and description = 'Engine Overhaul');

insert into expenses (vehicle_id, type, amount, description, date)
select (select id from vehicles where registration_number = 'DL-03-EF-9012'), 'toll', 650, 'NH-48 Toll Plaza', '2025-07-03'
where not exists (select 1 from expenses where vehicle_id = (select id from vehicles where registration_number = 'DL-03-EF-9012') and description = 'NH-48 Toll Plaza');

insert into expenses (vehicle_id, type, amount, description, date)
select (select id from vehicles where registration_number = 'MH-02-CD-5678'), 'miscellaneous', 2500, 'Parking fees at Ahmedabad Terminal', '2025-07-05'
where not exists (select 1 from expenses where vehicle_id = (select id from vehicles where registration_number = 'MH-02-CD-5678') and description = 'Parking fees at Ahmedabad Terminal');

insert into expenses (vehicle_id, type, amount, description, date)
select (select id from vehicles where registration_number = 'AP-10-ST-8901'), 'maintenance', 8500, 'Suspension Alignment', '2025-07-06'
where not exists (select 1 from expenses where vehicle_id = (select id from vehicles where registration_number = 'AP-10-ST-8901') and description = 'Suspension Alignment');
