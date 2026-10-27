# Live Regression Lab

A real-time classroom application for collecting study-hours and exam-mark data, fitting simple linear regression, and teaching the calculation step by step.

## Stack

- React, TypeScript, Vite
- Recharts
- Supabase Auth, Postgres, Row Level Security, RPC, and Realtime
- Vitest

## Local setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add the public Supabase URL and anon key.
4. Run `supabase/migrations/001_live_regression_lab.sql` in the Supabase SQL editor.
5. Enable **Anonymous sign-ins** under Supabase Authentication → Providers.
6. Start the app with `npm run dev`.

Teacher access uses Supabase Anonymous Auth. No email or password is requested, while `owner_id` and Row Level Security still restrict session controls to the browser identity that created the classroom.

## Classroom flow

1. Sign in from `/` with a teacher email.
2. Create a session and copy its joining link.
3. Open the `/teacher/:id` dashboard and select Start.
4. Share `/join/ROOM-CODE` with students.
5. Submit data and watch the dashboard update through Realtime.

## Supabase authentication redirects

Email-based redirects are not required when the no-login teacher flow uses Anonymous Auth.

Supabase controls the destination after email confirmation. For local development, configure Authentication under **URL Configuration** with:

- Site URL: `http://localhost:5173`
- Redirect URLs: `http://localhost:5173/**`

For production, add the full deployment origin, such as `https://dl-presentation.vercel.app/**`, and set that origin as the Site URL or production redirect URL.

A link ending in `/` with an access token hash is expected and should be handled by Supabase on the page that opens. It must use a port the Vite server is running on, such as `5173`, and not an unavailable port such as `3000`.

The migration creates the classroom and submission tables, value constraints, owner-only RLS policies, public join/submit RPCs, indexes, and Realtime publication entries. Never expose the service-role key in browser code.

## Commands

```bash
npm test
npm run build
npm run lint
npm run dev
```

## Deployment

Deploy the Vite build to Vercel or another static host. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables, configure the production redirect URLs in Supabase Auth, and enable SPA fallback routing.

## Sample data and limits

Sample points are browser-only and visibly labeled. The public submission RPC rejects inactive sessions and out-of-range values. Platform or reverse-proxy rate limiting should be configured for production.

## Retention and CSV export

Use the dashboard to clear submitted records according to your school's retention policy and export the collected data as CSV.

