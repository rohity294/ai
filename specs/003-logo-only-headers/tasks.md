# Tasks: Logo-Only Provider Headers (Feature 003)

User Story 1 - Logo-first Provider Headers

- T1_US1 — Remove visible provider text titles
  - Description: Remove the visible `<h2>` provider title from provider headers in `src/app.js` and update templates so only the logo image is visible.
  - Files: `src/app.js`, `src/styles.css`
  - Acceptance: No visible provider text in the header; HTML still contains semantic provider identity (see T3_US1/T1_US2).

- T2_US1 — Increase logo visual size and responsive sizing
  - Description: Increase provider logo display sizes proportionally. Set CSS responsive rules: desktop ~140px width, tablet ~110px, mobile ~80px (or best-fit).
  - Files: `src/styles.css`
  - Acceptance: Logos scale correctly across breakpoints and preserve aspect ratio; no content overlap.

- T3_US1 — Adjust header spacing and layout for larger logos
  - Description: Update margins/padding for `.provider-header` and surrounding content so larger logos don't create layout issues.
  - Files: `src/styles.css`
  - Acceptance: Visual spacing is balanced; cards below headers maintain consistent gap.

- T4_US1 — Provide accessible semantic label for provider header
  - Description: Ensure provider identity remains available to assistive tech (use visually-hidden H2, `aria-label`, or `aria-labelledby`).
  - Files: `src/app.js`, `src/styles.css`
  - Acceptance: Screen readers announce provider names; automated a11y checks pass.

- T5_US1 — QA & visual validation
  - Description: Manual visual checks across viewports and document results in `specs/003-logo-only-headers/qa-results.md`.
  - Acceptance: QA doc shows screenshots/notes confirming logos-only headers render well.

User Story 2 - Accessibility and SEO

- T1_US2 — Screen-reader announcements and ARIA
  - Description: Add proper `aria-label`/`aria-labelledby` for provider header regions and ensure `alt` text on logos is descriptive.
  - Files: `src/app.js`
  - Acceptance: Automated screen-reader tests or aXe report show provider names announced.

- T2_US2 — Preserve document outline / SEO
  - Description: Preserve semantic headings for SEO: either keep an H2 visually hidden (`.sr-only`) or add structured data (JSON-LD) linking provider sections.
  - Files: `src/app.js`, optional `docs/seo.md`
  - Acceptance: HTML contains semantic provider headings (hidden) or structured data; SEO crawlers can discover provider names.

- T3_US2 — Accessibility testing automation
  - Description: Add a CI task or local script that runs `axe`/`pa11y` checks against the homepage and ensures provider sections pass accessibility rules.
  - Files: `package.json` (scripts), `.github/workflows/ci.yml` (optional)
  - Acceptance: CI job or local script returns success for accessibility tests.

- T4_US2 — Performance & asset optimization for larger logos
  - Description: Ensure larger logos are optimized (WebP fallbacks or compressed PNG) and use width/height or `aspect-ratio` to reserve space.
  - Files: `assets/logos/*`, `src/styles.css`, `docs/ui.md`
  - Acceptance: Logos are optimized and no new CLS is introduced; images include width/height or CSS aspect-ratio.
