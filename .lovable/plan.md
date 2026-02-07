

# Comprehensive UI Upgrade + Feature Additions

This plan covers three feature additions and a full visual overhaul of every remaining page in the school management system.

---

## Part 1: New Features

### 1.1 Signature Upload for Report Cards

Currently, report cards show plain text labels "Class Teacher's Signature" and "Proprietor's Signature" with only a line above them. We will add the ability to upload signature images.

**Database changes:**
- Add two new columns to `school_settings`: `teacher_signature_url` (text, nullable) and `principal_signature_url` (text, nullable)
- Create a new storage bucket `school-signatures` (public) for storing uploaded signature images
- Add RLS policies for the bucket (admins can upload/update, authenticated users can read)

**Settings page update (`Settings.tsx`):**
- In the "Report Cards" tab, add two signature upload areas (one for Class Teacher, one for Principal/Proprietor)
- Each upload area shows a preview of the current signature or a placeholder dashed box
- Uses the same pattern as `SchoolLogoUpload` -- file input, upload to storage, save URL
- Save signature URLs alongside other school settings

**Report Card Template update (`ReportCardTemplate.tsx`):**
- In the signatures section at the bottom, if a signature URL exists, display the uploaded image above the signature label line
- Image will be sized to approximately 120x50px, maintaining aspect ratio
- Falls back to the current blank line if no signature is uploaded

**BulkReportCardGenerator update:**
- Pass signature URLs through the school settings to the print-all HTML generation
- Include `<img>` tags for signatures in the printed output

### 1.2 Student Photo on Report Card

Currently the report card template has no student photo. The `useReportCards` hook already fetches `photo_url` from the students table but doesn't include it in `ReportCardData`.

**Hook update (`useReportCards.ts`):**
- Add `photoUrl?: string` to the `ReportCardData` interface
- Pass the `photo_url` value to the generated report card data

**Template update (`ReportCardTemplate.tsx`):**
- In the header section, add the student passport photo (64x64px rounded) next to the student info grid
- The photo will display alongside the student name, admission number, etc.
- Falls back to initials avatar if no photo

### 1.3 Exam Diagrams (Upload Diagrams for Questions)

Currently exam questions are text-only. We will add an optional image/diagram attachment to each question.

**Database changes:**
- Add `image_url` column (text, nullable) to the `questions` table

**CreateExam page update (`CreateExam.tsx`):**
- Add an "Attach Diagram" button below each question text area
- Uses file input to upload an image to the `student-photos` bucket (reuse existing bucket or create dedicated `exam-assets` bucket)
- Shows a small preview of the uploaded image below the question
- Stores the image path in `image_url` when saving

**TakeExam page update (`TakeExam.tsx`):**
- If a question has an `image_url`, display the diagram image between the question text and the answer options
- Image rendered at max-width with proper containment

---

## Part 2: UI Overhaul -- Every Page Gets Gradient + Emoji Treatment

Each page will receive a unique gradient header/accent, emoji-enhanced section headings, glass-effect cards, and warm backgrounds instead of plain white. The design follows the established pattern from the Dashboard redesign.

### Page-by-Page Color Scheme:

| Page | Gradient Theme | Accent Emoji | Header Gradient |
|------|---------------|-------------|----------------|
| Admission | Blue-to-Purple | `UserPlus` icon + star | `from-primary/10 via-purple/5 to-pink/5` |
| Students | Teal-to-Green | `GraduationCap` | `from-accent/10 via-success/5 to-cyan/5` |
| Classes | Purple-to-Pink | existing emojis per level | `from-purple/10 via-pink/5 to-coral/5` |
| Teachers | Orange-to-Coral | book/person emojis | `from-secondary/10 via-coral/5 to-warning/5` |
| Fees | Green-to-Teal | money emojis | `from-success/10 via-accent/5 to-cyan/5` |
| Exams | Blue-to-Cyan | clipboard/brain emojis | `from-info/10 via-sky/5 to-cyan/5` |
| CBT Portal | Indigo-to-Purple | computer/exam emojis | `from-primary/10 via-purple/5 to-info/5` |
| Report Cards | Warm Gold-to-Orange | trophy/star emojis | `from-secondary/10 via-warning/5 to-coral/5` |
| Promotion | Green-to-Lime | arrow/star emojis | `from-success/10 via-lime/5 to-accent/5` |
| Online Classes | Cyan-to-Blue | video/book emojis | `from-cyan/10 via-info/5 to-primary/5` |
| Attendance | Purple-to-Blue | calendar/check emojis | `from-purple/10 via-primary/5 to-info/5` |
| ID Cards | Pink-to-Purple | ID card/person emojis | `from-pink/10 via-purple/5 to-primary/5` |
| Announcements | Orange-to-Pink | megaphone/bell emojis | `from-secondary/10 via-coral/5 to-pink/5` |
| Events | Blue-to-Purple | calendar/party emojis | `from-primary/10 via-purple/5 to-pink/5` |
| Messages | Teal-to-Blue | mail/chat emojis | `from-accent/10 via-info/5 to-primary/5` |
| User Management | Indigo-to-Teal | shield/person emojis | `from-primary/10 via-accent/5 to-success/5` |
| Settings | Gray-to-Blue (neutral) | gear emojis | `from-muted/30 via-primary/5 to-info/5` |
| Subjects | Coral-to-Orange | book emojis | `from-coral/10 via-secondary/5 to-warning/5` |
| CBT Management | Red-to-Orange (admin) | monitor emojis | `from-destructive/10 via-coral/5 to-secondary/5` |

### Common Patterns Applied to Each Page:

1. **Page-level gradient header strip** -- A subtle gradient background behind the page title area (added via a wrapper div inside the page component, not changing MainLayout)

2. **Section headings with emojis** -- Every `<h3>` or section label gets a relevant emoji prefix (e.g., "Personal Information" becomes a heading with a person emoji)

3. **Card styling** -- All `<Card>` components get:
   - `bg-card/80 backdrop-blur-sm border-border/30 shadow-lg`
   - Hover transitions where appropriate (`hover:shadow-xl transition-all`)

4. **Table styling** -- All tables get:
   - Gradient header rows (`bg-gradient-to-r from-muted/80 to-muted/40`)
   - Alternating row highlights
   - Rounded container with border

5. **Form sections** -- All form sections get:
   - Rounded cards with subtle gradient backgrounds
   - Emoji-enhanced labels
   - Consistent spacing and padding

6. **Badge styling** -- Status badges use gradient backgrounds matching the page theme

7. **Button styling** -- Primary action buttons use page-appropriate gradients

8. **Empty states** -- All "no data" states get friendly emoji illustrations and colorful messaging

---

## Technical Implementation Details

### Database Migration
```sql
-- Add signature columns to school_settings
ALTER TABLE school_settings 
  ADD COLUMN teacher_signature_url text,
  ADD COLUMN principal_signature_url text;

-- Add image_url to questions table for exam diagrams
ALTER TABLE questions ADD COLUMN image_url text;

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('school-signatures', 'school-signatures', true);

-- RLS policies for signatures bucket
CREATE POLICY "Anyone can view signatures" ON storage.objects
  FOR SELECT USING (bucket_id = 'school-signatures');

CREATE POLICY "Admins can upload signatures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'school-signatures' 
    AND (auth.uid() IS NOT NULL)
  );

CREATE POLICY "Admins can update signatures" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'school-signatures' 
    AND (auth.uid() IS NOT NULL)
  );

-- Storage bucket for exam assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('exam-assets', 'exam-assets', true);

CREATE POLICY "Anyone can view exam assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'exam-assets');

CREATE POLICY "Teachers can upload exam assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exam-assets' 
    AND (auth.uid() IS NOT NULL)
  );
```

### Files to Create
- None (all changes are modifications to existing files)

### Files to Modify (Feature Changes)
1. `src/pages/Settings.tsx` -- Add signature upload UI in Report Cards tab
2. `src/components/reports/ReportCardTemplate.tsx` -- Show signatures and student photo
3. `src/components/reports/BulkReportCardGenerator.tsx` -- Pass signatures to print, show photo
4. `src/hooks/useReportCards.ts` -- Add `photoUrl` to `ReportCardData`
5. `src/pages/teacher/CreateExam.tsx` -- Add diagram upload per question
6. `src/pages/cbt/TakeExam.tsx` -- Display question diagrams

### Files to Modify (UI Overhaul)
7. `src/pages/Admission.tsx` -- Gradient sections, emoji headings
8. `src/pages/Students.tsx` -- Gradient header, styled cards/table
9. `src/pages/Classes.tsx` -- Gradient section backgrounds, enhanced cards
10. `src/pages/Teachers.tsx` -- Gradient header, enhanced teacher cards
11. `src/pages/Fees.tsx` -- Gradient header, styled table, emoji stats
12. `src/pages/Exams.tsx` -- Gradient tabs, styled exam cards
13. `src/pages/cbt/CBTPortal.tsx` -- Gradient header, styled exam list
14. `src/pages/ReportCards.tsx` -- Gradient wrapper
15. `src/pages/StudentPromotion.tsx` -- Gradient sections
16. `src/pages/OnlineClasses.tsx` -- Gradient header, styled cards
17. `src/pages/Attendance.tsx` -- Gradient calendar area, styled table
18. `src/pages/IDCards.tsx` -- Gradient split, styled selection list
19. `src/pages/Announcements.tsx` -- Gradient header, styled announcement cards
20. `src/pages/Events.tsx` -- Gradient calendar, styled event cards
21. `src/pages/Messages.tsx` -- Gradient tabs, styled compose area
22. `src/pages/admin/UserManagement.tsx` -- Gradient header, styled user table
23. `src/pages/admin/CBTManagement.tsx` -- Gradient tabs, styled monitoring
24. `src/pages/Subjects.tsx` -- Gradient header, styled subject list

### Implementation Order
1. Database migration (signatures + exam diagrams + storage buckets)
2. Feature: Signature uploads in Settings + display in ReportCardTemplate
3. Feature: Student photo on report card
4. Feature: Exam diagram uploads
5. UI overhaul batch 1: Admission, Students, Classes, Teachers
6. UI overhaul batch 2: Fees, Exams, CBT Portal, Report Cards
7. UI overhaul batch 3: Promotion, Online Classes, Attendance, ID Cards
8. UI overhaul batch 4: Announcements, Events, Messages, Subjects
9. UI overhaul batch 5: User Management, CBT Management, Settings

