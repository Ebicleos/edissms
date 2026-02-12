

# Improve AI Exam Question Generation Flow

## Current Issues Found

After analyzing the code, here are the problems:

1. **Subject and Class not visible in the AI dialog** -- The `AIQuestionGenerator` receives `subject` and `classLevel` as props but does not display them to the user, so teachers have no confirmation of what context the AI is using.

2. **Dialog closes after adding questions** -- When the teacher clicks "Add Questions to Exam", the dialog immediately closes (`onOpenChange(false)`). There is no way to generate another batch on a different topic without re-opening the dialog.

3. **No "Generate More" flow** -- After adding selected questions, the state resets and the dialog closes. Teachers who want to add questions from multiple topics must repeatedly open the dialog.

4. **Empty subject/class fallback** -- If the teacher has not yet filled in the subject or class on the exam form, the generator silently falls back to "General" and "Primary", which could produce irrelevant questions.

## Proposed Changes

### 1. Show Subject and Class Context in the Dialog

Add a visible info banner at the top of the generation form showing the current subject and class level. If either is empty, show a warning prompting the teacher to fill them in on the exam form first.

### 2. Keep Dialog Open After Adding Questions (with "Generate More" option)

After clicking "Add Questions to Exam":
- Add the selected questions to the exam (existing behavior)
- Clear the generated questions list
- Do NOT close the dialog
- Show a success message and a "Generate More" prompt so teachers can enter a new topic
- Add a separate "Done" button to explicitly close the dialog

### 3. Validate Subject and Class Before Generating

If subject or class is empty when the teacher clicks "Generate", show an error toast telling them to fill in the exam details first, instead of silently falling back.

### 4. Display Cumulative Count

Show a running total of how many AI-generated questions have been added in this session (e.g., "12 questions added so far").

---

## Technical Details

### File: `src/components/exams/AIQuestionGenerator.tsx`

**Changes:**

- Add `addedCount` state to track cumulative additions
- Add a context banner showing subject and class with emoji indicators
- Validate that `subject` and `classLevel` are non-empty before generating
- After `handleAddSelected`:
  - Clear generated questions and topic (keep dialog open)
  - Increment `addedCount`
  - Show success toast
- Add a "Done" / "Close" button alongside "Add to Exam"
- Reset `addedCount` when dialog closes via `onOpenChange`
- Show empty-context warning if subject or class is missing

**No changes needed to:**
- The edge function (`generate-questions/index.ts`) -- it already correctly uses all 5 parameters
- `CreateExam.tsx` -- the props interface and `handleAddAIQuestions` already work correctly

### Summary of UI Changes in the Dialog

```
+--------------------------------------------------+
| AI Question Generator                             |
+--------------------------------------------------+
| Subject: Mathematics  |  Class: JSS 2            |  <-- NEW context banner
+--------------------------------------------------+
| Topic: [___________________________]              |
| Difficulty: [Medium v]   Count: [5]               |
| [     Generate Questions     ]                    |
+--------------------------------------------------+
| 3 of 5 selected        [Select All] [Deselect]   |
| (scrollable question list...)                     |
|                                                   |
| [Add 3 Questions to Exam]       [Done]            |  <-- "Done" is new
| 7 questions added this session                    |  <-- NEW running total
+--------------------------------------------------+
```

