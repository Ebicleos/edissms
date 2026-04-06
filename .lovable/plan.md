

# Landing Page Enhancement + Heading Consistency

## Current State
The landing page is well-structured with proper sections (hero, features, benefits, pricing, testimonials, FAQ, contact, footer). However, at the current 360px mobile viewport, several areas need visual enhancement:

1. **Hero section** feels flat — needs a more vibrant gradient background and better mobile text sizing
2. **Feature cards** lack color variety — all use similar muted styling
3. **Stats section** is plain — needs gradient cards with more visual punch
4. **Pricing cards** need better visual differentiation on mobile
5. **Trust badges** and **CTA sections** could be more colorful
6. **Footer** is generic — needs more personality

## Plan

### 1. Enhanced Hero Section
- Add a vivid animated gradient mesh background (purple → blue → teal) behind the hero
- Add floating decorative shapes (circles, dots) with subtle animation
- Improve mobile text sizing: h1 from `text-4xl` to a more impactful `text-[2.25rem]` with tighter line-height
- Add a subtle shimmer effect on the "Manage" gradient text
- Make the trust badge pill more colorful with a gradient border

### 2. Colorful Stats Bar
- Replace plain text stats with gradient-backed cards (each stat gets its own unique gradient: blue, green, amber, purple)
- Add emoji scaling animation on hover
- Better mobile grid: 2×2 with proper gap

### 3. Feature Cards with Color Accents
- Add a thin gradient top border to each card matching its icon color
- Add subtle colored background tint (`from-blue-50/50` etc.) per card
- Slightly larger icons on mobile

### 4. Benefits Section
- Add alternating pastel background tints to benefit cards
- Add a decorative gradient divider between sections

### 5. Testimonials
- Add colored left border accent to each card
- Randomize avatar gradient colors (not all primary)

### 6. Pricing Enhancement
- Add gradient header bar to each pricing card (not just the popular one)
- Each tier gets its own color identity (Starter=teal, Professional=primary, Enterprise=purple)
- Better mobile stacking with full-width cards

### 7. Final CTA Section
- Replace flat gradient with an animated gradient mesh
- Add floating particle/sparkle decorations

### 8. Footer
- Add a gradient divider line above footer
- Slightly warmer background

### 9. Heading Consistency Across App
- Audit heading patterns: ensure `font-display font-bold` is used for all H1/H2 across dashboards and landing page
- Already using `PageGradientHeader` in internal pages — verify no pages use mismatched heading styles

## Files to Modify
1. `src/pages/LandingPage.tsx` — All visual enhancements (single file, ~729 lines rewrite of styling classes)

## No database changes needed.

