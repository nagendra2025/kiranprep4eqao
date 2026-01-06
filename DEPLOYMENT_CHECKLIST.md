# 🚀 Vercel Deployment Checklist - kiranprep4EQAO

## ✅ Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All code committed to Git
- [ ] `.env.local` is in `.gitignore` (verify it's not committed)
- [ ] No hardcoded secrets or API keys in code
- [ ] All TypeScript errors resolved
- [ ] All linting errors resolved
- [ ] Test build locally: `npm run build`
- [ ] Test production build locally: `npm run start`

### 2. Environment Variables Setup

**Required Environment Variables for Vercel:**

```env
# Supabase Configuration (Public - Safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Supabase Configuration (Private - Server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI Configuration (Private - Server-side only)
OPENAI_API_KEY=sk-your_openai_api_key_here

# App Configuration (Public - Safe to expose)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Where to find these values:**
- **Supabase**: Dashboard → Settings → API
  - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `anon` `public` key
  - `SUPABASE_SERVICE_ROLE_KEY`: `service_role` `secret` key (⚠️ Keep secret!)
- **OpenAI**: https://platform.openai.com/api-keys
- **NEXT_PUBLIC_APP_URL**: Your Vercel deployment URL (update after first deploy)

### 3. Database Setup (Supabase)

- [ ] **Run Migration 1**: Execute `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor
  - Verify all tables created: `profiles`, `tests`, `questions`, `attempts`, `responses`, `admin_feedback`
  - Verify RLS policies are enabled
  - Verify indexes are created

- [ ] **Run Migration 2**: Execute `supabase/migrations/002_add_image_support.sql` in Supabase SQL Editor
  - Verify `source_image_url` column added to `tests` table
  - Verify `question_image_url` column added to `questions` table

- [ ] **Create Admin User**:
  1. Sign up a user via Supabase Auth or your app
  2. Run this SQL in Supabase SQL Editor:
     ```sql
     UPDATE profiles 
     SET role = 'ADMIN' 
     WHERE email = 'admin@test.com';
     ```
  3. Verify the role update:
     ```sql
     SELECT email, role FROM profiles WHERE email = 'admin@test.com';
     ```

- [ ] **Verify RLS Policies**:
  - Test that admins can manage all tests
  - Test that candidates can only view tests
  - Test that users can only see their own attempts

### 4. Supabase Configuration

- [ ] **Authentication Settings**:
  - [ ] Email authentication enabled
  - [ ] Email templates configured (if using custom templates)
  - [ ] Redirect URLs configured:
    - Add `https://your-app.vercel.app/**` to allowed redirect URLs
    - Add `https://your-app.vercel.app/api/auth/callback` if using OAuth

- [ ] **Database Settings**:
  - [ ] Connection pooling enabled (recommended for serverless)
  - [ ] Database backups configured
  - [ ] API rate limits reviewed

### 5. Build Verification

```bash
# Test build locally
npm run build

# Test production server locally
npm run start

# Verify no build errors
# Check console for warnings
```

- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No missing dependencies
- [ ] All pages compile successfully

### 6. Git Repository Setup

- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] Repository is accessible to Vercel
- [ ] `.gitignore` includes:
  - `.env.local`
  - `.env*.local`
  - `node_modules/`
  - `.next/`
  - `*.log`

---

## 🚀 Vercel Deployment Steps

### Step 1: Connect Repository to Vercel

1. [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. [ ] Click "Add New Project"
3. [ ] Import your Git repository
4. [ ] Select the repository

### Step 2: Configure Project Settings

- [ ] **Framework Preset**: Next.js (auto-detected)
- [ ] **Root Directory**: `./` (if project is in root)
- [ ] **Build Command**: `npm run build` (default)
- [ ] **Output Directory**: `.next` (default)
- [ ] **Install Command**: `npm install` (default)

### Step 3: Add Environment Variables

**⚠️ CRITICAL: Add ALL environment variables before first deployment**

In Vercel Dashboard → Project Settings → Environment Variables:

1. [ ] Add `NEXT_PUBLIC_SUPABASE_URL`
   - Environment: Production, Preview, Development
   - Value: Your Supabase project URL

2. [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Environment: Production, Preview, Development
   - Value: Your Supabase anon key

3. [ ] Add `SUPABASE_SERVICE_ROLE_KEY`
   - Environment: Production, Preview, Development
   - Value: Your Supabase service role key
   - ⚠️ Mark as "Sensitive"

4. [ ] Add `OPENAI_API_KEY`
   - Environment: Production, Preview, Development
   - Value: Your OpenAI API key
   - ⚠️ Mark as "Sensitive"

5. [ ] Add `NEXT_PUBLIC_APP_URL`
   - Environment: Production, Preview, Development
   - Value: `https://your-app.vercel.app` (update after first deploy)

### Step 4: Deploy

- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Note the deployment URL
- [ ] Update `NEXT_PUBLIC_APP_URL` with actual Vercel URL if needed
- [ ] Redeploy if you updated `NEXT_PUBLIC_APP_URL`

### Step 5: Update Supabase Redirect URLs

After deployment, update Supabase:

1. [ ] Go to Supabase Dashboard → Authentication → URL Configuration
2. [ ] Add to "Redirect URLs":
   - `https://your-app.vercel.app/**`
   - `https://your-app.vercel.app/api/auth/callback`
3. [ ] Save changes

---

## ✅ Post-Deployment Verification

### 1. Basic Functionality Tests

- [ ] **Homepage loads**: Visit `https://your-app.vercel.app`
- [ ] **Login page loads**: Visit `https://your-app.vercel.app/login`
- [ ] **Login works**: Test with admin credentials
- [ ] **Redirect works**: Admin redirects to `/admin/dashboard`, Student to `/candidate/dashboard`

### 2. Admin Functionality Tests

- [ ] **Admin Dashboard loads**
- [ ] **Generate Test page loads**: `/admin/generate-test`
- [ ] **Test generation works**: Generate a test with text input
- [ ] **Test generation with image works**: Generate a test with image upload
- [ ] **View Tests page loads**: `/admin/tests`
- [ ] **Test details page loads**: Click on a test
- [ ] **Delete test works**: Delete a test and verify it's removed
- [ ] **Review Attempts page loads**: `/admin/attempts`
- [ ] **Attempt details page loads**: Click on an attempt
- [ ] **Admin feedback works**: Add feedback to an attempt

### 3. Student Functionality Tests

- [ ] **Student Dashboard loads**
- [ ] **Available Tests display**: See list of tests
- [ ] **Start Test works**: Click "Start Test" on a test
- [ ] **Test taking works**: Answer questions and submit
- [ ] **Results page loads**: View results after submission
- [ ] **Test History displays**: See past attempts
- [ ] **Delete attempt works**: Delete an attempt and verify
- [ ] **Retake test works**: After deleting attempt, can start test again

### 4. API Endpoints Tests

Test these endpoints (use browser dev tools Network tab):

- [ ] `GET /api/tests` - Returns list of tests
- [ ] `GET /api/tests?id=xxx` - Returns single test
- [ ] `POST /api/tests/generate` - Generates new test
- [ ] `GET /api/attempts` - Returns attempts
- [ ] `POST /api/attempts` - Creates new attempt
- [ ] `POST /api/attempts/[id]/submit` - Submits attempt
- [ ] `GET /api/attempts/[id]` - Returns attempt details
- [ ] `DELETE /api/tests/[id]` - Deletes test (admin only)
- [ ] `DELETE /api/attempts/[id]` - Deletes attempt

### 5. Image Generation Tests

- [ ] **Image upload works**: Upload image in test generation
- [ ] **Image paste works**: Paste image in test generation
- [ ] **Generated images display**: Check if DALL-E images appear
- [ ] **Images display on student side**: Verify images show in test-taking
- [ ] **Images display in results**: Verify images show in results page

### 6. Error Handling Tests

- [ ] **404 page works**: Visit non-existent route
- [ ] **Error boundary works**: Test error scenarios
- [ ] **Unauthorized access blocked**: Try accessing admin pages as student
- [ ] **Invalid login shows error**: Try wrong credentials

### 7. Performance Checks

- [ ] **Page load times**: Check Lighthouse scores
- [ ] **API response times**: Monitor API endpoint performance
- [ ] **Image loading**: Verify images load efficiently
- [ ] **Build size**: Check bundle size in Vercel dashboard

---

## 🔒 Security Checklist

- [ ] **Environment Variables**: All secrets in Vercel environment variables, not in code
- [ ] **API Keys**: Service role key and OpenAI key marked as "Sensitive" in Vercel
- [ ] **RLS Policies**: Verified Row Level Security is working in Supabase
- [ ] **Authentication**: Verify users can only access their own data
- [ ] **Authorization**: Verify admin-only routes are protected
- [ ] **HTTPS**: Verify all traffic is over HTTPS (Vercel default)
- [ ] **CORS**: Verify CORS settings if using external APIs
- [ ] **Rate Limiting**: Consider adding rate limiting for API routes

---

## 📊 Monitoring Setup

### Vercel Analytics (Optional but Recommended)

- [ ] Enable Vercel Analytics in project settings
- [ ] Monitor page views and performance
- [ ] Set up error tracking

### Supabase Monitoring

- [ ] Monitor database usage in Supabase dashboard
- [ ] Set up alerts for high usage
- [ ] Monitor API request counts

### OpenAI Monitoring

- [ ] Monitor API usage in OpenAI dashboard
- [ ] Set up usage limits/alerts
- [ ] Track costs per request

---

## 🐛 Troubleshooting Common Issues

### Build Fails

**Issue**: Build fails with TypeScript errors
- **Solution**: Fix all TypeScript errors locally first
- **Check**: Run `npm run build` locally before deploying

**Issue**: Build fails with missing dependencies
- **Solution**: Ensure all dependencies are in `package.json`
- **Check**: Run `npm install` and verify `package-lock.json` is committed

### Environment Variables Not Working

**Issue**: `process.env` is undefined
- **Solution**: Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side
- **Check**: Restart deployment after adding environment variables

**Issue**: API calls fail with authentication errors
- **Solution**: Verify Supabase keys are correct
- **Check**: Test Supabase connection in Supabase dashboard

### Database Issues

**Issue**: Tables not found
- **Solution**: Run migrations in Supabase SQL Editor
- **Check**: Verify tables exist in Supabase dashboard

**Issue**: RLS blocking queries
- **Solution**: Verify RLS policies are correct
- **Check**: Test queries in Supabase SQL Editor with proper user context

### Image Generation Issues

**Issue**: Images not generating
- **Solution**: Verify OpenAI API key is correct and has credits
- **Check**: Test OpenAI API key in OpenAI dashboard

**Issue**: Images not displaying
- **Solution**: Check image URLs are accessible
- **Check**: Verify CORS settings if using external image hosting

---

## 📝 Post-Deployment Notes

### Update Documentation

- [ ] Update `README.md` with production URL
- [ ] Document any custom configurations
- [ ] Note any environment-specific settings

### Set Up Custom Domain (Optional)

- [ ] Add custom domain in Vercel project settings
- [ ] Configure DNS records
- [ ] Update `NEXT_PUBLIC_APP_URL` with custom domain
- [ ] Update Supabase redirect URLs with custom domain

### Backup Strategy

- [ ] Set up Supabase database backups
- [ ] Document backup restoration process
- [ ] Consider exporting test data periodically

---

## 🎉 Deployment Complete!

Once all items are checked, your application should be live and fully functional on Vercel!

**Quick Links:**
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://app.supabase.com
- OpenAI Dashboard: https://platform.openai.com

**Support:**
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs

