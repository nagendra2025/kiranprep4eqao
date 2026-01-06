# Supabase Database Setup

## Migration Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `001_initial_schema.sql`
4. Paste and run the SQL script
5. Verify all tables are created in the **Table Editor**

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

## Database Schema

The migration creates the following tables:

1. **profiles** - User profiles with roles (ADMIN/CANDIDATE)
2. **tests** - Generated tests from source EQAO questions
3. **questions** - AI-generated questions (10 per test)
4. **attempts** - Student test attempts
5. **responses** - Student answers to questions
6. **admin_feedback** - Admin feedback on student attempts

## Row Level Security (RLS)

All tables have RLS enabled with the following access patterns:

- **Admins**: Full access to all tables
- **Candidates**: Can view tests, create attempts, view their own attempts and responses
- **Profiles**: Users can view/update their own profile

## Automatic Profile Creation

When a user signs up via Supabase Auth, a profile is automatically created with the default role of 'CANDIDATE'. Admins can update roles manually in the database.

## Manual Admin Setup

After creating your first admin user, you'll need to manually update their role:

```sql
UPDATE profiles 
SET role = 'ADMIN' 
WHERE email = 'admin@example.com';
```

Replace `admin@example.com` with your admin user's email.



