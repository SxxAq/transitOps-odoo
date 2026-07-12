-- Seed Waqar, Saqlain, and Hammad as authenticated users and profiles.
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → Paste → Run

-- Step 1: Seed Waqar (Fleet Manager)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_sent_at, confirmed_at, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, role, aud)
VALUES (
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  '00000000-0000-0000-0000-000000000000',
  'waqar@transitops.com',
  crypt('password123', gen_salt('bf')),
  now(), null, '', null, '', null, '', '', null, null,
  '{"provider":"email","providers":["email"]}',
  '{}',
  false, now(), now(), null, null, '', null, now(), 0, null, '', null, false, null,
  'authenticated', 'authenticated'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (id, email, full_name, role)
VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'waqar@transitops.com', 'Waqar', 'fleet_manager')
ON CONFLICT (id) DO NOTHING;


-- Step 2: Seed Saqlain (Driver)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_sent_at, confirmed_at, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, role, aud)
VALUES (
  'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
  '00000000-0000-0000-0000-000000000000',
  'saqlain@transitops.com',
  crypt('password123', gen_salt('bf')),
  now(), null, '', null, '', null, '', '', null, null,
  '{"provider":"email","providers":["email"]}',
  '{}',
  false, now(), now(), null, null, '', null, now(), 0, null, '', null, false, null,
  'authenticated', 'authenticated'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (id, email, full_name, role)
VALUES ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'saqlain@transitops.com', 'Saqlain', 'driver')
ON CONFLICT (id) DO NOTHING;


-- Step 3: Seed Hammad (Financial Analyst)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_sent_at, confirmed_at, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, role, aud)
VALUES (
  'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
  '00000000-0000-0000-0000-000000000000',
  'hammad@transitops.com',
  crypt('password123', gen_salt('bf')),
  now(), null, '', null, '', null, '', '', null, null,
  '{"provider":"email","providers":["email"]}',
  '{}',
  false, now(), now(), null, null, '', null, now(), 0, null, '', null, false, null,
  'authenticated', 'authenticated'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (id, email, full_name, role)
VALUES ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'hammad@transitops.com', 'Hammad', 'financial_analyst')
ON CONFLICT (id) DO NOTHING;
