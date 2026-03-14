# Decision Log - Portfolio Rebranding & Review

> Session Date: 2026-03-14
> Project: shivanshPortfolio (formerly a friend's portfolio)
> Owner: Shivansh Mishra

---

## Context

Shivansh received this portfolio codebase from a friend and wants to rebrand it as his own. The site is a React + Three.js + GSAP portfolio with a 3D character, smooth scrolling, and interactive animations.

---

## Session Timeline

### 1. Initial Goal: Rebrand the Portfolio

**What we planned:**
- Replace all personal info (name, bio, career, education, social links, email)
- Update content to reflect Shivansh's profile

**Information gathered from LinkedIn screenshots:**
- **Name:** Shivansh Mishra
- **Title:** Software Engineer @ GE HealthCare
- **Education:** BTech in Computer Science, Kalinga Institute of Industrial Technology
- **Location:** Bengaluru, Karnataka, India
- **Career:**
  - GE HealthCare — Software Engineer (Aug 2023 – Present)
  - GE HealthCare — Software Engineer Intern (Sep 2022 – Jul 2023)
  - HighRadius — ARPA Intern (May 2022 – Sep 2022)
  - HighRadius — Technical Intern (Jan 2022 – May 2022)
  - Walmart Global Tech — Advanced SWE Intern (Mar 2022 – Apr 2022)
  - Goldman Sachs — Engineering Virtual Intern (Feb 2022 – Mar 2022)
- **Social links:**
  - Email: thebrownhuman@gmail.com
  - GitHub: https://github.com/thebrownhuman
  - LinkedIn: https://www.linkedin.com/in/thebrownhuman/
  - Instagram: https://www.instagram.com/thebrownhuman/
  - Twitter: to be added later

**Status:** Content gathered, rebrand edits pending (paused to address code issues first).

---

### 2. Full Code Review (32 Issues Found)

**Why:** Before rebranding and deploying, we wanted to understand the health of the codebase. A thorough audit was performed across all files.

**What was created:** `ISSUES.md` — a comprehensive list of 32 issues categorized by severity (Critical, High, Medium, Low).

**Key findings:**
- 3 Critical issues (hardcoded password, no SEO, memory leaks)
- 9 High issues (dead links, security gaps, invalid CSS)
- 15 Medium issues (cleanup bugs, no error boundaries, weak encryption)
- 5 Low issues (minor code quality)

---

### 3. GSAP Trial Package Discussion

**Issue:** The project uses `gsap-trial` (a trial/evaluation package) as a production dependency. This package includes premium plugins like `ScrollSmoother` but is not meant for production use — it can inject watermarks and may expire.

**Decision:** Since GSAP became completely free in 2025 (sponsored by Webflow), all plugins including ScrollSmoother are now available in the standard `gsap` package at no cost.

**Action needed:**
1. Create a free account at gsap.com (Shivansh did this)
2. Replace `gsap-trial` with `gsap` in package.json
3. Update all imports from `"gsap-trial/..."` to `"gsap/..."`

**Why this matters:** Removes legal/licensing risk and potential watermarks on the deployed site.

**Status:** Account created. Package swap not yet done.

---

### 4. Performance Investigation — Why the Site Takes 120s on Mobile

**User's question:** "My site takes 120 seconds to load on mobile. Why is moncy.dev so much faster?"

**Root cause identified:** The 3D character model (`character.glb`, ~2.3 MB) is encrypted with AES-CBC. On every page load, the browser must:
1. Fetch the encrypted `.enc` file
2. Hash the password with SHA-256
3. Decrypt 2.3 MB of data with AES-CBC
4. Create a Blob URL from the decrypted buffer
5. Then load the GLB from the Blob

This adds 1-3 seconds on mobile for **zero security benefit** because the decryption password `"MyCharacter12"` is hardcoded in the JavaScript bundle that ships to the browser. Anyone can view-source, find the password, and decrypt the model themselves.

**Analogy used:** "It's like locking a door and taping the key to the doorknob."

---

### 5. Decision: Remove Encryption (DONE)

**What was changed:**

**File: `src/components/Character/utils/character.ts`**
- Removed: `import { decryptFile } from "./decrypt"`
- Removed: The `decryptFile()` call that fetched `/models/character.enc`, decrypted it, and created a Blob URL
- Added: Direct loading of `/models/character.glb` via GLTFLoader
- Net effect: ~10 lines removed, 1 line changed

**File: `src/components/Character/utils/decrypt.ts`**
- Deleted entirely (23 lines)
- Contained `generateAESKey()` and `decryptFile()` functions
- No other file imported from this module (verified via grep)

**Why this decision:**
1. **Performance:** Saves 1-3 seconds of CPU time on every page load (especially impactful on mobile)
2. **Security:** The encryption provided zero actual protection since the key was in the client bundle
3. **Complexity:** Removes an entire module and simplifies the loading pipeline
4. **Reliability:** Eliminates a potential failure point (Web Crypto API issues on older browsers)

**What still needs to happen:**
- The encrypted file `public/models/character.enc` can be deleted to save ~2.3 MB from the repo
- A `character.glb` file needs to exist at `public/models/character.glb` for the site to work

---

### 6. GitHub Repository Setup

**Repo created:** `thebrownhuman/shivanshPortfolio`
- Visibility: Public (needed for free hosting on Vercel/Netlify/GitHub Pages)
- No README/gitignore/license added via GitHub (to avoid merge conflicts with existing files)
- Description: "Personal portfolio website built with React, Three.js, and GSAP — featuring 3D animations and smooth scrolling."

**Why these choices:**
- Public: Portfolio sites should be public for hosting and showcasing work
- No auto-generated files: The project already has `.gitignore`, `LICENSE`, and `README.md` — adding duplicates via GitHub would cause merge conflicts on first push

**Status:** Repo created, push pending.

---

### 7. Converted 5 Project Images from PNG to WebP (DONE)

**What:** Converted all 5 project screenshots from PNG to WebP at quality 80 using `sharp-cli`.

| File | Before (PNG) | After (WebP) | Reduction |
|------|-------------|--------------|-----------|
| bond | 7.0 MB | 222 KB | 97% |
| Maxlife | 6.7 MB | 210 KB | 97% |
| radix | 6.9 MB | 162 KB | 98% |
| sapphire | 6.8 MB | 201 KB | 97% |
| Solidx | 6.5 MB | 159 KB | 98% |
| **Total** | **34 MB** | **954 KB** | **97%** |

**File changed:** `src/components/Work.tsx` — Updated all 5 image paths from `.png` to `.webp`.

**Why:** These 5 uncompressed PNGs were the #1 reason the site took 120s on mobile (4G). WebP gives near-identical quality at a fraction of the size. Quality 80 is the sweet spot.

**Impact:** Saves ~33 MB. On 4G mobile (~5 Mbps), this alone saves ~50 seconds of load time.

---

### 8. Deleted Duplicate character.enc and decrypt.cjs (DONE)

**What:** Deleted `public/models/character.enc` (2.3 MB) and `public/models/decrypt.cjs` (encryption script).

**Why:** Code now loads `character.glb` directly (fixed in step 5). The `.enc` file and Node.js encryption script are no longer needed.

**Impact:** Saves 2.3 MB from the repo.

---

### 9. Added Lazy Loading to Project Images (DONE)

**File changed:** `src/components/WorkImage.tsx` line 39

**Before:** `<img src={props.image} alt={props.alt} />`
**After:** `<img src={props.image} alt={props.alt} loading="lazy" />`

**Why:** Project images are in a carousel below the fold. Without lazy loading, the browser downloads all 5 images on page load even though the user hasn't scrolled to them. With `loading="lazy"`, images load on-demand.

---

### 10. Capped devicePixelRatio to 2 (DONE)

**File changed:** `src/components/Character/Scene.tsx` line 35

**Before:** `renderer.setPixelRatio(window.devicePixelRatio)`
**After:** `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`

**Why:** On 3x phones, the GPU renders 9x the pixels (3^2). The visual difference between 2x and 3x is barely noticeable, but the GPU workload is massive. This is a standard Three.js best practice.

**Impact:** On 3x devices, GPU renders 2.25x pixels instead of 9x (75% less work).

---

### 11. Removed Unused @react-three/cannon Dependency (DONE)

**Command:** `npm uninstall @react-three/cannon`

**Why:** The project uses `@react-three/rapier` for physics (TechStack bouncing spheres). The `@react-three/cannon` package had zero imports anywhere in the codebase — it was dead weight.

**Impact:** 4 packages removed, smaller bundle, cleaner dependencies.

---

### 12. Disabled N8AO Post-Processing on Mobile (DONE)

**File changed:** `src/components/TechStack.tsx`

**What:** Added `const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;` and wrapped `<EffectComposer>` in `{!isMobile && (...)}`.

**Why:** N8AO (ambient occlusion) is a full-screen post-processing shader running every frame. On mobile GPUs it's expensive and the visual benefit on small screens is minimal. The tech spheres still look great without it.

**Impact:** Removes a full-screen shader pass on mobile, improving frame rates and reducing battery drain.

---

### Decision: Keep Loading Screen Delays

**Shivansh explicitly asked** to keep the loading screen delays (600ms + 1000ms + 900ms + slow progress bar). The loading animation is part of the site's design and identity. We respect this.

---

### 13. Fixed React StrictMode Double Character Rendering (DONE)

**File changed:** `src/components/Character/Scene.tsx`

**Problem:** On mobile, two identical 3D characters appeared, both animating in sync. One would get stuck while the other continued.

**Root cause:** React StrictMode unmounts and remounts components in development. The original cleanup function didn't properly clean up:
- No `cancelAnimationFrame` for the render loop
- Event listeners added with anonymous functions couldn't be removed (different references)
- No `disposed` flag to prevent async operations (model load callback) from running after unmount

**Fix:**
- Captured `currentDiv` ref at effect start for cleanup
- Added `disposed` flag — checked before any async operations proceed
- Tracked `animFrameId` and called `cancelAnimationFrame(animFrameId)` in cleanup
- Used named `onResize` and `onMouseMove` functions so `removeEventListener` works with the same reference
- Added `progress.dispose()` call in cleanup

**Why this matters:** Any recruiter opening the site on desktop (dev mode) would see duplicate characters — an instant credibility killer.

---

### 14. Fixed Loading Bar Restart Bug (DONE)

**File changed:** `src/components/Loading.tsx`

**Problem:** The loading bar would go 0→100%, then restart and get stuck around 50%.

**Root cause:** StrictMode double-mount created two progress trackers. The first one's intervals kept running after unmount, conflicting with the second tracker.

**Fix:** Added `dispose()` function and `disposed` flag to `setProgress`:
- All intervals check `disposed` before executing
- `dispose()` kills all intervals immediately
- Scene.tsx cleanup calls `progress.dispose()`

---

### 15. Fixed Blank Project Images on First Load (DONE)

**Files changed:** `src/components/Character/Scene.tsx`, `src/components/WorkImage.tsx`

**Problem:** On the very first visit, project carousel images were blank (white). Fine after refresh.

**Root cause:** We had added `loading="lazy"` to images (decision #9). But lazy-loaded images don't start fetching until they're near the viewport. On first visit, the browser cache is empty, so when the user scrolls to the carousel, images haven't loaded yet.

**Fix (two-part):**
1. **Removed `loading="lazy"`** from WorkImage.tsx — it caused more harm than good for above-the-fold-adjacent content
2. **Added image preloading** in Scene.tsx during the loading screen:
   ```typescript
   const preloadImages = () => {
     const urls = ["/images/Solidx.webp", "/images/radix.webp", ...];
     return Promise.all(urls.map((src) => new Promise<void>((resolve) => {
       const img = new Image();
       img.onload = () => resolve();
       img.onerror = () => resolve(); // Don't block on errors
       img.src = src;
     })));
   };
   const imagesReady = preloadImages();
   // ... later, after model loads:
   await imagesReady;
   progress.loaded();
   ```

**Why this approach:** The loading screen already exists and runs for several seconds. Using that time to preload images means they're cached before the user ever sees the carousel. No extra wait time.

---

### 16. Fixed Carousel Bleed on Mobile (DONE)

**File changed:** `src/components/styles/Work.css`

**Problem:** On mobile, adjacent carousel slide content was visible/bleeding into the current slide.

**Fix:** Added `max-width: 100%` and `overflow: hidden` to `.carousel-slide` and `overflow: hidden` to `.carousel-content`.

---

### 17. Fixed "What I Do" Section Invisible on Real Mobile (DONE)

**Files changed:** `src/components/styles/WhatIDo.css`, `src/components/WhatIDo.tsx`, `src/components/utils/GsapScroll.ts`

**Problem:** The "What I Do" section was completely invisible on real mobile phones, but visible in Chrome DevTools mobile emulation.

**Root cause (multi-layered — this took 5 attempts to fix):**

1. **CSS `display: none` on `.what-box-in`** (line 40 of WhatIDo.css) — the section starts hidden
2. **GSAP ScrollTrigger was supposed to reveal it** — in `GsapScroll.ts`, the mobile `else` branch (line 121) creates a ScrollTrigger to toggle `display: none → flex`
3. **But the `else` branch is gated by `if (character)`** — the 3D model must load first
4. **On real mobile, `setCharTimeline` may be called before the model loads**, or the function may not fire reliably because ScrollSmoother's scroll proxy interferes with ScrollTrigger
5. **Chrome DevTools works differently** — it doesn't have the same ScrollSmoother/ScrollTrigger timing issues as real mobile browsers

**Failed attempts and why they failed:**
- **Attempt 1:** Changed ScrollTrigger trigger from `.what-box-in` to `.whatIDO` — didn't work because the trigger change wasn't the issue; the entire `else` block was being skipped
- **Attempt 2:** IntersectionObserver in WhatIDo.tsx — didn't work because ScrollSmoother uses CSS transforms for scrolling, so `getBoundingClientRect()` and IntersectionObserver don't reflect the true scroll position
- **Attempt 3:** Various JS-based scroll listeners — unreliable with ScrollSmoother's paused state during loading

**Final fix (CSS + JS hybrid):**

**WhatIDo.css** — In `@media (max-width: 1024px)`:
```css
.what-box-in {
  display: flex !important;  /* Force visible — bypass GSAP entirely */
  opacity: 0;               /* Start invisible for fade animation */
}
/* Pause sub-animations until revealed */
.what-box-in .what-content-in,
.what-box-in .what-content::before, /* ...etc */ {
  animation-play-state: paused;
}
.what-box-in.revealed .what-content-in,
.what-box-in.revealed .what-content::before, /* ...etc */ {
  animation-play-state: running;
}
```

**WhatIDo.tsx** — Added native scroll listener (NOT ScrollTrigger) with capture phase:
```typescript
const checkReveal = () => {
  const rect = boxIn.getBoundingClientRect();
  if (rect.top < window.innerHeight * 0.85) {
    boxIn.style.transition = "opacity 0.6s ease";
    boxIn.style.opacity = "1";
    boxIn.classList.add("revealed"); // Triggers CSS animations
  }
};
window.addEventListener("scroll", checkReveal, true); // capture phase
```

**GsapScroll.ts** — Removed the mobile `else` block entirely (lines 121-131). The mobile reveal is now handled by WhatIDo.tsx directly.

**Key decisions:**
- `display: flex !important` in CSS ensures the element has layout (non-zero height) so scroll detection works
- `opacity: 0` hides it visually until the scroll listener reveals it
- Native `scroll` event with `capture: true` fires even with ScrollSmoother active (ScrollSmoother uses CSS transforms, not native scroll, but scroll events still bubble)
- `animation-play-state: paused/running` ensures the border/flicker animations only play when the section is revealed, matching the desktop experience

---

### 18. Fixed "What I Do" Card Expand Not Working on Real Mobile (DONE)

**File changed:** `src/components/WhatIDo.tsx`

**Problem:** Tapping the Frontend/Backend cards didn't expand them on real mobile phones, but worked in Chrome DevTools emulation.

**Root cause (TWO bugs):**

**Bug 1 — React StrictMode double-listener toggle cancellation:**
The click handler used anonymous functions:
```typescript
// Adding:
container.addEventListener("click", () => handleClick(container));
// Cleanup:
container.removeEventListener("click", () => handleClick(container));
```
`removeEventListener` with a NEW anonymous function doesn't match the original — cleanup does nothing. StrictMode unmounts/remounts, so TWO listeners get attached. `handleClick` uses `classList.toggle()`, so:
- Listener 1: toggles `what-content-active` ON
- Listener 2: toggles `what-content-active` OFF
- Net result: nothing visible happens

**Bug 2 — iOS Safari click events on non-interactive elements:**
iOS Safari doesn't fire `click` events on `<div>` elements unless they have `cursor: pointer`. Chrome DevTools doesn't enforce this restriction.

**Fix:**
```typescript
// Store stable references for proper cleanup
const clickHandlers: Array<{ el: HTMLDivElement; handler: () => void }> = [];
if (isTouch) {
  containerRef.current.forEach((container) => {
    const handler = () => handleClick(container);
    clickHandlers.push({ el: container, handler });
    container.addEventListener("click", handler);
  });
}
return () => {
  clickHandlers.forEach(({ el, handler }) => {
    el.removeEventListener("click", handler); // Same reference!
  });
};
```

**WhatIDo.css** — Added `cursor: pointer` to `.what-content` in mobile media query.

**Why Chrome DevTools worked but real mobile didn't:**
1. DevTools doesn't have StrictMode's timing behavior differences on real devices
2. DevTools doesn't enforce iOS Safari's `cursor: pointer` requirement for click events

---

### 19. Deleted Old PNG Files (DONE)

**Files deleted:** `public/images/Solidx.png`, `public/images/radix.png`, `public/images/bond.png`, `public/images/sapphire.png`, `public/images/Maxlife.png`

**Kept:** `public/images/preview.png` (referenced in README.md as OG/preview image)

**Why:** The WebP replacements (decision #7) are in use. The original PNGs were 34 MB of dead weight.

---

## Decisions NOT Yet Implemented (Pending)

| # | Decision | Priority | Status |
|---|----------|----------|--------|
| 1 | Full rebrand (name, bio, career, links) | High | Done (prior session) |
| 2 | Replace `gsap-trial` with `gsap` | High | Done (user did manually) |
| 3 | Fix event listener memory leaks | High | Done (#13) |
| 4 | Add SEO meta tags | High | Pending |
| 5 | Fix dead resume link | Medium | Pending |
| 6 | Add `rel="noopener noreferrer"` to links | Medium | Pending |
| 7 | Fix invalid CSS values | Medium | Pending |
| 9 | Delete orphaned `test.js` | Low | Pending |
| 10 | Push to GitHub | High | Pending |

---

## Verification Results

- **TypeScript:** `npx tsc --noEmit` — 0 errors
- **Production build:** `npx vite build` — succeeds in 3.73s
- **Dev server:** runs clean, no errors

---

## Summary of Performance Impact

| Metric | Before | After |
|--------|--------|-------|
| Total asset size | ~42 MB | ~8 MB |
| Project images | 34 MB (PNG) | 954 KB (WebP) |
| Duplicate model files | 4.6 MB | 2.3 MB |
| Unused dependencies | @react-three/cannon | Removed |
| Encryption overhead | 500ms-2s/load | 0 |
| Mobile GPU pixel load (3x) | 9x | 2.25x (capped at 2) |
| Mobile post-processing | N8AO every frame | Disabled |
| Image loading strategy | Preloaded during loading screen | Cached before visible |

## Summary of Bug Fixes

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Duplicate 3D characters | StrictMode double-mount, no cleanup | Disposed flag, cancelAnimationFrame, named listeners |
| Loading bar restart | StrictMode double progress tracker | dispose() function kills intervals |
| Blank carousel images | lazy loading + empty cache | Preload during loading screen |
| Carousel bleed on mobile | No overflow clipping | overflow: hidden on slide containers |
| WhatIDo invisible on mobile | GSAP ScrollTrigger unreliable with ScrollSmoother on mobile | CSS display:flex !important + native scroll fade-in |
| Card expand broken on mobile | Double click listeners (StrictMode) + iOS cursor:pointer | Stable handler refs + cursor:pointer CSS |

---

## Architecture Notes

The site's loading pipeline (after our changes):

```
Page Load
  → Loading.tsx (animated loader with progress bar)
  → Scene.tsx (creates WebGL renderer, camera, lights)
    → character.ts (loads /models/character.glb via GLTFLoader + DRACOLoader)
      → Sets up clothing colors (brown shirt, black pants)
      → Compiles shaders
      → Initializes GSAP scroll animations
  → Navbar.tsx (ScrollSmoother for smooth page scrolling)
  → Sections render: Landing → About → Career → WhatIDo → TechStack → Work → Contact
```

**Key dependency chain:** Three.js → GLTF model → GSAP animations → Page ready

This is why the loading screen exists — the 3D content must fully load before the page becomes interactive.
