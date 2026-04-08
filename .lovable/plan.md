
# Fix: CBT Exam Scores in Report Cards + Hide Submitted Exams

## Problem Analysis

### Issue 1: Exams taken do not reflect in report cards
**Root Cause**: Complete data pipeline disconnect. Report cards are generated from the `student_grades` table (populated by teachers via manual grade entry in `GradeEntry.tsx`). CBT exam scores are stored in `exam_submissions` table. The `grade-exam` edge function grades the exam and updates `exam_submissions` but **never writes to `student_grades`**. So CBT results exist in a separate silo that report card generation never reads.

**Fix**: After grading in the `grade-exam` edge function, automatically insert/upsert the CBT score into `student_grades` as the `exam_score` column. This bridges the two systems. The edge function already has the exam's subject, class_id, and student_id available — it just needs to fetch the exam metadata and write to `student_grades`.

### Issue 2: Submitted exams still visible in available tab
**Root Cause**: The CBT portal filtering logic at line 130 already filters by status, but `getExamStatus()` correctly returns 'completed' for submitted exams, so they should already be excluded from `availableExams`. However, the issue is that `fetchSubmissions` runs in a separate `useEffect` and may not have loaded yet when exams render — causing a brief window where completed exams show as "available". Also, the score should be displayed immediately after submission.

**Fix**: Ensure submissions are fetched before rendering exam lists, and after exam submission, redirect to results page or show score inline.

## Implementation Plan

### Step 1: Update `grade-exam` edge function
After grading, fetch the exam's `subject`, `class_id`, and school settings (term, academic_year), then upsert into `student_grades`:

```sql
-- Upsert into student_grades with CBT exam score
INSERT INTO student_grades (student_id, subject_name, class_id, term, academic_year, exam_score, total_score)
VALUES (...)
ON CONFLICT (student_id, subject_name, class_id, term, academic_year)
DO UPDATE SET exam_score = EXCLUDED.exam_score, total_score = ca1_score + ca2_score + ca3_score + EXCLUDED.exam_score
```

This requires adding a unique constraint on `student_grades` for the upsert.

### Step 2: Database migration
- Add unique constraint on `student_grades(student_id, subject_name, class_id, term, academic_year)` to enable upsert

### Step 3: Fix CBT Portal exam visibility
In `CBTPortal.tsx`:
- Ensure submissions load before exams render (combine into single useEffect or add loading gate)
- After submission in `TakeExam.tsx`, the redirect already goes to results — but also refresh submissions data
- Show score badge on completed exams more prominently

### Step 4: Fix TakeExam submission flow
In `TakeExam.tsx`, after successful submission and grading:
- Navigate to results page (already happens)
- The CBTPortal will correctly show the exam as "completed" on next visit since submissions are fetched

## Files to Modify
1. `supabase/functions/grade-exam/index.ts` — Add student_grades upsert after grading
2. **New migration** — Add unique constraint on student_grades
3. `src/pages/cbt/CBTPortal.tsx` — Fix race condition between submissions and exams loading; ensure completed exams never appear in available tab
4. `src/pages/cbt/TakeExam.tsx` — Minor: ensure score display after submission

## No other files need changes
The report card generation in `useReportCards.ts` already reads from `student_grades` correctly — once CBT scores flow into that table, they will automatically appear in report cards.
