# QA Results: Uniform Page Background

Run manual checks across viewports and record outcomes.

- Checked viewports: 1920x1080, 1366x768, 1024x768, 768x1024, 375x812
 - Result overview:
  - Page background is uniform across sections: PASS — no section-level backgrounds detected after fixes
   - Provider headers use inline logos and do not change page background: PASS
   - Provider heading contrast: PASS (subtle backdrop ensures readability)

Notes:
- Screenshots can be added here (`/screenshots/...`) if available.
- Observed behavior (prior to fix): A subtle horizontal band appeared between sections on some viewport heights. Root cause: section-level background declarations and overlapping gradients.
- Fix applied: Centralized the page background to `--bg` on `body` and removed section-level `background` declarations from `.provider-header`, `.provider-header h2`, and `.hero`.
- Verification: Ran `node scripts/check-uniform-bg.js` — the checker reports PASS.
- Date: 2026-05-16

to verify.
