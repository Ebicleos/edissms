

# Fix: CBT Exam Scores in Report Cards + Hide Submitted Exams

## Problem 1: CBT exam scores not in report cards
**Root cause**: Report cards read from `student_grades` table. CBT grading (`grade-exam` edge function) only writes to `exam_submissions`. The two systems are completely disconnected — no data flows from CBT to report cards.

## Problem 2: Submitted exams still visible
**Root cause**: `fetchSubmissions()` and `fetchExams()` run in separate `useEffect` hooks. Submissions may not be loaded when exams render, causing completed exams to briefly appear as "available".

---

## Changes

### 1. Database Migration
Add a unique constraint on `student_grades` to enable safe upsert:
```sql
ALTER TABLE public.student_grades
ADD CONSTRAINT student_grades_unique_student_subject_term
UNIQUE (student_id, subject_name, class_id, term, academic_year);
```

### 2. Update `supabase/functions/grade-exam/index.ts`
After grading the submission (updating `exam_submissions`), add a bridge step:
- Fetch the exam's `subject`, `class_id`, `school_id`
- Fetch `term` and `academic_year` from `school_settings`
- Normalize term format (e.g. "First Term" → "first")
- Calculate exam score as percentage scaled to 60 (standard Nigerian CA=40, Exam=60 split)
- Check if a `student_grades` row already exists for this student+subject+class+term+year
  - If exists: update `exam_score` and recalculate `total_score`
  - If not: insert new row with `exam_score` and zero CA scores
- Wrap in try/catch so grading never fails even if bridge fails

### 3. Update `src/pages/cbt/CBTPortal.tsx`
- Combine the two `useEffect` hooks into one sequential flow: fetch submissions first, then exams
- Add a `submissionsLoaded` gate so exams don't render until submissions are known
- This ensures `getExamStatus()` correctly identifies completed exams before rendering

### 4. Minor: `src/pages/cbt/CBTPortal.tsx` — Show score on available tab for completed
- Already handled by the tab filtering, but ensure the loading state covers both fetches

## Files Modified
1. **New migration** — unique constraint on `student_grades`
2. `supabase/functions/grade-exam/index.ts` — bridge CBT scores to `student_grades`
3. `src/pages/cbt/CBTPortal.tsx` — fix loading race condition between submissions and exams

## Technical Details
- The `student_grades` table has columns: `ca1_score`, `ca2_score`, `ca3_score`, `exam_score`, `total_score`
- CBT score is scaled to /60 (exam portion) to match the grading system
- The `useReportCards.ts` hook already reads from `student_grades` — no changes needed there
- Edge function uses service role key so no RLS issues for the insert

