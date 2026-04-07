

# Fix: Super Admin System Settings + Rename to EDISMS

## Root Cause

The `platform_settings` table is **completely empty** (0 rows). The save function uses `.update().eq('key', key)` which matches zero rows and silently does nothing. Settings never persist.

## Fix Strategy

### 1. Database Migration -- Seed platform_settings rows
Insert the 4 required rows (`maintenance_mode`, `system_announcement`, `platform_config`, `pricing`) with default values so that `.update()` has rows to match.

```sql
INSERT INTO platform_settings (key, value) VALUES
  ('maintenance_mode', '{"enabled": false, "message": ""}'),
  ('system_announcement', '{"message": "", "type": "info"}'),
  ('platform_config', '{"name": "EDISMS + School Management", "support_email": "support@edisms.com", "allow_registrations": true}'),
  ('pricing', '{"termly": 50000, "yearly": 120000, "trial_days": 30}')
ON CONFLICT DO NOTHING;
```

### 2. Code Fix -- Use upsert instead of update (defensive)
In `src/hooks/usePlatformSettings.ts`, change `updateSetting` to use `.upsert()` with `onConflict: 'key'` so future saves always work even if a row is missing. Also update the default platform name from "EduManage" to "EDISMS + School Management".

### 3. Rebrand remaining "EduManage" references to "EDISMS"
Files to update:
- `src/hooks/usePlatformSettings.ts` -- default name
- `src/hooks/useSchoolSettings.ts` -- default school name
- `src/pages/auth/ResetPassword.tsx` -- heading
- `src/pages/admin/RegisterSchool.tsx` -- heading
- `src/pages/admin/SubscriptionPayment.tsx` -- description text
- `src/pages/auth/SchoolRegistration.tsx` -- heading
- `supabase/functions/send-email-notification/index.ts` -- email templates
- `supabase/functions/send-sms/index.ts` -- SMS sender name
- `supabase/functions/subscription-webhook/index.ts` -- SMS text
- `supabase/functions/paystack-webhook/index.ts` -- fallback name

## Files Modified
1. **New migration**: Seed `platform_settings` with 4 rows
2. `src/hooks/usePlatformSettings.ts`: Upsert + rebrand default
3. `src/hooks/useSchoolSettings.ts`: Rebrand default
4. `src/pages/auth/ResetPassword.tsx`: Rebrand heading
5. `src/pages/admin/RegisterSchool.tsx`: Rebrand heading
6. `src/pages/admin/SubscriptionPayment.tsx`: Rebrand text
7. `src/pages/auth/SchoolRegistration.tsx`: Rebrand heading
8. `supabase/functions/send-email-notification/index.ts`: Rebrand all email templates
9. `supabase/functions/send-sms/index.ts`: Rebrand sender
10. `supabase/functions/subscription-webhook/index.ts`: Rebrand SMS
11. `supabase/functions/paystack-webhook/index.ts`: Rebrand fallback

