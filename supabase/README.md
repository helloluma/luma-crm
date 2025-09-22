# Database Setup Guide

This directory contains the database schema, migrations, and configuration for the Real Estate CRM application.

## Quick Start

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
curl -fsSL https://supabase.com/install.sh | sh
```

### 2. Start Local Supabase

```bash
# Start all Supabase services
npm run supabase:start

# Check status
npm run supabase:status
```

### 3. Set Up Database Schema

```bash
# Run migrations only
npm run db:setup

# Run migrations and seed data
npm run db:seed
```

### 4. Access Local Services

After starting Supabase locally, you'll have access to:

- **API URL**: http://127.0.0.1:54321
- **Studio**: http://127.0.0.1:54323
- **Inbucket (Email testing)**: http://127.0.0.1:54324

## Environment Variables

Update your `.env.local` file with the local Supabase credentials:

```env
# Local Supabase (from `supabase status`)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_supabase_status
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_supabase_status

# OAuth (optional for local development)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret
```

## Database Schema

### Tables

1. **profiles** - User profiles extending auth.users
2. **clients** - Client information and contact details
3. **transactions** - Real estate transactions and commissions
4. **documents** - File attachments for clients
5. **appointments** - Calendar events and deadlines
6. **notifications** - In-app notifications

### Key Features

- **Row Level Security (RLS)** - All tables have RLS policies
- **Role-based Access Control** - SuperAdmin, Admin, Assistant roles
- **Automatic Timestamps** - created_at and updated_at triggers
- **Referential Integrity** - Foreign key constraints
- **Performance Indexes** - Optimized queries

## Migrations

Migrations are located in `migrations/` and are numbered sequentially:

- `001_initial_schema.sql` - Core table structure
- `002_rls_policies.sql` - Row Level Security policies
- `003_auth_functions.sql` - Authentication helper functions

## Seed Data

The `seed.sql` file contains sample data for development:

- 3 sample users with different roles
- 5 sample clients in various stages
- 3 sample transactions
- Sample appointments and notifications

## Production Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and API keys

### 2. Run Migrations

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Push migrations to production
supabase db push
```

### 3. Configure Authentication

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Configure OAuth providers (Google, etc.)
3. Set up email templates
4. Configure redirect URLs

### 4. Set Up Storage

1. Go to Storage in your Supabase dashboard
2. Create a bucket named `documents`
3. Set up RLS policies for file access

## Troubleshooting

### Common Issues

**Migration Errors**
```bash
# Reset local database
npm run db:reset

# Restart Supabase
npm run supabase:stop
npm run supabase:start
```

**Permission Errors**
- Check that RLS is enabled on all tables
- Verify user roles are set correctly
- Ensure auth.uid() is available in policies

**Connection Issues**
- Verify environment variables are correct
- Check that Supabase services are running
- Confirm firewall isn't blocking ports

### Useful Commands

```bash
# View logs
supabase logs

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.types.ts

# Create new migration
supabase migration new migration_name

# Reset database (destructive!)
supabase db reset
```

## Development Workflow

1. Make schema changes in new migration files
2. Test locally with `supabase db reset`
3. Run migrations with `npm run db:setup`
4. Test with seed data using `npm run db:seed`
5. Push to production with `supabase db push`

## Security Considerations

- All tables use Row Level Security (RLS)
- User roles control data access
- File uploads are restricted by user permissions
- API keys should never be committed to version control
- Use environment variables for all sensitive data