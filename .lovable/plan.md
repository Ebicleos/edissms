## Plan: Soft Blue Background for Login Page

Replace the current neutral background gradient on `src/pages/Auth.tsx` with a soft blue tint so the auth/login screen no longer reads as bare white.

### Changes
- In `src/pages/Auth.tsx`, update the two background layers (lines 428 and 519):
  - Swap `bg-gradient-to-br from-background via-muted/30 to-background` for a soft blue gradient: `bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50` with a dark-mode equivalent (`dark:from-slate-950 dark:via-blue-950/40 dark:to-slate-950`).
  - Slightly increase the blurred blue blob opacity (from `opacity-30` to `opacity-40`) so the blue presence is felt without being loud.
- Leave card, typography, animations, and role tabs untouched — only the page background tone changes.

### Scope
- Only the login/auth page (`Auth.tsx`, both the main view and the forgot-password view).
- No changes to design tokens, other pages, or business logic.