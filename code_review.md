# Extensive Code Review — Shivansh Portfolio

> **Scope**: Every source file in `shivans-portfolio` (Vite + React + TypeScript, Three.js / R3F, GSAP).

---

## 1. Architecture & Project Structure

| Layer | Files | Verdict |
|---|---|---|
| Entry | [main.tsx](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/src/main.tsx) → [App.tsx](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/src/App.tsx) | ✅ Clean, StrictMode enabled |
| Layout | [MainContainer.tsx](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/src/components/MainContainer.tsx) | Contains all sections, handles desktop/mobile branching |
| 3D Scene | [Character/](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/src/components/Character/utils/character.ts#5-71) (Scene, utils) | Raw Three.js renderer in React — well-structured but tightly coupled |
| Animations | [utils/GsapScroll.ts](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/src/components/utils/GsapScroll.ts), [initialFX.ts](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/src/components/utils/initialFX.ts), [splitText.ts](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/src/components/utils/splitText.ts) | Heavy imperative DOM + GSAP usage |
| Context | [LoadingProvider.tsx](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/src/context/LoadingProvider.tsx) | Single context for loading state |
| Data | [boneData.ts](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/src/data/boneData.ts) | Static bone name arrays |
| Styles | Per-component CSS files in `styles/` | ✅ Good separation |

### Strengths
- Lazy-loading (`React.lazy`) for [CharacterModel](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/src/components/Character/index.tsx#3-6), [TechStack](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/src/components/TechStack.tsx#129-217), and [MainContainer](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/src/components/MainContainer.tsx#15-58) — good for perf on a heavy 3D page.
- GSAP `ScrollSmoother` + `ScrollTrigger` gives buttery smooth scrolling with scrub-based animations.
- Clean separation of Character utilities (lighting, animation, mouse tracking, resize).

### Structural Concerns

> [!WARNING]
> The empty file [exports.ts](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/src/components/Character/exports.ts) (0 bytes) is dead code. Delete it.

- [test.js](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/test.js) at the project root is a standalone scratch file referencing `clickElement` and `video` without any context. It's not a test and is not imported anywhere. Should be removed.

---

## 2. Bugs & Correctness Issues

### 🔴 Critical

#### 2.1 [WorkImage.tsx](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/src/components/WorkImage.tsx) — Fetching from `src/assets/` in production will 404
```tsx
// Line 17
const response = await fetch(`src/assets/${props.video}`);
```
After Vite builds the app, `src/assets/` does not exist in the output. This path only works during dev with Vite's dev server. **Move video assets to `public/` and reference them as `/videos/filename.mp4`**, or use Vite's asset import system.

#### 2.2 `Loading.tsx` — Side effects during render (lines 13–20)
```tsx
if (percent >= 100) {
  setTimeout(() => {
    setLoaded(true);   // ← setState call triggered during render
    ...
  }, 600);
}
```
This runs on **every render** when `percent >= 100`, spawning a new `setTimeout` each time. It can cause cascading state updates and potential memory leaks. Wrap this logic in a `useEffect` with `[percent]` as a dependency.

#### 2.3 `Cursor.tsx` — Event listeners never cleaned up (line 12, 26)
```tsx
document.addEventListener("mousemove", (e) => { ... });   // ← anonymous, no cleanup
document.querySelectorAll("[data-cursor]").forEach(...)    // ← listeners added but never removed for unmount
```
The `mousemove` listener and per-element `mouseover`/`mouseout` listeners are never removed in the cleanup function. Only the `requestAnimationFrame` loop leaks indefinitely since there's no `cancelAnimationFrame` call. Use a ref + cleanup return.

#### 2.4 `SocialIcons.tsx` — `requestAnimationFrame` leak + incorrect cleanup (lines 32, 52-54)
```tsx
requestAnimationFrame(updatePosition);  // runs forever, never cancelled

return () => {
  elem.removeEventListener("mousemove", onMouseMove); // ← removes from elem, but was added to document
};
```
Two issues:
1. `requestAnimationFrame(updatePosition)` runs an infinite loop per icon with **no way to cancel it**.
2. The cleanup function removes from `elem` but the listener was added to `document`. This cleanup does nothing.

#### 2.5 `Navbar.tsx` — Resize listener never cleaned up (line 38-40)
```tsx
window.addEventListener("resize", () => {
  ScrollSmoother.refresh(true);
});
```
Anonymous function = can never be removed. Will accumulate if the component ever re-mounts (StrictMode in dev does this).

---

### 🟡 Medium Severity

#### 2.6 `WhatIDo.tsx` — Cleanup uses new arrow functions (lines 20-24)
```tsx
container.removeEventListener("click", () => handleClick(container));
```
This creates a **new** function reference — `removeEventListener` requires the **same** reference as `addEventListener`. These event listeners are never actually removed.

#### 2.7 `TechStack.tsx` — Random material during render (line 198)
```tsx
material={materials[Math.floor(Math.random() * materials.length)]}
```
`Math.random()` in JSX means a different material is assigned **on every re-render**. This should be pre-computed per sphere (stored alongside the scale in the `spheres` array) or memoized.

#### 2.8 `TechStack.tsx` — `isMobile` computed at module load (line 127)
```tsx
const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
```
This is a **module-level constant** — it's evaluated once when the module loads and never updates on resize. A user resizing from desktop to mobile (or vice-versa) won't see the change.

#### 2.9 `MainContainer.tsx` — `useEffect` depends on `isDesktopView` unnecessarily (line 30)
```tsx
useEffect(() => { ... }, [isDesktopView]);
```
This re-attaches the `resize` listener every time `isDesktopView` changes, potentially causing double-firing. The dependency should be `[]` (mount-only) since the handler already reads `window.innerWidth`.

#### 2.10 `Navbar.tsx` — Exported mutable module-level variable (line 9)
```tsx
export let smoother: ScrollSmoother;
```
This is assigned inside `useEffect` but exported as a module-level variable. It creates implicit coupling — any importer gets a reference that's initially `undefined` and is silently mutated later. Consider using a ref or context instead.

#### 2.11 `Scene.tsx` — `character` captured as `null` in resize closure (line 84)
```tsx
const onResize = () =>
  handleResize(renderer, camera, canvasDiv, character!);
```
This closure is created in the `loadCharacter().then()` callback but captures the `character` from the outer scope. Since `character` comes from `useState`, this closure captures the **initial null state** reference — the `!` assertion is a lie if the state hasn't been set yet.

---

### 🟢 Low / Nit

#### 2.12 `LoadingProvider.tsx` — Empty `useEffect` (line 27)
```tsx
useEffect(() => {}, [loading]);
```
This does absolutely nothing and should be removed.

#### 2.13 `Loading.tsx` — `setIsLoading` missing from `useEffect` deps (line 34)
The `useEffect` at line 22 references `setIsLoading` but doesn't list it in its dependency array `[isLoaded]`. While `setState` functions are stable, it's best practice to include them (and the linter would flag it).

#### 2.14 `Scene.tsx` — `screenLight` typed as `any` (line 49)
```tsx
let screenLight: any | null = null;
```
`any | null` is just `any`. Type this properly as `THREE.Object3D | null`.

#### 2.15 `GsapScroll.ts` — `setInterval` for random intensity never cleared (line 9)
```tsx
setInterval(() => { intensity = Math.random(); }, 200);
```
This `setInterval` runs forever. It should be cleared when the timelines are killed or the component unmounts.

---

## 3. Performance Concerns

| Issue | File | Impact |
|---|---|---|
| `requestAnimationFrame` loop + gsap.to per frame | `Cursor.tsx:21` | Unnecessary — use pure CSS transforms with `will-change: transform` or a single rAF with direct style mutation |
| `SphereGeo` creates `new THREE.Vector3()` each frame | `TechStack.tsx:57` | Allocates a new vector on every `useFrame` call; reuse a module-level temp vector |
| 30 physics spheres + postprocessing on all devices | `TechStack.tsx` | Heavy for lower-end hardware; consider reducing count or disabling physics on mobile |
| `splitText.ts:79` adds ScrollTrigger refresh listener recursively | `splitText.ts` | `ScrollTrigger.addEventListener("refresh", () => setSplitText())` — this adds a **new** listener every time `setSplitText()` is called, and it's called on resize. Will stack infinitely. |
| No image lazy-loading for work project images | `WorkImage.tsx` | All images load eagerly |

---

## 4. Accessibility

| Issue | Details |
|---|---|
| `user-select: none` on `:root` | Prevents all text selection site-wide — bad for a11y and frustrating for users wanting to copy text |
| Missing `rel="noopener noreferrer"` | External links in `Contact.tsx` and `SocialIcons.tsx` use `target="_blank"` without `rel` — security concern |
| No skip-to-content link | Standard a11y practice for keyboard nav |
| Contact form missing | Only provides email link — no accessible form |
| Carousel keyboard navigation missing | Work.tsx carousel buttons are accessible, but `ArrowLeft`/`ArrowRight` keyboard shortcuts aren't implemented |
| `body { overflow: hidden }` on load | Screen reader users can't scroll until loading completes |

---

## 5. SEO

| Issue | Details |
|---|---|
| Missing `<meta name="description">` | `index.html` has title but no meta description |
| Commented-out favicon | `<!-- <link rel="icon" type="image/svg+xml" href="/" /> -->` |
| No Open Graph / Twitter Card tags | No social sharing metadata |
| No `<noscript>` fallback | Users with JS disabled see a blank page |
| Heading hierarchy | Landing page has `h2` then `h1` (reversed), which confuses crawlers |

---

## 6. TypeScript Quality

| Issue | File(s) |
|---|---|
| Heavy `any` usage | `GsapScroll.ts` (lines 39, 40, 42), `Scene.tsx` (line 49), `character.ts` (line 24), `lighting.ts` (line 30) |
| Non-null assertions (`!`) everywhere | `character.ts:49-50`, `animationUtils.ts:12,21,44`, `Cursor.tsx:9` — risk of runtime crashes |
| `@types/three` in dependencies instead of devDependencies | `package.json` line 18 — type packages belong in devDeps |

---

## 7. CSS Review

### Observations
- Two `body` rule blocks in `index.css` (lines 36-38 and 66-75) — merge them.
- Hard-coded pixel breakpoints work but `1024px`, `900px`, `768px`, `1400px`, `1600px` are used inconsistently across files. Define them as CSS custom properties or a shared constant.
- `--vh: 100vh; --vh: 100svh;` (lines 23-24) — clever fallback pattern ✅
- No dark/light mode toggle despite `color-scheme: light dark` being set.

---

## 8. Build & Config

| Issue | Details |
|---|---|
| No Vercel Analytics import | `@vercel/analytics` is in `package.json` dependencies but never imported in source code |
| `DECISION_LOG.md` and `ISSUES.md` should be in `.gitignore` or docs | Not harmful, but pollutes the root |
| No `.env` or environment variable handling | API keys or analytics tokens would need this eventually |
| `vite.config.ts` is very minimal | No `build` optimizations, chunk splitting, or source maps config |

---

## 9. Summary of Priority Fixes

| Priority | Item | Effort |
|---|---|---|
| 🔴 High | Fix `WorkImage` asset path for production | 5 min |
| 🔴 High | Move `setTimeout`/`setState` out of render in `Loading.tsx` | 15 min |
| 🔴 High | Fix memory leaks: `Cursor.tsx`, `SocialIcons.tsx`, `Navbar.tsx` RAF & event listeners | 30 min |
| 🔴 High | Fix `splitText.ts` recursive listener stacking | 10 min |
| 🟡 Med  | Fix `WhatIDo.tsx` event cleanup with stable refs | 10 min |
| 🟡 Med  | Pre-compute random materials in `TechStack.tsx` | 5 min |
| 🟡 Med  | Add `rel="noopener noreferrer"` to external links | 5 min |
| 🟡 Med  | Add SEO meta tags + favicon | 10 min |
| 🟡 Med  | Remove `user-select: none` from `:root` or scope it narrowly | 2 min |
| 🟢 Low  | Delete dead files: `exports.ts`, `test.js` | 1 min |
| 🟢 Low  | Remove empty `useEffect` in `LoadingProvider.tsx` | 1 min |
| 🟢 Low  | Move `@types/three` to devDependencies | 1 min |
| 🟢 Low  | Merge duplicate `body` blocks in `index.css` | 2 min |
| 🟢 Low  | Replace `any` types with proper Three.js types | 15 min |

---

## 10. What's Done Well 👏

- **Outstanding visual presentation** — the 3D character with scroll-driven animations, physics-based tech-stack spheres, and polished loading screen are impressive.
- **Code splitting with `React.lazy`** — correctly used for the heaviest components.
- **GSAP integration** — complex scroll-based timelines are well-organized in `GsapScroll.ts`.
- **Clean component structure** — each section is its own component with co-located styles.
- **Loading orchestration** — the progress system that coordinates 3D model loading with UI transitions is clever.
- **Touch support** — mouse tracking for head rotation includes touch equivalents.
- **Draco compression** — 3D model uses Draco decoding for smaller downloads.

---
---

# 📋 REVISION 2 — Deep Dive

> Second pass focused on CSS deep-dive, asset management, additional React patterns, and security.

---

## R2.1 CSS Deep Dive — New Findings

### 🔴 Overwritten `transform` in `Landing.css` (lines 98, 104)
```css
.character-rim {
  transform: translate(-50%, 36%) scaleX(1.4);   /* line 98 — OVERWRITTEN */
  transform: translate(-50%, 100%) scale(1.4);    /* line 104 — this wins */
}
```
The first `transform` declaration is silently overridden. If both were intentional (progressive enhancement), this doesn't qualify — both are equally supported. Remove line 98 or combine them.

### 🔴 Duplicate `height` declarations in `Landing.css` (lines 109-110)
```css
.character-model {
  height: 80%;       /* line 109 — overridden */
  height: 80vh;      /* line 110 — this wins */
}
```
The `80%` is dead code. Unlike the `--vh` fallback pattern, there's no progressive enhancement rationale here — `80vh` is universally supported.

### 🟡 Duplicate `opacity` in `Loading.css` (lines 32, 36)
```css
.loading-button::before {
  opacity: 1;        /* line 32 — immediately overwritten */
  opacity: 0;        /* line 36 — this wins */
}
```

### 🟡 Duplicate `@media (max-width: 1400px)` blocks in `WhatIDo.css`
Lines 247-277 and 278-285 are **two separate** `@media (max-width: 1400px)` blocks. These should be merged into one block.

### 🟡 `!important` Anti-pattern in `WhatIDo.css` (line 293)
```css
.what-box-in {
  display: flex !important;
}
```
The `!important` overrides the GSAP-controlled `display: none` toggling from `GsapScroll.ts`. This creates a fragile coupling — GSAP sets `display: flex` on scroll, but this media query forcefully overrides it. A cleaner approach is to use a CSS class toggle rather than GSAP directly setting display.

### 🟡 z-index Escalation Problem
The codebase has a wild z-index range with no system:

| Value | Element | File |
|---|---|---|
| `999999999` | `.loading-screen` | Loading.css |
| `9999999999` | `.loading-header` | Loading.css |
| `9999` | `.header` | Navbar.css |
| `999` | `.social-icons` | SocialIcons.css |
| `99` | `.icons-section`, `.cursor-main` | SocialIcons.css, Cursor.css |
| `15` | `.landing-circle1` | Landing.css |
| `12` | `.nav-fade` | Landing.css |
| `11` | `.character-model` (desktop) | Landing.css |

**Recommendation**: Define a z-index scale as CSS variables: `--z-cursor`, `--z-nav`, `--z-overlay`, `--z-modal`, `--z-loading`. Cap at reasonable numbers (1-100).

### 🟡 Media Query Ordering Issue in `SocialIcons.css`
```css
/* Line 84 — min-width: 900px */
@media (min-width: 900px) { .social-icons { display: flex; } }

/* Line 93 — min-width: 768px (comes AFTER 900px!) */
@media (min-width: 768px) { .resume-button { ... } }
```
When using `min-width`, smaller values should come first. While these target different selectors so it doesn't cause a bug right now, it's confusing and maintenance-prone.

### 🟢 Unused CSS Classes
- `.check-line` in `SocialIcons.css` (line 75-83) — not referenced in any component.
- `.loading-icon` in `Loading.css` (line 157-162) — not referenced in any component.
- `.landing-video`, `.landing-image` in `Landing.css` (lines 77-84) — not referenced.
- `.character-loaded` in `Landing.css` (line 148) — not referenced.
- `.visible` class is added in `splitText.ts` but never styled anywhere.

---

## R2.2 Asset Management Issues

### 🔴 ~35MB of PNG duplicates in `public/images/`
Five project images exist in **both** PNG and WebP formats:

| Image | PNG Size | WebP Size | Savings |
|---|---|---|---|
| `Maxlife` | 6.99 MB | 215 KB | **97%** |
| `Solidx` | 6.75 MB | 162 KB | **98%** |
| `bond` | 7.33 MB | 227 KB | **97%** |
| `radix` | 7.17 MB | 165 KB | **98%** |
| `sapphire` | 7.10 MB | 205 KB | **97%** |

Only the `.webp` files are referenced in code. The PNG files add **~35MB** to your repo and deployment for nothing. Delete them.

### 🟡 Unused images in `public/images/`
- `next.webp` (334 KB), `next1.webp`, `nextBL.webp` — not referenced in code
- `node.webp` (327 KB), `react.webp` (333 KB) — not referenced (only `react2.webp`/`node2.webp` are used)
- `placeholder.webp` — not referenced
- `preview.png` (1.67 MB) — no reference in code

### 🟡 Typo in asset filename
`char_enviorment.hdr` — "enviorment" should be "environment". Referenced in [lighting.ts](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/src/components/Character/utils/lighting.ts) and [TechStack.tsx](file:///c:/Users/Shivansh/Desktop/PROzz/shivans-portfolio/src/components/TechStack.tsx).

### 🟡 `encrypt.cjs` in `public/models/`
A 530-byte file called `encrypt.cjs` sits alongside 3D models. This looks misplaced — should it be here?

---

## R2.3 Additional React & JS Issues

### 🔴 Resume button links to `#` (SocialIcons.tsx line 77)
```tsx
<a className="resume-button" href="#">
```
This is a dead link. Users clicking "RESUME" get scrolled to the top of the page instead of downloading/viewing a resume.

### 🟡 `SocialIcons.tsx` — Stale `getBoundingClientRect()` (line 19)
```tsx
const rect = elem.getBoundingClientRect();
```
This captures the bounding rect **once** at mount time. If the page scrolls or resizes, `rect` becomes stale, causing the magnetic icon effect to use wrong coordinates. Should be recalculated on each `mousemove` (or at least on scroll/resize).

### 🟡 `Scene.tsx` — Touch listener leak (lines 118-119)
```tsx
element?.addEventListener("touchmove", (e: TouchEvent) =>
  handleTouchMove(e, (x, y) => (mouse = { x, y }))
);
```
A new `touchmove` listener is added inside `touchstart` on every touch. These anonymous listeners **stack** — tap 10 times and you have 10 `touchmove` handlers all running. Need to either add once and reuse, or use `{ once: true }` pattern.

### 🟡 `TechStack.tsx` — Scroll handler uses `window.scrollY` with ScrollSmoother
```tsx
const scrollY = window.scrollY || document.documentElement.scrollTop;
```
When GSAP `ScrollSmoother` is active, `window.scrollY` may not reflect the actual scroll position since ScrollSmoother wraps the content. This could cause `isActive` to be out of sync with the actual viewport.

### 🟡 `character.ts` — `resolve()` called before post-processing completes (line 46-48)
```tsx
resolve(gltf);                          // ← resolves the promise
setCharTimeline(character, camera);     // ← runs after resolve
setAllTimeline();
character!.getObjectByName("footR")!... // ← runs after resolve
```
The promise resolves *before* timelines are set and bone positions adjusted. The caller in `Scene.tsx` calls `.then()` to proceed, potentially racing with these setup steps.

### 🟢 Inconsistent event listener patterns
The codebase mixes three patterns:
1. **React event handlers** (`onClick`, `onMouseMove`) — used in `Work.tsx`, `Loading.tsx`
2. **`useEffect` + `addEventListener`** — used in `Cursor.tsx`, `SocialIcons.tsx`, `Navbar.tsx`
3. **Direct `document.querySelector` DOM manipulation** — used in `Navbar.tsx`, `TechStack.tsx`

For consistency and maintainability, prefer React event handlers where possible and `useEffect` with proper cleanup everywhere else.

---

## R2.4 Security

| Issue | Details |
|---|---|
| No Content Security Policy | `index.html` has no CSP meta tag — allows XSS vectors |
| Google Fonts loaded without `crossorigin` | `@import url(...)` in `index.css` — add `crossorigin` for subresource integrity |
| External links missing `rel` | Already flagged in Rev 1, but also applies to `SocialIcons.tsx` links |
| `encrypt.cjs` in public folder | Any user can download this file — check if it contains sensitive logic |

---

## R2.5 Revision 2 — Additional Priority Fixes

| Priority | Item | Effort |
|---|---|---|
| 🔴 High | Delete ~35 MB of unused PNG files from `public/images/` | 2 min |
| 🔴 High | Fix resume button dead link | 5 min |
| 🔴 High | Fix stacking `touchmove` listeners in `Scene.tsx` | 10 min |
| 🟡 Med | Remove duplicate CSS declarations (transform, height, opacity) | 5 min |
| 🟡 Med | Merge duplicate `@media` query blocks | 5 min |
| 🟡 Med | Delete unused CSS classes (~5 classes) | 5 min |
| 🟡 Med | Implement z-index scale with CSS variables | 15 min |
| 🟡 Med | Fix stale `getBoundingClientRect` in `SocialIcons.tsx` | 10 min |
| 🟡 Med | Delete unused image assets (~6 files, ~2.3 MB) | 2 min |
| 🟢 Low | Rename `char_enviorment.hdr` → `char_environment.hdr` | 2 min |
| 🟢 Low | Investigate/remove `encrypt.cjs` from public | 2 min |
| 🟢 Low | Add CSP meta tag | 5 min |

---

## R2.6 Overall Code Health Scorecard

| Category | Score | Notes |
|---|---|---|
| **Architecture** | ⭐⭐⭐⭐ | Clean structure, good code splitting, well-organized utilities |
| **Correctness** | ⭐⭐⭐ | Multiple memory leaks and race conditions, but core UX works |
| **Performance** | ⭐⭐⭐ | Great lazy-loading, but RAF leaks and excessive physics on mobile |
| **CSS Quality** | ⭐⭐⭐ | Good co-location, but dead declarations, z-index chaos, and unused rules |
| **TypeScript** | ⭐⭐ | Heavy `any` usage undermines type safety; non-null assertions risk crashes |
| **Accessibility** | ⭐⭐ | Missing fundamentals: skip-nav, keyboard nav, `user-select`, `rel` attrs |
| **SEO** | ⭐⭐ | Title only — no meta, no OG tags, no favicon, reversed heading hierarchy |
| **Asset Management** | ⭐⭐ | ~35 MB dead PNGs, unused images, misplaced files |
| **Security** | ⭐⭐⭐ | No CSP, missing `rel` on external links, but no API surface to exploit |
| **Overall** | ⭐⭐⭐ / ⭐⭐⭐⭐⭐ | Visually impressive portfolio with solid bones, but needs cleanup |

> **Bottom line**: The visual and interactive quality of this portfolio is genuinely impressive. The 3D character, scroll animations, and loading UX show real craft. The issues are primarily **hygiene** (memory leaks, dead code, asset bloat) rather than fundamental design flaws — all fixable in a focused day of cleanup.
