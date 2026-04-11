# main.html Simplify Review

## Context
Reviewed `main.html` with three parallel agents (reuse, quality, efficiency). Many findings are inapplicable given project constraints (no build step, script load order matters = no async/defer per ARCHITECTURE.md). Below are the actionable items.

## Findings Worth Fixing

### 1. Remove dead `<!-- Sizing -->` comment (line 262)
Empty section placeholder with no content. Just delete it.

### 2. Delete confirm title: `<div>` → `<h2>` (line 277)
Settings and wizard panels both use `<h2>` for titles, but the delete confirmation uses a `<div>`. Should be `<h2>` for consistency.

### 3. Add `aria-live="polite"` to `#toast-container` (line 292)
Toast notifications should announce to screen readers.

### 4. Swatch `style` + `data-color` duplication (lines 188-193)
Each color swatch carries the hex value twice: `data-color="#8B2020"` and `style="background-color: #8B2020;"`. The inline `style` could be set from `data-color` in the wizard init JS, removing 6 redundant `style` attributes. *(Requires a small JS change in the wizard init.)*

## Findings Dismissed

| Finding | Why dismissed |
|---|---|
| Render-blocking scripts / add `defer` | Project rule: script load order matters, no async/defer |
| Move scripts to `<head>` with `defer` | Same — violates project conventions |
| Generate wizard cards / selects from JS | Moves readable static HTML into JS for marginal gain; harder to scan/maintain in a no-build project |
| SVG `<symbol>`/`<use>` sprite | Only 2-3 duplicate icons; added complexity outweighs minimal savings |
| SRI hashes on CDN scripts | Embedded Chromium context, low risk; nice-to-have but not an efficiency gain |
| `<link rel="preconnect">` | Local/embedded environment, negligible benefit |
| Hidden overlays in initial DOM | Tiny page, no measurable impact |
| Missing `data-i18n` on mode toggle label | JS already handles this via `t()` calls in both `settings.js` and `i18n.js` |

## Changes

**File: `main.html`**
- Line 262: Remove `<!-- Sizing -->` comment
- Line 277: Change `<div class="delete-confirm-title"` to `<h2 class="delete-confirm-title"`
- Line 292: Add `aria-live="polite"` to `#toast-container`
- Lines 188-193: Remove inline `style="background-color: ..."` from 6 color swatches

**File: `scripts/app.js` or wizard init code** *(needs verification)*
- Add a line to set `swatch.style.backgroundColor = swatch.dataset.color` for each non-default, non-custom swatch on init

## Verification
- Open the symbiote in TaleSpire
- Confirm color swatches still display correctly in the wizard
- Confirm delete dialog title renders the same
- Confirm toast notifications still appear
