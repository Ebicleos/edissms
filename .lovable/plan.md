

# Plan: AI Question Generation Improvements + Dashboard UI Upgrades

## Part 1: AI Question Generation Fixes

### Current Issues
- The AI generator already accepts subject, class level, topic, difficulty, and count -- all working correctly
- The dialog closes after adding questions (`onOpenChange(false)` on line 117) -- per memory note, it should stay open for multiple batches
- Questions are added to the exam form in memory but only saved when the full exam is submitted -- this is correct behavior but could be clearer to users

### Changes to `AIQuestionGenerator.tsx`
1. Keep dialog open after adding questions (remove `onOpenChange(false)`)
2. Add a cumulative counter showing total questions added across batches
3. Add a "Done" button to close the dialog when finished
4. Show the subject and class level context prominently in the dialog header so teachers confirm context
5. Validate that subject and classLevel are provided before allowing generation (show warning if empty)
6. Improve UI with gradient styling, better spacing, and mobile responsiveness

### Changes to `CreateExam.tsx`
- Disable "Generate with AI" button if subject or class are not yet selected, with a tooltip explaining why
- No other changes needed -- the save flow already works correctly on form submit

### Edge Function (`generate-questions/index.ts`)
- Already correctly structured with tool calling, validation, rate limit handling
- No changes needed

## Part 2: Admin Dashboard UI Upgrade

### `Dashboard.tsx` (Admin)
- Already uses `WelcomeCard`, `EmojiStatCard`, `ScheduleCarousel`, `QuickActions` -- these are already styled with the modern design system
- Add a `PageGradientHeader` is not needed here since `WelcomeCard` serves as the header
- The dashboard is already well-designed from previous overhaul -- minimal changes needed

### `SuperAdminDashboard.tsx`
This page was NOT updated in the previous UI overhaul and still uses plain white cards. Full redesign:
1. Replace `MainLayout title/subtitle` with `WelcomeCard` (variant: "purple") for the super admin persona
2. Replace plain stat cards with `EmojiStatCard` components in a 2x2+1 grid (mobile-friendly)
3. Add `PageGradientHeader` for the "Recent Schools" section
4. Style quick action buttons with gradients
5. Add glassmorphism to the recent schools card
6. Make the stats grid responsive: 2 columns on mobile, 5 on desktop

### Mobile Optimization
- Ensure `AIQuestionGenerator` dialog is full-screen on mobile (`max-w-2xl` + proper padding)
- SuperAdmin dashboard: 2-column grid on mobile for stat cards
- Wrap quick action buttons for mobile

## Files to Modify
1. `src/components/exams/AIQuestionGenerator.tsx` -- Multi-batch support, UI polish, mobile responsive
2. `src/pages/teacher/CreateExam.tsx` -- Disable AI button when subject/class empty
3. `src/pages/superadmin/SuperAdminDashboard.tsx` -- Full modern redesign with gradients and emoji cards
4. `src/pages/Dashboard.tsx` -- Minor polish if needed (already well-styled)

## No Database Changes Required

