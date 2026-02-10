

# Fix: SuperAdmin Dashboard Persists After Switching to Admin View on Mobile

## Root Cause

When a superadmin switches to "Admin View" on mobile, the sidebar navigates to `/` (the admin dashboard). However, `ProtectedRoute` has a hardcoded redirect on line 42-44:

```
if (isSuperadmin && location.pathname === '/') {
  return Navigate to /superadmin
}
```

This immediately sends the user back to `/superadmin`, making it impossible to view the admin dashboard. The `ProtectedRoute` component has no awareness of the view mode context.

Additionally, all admin routes use `allowedRoles={['admin']}` -- but the superadmin bypass on line 48 (`isSuperadmin`) lets them through anyway, so that part works. The only problem is the forced redirect from `/` to `/superadmin`.

## Fix

### File: `src/components/auth/ProtectedRoute.tsx`

- Import `useViewMode` from `ViewModeContext`
- Modify the superadmin redirect logic: only redirect from `/` to `/superadmin` if `viewMode` is **not** `'admin'`
- When `viewMode === 'admin'`, let the superadmin stay on admin routes normally

The change is minimal -- roughly 3-4 lines modified in one file.

### Technical Detail

```text
Before:
  if (isSuperadmin && path === '/') --> always redirect to /superadmin

After:
  if (isSuperadmin && path === '/' && viewMode !== 'admin') --> redirect to /superadmin
  if (isSuperadmin && path === '/' && viewMode === 'admin') --> allow through to admin dashboard
```

No other files need changes. The sidebar navigation and view mode switching already work correctly -- this single redirect rule is the only blocker.

