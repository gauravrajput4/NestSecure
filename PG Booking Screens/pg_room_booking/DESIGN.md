---
name: PG Room Booking
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#464555'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#960014'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc1d25'
  on-tertiary-container: '#ffd0cc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  gutter: 1rem
  margin-mobile: 1rem
  margin-desktop: 5rem
  max-width: 1280px
---

## Brand & Style
The design system is built on a foundation of **Corporate Modernism** with a focus on reliability and accessibility. Given the nature of long-term housing (PG), the UI must evoke an emotional response of security and professionalism.

The style utilizes high-density information layouts balanced by generous white space to prevent cognitive overload during the search process. It leverages a "Safe & Secure" aesthetic—clean lines, purposeful movement, and a logical structure that guides the user from discovery to booking with zero friction.

## Colors
The palette is rooted in trust. **Indigo (#4F46E5)** serves as the primary action color, providing a strong, tech-forward anchor for the brand. 

- **Success (Green #10B981):** Reserved strictly for "Available" statuses and successful booking confirmations.
- **Error (Red #EF4444):** Used for "Full" status indicators, required field alerts, and cancellation actions.
- **Surface Strategy:** We use a tiered neutral system. The base background is a cool off-white (`#F9FAFB`) to reduce glare, while primary content cards use pure white (`#FFFFFF`) to pop against the background.

## Typography
This design system utilizes **Inter** for its exceptional legibility and systematic feel. The hierarchy is strictly enforced to differentiate between property titles, pricing, and logistical details.

- **Headlines:** Use tighter letter spacing and bold weights to create a sense of grounded authority.
- **Body Text:** Standard weight with a generous line height (1.5x) to ensure descriptions of amenities are easy to scan.
- **Labels:** Small caps or semi-bold weights are used for metadata like "Per Month" or "Security Deposit" to distinguish them from primary content.

## Layout & Spacing
The system employs a **12-column fluid grid** for desktop and a **single-column stack** for mobile.

- **Desktop:** 12 columns with 24px gutters. Content is centered with a max-width of 1280px.
- **Tablet:** 8 columns with 16px gutters and 32px side margins.
- **Mobile:** 4 columns (or fluid) with 16px side margins. 

We use an 8pt spacing system to maintain vertical rhythm. Cards in the property listing grid should span 4 columns on desktop (3 per row) and 6 columns on small tablets.

## Elevation & Depth
Depth is signaled through **Ambient Shadows** and **Tonal Layering**. We avoid heavy blacks in shadows, opting instead for semi-transparent Indigo tints to maintain brand cohesion.

- **Level 0 (Flat):** Background surface.
- **Level 1 (Low):** Standard property cards. Shadow: `0 2px 4px rgba(79, 70, 229, 0.05)`.
- **Level 2 (Medium):** Hover states on cards and dropdown menus. Shadow: `0 10px 15px rgba(79, 70, 229, 0.1)`.
- **Level 3 (High):** Modal dialogs for booking confirmations. Shadow: `0 20px 25px rgba(0, 0, 0, 0.1)`.

## Shapes
The design language uses a "Friendly-Geometric" approach. While the base components follow the `rounded` (0.5rem) standard, specific containers use exaggerated radii to feel more modern and premium.

- **Standard Elements:** Inputs and small buttons use `rounded` (8px).
- **Featured Containers:** Property cards and main booking modals use `rounded-2xl` (16px) to create a soft, inviting frame for property photography.

## Components
### Buttons
- **Primary:** Solid Indigo background, white text. On hover, darken to `#4338CA`.
- **Secondary:** White background with 1px Indigo border.
- **Interactive States:** All buttons transition over 200ms. Active states should "press" slightly (scale 0.98).

### Status Badges
- **Available:** `bg-green-100` with `text-green-800`.
- **Full:** `bg-red-100` with `text-red-800`.
- **Gender-Specific:** Use neutral blue for "Boys", soft purple for "Girls", and gray for "Unisex".

### Input Fields
- High-contrast 1px borders (`#D1D5DB`).
- Focus state: 2px Indigo ring with 4px offset.
- Floating labels are preferred for the "Search" bar to maximize space.

### Property Cards
- Must feature a `rounded-2xl` top-corner radius for images.
- Bottom section contains the price (Title-MD), location (Label-MD), and a prominent "View Details" high-contrast button.