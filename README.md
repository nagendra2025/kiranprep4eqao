# kiranprep4EQAO

Online EQAO-Style Math Test Simulator (Grade 9 – Ontario Curriculum, Canada)

## Overview

kiranprep4EQAO is an AI-powered educational platform that helps Grade 9 students practice EQAO-style math questions. Admins can paste a single EQAO question, and the system automatically generates 10 progressively difficult questions for students to practice.

## Features

### Admin Features
- ✅ Paste EQAO question and generate 10 AI-powered questions
- ✅ View all generated tests
- ✅ Review student attempts
- ✅ Provide personalized feedback
- ✅ Track student progress

### Student Features
- ✅ View available tests
- ✅ Take practice tests (10 questions)
- ✅ Auto-evaluation with instant results
- ✅ View detailed scorecards
- ✅ Access test history
- ✅ Read admin feedback

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- Supabase account and project
- OpenAI API key

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the migration script: `supabase/migrations/001_initial_schema.sql`
4. Verify all tables are created
5. Create your first admin user and update their role:
   ```sql
   UPDATE profiles SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and log in with your admin credentials.

## Project Structure

```
├── app/
│   ├── (auth)/            # Authentication pages (login)
│   ├── (admin)/           # Admin dashboard pages
│   │   ├── dashboard/     # Admin dashboard
│   │   ├── generate-test/ # Test generation
│   │   ├── tests/         # Test management
│   │   └── attempts/      # Review attempts
│   ├── (candidate)/       # Student pages
│   │   ├── dashboard/     # Student dashboard
│   │   ├── tests/         # Take tests
│   │   └── attempts/      # View results
│   ├── api/               # API routes
│   ├── error.tsx          # Error boundary
│   └── not-found.tsx      # 404 page
├── components/
│   ├── auth/              # Authentication components
│   └── ui/                # Reusable UI components
├── lib/
│   ├── ai/                # AI question generation
│   ├── supabase/          # Supabase clients
│   ├── openai/            # OpenAI client
│   └── utils/             # Utility functions
├── types/                 # TypeScript definitions
└── supabase/
    └── migrations/        # Database migrations
```

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth + PostgreSQL)
- **AI**: OpenAI API (GPT-4o)
- **Deployment**: Vercel-ready

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/tests/generate` | Generate test from question | Admin |
| GET | `/api/tests` | Get all tests | User |
| GET | `/api/tests/[testId]/questions` | Get test questions | User |
| POST | `/api/attempts` | Create attempt | User |
| POST | `/api/attempts/[attemptId]/submit` | Submit answers | Owner |
| GET | `/api/attempts/[attemptId]` | Get attempt details | Owner/Admin |
| POST | `/api/feedback` | Add admin feedback | Admin |

## Documentation

- [Deployment Guide](./DEPLOYMENT.md) - How to deploy the application
- [Testing Guide](./TESTING.md) - Testing checklist and procedures

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control (Admin/Candidate)
- Input validation and sanitization
- Secure API key storage
- Protected routes with middleware

## Development

```bash
# Development
npm run dev

# Build
npm run build

# Start production server
npm run start

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## License

Private project - All rights reserved
