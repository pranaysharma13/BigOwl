# BigOwl

An interactive study site for data structures, algorithms and coding-interview patterns. It follows the structure of *Introduction to Algorithms* (CLRS, 3rd ed.), with original explanations, step-by-step visualizers, predict-the-next-step drills, quizzes, and code in pseudocode, Python and C++.

Progress is saved in the browser and, once you sign in with an email link, synced to your account through Supabase.

## Stack

- Vite + React 19 + TypeScript, React Router 7, Zustand
- Supabase (email magic-link auth, Postgres with row-level security)
- Hosted on Vercel
- Fonts are self-hosted from `@fontsource-variable` packages; there are no third-party scripts at runtime

## Project layout

```
src/
  app/            router and page shell (header, index menu, footer)
  pages/          one file per route (Home, TopicPage, Patterns, Account, ...)
  components/     small React pieces (Mount, Pill, FitText, icons)
  engine/         framework-free visualizer engine: stage renderers, step player, code panel, quiz
  content/
    topics/       curriculum topics, one module per unit
    patterns/     interview pattern guides and problem ladders
    assess/       assessment question banks
  features/
    progress/     progress model (pure functions), store, hooks
    auth/         Supabase sign-in, sync, export and delete
  lib/            supabase client, theme, page title
  styles/         tokens.css, engine.css, app.css
supabase/migrations/   database schema and security policies
tests/                 Vitest unit tests
```

## Run it locally

Requires Node 20 or newer.

```bash
npm install
cp .env.example .env.local      # then fill in the two values (see below)
npm run dev                     # http://localhost:5173
```

The site works without the env values. Progress then stays in the browser only, and the account page says sync is not configured.

Other scripts: `npm run build`, `npm run preview`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run format`.

## Set up Supabase (once)

1. **SQL Editor → New query**: paste `supabase/migrations/20261102000000_progress.sql` and run it.
2. **Project Settings → API**: copy the Project URL and the anon key into `.env.local`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=...
   ```
   Never use the `service_role` key or the database password anywhere in this project.
3. **Authentication → URL Configuration**:
   - Site URL: `https://<your-domain>`
   - Redirect URLs: `http://localhost:5173/**` and `https://<your-domain>/**`

## Deploy to Vercel

1. Import the GitHub repository at vercel.com/new (framework preset: Vite).
2. **Settings → Environment Variables**: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then redeploy.

## Content and credits

All explanations, pseudocode, figures and questions are original. Section numbers point to the textbook so you can read along in your own copy. BigOwl is not affiliated with MIT Press, the book's authors, or LeetCode. Problem names and numbers link to LeetCode; statements are not copied. See `COMPLIANCE.md` for the privacy, security and licensing checklist.
