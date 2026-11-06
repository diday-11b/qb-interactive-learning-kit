# QB Interactive Learning Kits — Shared UI

The project is a collection of standalone HTML prototypes, so shared UI is provided as browser-native CSS and JavaScript instead of introducing a framework or build step.

## Shared files

- `assets/qb-design-system.css` contains color, type, spacing, radius, border, shadow, focus, responsive layout, and component styles.
- `assets/qb-design-system.js` registers `<qb-site-header>` and `<qb-mascot>`, plus native dialog and toast triggers.
- `index.html` includes a component showcase. `explore-questions.html` uses the same responsive header. The game library screen loads the shared tokens and accessibility utilities.

## Use in an HTML screen

Load the shared files once in the document head:

```html
<link rel="stylesheet" href="/assets/qb-design-system.css">
<script src="/assets/qb-design-system.js" defer></script>
```

Use the shared navigation with `<qb-site-header current="home"></qb-site-header>` or set `current="questions"` on the question catalog. The mobile menu supports keyboard activation and Escape to close.

Available component classes include `.qb-button` and its color modifiers, `.qb-card`, `.qb-badge`, `.qb-input`, `.qb-select`, `.qb-field`, `.qb-dialog`, `.qb-tooltip`, `.qb-status`, `.qb-empty-state`, `.qb-spinner`, `.qb-skeleton`, `.qb-container`, `.qb-stack`, and `.qb-form-layout`. Add `data-qb-dialog="dialog-id"` to open a native `<dialog>`, `data-qb-dialog-close` to close it, and `data-qb-toast="toast-id"` to show a status message.

The mascot is a small original SVG rendered by `<qb-mascot label="Leo the lion"></qb-mascot>`. It can be used without an image download. The system includes visible keyboard focus, touch-sized controls, a responsive mobile navigation, and reduced-motion overrides.

## Current scope

This is a shared component foundation, not yet a unified theme across every standalone screen. The stylesheet is linked by only a small subset of the 41 HTML pages; most routes retain page-specific colors, navigation, and control styles. The common font stylesheet is present more widely, but that alone does not make their layouts or controls consistent. Adopt the shared stylesheet and component classes as screens are updated. The project has no bundler, so shared asset URLs assume the static server is rooted at the repository folder.

The shared controls use the palette tokens above, a single visible focus color, touch-sized buttons, disabled states, bounded scrollable dialogs, and reduced-motion overrides for both the operating-system preference and the saved account preference. Verify any page after adopting the components because legacy page styles can override them.
