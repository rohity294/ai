# SPEC 005 — MCT Card Style

Short name: mct-card-style

Purpose
- Define the visual and interaction specification for styling the Microsoft Certified Trainer (MCT) card so it reads and feels like a physical MCT business/identity card while remaining accessible, responsive, and implementable as CSS-only enhancements to the existing SPA.

Actors
- Site visitor (primary): views certification cards on the homepage or provider sections.
- Content owner (secondary): updates certificate entries in `src/data/cert.json`.

User scenarios & testing
- Primary: A visitor opens the Microsoft provider section and visually distinguishes the MCT card as an official-looking MCT business card (gold accent, card-like surface, embossed-like title, contact-like metadata area). They can still read the card content, focus it with keyboard, and the card does not interfere with layout on small screens.
- Secondary: A visitor using a screen reader encounters the MCT card and receives a clear announcement (card role and `aria-label`) describing the MCT status.

Functional requirements (testable)
1. Visual appearance: The MCT card must show a distinct gold-themed treatment: gold border, subtle gold gradient surface, and a gold corner badge reading "MCT". (Test: compare MCT card against a non-MCT card — gold border present and badge visible at 1280px width.)
2. Card shape and depth: The MCT card must appear elevated with a soft shadow and slight rounded corners similar to a physical business card. (Test: CSS `box-shadow` present; `border-radius` >= 6px.)
3. Emphasized title: The certificate title on the MCT card must use stronger weight or a subtle embossed effect so it reads prominent without reducing legibility. (Test: computed `font-weight` or `text-shadow` providing visual emphasis.)
4. Metadata zone: The MCT card must contain a visually-separated metadata strip (smaller text) for issuer/role/date area, styled like a contact line on a business card. (Test: metadata has smaller font-size and a divider line or background with contrast ratio >= 3:1 against card surface.)
5. Badge: The gold MCT badge must be produced with CSS only (pseudo-element) and not rely on additional image assets. (Test: `.card.mct::after` or similar exists and contains visible text "MCT".)
6. Responsiveness: On narrow viewports (<420px), the MCT card compresses gracefully: badges scale down, fonts reduce but remain readable (WCAG AA for body text). (Test: at 360px width the card content remains readable and does not overflow container.)
7. Non-invasive: The MCT card must not change document order or remove keyboard focusability; it adds only visual styles and ARIA attributes. (Test: tab order unchanged; `tabindex` preserved.)
8. Sheen animation: The MCT card surface must include a subtle, left-to-right running metallic sheen/glimmer implemented in CSS (pseudo-element + keyframes). The animation:
	- runs continuously by default to provide a premium glimmer effect;
	- uses GPU-friendly transforms (translateX) and opacity only (avoid expensive paint/layout properties);
	- is subtle (low opacity, short width) and does not obscure card text or metadata;
	- respects `prefers-reduced-motion` by disabling or providing a non-animated fallback when requested by the user.
	(Test: at desktop width the sheen visibly glints left→right; with `prefers-reduced-motion: reduce` the sheen is stopped or replaced by a static highlight.)

Success criteria (measurable)
- Visual: At desktop width (>=1024px) the MCT card shows gold border and badge; non-MCT cards must not show these elements.
- Accessibility: Screen readers announce "Microsoft Certified Trainer" when focused on the MCT card via `aria-label` or `aria-describedby` and body text contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large text).
- Performance: Styling is CSS-only (no new network assets). Page weight change: 0 KB in assets; only CSS rules added.
- Responsiveness: No horizontal overflow at 320px viewport; badge scales to ≤12px height at narrow widths.

Key entities
- MCT card: certification object with `mct` detection currently derived in `src.app.js`.
- Card DOM element: `.card.mct` with content regions `.card__title`, `.card__meta`, `.card__desc`.

Assumptions
- `src.app.js` will add the `mct` class to the MCT card element (already implemented).
- The SPA maintains semantic markup: each card is focusable and includes title and desc elements.

Accessibility
- Provide `role="article"` and `aria-label="Microsoft Certified Trainer — <cert title>"` on the MCT card container.
- Ensure text contrast for metadata zone meets at least 3:1 for smaller text and 4.5:1 for normal body text.
- Avoid using color alone to convey MCT status; include a textual `::after` badge with the letters "MCT" for screen reader access.

Acceptance criteria / QA tests
1. Visual check: In a served local site, find the card with `.card.mct` and verify gold border, gold badge reading "MCT", box shadow, and metadata strip are present and styled.
2. Keyboard check: Tab to the MCT card; the focus outline is visible and the same content is accessible by keyboard.
3. Screen reader check: With a screen reader, focus the card and the announcement includes "Microsoft Certified Trainer" and the certificate name.
4. Responsive check: Resize viewport to 360×800 and verify no overflow and readable text; badge legible.

Implementation notes (for developers)
- Use a single CSS rule block targeting `.card.mct` and `.card.mct::after` for badge. Prefer pseudo-elements and CSS gradients/box-shadow to simulate metallic/gold surfaces.
- Keep changes additive — do not alter card markup or data structures in `src/data/cert.json`.
- Tests: manual visual checks plus quick axe run are sufficient at this stage; automated visual diff optional.

Sheen implementation guidance
- Implement the sheen as a pseudo-element (for example, `.card.mct::before` or `.card.mct .sheen`) positioned above the card surface using `pointer-events:none` and `mix-blend-mode:overlay` or opacity gradients.
- Animate using `@keyframes sheen { transform: translateX(-100%) => translateX(100%); }` applied to the pseudo-element with `will-change: transform` to leverage the compositor.
- Keep the animation duration moderate (e.g., 3.5s–8s) and easing gentle (ease-in-out) so the effect is premium and not distracting.
- Respect `prefers-reduced-motion: reduce` to pause or remove the animation and provide an accessible static sheen (e.g., a subtle highlight gradient) instead.
- Avoid animating `box-shadow`, `width`, `height`, or other properties that trigger layout/paint. Use `transform` + `opacity` only.

Performance and accessibility notes
- Verify CPU/GPU cost on a typical mobile device; the sheen should not cause jank. If necessary, reduce frame-rate (use step timing or longer duration) or remove the sheen on low-powered devices.
- Provide a CSS-only fallback when animations are unavailable.

Files produced by this spec
- `specs/005-mct-card-style/spec.md` (this file)
- `specs/005-mct-card-style/checklists/requirements.md` (quality checklist)

Status
- Draft: ready for review and implementation.
