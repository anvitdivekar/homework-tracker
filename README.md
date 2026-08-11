# Accounting Homework Tracker — MVP

A full-stack web application for managing accounting homework. Teaching assistants post text questions organized by chapter; students submit answers and see instant feedback with correct answers and explanations.

**Tech Stack:** Next.js 16 • React 19 • Supabase • TypeScript • CSS Custom Properties

**Design:** Playfair Display • Inter • JetBrains Mono • Navy/Gold color palette • 150ms animations

---

## Table of Contents

1. [Design](#design)
2. [Prerequisites](#prerequisites)
3. [Local Setup](#local-setup)
4. [Running Locally](#running-locally)
5. [Testing](#testing)
6. [Deployment to Vercel](#deployment-to-vercel)
7. [Troubleshooting](#troubleshooting)
8. [Features & Architecture](#features--architecture)

---

## Design

The app features a modern, polished academic aesthetic with careful attention to typography and interaction.

### Visual Identity
- **Color Palette:** Navy (#1a2e4a), Gold (#c9a227), Cream (#faf8f3), Surface (white)
- **Headings:** Playfair Display (serif) — elegant, professional
- **Body & UI:** Inter — clean, readable, accessible
- **Code & Entries:** JetBrains Mono — monospace for accounting journal entries
- **Shadows & Depth:** Subtle elevation on hover, 150ms smooth transitions
- **Animations:** Card lift on hover, 200ms modal fade-in, no bounces

### Pages
- **Login:** Centered card with HW monogram, grid background texture
- **Dashboard:** Sticky nav header, chapter filter tabs, question cards with left accent bars
- **Progress:** Summary stat cards, chapter breakdown with progress bars
- **Analytics:** KPI overview, performance tables with success rate visualizations

### Implementation
Zero new dependencies—all styling via `app/globals.css` with CSS custom properties. Responsive design works on mobile/tablet/desktop.

---

## Prerequisites

- **Node.js 18+** ([download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** ([download](https://git-scm.com/))
- **Supabase account** (free tier works) — https://supabase.com
- **Google Cloud Project** with OAuth 2.0 credentials
- **Vercel account** (for deployment) — https://vercel.com

---

## Local Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/anvitdivekar/homework-tracker.git
cd homework-tracker
npm install
```

### Step 2: Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name:** `homework-tracker` (or any name)
   - **Database Password:** Choose a strong password (save it)
   - **Region:** Pick closest to you
4. Click **Create New Project** (takes ~2 minutes)

Once ready, you'll see your project dashboard.

### Step 3: Set Up Database Schema

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open `supabase/schema.sql` from this repo
4. Copy the entire SQL content into the editor
5. Click **Run**
6. Verify: tables `users`, `questions`, `submissions` appear in **Table Editor**

**Expected output:**
```
CREATE TABLE (success)
ALTER TABLE (success) — for each RLS policy
CREATE INDEX (success) — for each index
```

### Step 4: Get Supabase Credentials

1. In Supabase, go to **Settings** (bottom left)
2. Click **API**
3. Copy and save these (you'll need them):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key** (public) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key** (secret!) → `SUPABASE_SERVICE_ROLE_KEY`

**⚠️ Never commit `SUPABASE_SERVICE_ROLE_KEY` to git.**

### Step 5: Register Google OAuth

1. Go to https://console.cloud.google.com
2. Create a new project (top left, project dropdown)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/auth/callback` (local dev)
   - `https://your-deployed-domain.vercel.app/auth/callback` (after you deploy, come back and add this)
7. Click **Create**
8. Download the JSON and save your **Client ID** and **Client Secret**

### Step 6: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   NEXT_PUBLIC_TA_EMAIL=yourteacheremail@example.com
   ```

   - Replace `yourteacheremail@example.com` with the email you'll use to sign in as TA
   - This email will automatically be assigned the `ta` role
   - All other emails will be assigned `student` role

3. **Verify `.env.local` is in `.gitignore`** (it should be — never commit secrets)

---

## Running Locally

### Start the Development Server

```bash
npm run dev
```

You'll see:
```
> next dev
▲ Next.js 16.x.x
- Local: http://localhost:3000
```

### Test the App

1. Open http://localhost:3000 in your browser
2. Click **Sign in with Google**
3. Use your TA email (from `.env.local`) to sign in
4. You'll land on the dashboard as a **TA**

### As TA (Your Account)

1. You'll see a **"Create Question"** form
2. Fill in:
   - **Title:** "Journal Entry Practice"
   - **Prompt:** "Record the following transaction: Received $1000 cash from customer"
   - **Correct Answer:** "Debit Cash 1000, Credit Revenue 1000"
   - **Chapter:** 1
3. Click **Create**
4. The question appears in the list below

### As Student (Different Email)

1. Open an **Incognito/Private** browser window
2. Visit http://localhost:3000 again
3. Sign in with a **different Google account** (not your TA email)
4. You'll see the **"Homework"** page (student view)
5. Click on your question
6. Enter an answer, click **Submit**
7. The correct answer and explanation are revealed

### Verify RLS & Permissions

- **Students cannot see other students' answers** (RLS policies enforce this)
- **Students cannot create questions** (only TA can)
- **TA can see all submissions** from the dashboard

---

## Testing

### Checklist

- [ ] Google OAuth login works
- [ ] TA email auto-assigned `ta` role
- [ ] Other emails auto-assigned `student` role
- [ ] TA can create questions
- [ ] Questions appear in student view
- [ ] Students can submit answers
- [ ] Answer reveal shows correct answer
- [ ] Can edit answer and resubmit
- [ ] Logout works, redirects to login

### Manual Testing Workflow

```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Check for TypeScript errors (optional)
npx tsc --noEmit

# Test in browser as shown above
```

---

## Deployment to Vercel

### Step 1: Prepare for Deployment

1. Push code to GitHub (already done if cloned from repo):
   ```bash
   git add .
   git commit -m "ready for deployment"
   git push origin main
   ```

2. Go to https://vercel.com and sign in

### Step 2: Import Project to Vercel

1. Click **Add New** → **Project**
2. Choose **Import Git Repository**
3. Select `homework-tracker` repo
4. Click **Import**

### Step 3: Add Environment Variables

1. In Vercel, you'll see **Environment Variables** section
2. Add these (same values as `.env.local`):
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...
   NEXT_PUBLIC_TA_EMAIL = yourteacheremail@example.com
   ```

3. Click **Deploy**

Vercel will build and deploy. Once complete, you'll see a URL like:
```
https://homework-tracker-xxxxx.vercel.app
```

### Step 4: Update Google OAuth Redirect URI

1. Go back to Google Cloud Console
2. Go to **Credentials** → your OAuth client
3. Under **Authorized redirect URIs**, add:
   ```
   https://homework-tracker-xxxxx.vercel.app/auth/callback
   ```
   (replace with your actual Vercel domain)
4. Click **Save**

### Step 5: Test Production

1. Visit your deployed URL
2. Try signing in with Google
3. Verify TA and student flows work
4. Share the URL with users

---

## Troubleshooting

### "Sign in with Google" button doesn't work

**Causes:**
- Google OAuth not configured correctly
- Redirect URI not added to Google Cloud Console
- `.env.local` variables not set

**Fix:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
2. Check Google Cloud Console → OAuth 2.0 Client ID → **Authorized redirect URIs**
3. Restart dev server: `Ctrl+C`, then `npm run dev`

### Database errors when creating a question

**Cause:** Supabase schema not set up

**Fix:**
1. Go to Supabase SQL Editor
2. Copy `supabase/schema.sql`
3. Run it to create tables
4. Restart dev server

### "RLS policy X does not allow X operation"

**Cause:** Role not assigned correctly, or permission mismatch

**Fix:**
1. Check your email matches `NEXT_PUBLIC_TA_EMAIL` (for TA access)
2. Verify RLS policies were created: Supabase → **Auth** → **Policies**
3. All rows should show "Enable" and policy names like "Only TA can insert"

### Getting "Invalid token" errors after deployment

**Cause:** Environment variables not synced to Vercel

**Fix:**
1. Go to Vercel project → **Settings** → **Environment Variables**
2. Verify all 4 variables are set and correct
3. Redeploy: click **Deployments** → **Latest** → **Redeploy**

### Can't edit answer as student

**Cause:** Modal not closing after first submission

**Fix:**
1. Refresh the page
2. Resubmit the question
3. Click **Edit** button in the reveal panel

---

## Features & Architecture

### What's Included (MVP)

- ✅ **Google OAuth login** with automatic role assignment
- ✅ **12 chapters** (fixed, hardcoded)
- ✅ **Text questions only** (TA creates, students answer)
- ✅ **Answer reveal** with correct answer + explanation
- ✅ **Re-submission** (edit answer and submit again)
- ✅ **Row-Level Security (RLS)** on all database tables
- ✅ **Role-based access** (TA vs. Student)

### What's NOT Included (Future)

- ❌ Multiple choice questions
- ❌ Table/structured questions
- ❌ Screenshot import with AI parsing
- ❌ Email notifications
- ❌ Analytics & performance tracking
- ❌ Fancy UI design (minimal MVP styling)
- ❌ Admin dashboard for role management

### Architecture

```
├── app/
│   ├── layout.tsx               Root layout
│   ├── page.tsx                 Redirect to login/dashboard
│   ├── login/page.tsx           Google OAuth entry
│   ├── auth/callback/route.ts   OAuth callback handler
│   └── dashboard/page.tsx       Main app (TA + Student views)
├── lib/
│   ├── types.ts                 TypeScript interfaces
│   ├── supabase-client.ts       Browser client
│   └── supabase-server.ts       Server-side client
├── supabase/
│   └── schema.sql               Database schema + RLS
└── README.md                    This file
```

### Security

- **Secrets never in git:** `.env.local` is gitignored
- **RLS enforces permissions:** Database-level access control
- **Service role key server-only:** Never exposed to browser
- **Google OAuth:** Verified sign-in, no manual email input

---

## Support & Next Steps

### Immediate

1. Follow steps above to run locally
2. Test as TA and student
3. Deploy to Vercel
4. Share URL with your class

### Enhancement Ideas

- Add multiple-choice questions
- Add table/grid questions (categorization, matching)
- Screenshot import with AI parsing
- Email reminders for due dates
- Analytics dashboard
- Dark mode

---

**Questions?** Check the [troubleshooting](#troubleshooting) section or review the code in `app/dashboard/page.tsx` (main app logic).

**Built with:** Next.js 16, React 19, Supabase, TypeScript
