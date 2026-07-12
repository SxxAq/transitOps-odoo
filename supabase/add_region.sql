-- TransitOps Database Update: Add Region column to Vehicles
-- Run this script in your Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor → Paste → Run

-- Step 1: Add the region column
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS region text;

-- Step 2: Add check constraint for regions
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_region_check;
ALTER TABLE vehicles ADD CONSTRAINT vehicles_region_check
  CHECK (region IS NULL OR region IN ('North', 'South', 'East', 'West', 'Central'));

-- Step 3: Seed existing vehicles with regions
UPDATE vehicles SET region = 'North' WHERE registration_number = 'MH-01-AB-1234';
UPDATE vehicles SET region = 'South' WHERE registration_number = 'MH-02-CD-5678';
UPDATE vehicles SET region = 'East' WHERE registration_number = 'DL-03-EF-9012';
UPDATE vehicles SET region = 'West' WHERE registration_number = 'KA-04-GH-3456';
UPDATE vehicles SET region = 'Central' WHERE registration_number = 'GJ-05-IJ-7890';
UPDATE vehicles SET region = 'North' WHERE registration_number = 'TN-06-KL-2345';
UPDATE vehicles SET region = 'South' WHERE registration_number = 'UP-07-MN-6789';
UPDATE vehicles SET region = 'East' WHERE registration_number = 'RJ-08-OP-0123';
UPDATE vehicles SET region = 'West' WHERE registration_number = 'MH-09-QR-4567';
UPDATE vehicles SET region = 'Central' WHERE registration_number = 'AP-10-ST-8901';

-- Set default region for other vehicles if any
UPDATE vehicles SET region = 'North' WHERE region IS NULL;
