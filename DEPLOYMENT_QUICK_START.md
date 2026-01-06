# 🚀 Quick Deployment Guide - Vercel

## ⚡ 5-Minute Setup

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Click "Deploy"

### 3. Add Environment Variables
**Before first deployment**, add these in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
OPENAI_API_KEY=sk-xxx...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 4. Run Database Migrations
In Supabase SQL Editor, run:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_add_image_support.sql`

### 5. Create Admin User
```sql
UPDATE profiles SET role = 'ADMIN' WHERE email = 'admin@test.com';
```

### 6. Update Supabase Redirect URLs
Add to Supabase → Authentication → URL Configuration:
- `https://your-app.vercel.app/**`

### 7. Deploy!
Click "Deploy" in Vercel and wait for build to complete.

---

## ✅ Build Status: READY

- ✅ TypeScript compilation: **PASSED**
- ✅ All dependencies: **RESOLVED**
- ✅ Build completes: **SUCCESS**
- ✅ Routes configured: **DYNAMIC** (correct for auth)

---

## 📋 Full Checklist

See **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** for comprehensive verification steps.

---

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com
- **OpenAI Dashboard**: https://platform.openai.com

