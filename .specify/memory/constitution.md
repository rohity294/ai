# [PROJECT_NAME] Constitution

Purpose: Define the bare-minimum requirements to build, ship, and operate a static web application.

## Minimum Requirements

- **Build output**: Produce a single, deployable directory named `dist/` (or `public/`) containing all production files.
- **Entry point**: `index.html` must exist at the root of the build output and serve as the application entry.
- **Assets**: Static assets (CSS, JS, images, fonts) must be in an `assets/` (or equivalent) directory; use filename hashing for cache busting.
- **Routing**: For single-page apps, the host must be configured to rewrite unknown paths to `index.html` (SPA fallback).
- **Hosting**: Host on a static file host (GitHub Pages, Netlify, Vercel, Azure Static Web Apps, S3+CDN, Cloudflare Pages, etc.). No server-side runtime required.
- **Hosting**: Host on a static file host (GitHub Pages, Netlify, Vercel, Azure Static Web Apps, S3+CDN, Cloudflare Pages, etc.). Preferred: Vercel (automatic SPA fallback, preview deployments, built-in CI integration). No server-side runtime required.
- **TLS/HTTPS**: Serve all traffic over HTTPS with a valid certificate.
- **Caching & headers**: Fingerprinted assets may be cached long-term; HTML should use short/no-cache. Set correct `Content-Type` headers. Recommend `Content-Security-Policy` and other security headers.
- **Secrets**: No secrets or private keys committed to the repo. Any build-time secrets must be injected via CI/CD secure variables and not bundled into public assets.
- **CI/CD**: Builds must run in CI; deployment triggered from the main branch. Deploy artifacts should be immutable and atomic where supported.
- **Smoke test**: Post-deploy check must verify `index.html` returns HTTP 200 and critical assets load.

## Optional (recommended)

- **CDN**: Serve assets via a CDN for global performance and cache invalidation support.
- **Sitemap & robots**: Provide `sitemap.xml` and `robots.txt` as appropriate for public sites.
- **Accessibility & SEO**: Include basic meta tags and run basic accessibility checks in CI.

## Governance

- Amendments to this constitution require a short PR describing the change and one approver.

**Version**: 1.0 | **Ratified**: [DATE] | **Last Amended**: [DATE]

## Clarifications

### Session 2026-05-16

- Q: Deployment target → A: Vercel
