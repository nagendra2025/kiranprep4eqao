# Migration Verification Checklist

## ✅ Quick Verification Steps

### 1. Check Migration File
Your migration file `002_add_image_support.sql` looks correct:
- ✅ Adds `source_image_url` to `tests` table
- ✅ Adds `question_image_url` to `questions` table
- ✅ Uses `IF NOT EXISTS` for safety

### 2. Run the Migration

**In Supabase Dashboard:**

1. Go to **SQL Editor**
2. Copy and paste this SQL:
   ```sql
   -- Add image support to tests table
   ALTER TABLE tests 
   ADD COLUMN IF NOT EXISTS source_image_url TEXT;

   -- Add image support to questions table  
   ALTER TABLE questions
   ADD COLUMN IF NOT EXISTS question_image_url TEXT;
   ```
3. Click **"Run"**
4. Should see: ✅ "Success. No rows returned"

### 3. Verify Columns Were Added

**Check `tests` table:**
1. Go to **Table Editor** → `tests` table
2. Look for column: `source_image_url` (type: TEXT, nullable: Yes)
3. ✅ Column exists

**Check `questions` table:**
1. Go to **Table Editor** → `questions` table
2. Look for column: `question_image_url` (type: TEXT, nullable: Yes)
3. ✅ Column exists

### 4. Test the Application

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Test image upload:**
   - Login as admin
   - Go to "Generate Test"
   - Select "Image" input type
   - Upload an image
   - ✅ Should work without errors

3. **Check database:**
   - After generating a test with an image
   - Go to Supabase → `tests` table
   - Find your test
   - ✅ `source_image_url` should contain a data URL

---

## ❌ Common Issues

### Issue: "relation 'tests' does not exist"
**Solution:** Run `001_initial_schema.sql` first

### Issue: "column already exists"
**Solution:** This is fine - the migration uses `IF NOT EXISTS`. The column is already there.

### Issue: Application errors after migration
**Solution:** 
1. Restart your dev server
2. Clear browser cache
3. Check browser console for errors

---

## ✅ Final Checklist

- [ ] Migration 002 has been run in Supabase SQL Editor
- [ ] `tests.source_image_url` column exists
- [ ] `questions.question_image_url` column exists
- [ ] Application starts without errors
- [ ] Can upload images in "Generate Test" page
- [ ] Images display correctly in test details page

---

## Need Help?

If you see any errors, check:
1. Supabase Dashboard → Logs
2. Browser Console (F12)
3. Terminal where `npm run dev` is running

