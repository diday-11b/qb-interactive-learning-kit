---
name: QB Interactive Learning Kits
colors:
  surface: '#f9f9ff'
  surface-dim: '#d4daeb'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e8edff'
  surface-container-high: '#e2e8fa'
  surface-container-highest: '#dde2f4'
  on-surface: '#151c28'
  on-surface-variant: '#554337'
  inverse-surface: '#2a303e'
  inverse-on-surface: '#edf0ff'
  outline: '#887365'
  outline-variant: '#dbc2b1'
  surface-tint: '#924c00'
  primary: '#924c00'
  on-primary: '#ffffff'
  primary-container: '#ff983d'
  on-primary-container: '#6b3600'
  inverse-primary: '#ffb780'
  secondary: '#006783'
  on-secondary: '#ffffff'
  secondary-container: '#83dafe'
  on-secondary-container: '#00607a'
  tertiary: '#006c44'
  on-tertiary: '#ffffff'
  tertiary-container: '#5ac58e'
  on-tertiary-container: '#004f30'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc4'
  primary-fixed-dim: '#ffb780'
  on-primary-fixed: '#2f1400'
  on-primary-fixed-variant: '#6f3800'
  secondary-fixed: '#bce9ff'
  secondary-fixed-dim: '#7bd2f6'
  on-secondary-fixed: '#001f29'
  on-secondary-fixed-variant: '#004d63'
  tertiary-fixed: '#8df8bd'
  tertiary-fixed-dim: '#70dba2'
  on-tertiary-fixed: '#002111'
  on-tertiary-fixed-variant: '#005232'
  background: '#f9f9ff'
  on-background: '#151c28'
  surface-variant: '#dde2f4'
typography:
  display-hero:
    fontFamily: Quicksand
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Quicksand
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: '0'
  headline-md:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-sm:
    fontFamily: Quicksand
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  title-md:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 26px
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-sm:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-lg:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '800'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '800'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: '800'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

This design system is crafted specifically for early-stage learners, elementary students, parents, and educators. The brand personality is joyful, delightfully tactile, endlessly encouraging, and structured enough to support high-focus educational tasks. It avoids sterile corporate patterns in favor of a "Soft Pop / Playful Neo-Brutalist" visual language: rich, pastel-tinted environments paired with thick, ink-lined containers, pillowy shapes, and chunky mechanical affordances that feel like physical learning toys.

### Visual Pillars
- **Chunky & Tactile Affordances:** Interactive elements feature explicit 2px ink boundaries and hard offset drop shadows that visually depress upon click or tap. Children receive instantaneous, physical feedback.
- **Warm Cognitive Ergonomics:** The sky-blue atmospheric base reduces digital screen fatigue, while vibrant secondary pastels clearly categorize distinct academic domains (such as science, math, reading, and gamified challenges).
- **Celebratory Momentum:** Micro-interactions emphasize reward states, badge unlocks, bouncing pill badges, and friendly shapes designed to spark curiosity without sensory overwhelm.

## Colors

The color palette pairs cheerful, sunlit hues with a grounding ink outline to achieve high-contrast legibility and whimsical energy.

### Color Tokens & Semantic Roles
- **Page Background (`#D9EEFF`):** Soft Sky Blue. Serves as the global backdrop canvas, preventing stark white eye fatigue while framing content cards.
- **Primary Action (`#FF983D`):** Warm Orange. Reserved for high-priority calls to action, primary game triggers, start/continue milestones, and high-impact interactive prompts.
- **Secondary Accent (`#79D0F4`):** Bright Blue. Used for navigation bars, active segmented controls, tab selection, and general navigational wayfinding.
- **Tertiary & Reward (`#7DE8AE`):** Mint Green. Denotes completed exercises, correct answers, streak increments, and progress milestones.
- **Accent Highlight (`#FFF0A8`):** Soft Yellow. Applied to attention ribbons, reward stars, unlocked items, and instructional tip callouts.
- **Domain Accent - Reading & Art (`#E7D8FF`):** Lavender. Distinguishes creative activities, storytelling units, and quiet focus modules.
- **Domain Accent - Hearts & Warnings (`#FFAAA9`):** Coral. Designates lives, favorites, bookmarks, gentle error alerts, and time indicators.
- **Surface Crisp (`#FFFFFF`):** Pure White. The primary container surface for lesson cards, worksheets, and dialogues, ensuring sharp typography contrast against the sky-blue backdrop.
- **Structural Ink (`#202633`):** Ink Navy. Serves as the universal 2px border stroke, primary typography color, icon stroke, and hard offset shadow color.
- **Neutral Muted (`#667085`):** Muted Slate Gray. Reserved strictly for helper text, timestamps, metadata, and disabled placeholder states.

## Typography

The typography engine is tuned to maximize legibility for early readers and developing eyes:

- **Headings & Display (`Quicksand`):** Rounded terminal geometry gives letters a natural, welcoming, friendly voice while maintaining distinct character silhouettes for emerging readers.
- **Body & Controls (`Nunito Sans`):** Utilizes minimum semi-bold (`600`) and extra-bold (`800`) weights. Thin, spindly type is strictly prohibited to guarantee readability across budget tablets and handheld viewports.
- **Spacing & Proportions:** Generous line heights (`1.4` to `1.55`) eliminate vertical overcrowding, easing cross-line tracking for dyslexic and young readers.

## Layout & Spacing

The layout structure balances generous touch targets with responsive modularity across tablets, classroom displays, and mobile phones.

### Grid & Layout Structure
- **Desktop & Landscape Tablet (>= 1024px):** 12-column fluid grid, max-width `1280px`, `2rem` outer canvas margin, and `1.25rem` column gutters.
- **Portrait Tablet (768px - 1023px):** 8-column layout, `1.5rem` outer canvas margin, and `1rem` column gutters. Navigation transitions from top bar to prominent rail or sticky bottom launcher.
- **Mobile Handheld (< 768px):** 4-column responsive grid, `1rem` outer canvas margin, and `0.75rem` column gutters. Cards stack vertically, with key learning controls locked to ergonomic thumbs-reach zones at the bottom edge.

### Tap Targets & Touch Comfort
- All primary interactive elements maintain a minimum hit area of `48px x 48px` (optimally `56px` for kid-facing buttons) with at least `space-sm` (`8px`) separation between adjacent targets to eliminate accidental miss-taps.

## Elevation & Depth

This system avoids blurred, realistic lighting in favor of tactile **Chunky Neo-Brutalist Hard Shadows**.

### Visual Rules
- **Base Border:** Every raised surface, floating card, interactive badge, and button carries an invariant `2px solid #202633` outline.
- **Surface Elevation (Rest):** Raised cards, panels, and resting buttons apply a distinct hard drop shadow:
  ```css
  box-shadow: 4px 4px 0px #202633;
  ```
- **Active / Pressed State:** When activated or tapped, components translate downward and rightward by `2px` to `4px`, collapsing the shadow:
  ```css
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #202633;
  ```
- **Deep Elevation (Modals & Flyouts):** Drawers and modal sheets elevate higher to clearly separate from play boards:
  ```css
  box-shadow: 8px 8px 0px #202633;
  ```
- **Backdrop Overlays:** Modal screens utilize `rgba(32, 38, 51, 0.45)` with an ultra-light blur (`blur(2px)`), keeping focus centered on the foreground challenge.

## Shapes

The design system employs an inviting, pillowy shape scale that softens the rigid ink lines:

- **Cards & Surfaces (`16px - 22px`):** Large surface panels, activity cards, and worksheet containers use smooth radii to feel friendly and protective.
- **Buttons & Interactive Controls (`12px - 14px`):** Chunky rounded corners convey clear affordances for squeezing, pressing, and tapping.
- **Badges, Counter Pills, & Chips (`9999px`):** Fully rounded pill geometries house status chips, coin balances, streak icons, and mini domain categories.

## Components

### Buttons
- **Primary Action (Play / Submit):** Background `#FF983D`, text `#202633` (weight 800), border `2px solid #202633`, corner radius `14px`, shadow `4px 4px 0px #202633`. On active press: `transform: translate(2px, 2px); shadow: 2px 2px 0px #202633`.
- **Success Action (Claim Reward / Continue):** Background `#7DE8AE`, text `#202633`, border `2px solid #202633`, corner radius `14px`, shadow `4px 4px 0px #202633`.
- **Secondary Utility:** Background `#FFFFFF`, text `#202633`, border `2px solid #202633`, corner radius `12px`, shadow `3px 3px 0px #202633`.
- **Icon Button:** Symmetrical `52px x 52px` container, circular or `14px` radius, housing clear, high-stroke iconography with the same tactile press behavior.

### Cards & Lesson Containers
- **Lesson / Task Card:** Background `#FFFFFF`, border `2px solid #202633`, radius `18px`, shadow `4px 4px 0px #202633`.
- **Activity Header Banner:** Integrates a saturated accent tint (`#79D0F4`, `#E7D8FF`, or `#FFF0A8`) nested inside the top rim of the card, divided by a `2px solid #202633` horizontal border.
- **Hover/Focus State:** Shifts up and left by 1px with enhanced shadow expansion (`5px 5px 0px #202633`) on desktop environments.

### Badges, Pills & Rewards
- **Counter Badges (Coins, Stars, Streaks):** Pill shape (`rounded-full`), background `#FFF0A8` (Stars) or `#FFAAA9` (Streaks), border `2px solid #202633`, shadow `2px 2px 0px #202633`, typography `label-sm` or `label-md`.
- **Subject Pills:** Compact pill with subject color background (`#E7D8FF` for Reading, `#7DE8AE` for Science, `#79D0F4` for Math), border `2px solid #202633`.

### Interactive Segmented Tabs
- Container styled in `#FFFFFF` with `2px solid #202633` border and `16px` radius.
- Inactive items possess transparent backgrounds with `#667085` or `#202633` text.
- Active item snaps into a pillowy block with `#79D0F4` background, `2px solid #202633` outline, and `2px 2px 0px #202633` shadow.

### Input Fields & Selectors
- Background `#FFFFFF`, border `2px solid #202633`, radius `12px`, padding `14px 18px`.
- Font size minimum `16px` to prevent automatic browser zoom on iOS mobile devices.
- Focused State: Border stays `#202633`, shadow pops to `3px 3px 0px #202633` with an outline ring of `#79D0F4` (`3px`).

### Checkboxes & Radios
- Size `28px x 28px` minimum.
- Border `2px solid #202633`, radius `8px` for checkboxes, `9999px` for radios.
- Unchecked: White background, subtle offset shadow.
- Checked: Background `#7DE8AE` with a bold `#202633` checkmark icon and depressed `1px 1px 0px #202633` shadow.

### Mascot & Dialog Callouts
- Mascot speech bubbles use `#FFFFFF` background, `2px solid #202633` outline, radius `18px`, and `4px 4px 0px #202633` shadow, featuring an ink-outlined triangular directional pointer anchored to the mascot guide.