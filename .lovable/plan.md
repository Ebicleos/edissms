## Goal

Let school admins pick a report card design preset and customize content fields, with a live preview, on a dedicated page at `/settings/report-card-template`.

## Scope

- 3 preset templates: **Classic** (current design), **Modern** (cleaner sans-serif, accent color, card-style sections), **Compact** (tighter spacing, single-page focus).
- Editable content fields surfaced in one place: report title, header tagline, term labels, footer note ("NB:…"), conduct/attitude/interest labels, signature labels, plus existing principal name / closing date / next term / signature uploads.
- Live preview pane (right side on desktop, stacked on mobile) renders the selected preset with sample student data + the admin's school branding so changes are visible immediately.
- Admin-only access (gated by `has_role(admin)` / superadmin). Teachers continue to see read-only generated cards.

## Technical Changes

### 1. Database (migration)
Add to `public.school_settings`:
- `report_card_template_id text not null default 'classic'` — one of `classic | modern | compact`.
- `report_card_title text default 'STUDENT TERMLY REPORT CARD'`
- `report_card_footer_note text default 'NB: DO NOT JUDGE YOUR CHILD/CHILDREN PERFORMANCE BASED ON POSITION BUT ON AVERAGE'`
- `report_card_tagline text` (optional sub-header under school name)

Existing RLS on `school_settings` already restricts to the school's admins — reused as-is.

### 2. Template components
- Refactor `src/components/reports/ReportCardTemplate.tsx` into a thin dispatcher that picks one of:
  - `src/components/reports/templates/ClassicTemplate.tsx` (lift current JSX here verbatim)
  - `src/components/reports/templates/ModernTemplate.tsx`
  - `src/components/reports/templates/CompactTemplate.tsx`
- All three accept the same `data` + extended `schoolSettings` props (now including `templateId`, `reportTitle`, `footerNote`, `tagline`).
- `BulkReportCardGenerator.tsx` continues to use `ReportCardTemplate` — no consumer changes needed.

### 3. New page + route
- `src/pages/admin/ReportCardTemplateEditor.tsx`:
  - Left column: template picker (3 cards w/ thumbnail labels), content-field form, signature uploads, save button.
  - Right column: sticky live preview using `ReportCardTemplate` with fabricated sample `ReportCardData` and the admin's `school_settings` values.
- Register route `/settings/report-card-template` (admin guard) in the existing router file.
- Add a "Customize Template" button inside `Settings.tsx` → Report Cards tab that links to the new page (keeps the existing tab for quick field edits; the new page is the full editor).

### 4. Sidebar / nav
- No new top-level sidebar entry. Entry point is the Settings tab button.

## Out of scope
- No drag/drop layout editor, no font/color picker, no raw HTML editor.
- Grading scale stays read-only (matches current note "Contact support to customize").
- Student-facing report views unchanged (they already render via `ReportCardTemplate`).

## Verification
- Type-check passes.
- Visiting `/settings/report-card-template` as admin: switching presets updates preview instantly; Save persists `report_card_template_id` and content fields; reload preserves selection.
- Generating a report card via `BulkReportCardGenerator` after switching to "Modern" renders the Modern layout.
- Non-admin route guard redirects.
