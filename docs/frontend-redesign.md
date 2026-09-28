# Frontend redesign review

The section and content decisions below describe the earlier recruiter-focused
pass. For the current typography, neutral surfaces, responsive cards and motion
behavior, see [Visual refinement](visual-refinement.md).

## Audit and decisions

The existing vanilla HTML/CSS/JavaScript frontend loads project records from
`GET /api/portfolio`, backed by SQLite. The contact form posts validated JSON to
`POST /api/contact`; the Express admin endpoints manage the persistent inbox.
The portfolio and admin interface share `styles.css`. These contracts and
the database seed remain unchanged.

| Perspective | Finding | Decision |
| --- | --- | --- |
| Technical recruiter | The opening screen spent space on two slogans and academic statistics; internship interests were buried in About. | Lead with identity, practical work, technologies, university, internship interests, and direct links. |
| Engineering hiring manager | Project capabilities, complete stacks, and the sole supplied source URL required opening dialogs. | Put product descriptions, technologies, selected capabilities, and the available source link directly on the page. |
| UI/UX designer | Repeated italic headings, diagram-heavy cards, and badge clusters competed with useful content. | Use coordinated violet accents, direct headings, readable text, and a rolling stack that keeps verified project evidence in focus. |
| Frontend engineer | Navigation waited for the portfolio request; reveal styling could leave content invisible when initialization failed. | Initialize navigation and contact independently of project loading. Show content immediately and bound the project request to ten seconds. |
| Accessibility reviewer | Whole project cards were buttons containing structural content; mobile navigation did not move focus into the opened menu. | Use semantic project articles with separate controls, visible labels, keyboard entry and Escape return, readable contrast, and native dialogs. |

- **Keep:** seven projects; full technical details; all verified academic,
  experience, leadership, and supporting skill information; contact;
  themes; API integration; admin workflows; existing tests and CI.
- **Improve:** visible engineering evidence, focus behavior, error recovery,
  mobile layouts, shared print colors, and control contrast.
- **Remove:** repeated slogans, hover-only technology lists, decorative reveal
  gates, redundant hero statistics, unused selectors, and a misleading dialog
  note about illustrative screenshots (the visuals are architecture diagrams).
- **Move:** professional experience into the Experience section; secondary architecture diagrams
  into their technical-detail dialogs.
- **Shorten:** About and section titles. Keep complete implementation details
  available through progressive disclosure.

## Information architecture and text wireframe

Before: hero + profile panel + academic statistics → selected work → experience
→ About → skills → education → contact.

After:

1. **Identity:** Nurin Irdina; full-stack development and practical AI; concrete
   work description; React, TypeScript, Node.js, SQL, Python; projects,
   GitHub, LinkedIn and email. Adjacent university and internship direction.
2. **Selected engineering work:** an interactive rolling stack opens with
   JomDekan and lets visitors move through FitWUs and Animal Image
   Classification. Each active card exposes its product description, stack,
   engineering highlights, architecture overview, source link when supplied,
   and technical details. Four other projects use compact summaries and filters.
3. **Experience:** a Professional experience group (Account Trainee) followed
   by Leadership & outreach, with further leadership in a disclosure.
4. **Capabilities:** six readable technology groups with project evidence links;
   supporting tools remain available in a disclosure.
5. **About:** brief development interests and work beyond software.
6. **Contact:** direct contact links and the existing validated inbox form.

Main navigation now has Projects, Experience, Skills and Contact. The separate
résumé page has been removed; its professional experience now lives on the
main page.

JomDekan has the strongest documented breadth: React/TypeScript, Express,
PostgreSQL, resource-grounded AI, citations, authentication, security, testing,
and documentation. FitWUs demonstrates another full-stack application; Animal
Image Classification demonstrates model training and inference. This ranking
uses the supplied records, not independently verified project outcomes.

## Content integrity

Project descriptions, highlighted features, technologies and source links are
rendered from existing API records. No project metrics, live demos, technologies,
experience or academic claims were added. JomDekan is the only project with a
source URL in the seed; the others receive technical-details controls only.
Individual contribution and solo/team status are not recorded, so implementation
copy remains neutral pending owner confirmation.

## Responsive and accessibility decisions

- Desktop uses a compact split hero and a rolling project stack with exposed
  card headers, architecture, indicators, and previous/next controls.
- At tablet widths each active project becomes one column and its architecture
  becomes a two-column overview; skills use two columns and navigation becomes
  an explicit menu.
- Phones use taller one-column rolling cards, swipe navigation, compact controls,
  one-column skills, wrapping filters, and full-width form controls.
- Text and controls use the same light/dark tokens. The tested text pairs reach
  at least 4.85:1 in light mode and 4.93:1 in dark mode, including the brightest
  shader colors; focus and input borders
  reach at least 3:1 against their tested backgrounds.
- Keep skip links, logical headings, labels, live status messages, native form
  validation, native dialogs, dialog focus return and visible keyboard focus.
  Opening mobile navigation focuses its first link; Escape returns to the toggle.
- Content is immediately visible. Reduced motion disables smooth scrolling and
  transitions. Print tokens switch to readable light colors even from dark mode.
- Fine-pointer hover states add restrained lift and border feedback to controls,
  project layers, architecture nodes, experience rows, skills and contact areas.
- A fixed WebGL Plasma background adds slow, organic purple movement behind the
  portfolio. Dark mode uses the reference's black-and-purple palette; light mode
  uses a pale-violet variant for readable dark text. It ignores pointer input,
  becomes static for reduced motion, and is omitted from print.
- Shared admin token aliases resolve legacy custom-property names in admin CSS.

## Validation

Commands run on Windows using `npm.cmd` because PowerShell blocks `npm.ps1`:

- `npm.cmd run check`: passed.
- `npm.cmd test`: 13 passed (six backend integration tests and seven frontend
  interaction regression tests).
- `npm.cmd run build`: passed. Unrelated regenerated vendor assets were restored
  to their initially clean tracked contents after checking the build.
- `npm.cmd audit --omit=dev --audit-level=high --cache ./tmp/npm-cache`: passed,
  zero vulnerabilities. The first restricted-network attempt could not reach
  the audit endpoint; the network-enabled retry succeeded.
- Local static review: balanced markup, unique IDs, static anchor and ARIA target
  checks for the homepage, résumé and admin page; CSS parsing without warnings;
  palette contrast calculations.

Frontend regression tests exercise API-backed rendering, independent source
links, rolling-card buttons, arrow keys and swipe gestures, archive filters,
dialog activation and focus-return handlers, escaped
API content, unsafe-link omission, missing diagrams, API errors, contact during
pending project loading, contact validation/error recovery, and mobile menu
keyboard handlers. They use a small DOM boundary fake and do not establish
native browser layout, focus trapping or accessibility-tree behavior.

The Browser connection returned no available browser. Responsive rules were
reviewed statically for 320, 375, 768, 1024 and 1440px layouts, but no rendered
screenshots or browser interaction checks were possible in this session.

## Remaining verification and content

- In a connected browser, inspect those widths in both themes and with reduced
  motion. Check overflow, touch controls, keyboard order, dialog Escape/focus
  trapping, screen-reader announcements, résumé print preview and live links.
- Confirm personal contribution and solo/team status for the three featured
  projects before adding ownership statements.
- Add other repository/demo links only when verified and supplied. The current
  data contains no additional project links.

The Express backend, SQLite schema and seed, contact/admin API contracts, theme persistence, and CI workflow were preserved. No dependencies or
framework migration were introduced.
