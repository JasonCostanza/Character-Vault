# Character Vault Icon Replacement Plan

This document provides a detailed mapping of every icon in the Character Vault project to its required thematic colors. Use this as a reference when exporting icons from [Google Fonts Icons](https://fonts.google.com/icons) to ensure they match the Character Vault design system.

## 1. Master Color Token Reference

Use these hex codes when setting the "Color" property in Google Fonts.

| Semantic Token | Dark (Default) | Light (Parchment) | Cyberpunk | Sci-Fi | Angelic | Demonic |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `--cv-text` | `#E8DCC8` | `#2C1A0E` | `#E0E0F0` | `#C8D8E8` | `#1A1A2E` | `#E8D0C8` |
| `--cv-text-secondary` | `#B0A090` | `#5C3D2E` | `#9090B0` | `#7A90A8` | `#484868` | `#A08078` |
| `--cv-text-muted` | `#6A5A4A` | `#8B6E5A` | `#505070` | `#3E5068` | `#8888A0` | `#604840` |
| `--cv-accent` | `#C0874A` | `#8B4513` | `#FF2E8B` | `#2196F3` | `#B8860B` | `#CC2020` |
| `--cv-accent-secondary` | `#A06838` | `#6B4226` | `#00E5FF` | `#00BCD4` | `#6A5ACD` | `#E07020` |
| `--cv-success` | `#5A9E6E` | `#4A7C59` | `#00E676` | `#4CAF50` | `#3A8A4A` | `#6A9A40` |
| `--cv-danger` | `#B84040` | `#8B2020` | `#FF1744` | `#E04848` | `#A03030` | `#FF3030` |
| `--cv-warning` | `#C09040` | `#A0722A` | `#FFAB00` | `#F5A623` | `#B07A10` | `#D48A20` |

---

## 2. Icon Replacement Matrix

For each icon, export a version for **every hex code listed** under its required tokens.

### Shared Icons (`scripts/shared.js`)

| Icon Key | Required Token(s) | Notes |
| :--- | :--- | :--- |
| `star`, `circle`, `square`, `diamond` | `--cv-text-secondary` | General markers |
| `triangle`, `flash`, `torch`, `radiation`, `radiant` | `--cv-text-secondary`<br>`--cv-warning` | Warning / Light / Holy |
| `hourglass`, `clock`, `stopwatch`, `timer`, `bell` | `--cv-text-secondary` | Time / Alerts |
| `sword`, `shield`, `axe`, `bow`, `dagger`, `gun`, `staff`, `wand`, `laser` | `--cv-text`<br>`--cv-text-secondary` | Combat / Equipment |
| `flame`, `bolt`, `target`, `crosshair`, `energy`, `power`, `thunder`, `force` | `--cv-text-secondary`<br>`--cv-accent` | Combat FX / Actions |
| `coin`, `gem`, `scroll`, `eye`, `hand`, `armour`, `boots`, `bottle`, `gloves`, `hash`, `helmet`, `magnify`, `pants`, `shirt`, `shoes`, `rocket`, `circuit`, `robot`, `wrench` | `--cv-text-secondary` | Resources / Equipment |
| `potion`, `apple`, `bread`, `poison` | `--cv-text-secondary`<br>`--cv-success` | Consumables / Poison |
| `water`, `cold`, `psychic`, `lightning` | `--cv-text-secondary`<br>`--cv-accent-secondary` | Elemental / Mental |
| `skull`, `skull-crossbones`, `fire`, `acid` | `--cv-text-secondary`<br>`--cv-danger` | Danger / Lethal |
| `necrotic` | `--cv-text-secondary`<br>`--cv-text-muted` | Decay |

### Condition Icons (`scripts/module-condition.js`)

Most condition icons appear in the main list using `--cv-text`.

| Icon Category | Required Token(s) | Context |
| :--- | :--- | :--- |
| **All Conditions** | `--cv-text` | Primary List Item |
| `bleeding`, `dying` | `--cv-danger` | Status Alerts |
| `burning` | `--cv-warning` | Status Alerts |

### Application UI Icons

| UI Icon | Required Token(s) | Usage |
| :--- | :--- | :--- |
| `Settings Gear`, `Plus Sign`, `Close X` | `--cv-text-muted`<br>`--cv-text` | Buttons (Default/Hover) |
| `Plus Sign`, `Edit Pen`, `Play Triangle`, `Sort Up`, `Sort Down` | `--cv-accent` | Primary Actions / Active States |
| `GitHub Logo`, `Kebab Menu`, `Drag Handle`, `Resize Handle`, `Palette Icon`, `Expand/Inspect` | `--cv-text-muted` | Supporting UI |
| `Trash Can`, `Close X` | `--cv-danger` | Destructive Actions |

---

## 3. Export Settings (Google Fonts)

To maintain the Character Vault aesthetic, use the following settings in the Google Fonts Icon interface:

- **Weight**: `400` (Regular) or `300` (Light) for a cleaner look.
- **Grade**: `0`
- **Optical Size**: `24px`
- **Format**: SVG
- **Filling**: Ensure icons are **outlined** (Fill = 0) unless specified otherwise.

> [!TIP]
> When exporting, name your files using the format `[icon-key]-[token-name].svg` (e.g., `star-text-secondary.svg`) to keep your asset library organized.
