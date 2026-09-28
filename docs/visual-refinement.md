# Visual refinement

## Audit and direction

Keep the existing section order, copy, API-fed projects, rolling stack, technical
detail dialogs, filters, skill evidence links, contact form and dedicated resume.
The current frontend is vanilla HTML/CSS/JavaScript with shared tokens. No project
screenshots or contribution records are present; use the existing verified system
diagrams and project descriptions without inventing preview images or claims.

The previous palette applies saturated purple to nearly every surface. Corner
radii mix 4px controls with 6px cards, supporting skills lack clear grouping,
and fixed-height project cards clip descriptions on phones. Text sizing and
spacing use many unrelated values; some hover states move entire text blocks.

Refine the system first: local Inter variable typography; charcoal/neutral
surfaces with violet accents; 8/12/16/20px radii; a 4px spacing scale; shared
control heights, panel padding, borders, elevation, and fast motion tokens.
Use modular panels for projects, skills, profile and contact. Keep experience,
About, and supporting resume information as readable text and ruled rows.

## Component decisions

- Keep identity and projects prominent with a compact display scale and distinct
  title/body/label/metadata styles. Serve Inter locally with a system fallback.
- Keep the user's Plasma background visible across the entire portfolio, with
  continuous motion. Pause when the document is hidden or reduced motion applies.
  A light overlay preserves text readability; solid neutral cards stay distinct.
- Use solid, layered neutral navigation and panels with restrained violet states.
- Let overlapping project cards take their height from their content; retain full
  descriptions at every width. Frame real system diagrams as technical previews.
- Render API technology values as compact neutral tags. Keep all original values.
- Use a two-column supporting project gallery and a three/two/one-column skills
  grid. Preserve the existing filters and detail actions.
- Limit lift to cards and interactive controls; retain visible keyboard focus,
  44px touch controls, native validation and reduced-motion support.
- Share one scroll-reveal script across the portfolio, resume and admin pages.
  Reveal content once at 12% intersection, from 24px below and zero opacity to its
  normal position and full opacity over 500ms. Stagger siblings by 70ms, capped at
  480ms. Register dynamic projects, dialogs and inbox messages; reveal focused
  controls immediately. Reduced motion, printing and unsupported browsers keep
  content visible. Remove completed reveal styles to preserve hover transitions.

## Validation

> **Later change:** `frontend/resume.html` has since been removed. Professional
> experience now appears in the homepage Experience section, and no page links
> to a résumé. Resume notes below are kept as history.

### Resume background follow-up

`frontend/resume.html` now loads the existing `effects.js` and uses the same
decorative Plasma canvas as the homepage. `frontend/styles.css` places resume
content and its footer above that shared background. No shader duplication,
content edits or layout changes. Desktop light mode and phone dark mode passed
browser checks for continuous motion below the intro, scroll reveals, theme
switching and overflow. Reduced motion renders a static frame; print/PDF hides
the background on a white page. All 15 tests and markup/CSS checks passed.

### Loading and depth follow-up

The attached loading brief is implemented in the existing vanilla JavaScript
architecture. React hooks would require a framework migration; the equivalent
single page-level state lives in `frontend/js/loading.js`, with one 600ms timer
started at DOMContentLoaded and cleanup on completion, pagehide or printing.
Only the homepage gets this initial loader. The resume retains its normal reveal.

Reusable skeleton masks use the real content boxes, preserving text wrapping,
responsive grids and component dimensions. An API-specific project placeholder
remains if that request takes longer; app.js still owns its success/error state.
The main region is busy and inert for the short loading interval. Navigation can
end it early. A 320ms main-content fade handles the visible viewport, then the
shared reveal script handles subsequent sections without a second hero entrance.
Reduced motion disables pulse, entrance and reveal motion. Existing Plasma,
rolling cards, hover interactions, content, backend and form logic are preserved.

Shared shadow tokens now use a soft 8px/30px card shadow, 16px/50px featured
shadow, and restrained hover elevation. Dark mode has separate shadow opacity.
Profile, projects, skills, contact and education reuse these tokens. Experience
and certification groups receive only the smallest shadow and keep their ruled
editorial layout. Shadows are removed for print.

Changed for this follow-up: `frontend/js/loading.js`, `frontend/js/reveal.js`,
`frontend/styles.css`, `frontend/index.html`, the syntax-check command in
`package.json`, and this document. No content edits or dependency additions.

Browser validation at 1440px, 820px and 390px in light/dark modes measured the
loading interval at 604–613ms. Hero dimensions matched before and after the
transition at all three sizes. No horizontal overflow, continuing WebGL draws,
offscreen reveals, static reduced-motion placeholders, visible hero controls,
project dialogs and slow/failing API recovery passed. Skeleton screenshots use
an extended timer in the browser test only so the short state can be inspected;
production remains 600ms. Checks and all 15 existing tests passed.

### Earlier refinement checks

- `npm.cmd run check`: passed.
- `npm.cmd test`: 15 passed, including regression coverage for skill evidence
  links revealing their project and keyboard focus following the active slide.
- Static review: valid markup/ARIA references and CSS; minimum core text contrast
  on shared surfaces is 5.94:1 in light mode and 7.19:1 in dark mode. Input borders
  and focus indicators meet 3:1 against their tested surfaces.
- Actual headless Edge renders at 1440, 820, 390 and 320px: reviewed hero,
  featured work, supporting gallery, skills, contact, dialogs and resume in both
  themes. No page overflow or clipped active-card controls. Tablet project panels
  use one column and a two-column system diagram; phones use vertical diagrams.
- Browser interactions: all three slides, project filters, theme toggle, mobile
  menu, dialog Escape/focus restoration, skill links, arrow-key focus transfer,
  visible form focus and the admin login view passed without JavaScript errors.
- Browser motion checks cover continuous animation, including below the hero and
  beyond five seconds; reduced motion renders a static frame with project
  transitions disabled. Resume print mode uses a white background.
- Scroll-reveal browser checks passed on all three pages: 12% threshold, 24px
  offset, 500ms timing, capped stagger, reduced motion on load and preference
  changes, and visible printed content. Dynamic projects, dialogs and a temporary
  local inbox fixture passed, as did immediate keyboard-focus visibility and the
  fallback when IntersectionObserver is unavailable. No browser exceptions.
- Compared entire homepage and resume body markup with pre-refinement snapshots:
  unchanged. Project text and technology values still come from the existing API.
  No invented metrics, contributions or screenshots were added.
- `git diff --check`: passed. No package dependencies, backend or database changes.

## Files

Shared tokens/components: `frontend/styles.css`. Project tag markup and focus:
`frontend/js/app.js`. Ambient motion and navigation breakpoint:
`frontend/js/effects.js`. Font preload and resume control styling:
`frontend/index.html`, `frontend/resume.html`. Local font and license:
`frontend/assets/fonts/`. Regression coverage: `test/frontend.test.mjs`.
Shared scroll reveals: `frontend/js/reveal.js`, loaded by all three HTML pages;
its syntax check is included in `package.json`.

Typography uses the official [Inter variable font](https://github.com/rsms/inter),
served locally with its included SIL Open Font License. No third-party font
request is needed when visiting the site.

Screenshots and browser-check output are in the ignored `tmp/visual-refinement/`
directory. Real-device Safari and Android rendering remain manual checks; this
review used Edge at emulated viewport sizes. Changes are local and not deployed.
