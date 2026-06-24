## Plan: End-to-End App Flow Test & Fix

Drive the running app with Playwright (headless Chromium against `localhost:8080`), walk every major user flow, capture screenshots + console + network, then fix every defect uncovered.

### Flows to exercise
1. **Unauthenticated** → `/` redirects to `/auth`; auth page loads cleanly (blue background, no console errors).
2. **Admin flow** (sign in as existing admin via injected Supabase session)
   - Dashboard loads, sidebar nav works
   - Students: list, search, pagination, create, edit, bulk import dialog
   - Teachers: list/create
   - Classes & subjects
   - Fees: create fee, record payment
   - CBT: create exam, add question (incl. AI generation)
   - Report cards: bulk generate, template editor (Settings → Report Card Template)
   - Communication Center (SMS/email composer opens)
   - Settings pages (school profile, branding, payment, maintenance)
3. **Teacher flow**: dashboard, class view, exam authoring, grade entry
4. **Student flow**: login by admission number, dashboard, CBT exam start/submit, results, report card view, learning materials
5. **Superadmin flow**: tenant list, view-switching, platform settings
6. **Password reset**: forgot-password form submits, rate-limit message renders

### Procedure (per flow)
- Launch Playwright, restore Supabase session for the target role
- Navigate each page, click primary actions, screenshot
- Collect: `console` errors/warnings, failed network requests (4xx/5xx), unhandled promise rejections
- Record findings in a checklist file under `/tmp/browser/audit/`

### Fix pass
- Triage findings by severity (broken page > broken action > console warning > visual)
- For each defect: read the relevant component, apply minimal fix, re-run that specific flow to confirm green
- Database/RLS issues → SQL migration; UI/logic issues → component edits; missing routes → `App.tsx`

### Deliverable
- Audit report (chat reply) listing each issue found, the fix applied, and verification screenshot
- All previously-broken flows now pass

### Notes / assumptions
- I'll use whatever admin/teacher/student accounts already exist in the DB. If a role has no seeded account, I'll flag it instead of creating one (account creation can change tenant data).
- Scope: functional + console/network errors only. No visual redesign unless something is visibly broken.
- I will NOT delete tenant data, run destructive bulk actions, or change platform secrets during the audit.