# Portfolio Code Review - Relevant vs Not Relevant

> Based on the full audit in `code_review.md` (2 revisions, 50+ findings)
> Categorized by real-world impact on a recruiter visiting this portfolio site

---

## Why Issues Are Marked "Relevant"

Every issue in this section directly affects what happens when a real person visits the site. Memory leaks from uncleaned `requestAnimationFrame` loops and stacking event listeners cause the browser tab to consume more CPU and RAM the longer someone stays — on a mobile phone with 3-4GB RAM, this means the site gets sluggish or crashes after a minute of scrolling. A dead resume button, missing SEO tags, or production-breaking asset paths mean the portfolio fails at its primary job: getting a recruiter to see your work and reach out. These aren't theoretical concerns — a recruiter on an iPhone opening your LinkedIn, clicking your portfolio link, and seeing a blank page or a broken "Resume" button is a lost opportunity that no amount of cool 3D animations can recover from.

## Why Issues Are Marked "Not Relevant"

These issues come from applying enterprise-grade standards to a personal portfolio site. A Content Security Policy protects against XSS attacks on apps that accept user input — this site has zero forms, zero user input, and zero attack surface. TypeScript `any` types and code style inconsistencies matter when a team of developers maintains a codebase for years, but this is a solo project where the author understands every line. Renaming a misspelled HDR filename or reorganizing CSS class declarations costs time with zero visible benefit to anyone visiting the site. A recruiter will never inspect your z-index scale or check if your heading hierarchy follows W3C guidelines — they'll look at the visual quality, click a few links, and decide if they want to reach out. These issues are technically correct observations but solving them doesn't move the needle.

---

## ALREADY FIXED (this session)

| # | Issue | What We Did |
|---|-------|-------------|
| — | Hardcoded password `"MyCharacter12"` in source | Removed encryption entirely. Deleted `decrypt.ts` and `.enc` file. Load `.glb` directly. |
| — | React StrictMode double 3D character on mobile | Added `disposed` flag, captured `currentDiv` ref, tracked `animFrameId`, used named listener functions for proper cleanup. |
| — | Loading bar restarting (0→100→0→50% stuck) | Added `dispose()` to `setProgress` that kills all intervals on unmount. StrictMode double-mount no longer creates two progress trackers. |
| — | gsap-trial in production | User swapped to official `gsap` package. |
| — | 42MB assets (PNG images) | Converted 5 project images from PNG to WebP. Total went from ~35MB to ~954KB (97% reduction). |
| — | WhatIDo section invisible on real mobile | CSS `display: flex !important` on mobile + scroll-based reveal animation with `opacity` transition. Bypasses unreliable GSAP ScrollTrigger dependency on 3D model loading. |
| — | WhatIDo click-to-expand broken on mobile | StrictMode double-mount stacked 2 click listeners (toggle ON then OFF = nothing). Fixed by storing stable handler references for proper cleanup. |
| — | Blank project images on first load | Added image preloading during loading screen with `Promise.all` + `await imagesReady`. |
| — | Carousel content bleeding on mobile | Added `overflow: hidden` and `max-width: 100%` to `.carousel-slide` and `.carousel-content`. |
| — | N8AO ambient occlusion killing mobile GPU | Disabled `<EffectComposer>` with N8AO on mobile (`window.innerWidth <= 768`). |
| — | devicePixelRatio too high on mobile | Capped at `Math.min(window.devicePixelRatio, 2)` in Scene.tsx renderer. |

---

## RELEVANT - Should Fix

### Bugs & Correctness

**R1. WorkImage.tsx — `fetch("src/assets/...")` will 404 in production** (Critical)
- `src/assets/` only exists during Vite dev server. After build, this path doesn't exist.
- Move video assets to `public/` and reference as `/videos/filename.mp4`.

**R2. Loading.tsx — Side effects during render** (Critical)
- `setTimeout` + `setState` runs on every render when `percent >= 100`, spawning duplicate timers.
- Wrap in `useEffect` with `[percent]` dependency.

**R3. Cursor.tsx — RAF loop + event listeners never cleaned up** (Critical)
- `requestAnimationFrame` loop runs forever after unmount. `mousemove` listener is anonymous so cleanup can't remove it.
- Store RAF ID, call `cancelAnimationFrame()`, use named functions.

**R4. SocialIcons.tsx — RAF leak + wrong cleanup target** (Critical)
- `requestAnimationFrame(updatePosition)` runs infinite loop per icon, never cancelled.
- Cleanup removes from `elem` but listener was added to `document`. Does nothing.

**R5. Navbar.tsx — Resize listener never cleaned up** (High)
- Anonymous function in `addEventListener("resize")` = can never be removed. Accumulates on StrictMode re-mount.

**R6. Scene.tsx — Stacking touchmove listeners** (High)
- A new `touchmove` listener is added inside `touchstart` on every touch. Tap 10 times = 10 handlers running.
- Add once and reuse, or use `{ once: true }`.

**R7. splitText.ts — Recursive ScrollTrigger refresh listener** (High)
- `ScrollTrigger.addEventListener("refresh", () => setSplitText())` adds a new listener every time. Stacks infinitely on resize.
- Add guard flag to prevent re-registration.

**R8. TechStack.tsx — Random material assigned during render** (Medium)
- `Math.random()` in JSX = different material on every re-render. Pre-compute per sphere.

**R9. SocialIcons.tsx — Stale getBoundingClientRect** (Medium)
- Bounding rect captured once at mount. After scroll/resize, magnetic icon effect uses wrong coordinates.

**R10. character.ts — Promise resolves before setup completes** (Medium)
- `resolve(gltf)` is called before `setCharTimeline` and bone positioning finish. Potential race condition.

### User-Facing Issues

**R11. Resume button links to `#`** (Critical)
- The single most important link on a portfolio. Recruiter clicks it, gets scrolled to top. Useless.
- Link to actual PDF or remove the button.

**R12. Missing SEO meta tags** (High)
- No meta description, no Open Graph tags, no favicon. LinkedIn/Slack previews are blank. Google can't index properly.

**R13. External links missing `rel="noopener noreferrer"`** (High)
- All `target="_blank"` links in Contact.tsx and SocialIcons.tsx. Security risk + Lighthouse flag.

**R14. `overflow: clip` browser support** (Medium)
- Not supported in older Safari. Could break layout on some iPhones. Use `overflow: hidden`.

### Asset Bloat

**~~R15. ~35MB of unused PNG files still in repo~~ ✅ FIXED**
- Deleted all original PNGs. Only WebP versions remain.

**~~R16. Unused images in public/images/~~ ✅ FIXED**
- Deleted `next.webp`, `next1.webp`, `nextBL.webp`, `node.webp`, `react.webp`, `placeholder.webp`.

### Dead Code

**~~R17. `exports.ts` — Empty file (0 bytes)~~ ✅ FIXED**
- Deleted.

**~~R18. `test.js` — Orphaned scratch file~~ ✅ FIXED**
- Deleted.

**~~R19. `encrypt.cjs` in public/models/~~ ✅ FIXED**
- Deleted.

**R20. Unused CSS classes** (Low)
- `.check-line`, `.loading-icon`, `.landing-video`, `.landing-image`, `.character-loaded` — defined but never used.

**R21. Empty useEffect in LoadingProvider.tsx** (Low)
- `useEffect(() => {}, [loading])` does literally nothing. Remove it.

---

## NOT RELEVANT - Safe to Ignore

**NR1. No Content Security Policy**
- CSP protects apps that handle user input. This is a static portfolio with zero forms, zero APIs, zero user input. The XSS attack surface doesn't exist.

**NR2. Heavy `any` usage in TypeScript**
- Three.js objects and GSAP internals have complex, deeply nested types. Fighting the type system here adds friction with no runtime benefit. This is a solo project — the author knows what these variables are.

**NR3. Module-level ScrollSmoother export (Navbar.tsx)**
- Technically breaks React's unidirectional data flow. Practically, it works perfectly for a single-page app where ScrollSmoother is a singleton. Wrapping it in Context adds boilerplate with zero benefit.

**NR4. `isMobile` computed at module load (TechStack.tsx)**
- Evaluated once, never updates on resize. But nobody resizes their browser from desktop to mobile while viewing a portfolio. Real mobile users are on mobile from the start.

**NR5. MainContainer useEffect depends on `isDesktopView`**
- Could theoretically cause double-firing of resize listener. In practice, the listener is idempotent (just rechecks width). No visible bug.

**NR6. Non-null assertions (`!`) in TypeScript**
- Used in `character.ts`, `animationUtils.ts`, `Cursor.tsx`. These are for objects that are guaranteed to exist at runtime (bone names, DOM elements created by React). The assertions are correct.

**NR7. `@types/three` in dependencies instead of devDependencies**
- Technically should be in devDeps since types aren't needed at runtime. Zero practical impact — Vite tree-shakes it out of the build regardless.

**NR8. Duplicate CSS declarations (transform, height, opacity)**
- Second declaration wins, first is dead. Browser handles this correctly. Just cosmetic code noise.

**NR9. Duplicate `@media (max-width: 1400px)` blocks in WhatIDo.css**
- Two blocks with the same breakpoint. Browser merges them. No bug, just messy organization.

**NR10. z-index escalation (values up to 9999999999)**
- Wild numbers like `999999999` for loading screen look bad but work perfectly. The loading screen IS the highest thing on the page. Implementing a formal z-index scale is engineering overkill for a portfolio.

**NR11. Media query ordering in SocialIcons.css**
- `min-width: 900px` appears before `min-width: 768px`. They target different selectors so no bug exists. Just confusing to read.

**NR12. Rename `char_enviorment.hdr` typo**
- Would require updating references in `lighting.ts` and `TechStack.tsx`. File works fine with the typo. Zero user-facing impact.

**NR13. Duplicate `body` blocks in index.css**
- Two `body {}` blocks. Browser merges them. No visual bug.

**NR14. Google Fonts without `crossorigin`**
- Only matters for subresource integrity checks. Google Fonts CDN is trusted and ubiquitous. Adding crossorigin gains nothing practical.

**NR15. No `<noscript>` fallback**
- A 3D portfolio with Three.js, GSAP, and React literally cannot function without JavaScript. A noscript message saying "enable JS" adds nothing useful.

**NR16. No dark/light mode toggle**
- The site is designed as a dark theme portfolio. Adding a light mode would require redesigning every component. Not a bug — it's a design choice.

**NR17. Heading hierarchy (h2 before h1)**
- Landing page shows name as h2 and tagline as h1. Technically incorrect for SEO crawlers, but visual hierarchy takes priority for a portfolio. Google can handle it.

**NR18. `user-select: none` on `:root`**
- Prevents text selection site-wide. Intentional design choice for a visual portfolio — prevents ugly text selections during scroll animations. Accessibility impact is minimal since the site has no long-form content worth copying.

**NR19. Missing skip-to-content link**
- Standard a11y practice for keyboard navigation. But this is a scroll-based portfolio where sections flow into each other — there's no clear "main content" to skip to.

**NR20. Carousel keyboard navigation**
- Arrow keys don't control the work carousel. The carousel has visible buttons. Adding keyboard support is nice but not critical for a portfolio.

**NR21. Inconsistent event listener patterns**
- Mixes React handlers, useEffect+addEventListener, and direct DOM manipulation. This is a consequence of integrating Three.js and GSAP (imperative libraries) with React (declarative). Each pattern is used where it makes sense. Forcing consistency would mean fighting the libraries.

**NR22. Hardcoded colors everywhere**
- CSS variables for colors only matter if you plan multiple themes. This portfolio has one dark theme. Refactoring 20+ files for theming that won't happen is wasted effort.

**NR23. No Vite build optimizations**
- Vite's defaults (esbuild minification, tree-shaking) are already good. Manual chunk splitting saves ~50ms against a 2-second 3D model download. The bottleneck is asset size, which we already fixed.

---

## Summary

| Category | Count |
|----------|-------|
| Already Fixed | 16 |
| Relevant (should fix) | 16 |
| Not Relevant (safe to ignore) | 23 |
| **Total findings** | **55** |

### Top 5 Next Priorities
1. Fix resume button dead link (5 min, most important for recruiters)
2. Add SEO meta tags + Open Graph + favicon (10 min)
3. Fix memory leaks: Cursor.tsx, SocialIcons.tsx, Navbar.tsx (30 min)
4. Add `rel="noopener noreferrer"` to external links (5 min)
5. Fix WorkImage.tsx production asset path (5 min)
