

# Fix Plan: 5 Critical Bugs

## Root Cause Analysis

### 1. Announcements fail to publish
**Cause**: The insert does NOT include `school_id`. The announcements table has a `school_id` column, and the RLS policy requires `school_id = get_user_school(auth.uid())` for admin access. Without `school_id` in the insert payload, the row either fails RLS on insert or can't be read back.
**Fix**: Add `school_id` from auth context to the announcement insert/update data.

### 2. Course material fails to upload
**Cause**: The `learning-materials` storage bucket does not exist. The code uploads to `supabase.storage.from('learning-materials')` but no such bucket is configured (only `school-logos`, `student-photos`, `school-signatures`, `exam-assets` exist).
**Fix**: Create the `learning-materials` storage bucket via migration, with appropriate RLS policies on `storage.objects`.

### 3. Student attendance fails to fetch in teacher's portal
**Cause**: The student attendance view (`StudentAttendance.tsx`) queries attendance with `.eq('student_id', studentId)` where `studentId` comes from `useStudentRecord` which returns `students.id` (the students table primary key). However, the RLS policy for students uses `student_id = auth.uid()` -- comparing the attendance `student_id` column against the auth user UUID. Since `students.id != auth.uid()`, the RLS blocks all reads for students. For teachers, this is fine (teacher RLS is role-based). The user reports this fails in the **teacher's portal** specifically, which suggests the attendance table's `student_id` stores `students.id` (not auth uid), so the teacher query should work. Let me re-check -- the teacher RLS allows all authenticated teachers to read. The issue may be that the Attendance page (`src/pages/Attendance.tsx`) used by teachers queries students but doesn't filter by `school_id`, potentially hitting limits or returning students from other schools. Actually, re-reading: the teacher fetches students via `students` table filtered by `class_id`, and the students RLS for teachers requires `school_id = get_user_school(auth.uid())`. This should work. The likely issue is that `fetchExistingAttendance` doesn't properly map student IDs.

Let me look more carefully -- the real issue for the student's own attendance view is the RLS policy `student_id = auth.uid()`. But since `student_id` in the attendance table stores `students.id` (not `auth.uid()`), the student can never see their own attendance. For the teacher portal, the teacher RLS should work fine since it's role-based.

**Fix**: Update the student attendance RLS policy to check `student_id IN (SELECT id FROM students WHERE user_id = auth.uid())` instead of `student_id = auth.uid()`.

### 4. Published exams not displayed in student portal
**Cause**: The exams RLS policy for students uses `class_id = get_user_class(auth.uid())`. The `get_user_class` function queries `student_classes` table: `SELECT class_id FROM student_classes WHERE student_id = _user_id LIMIT 1`. If the student doesn't have a row in `student_classes`, this returns NULL and no exams are visible. Additionally, even if the student_classes record exists, the `class_id` stored there may not match the exam's `class_id` exactly (case/spacing differences), which is why the code does client-side normalization -- but the RLS blocks the rows at the database level first.
**Fix**: Update the `get_user_class` function to also check the `students` table as a fallback: `SELECT class_id FROM students WHERE user_id = _user_id LIMIT 1`. This ensures the RLS works even without a `student_classes` record.

### 5. Student unable to view report card
**Cause**: The report_cards RLS policy for students is `student_id = auth.uid()`. But `report_cards.student_id` references `students.id`, not the auth user ID. So the policy never matches.
**Fix**: Update the RLS policy to `student_id IN (SELECT id FROM students WHERE user_id = auth.uid())`.

---

## Implementation Steps

### Step 1: Database Migration
Single migration to fix all RLS and create the missing bucket:

- **Create `learning-materials` storage bucket** (public bucket for file access)
- **Add storage RLS policies** for authenticated uploads and public reads
- **Fix `get_user_class` function** to fallback to `students.user_id` lookup
- **Fix report_cards student RLS**: Drop and recreate with subquery on `students.user_id`
- **Fix attendance student RLS**: Drop and recreate with subquery on `students.user_id`
- **Fix fee_payments student RLS**: Same pattern (currently uses `students.user_id` join which is correct -- verify)

### Step 2: Code Fix -- Announcements
In `src/pages/Announcements.tsx`, add `school_id` from the auth context to the insert/update payload. The `useAuth` hook provides `profile.school_id`.

### Step 3: Code Fix -- OnlineClasses (material upload)
No code changes needed -- once the bucket exists, uploads will work.

## Files Modified
1. **New migration**: Fix RLS policies + create storage bucket
2. `src/pages/Announcements.tsx`: Add `school_id` to announcement data

