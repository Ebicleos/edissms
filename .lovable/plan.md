
# Implementation Plan: AI Question Generation, Fee Deletion, ID Card Fix & Testing

## Overview
This plan addresses four key requirements:
1. **AI Question Generation** for teachers to auto-generate exam questions
2. **Fee Record Deletion** functionality for administrators
3. **Student ID Card School Settings Fix** to display correct school data
4. **Application Testing** to verify publication readiness

---

## 1. AI Question Generation for Teachers

### Current State
- Teachers manually create exam questions in `CreateExam.tsx` and can bulk upload via CSV in `QuestionUploadDialog.tsx`
- No AI-powered question generation exists

### Implementation

#### 1.1 Create Edge Function for AI Question Generation
Create `supabase/functions/generate-questions/index.ts` that:
- Accepts subject, class level, topic, difficulty, and number of questions
- Uses Lovable AI (google/gemini-3-flash-preview) via the gateway
- Returns structured multiple-choice questions with options and correct answers
- Uses tool calling to ensure structured JSON output

#### 1.2 Create AI Question Generator Component
Create `src/components/exams/AIQuestionGenerator.tsx`:
- Form with inputs for subject, topic, class, difficulty (easy/medium/hard), and question count (1-20)
- Loading state with streaming feedback
- Preview of generated questions before adding to exam
- Option to regenerate or edit individual questions

#### 1.3 Integrate into Exam Creation Flow
Modify `src/pages/teacher/CreateExam.tsx`:
- Add "Generate with AI" button next to "Add Question"
- Open AI generator dialog when clicked
- Allow teacher to review and add generated questions to the exam

---

## 2. Fee Record Deletion for Administrators

### Current State
- Fee records can be created and updated in `src/pages/Fees.tsx`
- No delete functionality exists in the dropdown menu

### Implementation

#### 2.1 Add Delete Handler
Add `handleDeleteFeeRecord` function in `src/pages/Fees.tsx`:
- Confirm deletion with dialog
- Check if any payments have been made (warn if amount_paid > 0)
- Delete from `fee_payments` table
- Refresh the list after deletion

#### 2.2 Update Dropdown Menus
Add "Delete Record" option to both mobile and desktop dropdown menus:
- Mobile card view (around line 505-510)
- Desktop table view (around line 580-593)
- Use destructive styling to indicate irreversible action

---

## 3. Student ID Card School Settings Fix

### Root Cause Identified
The `school_settings` table's RLS policy uses `get_user_school(auth.uid())` which queries the `profiles.school_id` column. However, students' profiles have `school_id = NULL` because they're registered through the student system, not as admin users. The student's actual school_id exists in the `students` table.

### Implementation

#### 3.1 Create Helper Function for Student School ID
Create a database function `get_student_school(user_id)` that:
- First checks `profiles.school_id`
- Falls back to `students.school_id` via `students.user_id`

#### 3.2 Add RLS Policy for Student Access
Add a new RLS SELECT policy on `school_settings`:
```sql
CREATE POLICY "Students can view their school settings"
ON school_settings FOR SELECT
USING (
  school_id IN (
    SELECT s.school_id FROM students s WHERE s.user_id = auth.uid()
  )
);
```

#### 3.3 Alternative: Update useSchoolSettings Hook
The `useSchoolSettings` hook already accepts a `schoolId` parameter and the `StudentIDCard.tsx` already passes `studentRecord?.school_id`. The issue is RLS blocking the query.

---

## 4. Application Testing Strategy

### 4.1 Authentication Flows
- **Admin Login**: Email/password login
- **Teacher Login**: Email/password login
- **Student Login**: Admission number + password (newly fixed)

### 4.2 Core Feature Verification

| Feature | Admin | Teacher | Student |
|---------|-------|---------|---------|
| Dashboard | Check stats, quick actions | Class overview | Personal summary |
| Students | CRUD operations | View assigned class | N/A |
| Fees | Create, update, delete (new) | N/A | View own fees |
| Exams | Manage CBT | Create, AI generate (new), publish | Take exams, view results |
| ID Cards | Generate for students | N/A | View own card (fix) |
| Report Cards | Generate, print | Enter grades | View own |
| Announcements | Create, publish | View | View published |

### 4.3 Critical Paths to Test
1. Student login with admission number → Dashboard → CBT Portal → Take exam
2. Admin creates fee record → Student views fee → Print receipt
3. Teacher creates exam with AI → Publish → Student takes exam
4. Admin updates school settings → Student ID card reflects changes

### 4.4 Known Issues to Verify Fixed
- Student login "Student not found" error (RPC function created)
- CBT exams not showing for students (class_id normalization applied)
- School branding on student ID card (RLS policy to be added)

---

## Technical Implementation Details

### Database Migration Required
```sql
-- Allow students to view their school's settings
CREATE POLICY "Students can view their school settings via student record"
ON public.school_settings
FOR SELECT
TO authenticated
USING (
  school_id IN (
    SELECT s.school_id 
    FROM public.students s 
    WHERE s.user_id = auth.uid()
  )
);
```

### New Files to Create
1. `supabase/functions/generate-questions/index.ts` - AI edge function
2. `src/components/exams/AIQuestionGenerator.tsx` - React component

### Files to Modify
1. `src/pages/teacher/CreateExam.tsx` - Add AI button
2. `src/pages/Fees.tsx` - Add delete functionality
3. Database migration for RLS policy

### Dependencies
- Uses existing Lovable AI integration (no new API keys required)
- Uses existing Supabase client and types

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| AI generates incorrect questions | Teacher reviews before adding; allow editing |
| Accidental fee deletion | Confirmation dialog; warn if payments exist |
| RLS policy conflicts | Test with student account after migration |

---

## Estimated Changes
- **2 new files** (edge function + React component)
- **2 modified files** (CreateExam.tsx, Fees.tsx)
- **1 database migration** (RLS policy for school_settings)
