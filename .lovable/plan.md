
# Fix: Student ID Card Print Preview Shows Whole Page

## Problem
When students click "Print" on their ID card page, the print preview displays the entire page including the sidebar, header, and navigation instead of just the ID card.

## Root Cause
- No `@media print` CSS rules exist in the codebase
- The `MainLayout` component wraps the ID card with sidebar, header, and navigation
- Only a single `print:shadow-none` class exists on the ID card, which is insufficient

## Solution
Add comprehensive print styles to `src/index.css` that:
1. Hide all layout elements (sidebar, header, mobile nav) when printing
2. Remove padding and margins from the main content area
3. Center the ID card on the printed page
4. Set appropriate page size for ID card format
5. Add a printable class to target the ID card specifically

## Implementation

### 1. Add Print Styles to `src/index.css`
Add a new `@media print` section at the end of the file:

```css
/* Print styles for ID cards and documents */
@media print {
  /* Hide all layout elements */
  .md\\:pl-64,
  [class*="Sidebar"],
  header,
  nav,
  .print\\:hidden {
    display: none !important;
  }
  
  /* Reset body and main container */
  body {
    padding: 0 !important;
    margin: 0 !important;
    background: white !important;
  }
  
  main {
    padding: 0 !important;
    margin: 0 !important;
  }
  
  /* Hide non-printable elements on ID card page */
  .space-y-6 > div:first-child,
  .space-y-6 > div:last-child {
    display: none !important;
  }
  
  /* Center and style the printable ID card */
  .print\\:only {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    min-height: 100vh !important;
  }
  
  /* ID card specific print styles */
  .id-card-printable {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
    page-break-inside: avoid !important;
  }
}
```

### 2. Update `StudentIDCard.tsx`
Add appropriate CSS classes to enable print targeting:

- Add `print:hidden` to header section with title and buttons
- Add `print:hidden` to footer disclaimer text
- Add `id-card-printable` class to the ID card container
- Wrap ID card container with print positioning classes

### Files to Modify
1. `src/index.css` - Add @media print rules
2. `src/pages/student/StudentIDCard.tsx` - Add print utility classes

## Expected Result
- Print preview will show only the ID card, centered on the page
- Header, sidebar, navigation, and footer text will be hidden
- ID card will maintain its styling but without shadows
- Clean, professional print output suitable for lamination
