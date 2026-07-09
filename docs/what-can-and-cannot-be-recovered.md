# What Can and Cannot Be Recovered

An honest accounting.

## What this harness can recover

### UI / visual

- Public layout regions (header, sidebar, main, aside, footer).
- Public typography (font-family, size, weight, line-height) when the
  browser can compute it.
- Public colors via computed styles and CSS variables the browser
  delivers.
- Spacing, borders, shadows, radii for top-level regions.
- Public icons/assets (URLs only, not binary contents).
- Responsive behavior at the captured viewports.

### Interaction

- Discoverable buttons, links, inputs, tabs, dialogs, menus.
- Roles and accessible names from ARIA.
- Hover-only and disabled states where they exist in static markup.

### Network

- Public request URLs the browser initiated.
- Method, status, content-type, timing.
- Sanitized headers (authorization/cookie/etc. redacted).
- Truncated response bodies.
- A reasonable inference of which requests are framework telemetry vs
  app functionality.

### Storage

- `localStorage` keys and redacted values.
- `sessionStorage` keys and redacted values.
- IndexedDB **database names and versions** (no record contents).

### Bundles

- Public JS/CSS/Worker/WASM asset URLs.
- File name + chunk layout.
- Framework clues (Next.js, Remix, Vite, Tailwind, etc.).
- Source map presence — only if the server delivers `.map` publicly.

### Console

- Console messages and uncaught errors.
- Page errors.

### Architecture

- An inferred state model from observed regions, controls, and storage.
- An inferred component map from DOM landmarks and ARIA roles.
- An event map from click attempts and observed transitions.
- A candidate export pipeline from worker URLs and WASM modules.

## What this harness CANNOT recover

### Hidden backend

- Private server code.
- Private API endpoints that the public client does not call.
- Server-side business logic, queues, payment, or auth flows.

### Closed-source modules

- Modules the public client does not deliver.
- Encrypted/obfuscated server payloads.

### Pixel-perfect clones

- Hover animations and micro-interactions in flight.
- Anti-aliasing and font rendering across platforms.
- Full state matrix of every modal/notification ever shown.

### Anything behind authentication

- Logged-in dashboards, admin tools, project files of other users.
- Account data, billing, usage.

### Source maps that are not publicly delivered

- If the server does not serve a `.map` for a JS file, we do not attempt
  to bypass access controls.

### Cross-user data

- We never scrape other users' projects, library, or storage.

## What this proves (and does not prove)

### Proves

- Claude Code can reconstruct the **observable** behavior and
  implementation architecture of an owned/authorized deployed app
  using browser-delivered evidence and open-source architectural
  references.
- Claude Code can produce a spec, state model, event map, acceptance
  tests, and an independent rebuild plan sufficient to drive a rebuild.

### Does NOT prove

- Claude Code can recover exact hidden backend source code.
- Claude Code can clone proprietary design systems pixel-for-pixel.
- Claude Code can bypass authentication.
- Claude Code can extract or replay secrets.

## The correct framing

This harness exists to support the claim:

> Given browser-delivered evidence of an owned/authorized deployed app,
> Claude Code can independently reimplement the app's observable
> behavior and verify parity with automated tests.

It does **not** support the claim:

> Claude Code can recover exact private source code.

The user (or anyone reading the harness) should treat any claim of
"hidden backend recovery" with skepticism. There is no such capability
here, by design.