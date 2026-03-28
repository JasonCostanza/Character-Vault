# Attribute Wizard — Design Specification

This document outlines the design and interaction model for the **Attribute Wizard** overlay in Character Vault. The wizard provides a streamlined interface for users to create new custom attributes for their items.

## 🎨 Visual Identity

The wizard follows the core Character Vault (CV) aesthetic: a premium, dark-themed interface with subtle borders, high-contrast accents, and serif typography for headers.

### Color Palette (Dark Theme)

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--cv-bg` | `#1C1C1C` | Main background |
| `--cv-bg-surface` | `#252525` | Secondary background |
| `--cv-bg-raised` | `#2E2E2E` | Card/Button background |
| `--cv-bg-sunken` | `#141414` | Input background |
| `--cv-accent` | `#C0874A` | Brand color, active states |
| `--cv-text` | `#E8DCC8` | Primary text |
| `--cv-text-muted` | `#6A5A4A` | Low-priority text, icons |
| `--cv-border` | `#3A3530` | Structural dividers |

---

## 🏗️ Layout Structure

The wizard is implemented as a fixed-position, full-screen overlay with a centralized panel restricted to a maximum width of `380px`.

### 1. Header
- **Title**: "New Attribute" (Style: Palatino Linotype, Uppercase, Tracking `0.08em`).
- **Close Button**: A subtle 'X' icon that dismisses the wizard without saving.

### 2. Body (Scrollable)
The body is divided into three distinct sections:

#### **A. Name**
- A standard text input for the attribute name.
- **Placeholder**: "e.g. Charges, Rarity, Condition…"
- **Logic**: The "Create" button remains disabled until this field contains at least one non-whitespace character.

#### **B. Type Selection**
Attributes can be one of four distinct types, presented as a 2x2 grid of cards:

| Type | Glyph Representation | Description |
| :--- | :--- | :--- |
| **Toggle** | 🔘 (Switch SVG) | On / off state |
| **Number** | `42` | A single integer value |
| **Number Pair** | `8 / 10` | A current value and a maximum |
| **Text** | `Aa` | A short text label/string |

#### **C. Icon Selection (Optional)**
A 7-column grid of icons that can be associated with the attribute.
- **First Option**: "None" (marked with a dash `—`).
- **Icons**: A library of Lucide-inspired SVG icons (Scale, Bottle, Armour, Helmet, Sword, Gem, etc.).
- **Feedback**: Hovering over an icon shows a CSS-based tooltip with the icon's label.

### 3. Footer
- **Cancel Button**: Simple border-only button.
- **Create Button**: Primary action button (Solid Accent color, Dark text).
- **Validation**: Enabled only when a Name is provided.

---

## 🛠️ Implementation Details

### Typography
- **Headings**: `Palatino Linotype`, `Book Antiqua`, `Georgia`, serif.
- **UI/Labels**: System UI (Segoe UI, Roboto, sans-serif).

### Interactive States
- **Hover**: Subtle background lightening or border color shifts (e.g., `--cv-accent-secondary`).
- **Active/Selected**: Border set to `--cv-accent` with a very faint background tint (8%–12% opacity).
- **Focus**: `2px` ring using `--cv-focus-ring` (`#C0874A80`).

---

## 📦 Icon Library Reference

The following icons are included in the wizard's picker:

- `None`
- `Balance Scale`
- `Power Button`
- `Apple`
- `Bread`
- `Bottle of Water`
- `Magnifying Glass`
- `Torch`
- `Flashlight`
- `Armour`
- `Helmet`
- `Boots`
- `Gloves`
- `T-Shirt`
- `Pants`
- `Shoes`
- `Gun`
- `Sword`
- `Dagger`
- `Wand`
- `Staff`
- `Coin`
- `Potion`
- `Key`
- `Gem`
- `Bow`
- `Axe`
- `Shield`
