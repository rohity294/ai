# UI Tokens and Background

This document records the canonical background token and UI guidance for the Certification Portfolio project.

- Canonical page background token: `--bg`
  - Current value (development): `linear-gradient(180deg,#071024 0%, #071833 60%)` defined in `src/styles.css`.
  - Usage: Apply to the `body` or top-level container (`.app-shell`) only. Do not override in sections.

- Card and foreground tokens:
  - `--card`: card surface color
  - `--muted`: secondary text color
  - `--accent`: accent color used for highlights

Guidance for contributors:
- To change the page background, update `--bg` in `:root` within `src/styles.css`.
- Do not add `background` or `background-image` rules to section containers (e.g., `.provider-section`, `.provider-header`).
- Decorative logos for provider headers should be inline images (`<img class="provider-header-logo">`) and not used as background-image on sections.

Accessibility:
- Ensure provider headers and card text maintain contrast against the page background. If necessary, add a subtle semi-opaque backdrop behind heading text (as implemented in `src/styles.css`).
