# COLORS.md — Character Vault Color System

## Overview

Character Vault supports **six themes**: `dark` (default, matches TaleSpire's aesthetic), `light` (parchment), `cyberpunk` (neon pink/cyan on indigo-black), `scifi` (blue-steel HUD), `angelic` (gold on silver-white, light theme), and `demonic` (blood red on crimson-black). The active theme is set via a `data-theme` attribute on the root `<html>` element.

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

| Token | Dark | Light | Cyberpunk | Sci-Fi | Angelic | Demonic | Purpose |
|---|---|---|---|---|---|---|---|
| `--cv-bg` | `#1C1C1C` | `#F2E8D0` | `#0A0A14` | `#0C1018` | `#F0F0F5` | `#120808` | Page / app background |
| `--cv-bg-surface` | `#252525` | `#EDE0C4` | `#12121F` | `#131A24` | `#E8E8F0` | `#1C0E0E` | Cards, panels, modules |
| `--cv-bg-raised` | `#2E2E2E` | `#F7EED8` | `#1A1A2A` | `#1A2332` | `#F5F5FA` | `#281414` | Elevated elements (dropdowns, tooltips) |
| `--cv-bg-sunken` | `#141414` | `#D9C9A8` | `#06060E` | `#080C12` | `#D8D8E4` | `#0A0404` | Inset areas, input backgrounds |
| `--cv-text` | `#E8DCC8` | `#2C1A0E` | `#E0E0F0` | `#C8D8E8` | `#1A1A2E` | `#E8D0C8` | Primary body text |
| `--cv-text-secondary` | `#B0A090` | `#5C3D2E` | `#9090B0` | `#7A90A8` | `#484868` | `#A08078` | Labels, supporting text |
| `--cv-text-muted` | `#6A5A4A` | `#8B6E5A` | `#505070` | `#3E5068` | `#8888A0` | `#604840` | Placeholder, disabled text |
| `--cv-border` | `#3A3530` | `#C8AE8C` | `#2A2A40` | `#1E2E40` | `#C0C0D4` | `#3A2020` | Default borders and dividers |
| `--cv-border-subtle` | `#2A2520` | `#DDD0B2` | `#1E1E30` | `#162030` | `#D8D8E8` | `#2A1515` | Subtle separators |
| `--cv-accent` | `#C0874A` | `#8B4513` | `#FF2E8B` | `#2196F3` | `#B8860B` | `#CC2020` | Primary accent (buttons, highlights) |
| `--cv-accent-hover` | `#D9A060` | `#6B3410` | `#FF5AA5` | `#42A5F5` | `#9A7209` | `#E03030` | Accent hover state |
| `--cv-accent-secondary` | `#A06838` | `#6B4226` | `#00E5FF` | `#00BCD4` | `#6A5ACD` | `#E07020` | Secondary accent |
| `--cv-success` | `#5A9E6E` | `#4A7C59` | `#00E676` | `#4CAF50` | `#3A8A4A` | `#6A9A40` | Positive / success states |
| `--cv-danger` | `#B84040` | `#8B2020` | `#FF1744` | `#E04848` | `#A03030` | `#FF3030` | Error / danger states |
| `--cv-warning` | `#C09040` | `#A0722A` | `#FFAB00` | `#F5A623` | `#B07A10` | `#D48A20` | Warning / caution states |
| `--cv-focus-ring` | `#C0874A80` | `#8B451380` | `#FF2E8B80` | `#2196F380` | `#B8860B80` | `#CC202080` | Focus outline (with alpha) |

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

/* ── Cyberpunk Theme ─────────────────────────────────────────────── */
html[data-theme="cyberpunk"] {
  --cv-bg:              #0A0A14;
  --cv-bg-surface:      #12121F;
  --cv-bg-raised:       #1A1A2A;
  --cv-bg-sunken:       #06060E;

  --cv-text:            #E0E0F0;
  --cv-text-secondary:  #9090B0;
  --cv-text-muted:      #505070;

  --cv-border:          #2A2A40;
  --cv-border-subtle:   #1E1E30;

  --cv-accent:          #FF2E8B;
  --cv-accent-hover:    #FF5AA5;
  --cv-accent-secondary:#00E5FF;

  --cv-success:         #00E676;
  --cv-danger:          #FF1744;
  --cv-warning:         #FFAB00;

  --cv-focus-ring:      #FF2E8B80;
}

/* ── Sci-Fi Theme ────────────────────────────────────────────────── */
html[data-theme="scifi"] {
  --cv-bg:              #0C1018;
  --cv-bg-surface:      #131A24;
  --cv-bg-raised:       #1A2332;
  --cv-bg-sunken:       #080C12;

  --cv-text:            #C8D8E8;
  --cv-text-secondary:  #7A90A8;
  --cv-text-muted:      #3E5068;

  --cv-border:          #1E2E40;
  --cv-border-subtle:   #162030;

  --cv-accent:          #2196F3;
  --cv-accent-hover:    #42A5F5;
  --cv-accent-secondary:#00BCD4;

  --cv-success:         #4CAF50;
  --cv-danger:          #E04848;
  --cv-warning:         #F5A623;

  --cv-focus-ring:      #2196F380;
}

/* ── Angelic Theme (Light) ───────────────────────────────────────── */
html[data-theme="angelic"] {
  --cv-bg:              #F0F0F5;
  --cv-bg-surface:      #E8E8F0;
  --cv-bg-raised:       #F5F5FA;
  --cv-bg-sunken:       #D8D8E4;

  --cv-text:            #1A1A2E;
  --cv-text-secondary:  #484868;
  --cv-text-muted:      #8888A0;

  --cv-border:          #C0C0D4;
  --cv-border-subtle:   #D8D8E8;

  --cv-accent:          #B8860B;
  --cv-accent-hover:    #9A7209;
  --cv-accent-secondary:#6A5ACD;

  --cv-success:         #3A8A4A;
  --cv-danger:          #A03030;
  --cv-warning:         #B07A10;

  --cv-focus-ring:      #B8860B80;
}

/* ── Demonic Theme ───────────────────────────────────────────────── */
html[data-theme="demonic"] {
  --cv-bg:              #120808;
  --cv-bg-surface:      #1C0E0E;
  --cv-bg-raised:       #281414;
  --cv-bg-sunken:       #0A0404;

  --cv-text:            #E8D0C8;
  --cv-text-secondary:  #A08078;
  --cv-text-muted:      #604840;

  --cv-border:          #3A2020;
  --cv-border-subtle:   #2A1515;

  --cv-accent:          #CC2020;
  --cv-accent-hover:    #E03030;
  --cv-accent-secondary:#E07020;

  --cv-success:         #6A9A40;
  --cv-danger:          #FF3030;
  --cv-warning:         #D48A20;

  --cv-focus-ring:      #CC202080;
}
```

---

## Theme Switching (JS)

```js
function setTheme(theme) {
  // theme: "dark" | "light" | "cyberpunk" | "scifi" | "angelic" | "demonic"
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
