# TransitOps - Smart Transport Operations Platform

A centralized transport management system built for the Odoo Hackathon. Manages vehicles, drivers, trips, maintenance, fuel, expenses, and analytics with enforced business rules.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth)
- **Libraries:** React Hook Form, Zod, TanStack Table, Recharts, React CSV

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd transitOps-odoo

# Install dependencies
npm install

# Copy env file and add your Supabase keys
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Tables

Create these tables in your Supabase project:

| Table | Key Fields |
|---|---|
| `profiles` | id, email, full_name, role |
| `vehicles` | registration_number, model, type, capacity, odometer, acquisition_cost, status |
| `drivers` | name, license_number, license_category, license_expiry, contact, safety_score, status |
| `trips` | source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status |
| `maintenance` | vehicle_id, description, start_date, end_date, cost, status |
| `fuel_logs` | vehicle_id, litres, cost, date |
| `expenses` | vehicle_id, trip_id, type, amount, description, date |

## Project Structure

```
src/
  app/                 → Pages (route-based)
  components/
    layout/            → Sidebar, nav
    ui/                → shadcn components
  features/            → Module-specific logic
  hooks/               → Custom React hooks
  lib/
    businessRules.ts   → All business validations
    supabase.ts        → Supabase client
    validations.ts     → Zod schemas
  services/            → Supabase CRUD operations per module
  types/               → TypeScript type definitions
```

## Feature Branches

```
feature/auth
feature/dashboard
feature/vehicles
feature/drivers
feature/trips
feature/maintenance
feature/expenses
feature/analytics
```

Work on your branch, merge frequently. Never commit directly to main.
