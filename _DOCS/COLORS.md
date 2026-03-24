# COLORS.md — Character Vault Color System

## Overview

Character Vault supports **two themes**: `light` (parchment) and `dark` (default, matches TaleSpire's aesthetic). The active theme is toggled via a `data-theme` attribute on the root `<html>` element.

TaleSpire injects its own CSS variables when `colorStyles` is listed under `extras` in `manifest.json`. These TS-provided variables are documented below as a reference, but Character Vault defines its own semantic token layer on top of them for full control over both themes.

---

## TaleSpire colorStyles Reference (Injected by TS)

These variables are provided by TaleSpire automatically when `"colorStyles"` is in `extras`. They reflect TaleSpire's current UI theme. Use them only when you want to intentionally match TaleSpire's native UI chrome.

| Variable | Description |
|---|---|
| `--ts-color-background` | TaleSpire panel background |
| `--ts-color-surface` | TaleSpire surface/card color |
| `--ts-color-text-primary` | TaleSpire primary text color |
| `--ts-color-text-secondary` | TaleSpire secondary/muted text |
| `--ts-color-border` | TaleSpire border color |
| `--ts-color-accent` | TaleSpire primary accent/highlight |
| `--ts-color-accent-hover` | TaleSpire accent hover state |
| `--ts-color-danger` | TaleSpire danger/error color |
| `--ts-color-success` | TaleSpire success/positive color |

> **Note:** TS variable names are approximations based on the colorStyles API. Verify exact names when TaleSpire's symbiote docs are available. These should not be used as substitutes for Character Vault's own tokens.

---

## Character Vault Color Tokens

All app-level styling uses `--cv-*` prefixed CSS custom properties. These are defined per-theme via `[data-theme]` selectors on `<html>`.

### Semantic Token Table

| Token | Light (Parchment) | Dark | Purpose |
|---|---|---|---|
| `--cv-bg` | `#F2E8D0` | `#1C1C1C` | Page / app background |
| `--cv-bg-surface` | `#EDE0C4` | `#252525` | Cards, panels, modules |
| `--cv-bg-raised` | `#F7EED8` | `#2E2E2E` | Elevated elements (dropdowns, tooltips) |
| `--cv-bg-sunken` | `#D9C9A8` | `#141414` | Inset areas, input backgrounds |
| `--cv-text` | `#2C1A0E` | `#E8DCC8` | Primary body text |
| `--cv-text-secondary` | `#5C3D2E` | `#B0A090` | Labels, supporting text |
| `--cv-text-muted` | `#8B6E5A` | `#6A5A4A` | Placeholder, disabled text |
| `--cv-border` | `#C8AE8C` | `#3A3530` | Default borders and dividers |
| `--cv-border-subtle` | `#DDD0B2` | `#2A2520` | Subtle separators |
| `--cv-accent` | `#8B4513` | `#C0874A` | Primary accent (buttons, highlights) |
| `--cv-accent-hover` | `#6B3410` | `#D9A060` | Accent hover state |
| `--cv-accent-secondary` | `#6B4226` | `#A06838` | Secondary accent |
| `--cv-success` | `#4A7C59` | `#5A9E6E` | Positive / success states |
| `--cv-danger` | `#8B2020` | `#B84040` | Error / danger states |
| `--cv-warning` | `#A0722A` | `#C09040` | Warning / caution states |
| `--cv-focus-ring` | `#8B451380` | `#C0874A80` | Focus outline (with alpha) |

---

## CSS Implementation

Apply this block to `main.css`. Theme switching is done by setting `data-theme` on `<html>`.

```css
/* ── Dark Theme (default) ─────────────────────────────────────────── */
:root,
html[data-theme="dark"] {
  --cv-bg:              #1C1C1C;
  --cv-bg-surface:      #252525;
  --cv-bg-raised:       #2E2E2E;
  --cv-bg-sunken:       #141414;

  --cv-text:            #E8DCC8;
  --cv-text-secondary:  #B0A090;
  --cv-text-muted:      #6A5A4A;

  --cv-border:          #3A3530;
  --cv-border-subtle:   #2A2520;

  --cv-accent:          #C0874A;
  --cv-accent-hover:    #D9A060;
  --cv-accent-secondary:#A06838;

  --cv-success:         #5A9E6E;
  --cv-danger:          #B84040;
  --cv-warning:         #C09040;

  --cv-focus-ring:      #C0874A80;
}

/* ── Light Theme (Parchment) ──────────────────────────────────────── */
html[data-theme="light"] {
  --cv-bg:              #F2E8D0;
  --cv-bg-surface:      #EDE0C4;
  --cv-bg-raised:       #F7EED8;
  --cv-bg-sunken:       #D9C9A8;

  --cv-text:            #2C1A0E;
  --cv-text-secondary:  #5C3D2E;
  --cv-text-muted:      #8B6E5A;

  --cv-border:          #C8AE8C;
  --cv-border-subtle:   #DDD0B2;

  --cv-accent:          #8B4513;
  --cv-accent-hover:    #6B3410;
  --cv-accent-secondary:#6B4226;

  --cv-success:         #4A7C59;
  --cv-danger:          #8B2020;
  --cv-warning:         #A0722A;

  --cv-focus-ring:      #8B451380;
}
```

---

## Theme Switching (JS)

```js
function setTheme(theme) {
  // theme: "light" | "dark"
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("cv-theme", theme);
}

function loadTheme() {
  const saved = localStorage.getItem("cv-theme") ?? "dark";
  setTheme(saved);
}
```

Call `loadTheme()` on startup. Provide a toggle control in `Edit` mode only (per the `Edit` mode design rule in `_DESIGN.md`).

---

## Usage Guidelines

- **Always use `--cv-*` tokens** in component styles. Never hardcode hex values.
- Use `--cv-bg-surface` for module/card backgrounds, `--cv-bg` for the outer app shell.
- Use `--cv-text-secondary` for field labels; `--cv-text` for values.
- `--cv-accent` should be used sparingly — primary CTAs, active states, roll buttons.
- Danger (`--cv-danger`) is reserved for destructive actions and error states only.
- The dark theme is the **default** and primary design target; the light theme is an opt-in.
