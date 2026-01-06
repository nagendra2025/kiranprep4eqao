# Database Migration Setup Guide

## Step-by-Step Migration Instructions

### Prerequisites
✅ Ensure you have already run `001_initial_schema.sql` first
✅ You have access to your Supabase Dashboard

---

## Migration 002: Image Support

### Step 1: Run the Migration

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy the entire contents of `supabase/migrations/002_add_image_support.sql`:
   ```sql
   -- Add image support to tests table
   ALTER TABLE tests 
   ADD COLUMN IF NOT EXISTS source_image_url TEXT;

   -- Add image support to questions table  
   ALTER TABLE questions
   ADD COLUMN IF NOT EXISTS question_image_url TEXT;
   ```
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. ✅ You should see: "Success. No rows returned"

**Option B: Using Supabase CLI**

```bash
cd supabase/migrations
supabase db push
```

---

### Step 2: Verify the Migration

1. Go to **Table Editor** in Supabase Dashboard
2. Click on the **`tests`** table
3. Check the columns - you should see:
   - ✅ `source_image_url` (TEXT, nullable)
4. Click on the **`questions`** table
5. Check the columns - you should see:
   - ✅ `question_image_url` (TEXT, nullable)

---

### Step 3: Verify Initial Schema (If Not Done)

If you haven't run the initial schema yet:

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and run `supabase/migrations/001_initial_schema.sql`
3. Verify all tables exist:
   - ✅ `profiles`
   - ✅ `tests`
   - ✅ `questions`
   - ✅ `attempts`
   - ✅ `responses`
   - ✅ `admin_feedback`

---

## Troubleshooting

### Error: "relation does not exist"
- **Solution**: Run `001_initial_schema.sql` first to create the tables

### Error: "column already exists"
- **Solution**: The migration uses `IF NOT EXISTS`, so this is safe to ignore. The column already exists.

### Error: "permission denied"
- **Solution**: Make sure you're using the correct Supabase project and have admin access

---

## Verification Checklist

- [ ] Migration 001 (`001_initial_schema.sql`) has been run
- [ ] Migration 002 (`002_add_image_support.sql`) has been run
- [ ] `tests` table has `source_image_url` column
- [ ] `questions` table has `question_image_url` column
- [ ] No errors in Supabase SQL Editor
- [ ] Application can start without database errors

---

## Next Steps

After running the migration:

1. ✅ Restart your development server: `npm run dev`
2. ✅ Test image upload functionality:
   - Login as admin
   - Go to "Generate Test"
   - Upload an image with a math question
   - Verify the image is stored and displayed
3. ✅ Verify generated questions can reference images

---

## Need Help?

If you encounter any issues:
1. Check Supabase Dashboard → Logs for error messages
2. Verify your `.env.local` has correct Supabase credentials
3. Ensure you're connected to the correct Supabase project

