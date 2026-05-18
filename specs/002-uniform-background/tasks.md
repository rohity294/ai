# Tasks: Implement Uniform Page Background (Feature 002)

All tasks are scoped to make the page background uniform while preserving accessibility and the previously implemented provider logos (they should no longer change the page-level background).

- [ ] T201 [US1] Update `src/styles.css` to centralize the page background using `--bg` and remove any section-level background rules that create visible stripes.
  - Acceptance: `body` or `.app-shell` uses `--bg` for background; no section element (e.g., `.provider-section`, `.provider-header`) sets a full-page background image or color that differs from `--bg`.

- [ ] T202 [US1] Refactor provider header implementation so logos are decorative inline elements (e.g., `<img class="provider-inline-logo">`) instead of background banners.
  - Files: `src/app.js`, `src/styles.css`
  - Acceptance: Provider logos are visible inside the header but sections do not change page-level background; visual parity maintained.

- [ ] T203 [US1] Ensure contrast and accessibility: add overlay rules or adjust text color so provider headings meet WCAG AA contrast (>=4.5:1).
  - Files: `src/styles.css`
  - Acceptance: Automated contrast check passes for provider headings.

- [ ] T204 [US1] Remove any inline `style="--provider-logo:..."` usage that causes background-image rendering; migrate to setting `src` on inline `<img>` elements.
  - Files: `src/app.js`, `src/styles.css`
  - Acceptance: No inline CSS vars used to set `background-image` on header elements.

- [ ] T205 [US1] Add an automated check script `scripts/check-uniform-bg.js` that scans compiled HTML/CSS for section-level background declarations and fails if found.
  - Acceptance: `node scripts/check-uniform-bg.js` exits 0 when page is uniform, non-zero otherwise. Add to CI as a pre-deploy check.

- [ ] T206 [US1] Update documentation: `docs/ui.md` (or `specs/002-uniform-background/spec.md`) to record the decision and the canonical `--bg` token.
  - Acceptance: Documentation shows the chosen `--bg` value and guidance for contributors.

- [ ] T207 [US1] Manual QA & cross-viewport verification (desktop/tablet/mobile) and record results in `specs/002-uniform-background/qa-results.md`.
  - Acceptance: `qa-results.md` contains screenshots or notes verifying uniform background across 5 viewport sizes.
