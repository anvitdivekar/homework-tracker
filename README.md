# Accounting Homework Tracker — MVP

Minimal viable product: TA posts text questions, students submit answers.

## Setup

1. **Supabase**: Create project at supabase.com
2. **Database**: Run SQL from `supabase/schema.sql` in Supabase SQL editor
3. **Google OAuth**: Register at Google Cloud Console, add redirect: `http://localhost:3000/auth/callback`
4. **Env vars**: Copy `.env.example` to `.env.local`, fill in your credentials

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
NEXT_PUBLIC_TA_EMAIL=<your-email>
```

5. **Run**: 
```bash
npm install
npm run dev
```

Visit http://localhost:3000

## Features

- Google OAuth login
- TA: Create 12-chapter homework (text only)
- Students: Submit, see reveal (correct answer + explanation)
- Role-based access (TA email auto-assigned)

## Deploy

```bash
npm run build
vercel --prod
```

Add env vars in Vercel project settings. Update Google OAuth redirect URI to your domain.

## Notes

MVP skips: multiple choice, tables, screenshots, analytics, fancy UI. Text questions only.
