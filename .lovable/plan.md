# Audit signup & registration flows

## Scope

Four entry points to exercise end-to-end:

1. `/auth` — role-based signup tabs (Admin, Teacher, Student)
2. `/auth` — login (email + admission-number)
3. `/auth` — forgot password
4. `/auth/register-school` — paid school registration (trial + Paystack)
5. `/admin/register-school` — first-admin school registration (post-signup)

## Method

For each flow, drive Playwright headless against `http://localhost:8080` using the injected superadmin session where needed, and unauthenticated context for signup. Capture screenshots, console errors, network 4xx/5xx, and Supabase RPC errors at every step. For paid registration, stop at the Paystack redirect (do not complete a real charge) and separately exercise the `?reference=` callback path with a fake reference to verify the verify-branch error handling.

Test cases per flow:

- **Admin signup**: Only allowed when no admin exists. Verify `adminExists` gate, profile creation, `user_roles` insert, redirect to `/admin/register-school`.
- **Teacher signup**: Class required, `teacher_classes` insert, profile school_id backfill from role, redirect to `/teacher`.
- **Student signup**: Admission number + name validation via `validate_student_for_signup`, `link_student_to_user` RPC, duplicate detection, class formatting, redirect to `/student`.
- **Login (admin/teacher)**: Email + password, invalid credentials messaging.
- **Login (student)**: Admission-number lookup via `lookup_student_for_login`, email resolution fallbacks, "not created yet" vs "incorrect password" branches.
- **Forgot password**: Email existence check, 3/24h rate limit branch, `password_reset_requests` insert, `resetPasswordForEmail` redirect URL.
- **School registration (trial)**: Zod validation, duplicate email check, edge function init, callback verify branch with bad reference.
- **First-admin RegisterSchool**: Form → school insert → subscription → profile update → role update.

## Known suspects to verify during the audit

Only fix items confirmed by the audit; each is currently unconfirmed:

- `Auth.tsx` signup does not navigate after success — user is left on the auth page while the `useEffect` redirect races the `onAuthStateChange` role fetch. Confirm behaviour and, if stuck, force a `navigate` after `refreshProfile`.
- Admin signup path: after account creation, `role === 'admin'` + no `school_id` triggers `ProtectedRoute` to `/admin/register-school`, but the redirect target is `/` from `Auth.tsx`. Verify the handoff works.
- `AuthContext.signUp` for students inserts into `student_classes` with `student_id: data.user.id`, but the existing linked record may already have a row — check for unique-violation errors and switch to upsert if reproduced.
- `registration-payment` verify branch: `authData.user.id` is used before checking `authError` returns early on duplicate-email; confirm behaviour on retry with same admin email.
- `Auth.tsx` forgot-password path queries `profiles.email` — verify RLS allows anon read (previous scan flagged similar); if blocked, move lookup into an RPC.
- Student signup pre-check queries `student_classes` with `.eq('admission_number', ...)` (case-sensitive) while login uses `ilike`. Confirm and normalise.

## Deliverables

- One consolidated report of what passed, what failed, and the exact fix applied per failure.
- Code fixes limited to bugs the audit reproduces; no speculative refactors.
- Re-run the same Playwright suite after fixes to confirm green.

## Technical notes

- Use unique emails per run (`test+<ts>@edissms.dev`) to avoid duplicate-profile short-circuits.
- Seed a student row via `supabase--insert` before testing student signup so `validate_student_for_signup` returns true.
- Use `supabase--read_query` to inspect `profiles`, `user_roles`, `student_classes`, `password_reset_requests` after each mutating step.
- Clean up test accounts via `delete-user` edge function at end of run.
