# Deployment Guide - kiranprep4EQAO

> **📋 For a comprehensive deployment checklist, see [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)**

## Quick Start

### 1. Environment Variables
Ensure all environment variables are set in your deployment platform:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Database Setup
- Run both SQL migrations in Supabase Dashboard:
  - `supabase/migrations/001_initial_schema.sql`
  - `supabase/migrations/002_add_image_support.sql`
- Verify all tables are created
- Set up at least one admin user

### 3. Build and Test
```bash
npm run build
npm run start
```

## Deployment Platforms

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms
- Ensure Node.js 18+ is supported
- Set build command: `npm run build`
- Set start command: `npm run start`
- Add all environment variables

## Post-Deployment

1. Test authentication flow
2. Test test generation as admin
3. Test test taking as student
4. Verify API endpoints are working
5. Check error handling

## Security Notes

- Never commit `.env.local` to version control
- Use environment variables for all secrets
- Regularly rotate API keys
- Monitor Supabase usage
- Monitor OpenAI API usage

## Detailed Checklist

See **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** for a comprehensive step-by-step deployment checklist with verification steps.



