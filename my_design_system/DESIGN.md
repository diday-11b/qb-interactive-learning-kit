---
name: My Design System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d7dae3'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3fc'
  surface-container: '#ebedf7'
  surface-container-high: '#e6e8f1'
  surface-container-highest: '#e0e2eb'
  on-surface: '#181c22'
  on-surface-variant: '#414753'
  inverse-surface: '#2d3037'
  inverse-on-surface: '#eef0fa'
  outline: '#717785'
  outline-variant: '#c1c6d5'
  surface-tint: '#005db8'
  primary: '#005cb8'
  on-primary: '#ffffff'
  primary-container: '#1275e2'
  on-primary-container: '#000512'
  inverse-primary: '#aac7ff'
  secondary: '#465f88'
  on-secondary: '#ffffff'
  secondary-container: '#b6d0ff'
  on-secondary-container: '#3f5881'
  tertiary: '#9a4600'
  on-tertiary: '#ffffff'
  tertiary-container: '#c05900'
  on-tertiary-container: '#0d0300'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#aac7ff'
  on-primary-fixed: '#001b3e'
  on-primary-fixed-variant: '#00458d'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#aec7f7'
  on-secondary-fixed: '#001b3d'
  on-secondary-fixed-variant: '#2d476f'
  tertiary-fixed: '#ffdbc9'
  tertiary-fixed-dim: '#ffb68c'
  on-tertiary-fixed: '#321200'
  on-tertiary-fixed-variant: '#763400'
  background: '#f9f9ff'
  on-background: '#181c22'
  surface-variant: '#e0e2eb'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

# Design System

## Brand & Style
The design system embraces a **Corporate / Modern** aesthetic, prioritizing clarity, efficiency, and professional reliability. It combines high-fidelity visual standards with clean, accessible layouts that suit enterprise applications, developer tools, and data-dense dashboards. The overall tone is objective, trustworthy, and precise.

### Emotional Response
- **Reliability:** Consistent structures and predictable patterns instill user confidence.
- **Efficiency:** Streamlined interfaces minimize cognitive load and accelerate task completion.
- **Clarity:** High typographic legibility and purposeful use of color ensure information hierarchy is instantly understood.

## Colors
The color system is organized around a semantic palette designed for optimal contrast, readability, and modern aesthetics in light mode.

- **Primary (`#1275e2`):** A vibrant, trustworthy blue serving as the main anchor for interactive elements, primary actions, and key focal points.
- **Secondary (`#5f78a3`):** A slate-blue tone used for supportive UI components, secondary states, and structural accents.
- **Tertiary (`#c55b00`):** A warm amber-orange accent deployed strategically for alerts, highlights, or distinct callouts.
- **Neutral (`#74777f`):** A balanced cool gray utilized across text layers, surface backgrounds, and borders to maintain visual harmony.

## Typography
The typography stack utilizes **Inter** across all headline, body, and label roles. Inter provides exceptional legibility at small sizes and a crisp, modern geometric neutrality at larger scales.

### Hierarchy
- **Headlines:** Set in higher weights (SemiBold) to establish clear structural hierarchy and section partitioning.
- **Body:** Optimized for readability in data tables, paragraphs, and forms using Regular weight and comfortable line heights.
- **Labels:** Compact, medium-weight styles tailored for form controls, navigation items, and microcopy.

## Layout & Spacing
The layout model relies on a responsive, fluid grid system structured around consistent spacing intervals.

- **Gutters & Margins:** Generous 1.5rem gutters and 2.5rem outer canvas margins provide breathing room on large screens while gracefully scaling down for tablets and mobile viewports.
- **Spacing Rhythm:** Built on a modular scale ranging from `space-xs` (0.25rem) to `space-xl` (2.5rem), ensuring consistent padding for components, stacking gaps, and layout groupings.

## Elevation & Depth
Elevation is handled primarily through **tonal layers and low-contrast outlines**, supplemented by subtle ambient shadows for floating components like dropdown menus and modals. 

- **Surfaces:** Use shifts in neutral tone and light borders to separate containers rather than relying heavily on deep drop shadows, preserving a clean, modern flat-to-layered hierarchy.
- **Interactive States:** Hover and active elevations introduce soft, diffused shadow layers to indicate interactivity clearly.

## Shapes
The design system implements a **Rounded** shape language (`roundedness: 2`). 

- **Base Elements:** Standard UI containers, buttons, and inputs feature a moderate roundedness of 0.5rem.
- **Large Containers:** Cards, modals, and larger structural wrappers scale up to 1rem (`rounded-lg`) or 1.5rem (`rounded-xl`) to maintain a friendly yet professional appearance.

## Components
- **Buttons:** Primary buttons use the primary brand color with rounded corners (0.5rem radius) and medium-weight Inter labels. Secondary buttons use ghost borders or neutral surface fills.
- **Chips:** Compact, pill-adjacent or softly rounded tag elements used for filtering and categorization.
- **Lists:** Clean row items separated by subtle neutral dividers, supporting leading icons and trailing actions.
- **Checkboxes & Radio Controls:** Custom-styled indicators featuring the primary brand color when selected.
- **Input Fields:** Outlined text boxes with clear focus states driven by the primary accent color and supportive label typography.
- **Cards:** Surface containers with soft rounded corners, light borders, and ample internal padding for grouping related content blocks.