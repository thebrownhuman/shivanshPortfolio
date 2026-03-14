# Portfolio Code Review - Issues & Findings

> Full audit completed on 2026-03-14
> Severity: Critical > High > Medium > Low

---

## CRITICAL Issues

### 1. Hardcoded Password in Source Code
- **File:** `src/components/Character/utils/character.ts:21`
- **Issue:** Password `"MyCharacter12"` is hardcoded in plain text. Anyone inspecting the bundle can see it.
- **Fix:** Move to environment variable `import.meta.env.VITE_CHAR_PASSWORD` and add to `.env`.

### 2. Missing SEO Meta Tags
- **File:** `index.html`
- **Issue:** No meta description, no Open Graph tags, no favicon, no canonical URL. Site will have poor search visibility and blank social media previews.
- **Fix:** Add meta description, OG tags (title, description, image, url), favicon, and canonical link.

### 3. Multiple Event Listener Memory Leaks
- **Files:** `SocialIcons.tsx:48`, `Navbar.tsx:26-36`, `Character/Scene.tsx:133-143`, `Character/utils/GsapScroll.ts:9-11`
- **Issue:** `document.addEventListener("mousemove")` and `window.addEventListener("resize")` are added but never removed. Listeners accumulate on re-renders. `setInterval` in GsapScroll.ts runs indefinitely without `clearInterval`.
- **Fix:** Store listener/interval references and clean up in useEffect return functions.

---

## HIGH Issues

### 4. Dead Resume Button
- **File:** `src/components/SocialIcons.tsx:77`
- **Issue:** Resume button `href="#"` goes nowhere. Users clicking it get no resume.
- **Fix:** Link to an actual resume PDF or remove the button.

### 5. Timers Not Cleaned Up in Loading.tsx
- **File:** `src/components/Loading.tsx:14-19`
- **Issue:** `setTimeout` calls are not stored or cleared. If component unmounts mid-load, timers keep running and try to update unmounted state.
- **Fix:** Store timeout IDs in refs and clear in useEffect cleanup.

### 6. External Links Missing rel="noopener noreferrer"
- **Files:** `Contact.tsx:22-44`, `SocialIcons.tsx:62-74`
- **Issue:** All `target="_blank"` links lack `rel="noopener noreferrer"`. This is a security risk (reverse tabnapping) and accessibility concern.
- **Fix:** Add `rel="noopener noreferrer"` to every external link.

### 7. SocialIcons.tsx Cleanup Never Executes
- **File:** `src/components/SocialIcons.tsx:52-54`
- **Issue:** `return` inside `.forEach()` callback returns from the callback, not from useEffect. The cleanup functions are silently discarded.
- **Fix:** Collect cleanup logic outside forEach and return a single cleanup function from useEffect.

### 8. Invalid CSS Values
- **File:** `src/components/styles/About.css:4-5`
- **Issue:** `justify-content: left` and `justify-content: right` are invalid CSS. Should be `flex-start` / `flex-end`.
- **Fix:** Replace with valid flexbox values.

### 9. Module-Level Export of ScrollSmoother
- **File:** `src/components/Navbar.tsx:9`
- **Issue:** `export let smoother: ScrollSmoother` is a mutable module-level export. Any file can import and mutate it, breaking React's data flow.
- **Fix:** Wrap in React Context or expose via a getter function.

### 10. gsap-trial in Production
- **File:** `package.json:22`
- **Issue:** `gsap-trial` is a trial/beta package not meant for production. May have watermarks or limitations.
- **Fix:** Replace with licensed `gsap` or use the free GSAP core.

### 11. Texture Loading at Module Level
- **File:** `src/components/TechStack.tsx:25`
- **Issue:** All 8 textures are loaded synchronously at module level on import. Blocks the main thread and loads even if the section is never scrolled to.
- **Fix:** Lazy-load textures inside useEffect or use React Three Fiber's `useTexture` hook.

### 12. No Error Handling for 3D Content
- **Files:** `TechStack.tsx:201`, `Character/Scene.tsx:56+`
- **Issue:** If WebGL fails or the 3D model doesn't load, the user sees a blank space or crash. No fallback UI.
- **Fix:** Add error boundaries and fallback UI for non-WebGL browsers.

---

## MEDIUM Issues

### 13. Cursor RAF Never Cancelled
- **File:** `src/components/Cursor.tsx:22`
- **Issue:** `requestAnimationFrame` loop runs forever, even after unmount.
- **Fix:** Store RAF ID and call `cancelAnimationFrame()` in cleanup.

### 14. Navbar Click Listeners Accumulate
- **File:** `src/components/Navbar.tsx:26-36`
- **Issue:** forEach adds click listeners in useEffect without cleanup. Re-renders stack duplicate listeners.
- **Fix:** Add cleanup function that removes all listeners.

### 15. WhatIDo.tsx Event Listener Cleanup Bug
- **File:** `src/components/WhatIDo.tsx:22`
- **Issue:** Cleanup creates new anonymous function that won't match the original listener reference.
- **Fix:** Store handler reference and use it for both add and remove.

### 16. WorkImage.tsx Fetch Path
- **File:** `src/components/WorkImage.tsx:17`
- **Issue:** Uses relative `src/assets/` path that won't resolve in production builds.
- **Fix:** Use static imports or public directory paths.

### 17. Loading Progress Multiple Intervals
- **File:** `src/components/Loading.tsx:95-135`
- **Issue:** `setProgress` can create overlapping intervals if called multiple times.
- **Fix:** Refactor into a custom hook with proper cleanup.

### 18. No Content Security Policy
- **File:** `index.html` / server config
- **Issue:** No CSP headers configured. Vulnerable to XSS injection.
- **Fix:** Add CSP meta tag or configure via Vite/server headers.

### 19. CSS Duplicate Transforms
- **File:** `src/components/styles/Landing.css:98,104`
- **Issue:** `.character-rim` has conflicting transform on lines 98 and 104. Line 98 is overridden.
- **Fix:** Remove the dead transform on line 98.

### 20. overflow: clip Browser Support
- **File:** `src/index.css:109`
- **Issue:** `overflow: clip` has limited browser support.
- **Fix:** Use `overflow: hidden` for broader compatibility.

### 21. Scene.tsx Giant useEffect
- **File:** `src/components/Character/Scene.tsx`
- **Issue:** Single useEffect is 130+ lines. Hard to maintain, test, or debug.
- **Fix:** Split into `useCharacterSetup`, `useEventListeners`, `useAnimation` hooks.

### 22. Weak Encryption
- **File:** `src/components/Character/utils/decrypt.ts`
- **Issue:** AES-CBC with a predictable password and no key stretching (PBKDF2).
- **Fix:** Use PBKDF2 for key derivation if encryption is actually needed.

### 23. Any Types in TypeScript
- **Files:** `Scene.tsx:47`, `GsapScroll.ts:39`, `character.ts:31`
- **Issue:** Multiple `any` types defeat the purpose of TypeScript.
- **Fix:** Type as `THREE.Mesh`, `THREE.Object3D`, etc.

### 24. SplitText Recursive Refresh
- **File:** `src/components/utils/splitText.ts:79`
- **Issue:** `ScrollTrigger.addEventListener("refresh")` inside the function can trigger recursive calls.
- **Fix:** Add a guard flag to prevent re-registration.

### 25. Duplicated Media Queries in CSS
- **File:** `src/components/styles/Work.css:237-300`
- **Issue:** Same selectors repeated across multiple media queries. Increases CSS bundle size.
- **Fix:** Consolidate or use mobile-first approach.

### 26. No Vite Build Optimizations
- **File:** `vite.config.ts`
- **Issue:** No minification settings, no image optimization plugin, no chunk splitting configured.
- **Fix:** Add terser minification, image optimization, and manual chunk splitting for Three.js.

### 27. Hardcoded Colors Everywhere
- **Files:** Multiple CSS files
- **Issue:** Colors are hardcoded instead of using CSS custom properties. Changing the theme requires editing 20+ files.
- **Fix:** Define a color palette in `:root` and use `var(--color-*)` throughout.

---

## LOW Issues

### 28. HoverLinks Boolean Logic
- **File:** `src/components/HoverLinks.tsx:5`
- **Issue:** `data-cursor={!cursor && "disable"}` evaluates to `false` (not "disable") when cursor is truthy.
- **Fix:** Use ternary: `data-cursor={cursor ? undefined : "disable"}`.

### 29. Decorative SVGs Not Hidden
- **File:** `src/components/WhatIDo.tsx:40-107`
- **Issue:** Decorative SVG lines lack `aria-hidden="true"`.
- **Fix:** Add `aria-hidden="true"` to all decorative SVGs.

### 30. Unused test.js in Root
- **File:** `test.js`
- **Issue:** Orphaned test file not connected to any test runner.
- **Fix:** Delete or integrate into a proper test suite.

### 31. Landing.tsx is Just a Wrapper
- **File:** `src/components/Landing.tsx`
- **Issue:** Component has no logic, just wraps JSX. Could be simplified.
- **Fix:** Fine as-is for readability, but could be a CSS module.

### 32. No Loading Skip Option
- **File:** `src/components/Loading.tsx`
- **Issue:** Users on slow connections can't skip the loading animation.
- **Fix:** Add a "Skip" button or auto-advance after a timeout.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 9 |
| Medium | 15 |
| Low | 5 |
| **Total** | **32** |

### Top 5 Priorities
1. Remove hardcoded password from source code
2. Fix event listener memory leaks (4+ components)
3. Add SEO meta tags and favicon
4. Fix dead resume link
5. Add `rel="noopener noreferrer"` to external links
