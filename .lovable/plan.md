

# Fix: Published CBT Exams Not Visible in Student Portal

## Root Cause

**Class ID format mismatch between tables.**

- Exams table stores: `"SSS 1"` (with space, mixed case)
- Students table stores: `"sss1"` (no space, lowercase)

The RLS policy on `exams` for students uses:
```sql
(is_published = true) AND (class_id = get_user_class(auth.uid()))
```

`get_user_class` returns `"sss1"` from the students table. The strict SQL `=` comparison against `"SSS 1"` fails, so RLS blocks all exam rows before they ever reach the client.

The CBTPortal code has client-side normalization (lines 65-78), but it never runs because zero rows pass RLS.

## Fix Strategy

**Update the `get_user_class` SQL function** to normalize both sides of the comparison, and also update the RLS policy to use a normalized comparison.

### Option A (Recommended): Normalize the `get_user_class` function output
Change the function to return the class_id as-is (it already does), but update the **RLS policy** on `exams` to compare normalized values:

```sql
-- Drop the existing student SELECT policy
DROP POLICY "Students can view published exams for their class" ON exams;

-- Create new policy with normalized comparison
CREATE POLICY "Students can view published exams for their class"
ON exams FOR SELECT TO public
USING (
  is_published = true 
  AND LOWER(REPLACE(class_id, ' ', '')) = LOWER(REPLACE(get_user_class(auth.uid()), ' ', ''))
);
```

### Also fix the same issue on these tables with identical RLS patterns:
- `questions` (student view policy)
- `assignments` (student view policy)
- `learning_materials` (student view policy)
- `online_classes` (student view policy)

Each has a policy comparing `class_id = get_user_class(auth.uid())` that will fail with the same mismatch.

## Database Migration
One migration to update all 5 RLS policies to use normalized comparison.

## Code Changes
None required — the CBTPortal already handles client-side normalization. Once RLS passes the rows through, everything works.

## Files Modified
1. **New migration**: Update 5 RLS policies with normalized class_id comparison

