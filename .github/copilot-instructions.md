# Workspace instructions

- Keep Supabase credentials in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY only.
- Never expose the Supabase service-role key in frontend code.
- Keep regression calculations in src/lib/linearRegression.ts and tests in src/lib/linearRegression.test.ts.
- Use the student submission RPC to enforce active-session status and value limits.
- Keep teacher-only operations protected by Supabase Auth and Row Level Security.
- Run npm test and npm run build after substantive changes.
