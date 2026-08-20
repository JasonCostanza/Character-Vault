# Character Vault Icon Replacement Plan

This document maps every icon in the Character Vault to a recommended replacement source and outlines the approach for integrating them.

> **Visual Preview**: Open [`_DOCS/icon-preview.html`](icon-preview.html) in Chrome to see current icons vs. proposed replacements side by side. Click candidates to mark picks; use "search" links for alternatives.

## 1. Source Strategy

| Category | Source | Style | Why |
| :--- | :--- | :--- | :--- |
| **RPG content icons** (weapons, damage types, items, conditions) | [game-icons.net](https://game-icons.net) | Filled silhouette (`fill="currentColor"`) | 4,000+ RPG-specific icons (swords, potions, skulls, elemental types). CC BY 3.0 license. Purpose-built for tabletop games. |
| **UI chrome icons** (settings, close, plus, sort, trash, menu) | [Lucide](https://lucide.dev) | Stroke-based (`stroke="currentColor"`) | Clean, neutral, consistent 24×24 stroke icons. Won't impose a "Google app" or "Material Design" feel on the six CV themes. |

### Style Mixing — Why It Works

The current `CV_ICONS` already mix styles: most icons are stroke-based, but several use `fill="currentColor"` for details (skull eye sockets, poison eyes, etc.). The split reinforces a natural visual hierarchy:

- **Filled silhouettes** for RPG content → heavier visual weight → these are the icons users look at and identify
- **Stroke outlines** for UI controls → lighter visual weight → these stay out of the way

Both sources use `currentColor`, so all six themes work automatically via CSS color inheritance — no per-theme exports needed.

---

## 2. SVG Normalization Rules

Every icon that enters `CV_ICONS` or the UI SVG constants must follow these rules:

```
<svg class="icon" xmlns="http://www.w3.org/2000/svg"
     width="16" height="16" viewBox="0 0 24 24"
     ...source-specific attributes...>
  <!-- path data -->
</svg>
```

### For game-icons.net (RPG icons)

1. Download the SVG from game-icons.net
2. Re-map the viewBox to `0 0 24 24` (source uses `0 0 512 512` — scale paths accordingly or use a nested `<g transform="scale(...)">`)
3. Replace any hardcoded fill colors with `fill="currentColor"`
4. Remove `stroke` attributes (these are filled icons, not stroked)
5. Strip metadata, classes, IDs, and `<title>` elements
6. Add the standard wrapper: `class="icon" width="16" height="16"`

### For Lucide (UI icons)

1. Copy the SVG from [lucide.dev](https://lucide.dev/icons/)
2. Lucide icons are already 24×24 with `stroke="currentColor"`, `fill="none"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"` — nearly drop-in
3. Add: `class="icon" width="16" height="16"` (or `width="12" height="12"` / `width="10" height="10"` for smaller UI contexts like close/sort)
4. Strip any Lucide-specific classes or data attributes

---

## 3. RPG Icon Replacement Matrix (game-icons.net)

Final selections. **KEEP** = retain current inline SVG. All others are `game-icons.net` author/name pairs.

### Generic Markers

| Icon Key | Selection | Status |
| :--- | :--- | :--- |
| `none` | `lorc/hazard-sign` | Confirmed |
| `star` | `delapouite/stars-stack` | Confirmed |
| `circle` | `delapouite/circle` | Confirmed |
| `square` | `delapouite/square` | Confirmed |
| `triangle` | `delapouite/triangle-target` | Confirmed |
| `diamond` | `skoll/diamonds` | Confirmed |
| `hash` | Lucide `hash` | Confirmed |
| `crosshair` | `delapouite/crosshair` | Confirmed |

### Time / Alerts

| Icon Key | Selection | Status |
| :--- | :--- | :--- |
| `hourglass` | Lucide `hourglass` | Confirmed |
| `clock` | Lucide `clock` | Confirmed |
| `stopwatch` | Lucide `timer` | Confirmed |
| `bell` | Lucide `bell` | Confirmed |
| `timer` | Lucide `alarm-clock` | Confirmed |

### Combat / Weapons

| Icon Key | Selection | Status |
| :--- | :--- | :--- |
| `sword` | `lorc/broadsword` | Confirmed |
| `shield` | `sbed/shield` | Confirmed |
| `armour` | `lorc/breastplate` | Confirmed |
| `dagger` | `lorc/plain-dagger` | Confirmed |
| `bow` | `lorc/pocket-bow` | Confirmed |
| `axe` | `lorc/battle-axe` | Confirmed |
| `wand` | `lorc/fairy-wand` | Confirmed |
| `staff` | `lorc/wizard-staff` | Confirmed |
| `gun` | `john-colburn/pistol-gun` | Confirmed |
| `crossbow` | `carl-olsen/crossbow` | Confirmed |
| `mace` | `lorc/spiked-mace` | Confirmed |
| `spear` | `lorc/spear-hook` | Confirmed |
| `grenade` | `lorc/grenade` | Confirmed |
| `bullet` | `lorc/bullets` | Confirmed |

### Combat FX / Actions

| Icon Key | Selection | Status |
| :--- | :--- | :--- |
| `flame` | `carl-olsen/flame` | Confirmed |
| `bolt` | `lorc/lightning-branches` | Confirmed |
| `target` | `skoll/bullseye` | Confirmed |
| `energy` | `lorc/lightning-helix` | Confirmed |
| `power` | Lucide `power` | Confirmed |

### Resources / Consumables

| Icon Key | Selection | Status |
| :--- | :--- | :--- |
| `coin` | `delapouite/two-coins` | Confirmed |
| `gem` | `lorc/cut-diamond` | Confirmed |
| `potion` | `lorc/potion-ball` | Confirmed |
| `apple` | `lorc/shiny-apple` | Confirmed |
| `water` | `lorc/droplets` | Confirmed |
| `key` | `lorc/key` | Confirmed |
| `bread` | `lorc/sliced-bread` | Confirmed |
| `bottle` | `lorc/square-bottle` | Confirmed |

### Miscellaneous

| Icon Key | Selection | Status |
| :--- | :--- | :--- |
| `scroll` | `lorc/scroll-unfurled` | Confirmed |
| `skull` | `sbed/death-skull` | Confirmed |
| `skull-crossbones` | `lorc/skull-crossed-bones` | Confirmed |
| `eye` | Lucide `eye` | Confirmed |
| `hand` | `skoll/open-palm` | Confirmed |
| `magnify` | `lorc/magnifying-glass` | Confirmed |
| `scale` | `lorc/scales` | Confirmed |
| `torch` | `delapouite/torch` | Confirmed |
| `flash` | `delapouite/flashlight` | Confirmed |

### Equipment

| Icon Key | Selection | Status |
| :--- | :--- | :--- |
| `helmet` | `lorc/visored-helm` | Confirmed |
| `boots` | `delapouite/leg-armor` | Confirmed |
| `gloves` | `lorc/mailed-fist` | Confirmed |
| `shirt` | `lucasms/shirt` | Confirmed |
| `pants` | `lorc/trousers` | Confirmed |
| `shoes` | `lorc/leather-boot` | Confirmed |

### Sci-Fi

| Icon Key | Selection | Status |
| :--- | :--- | :--- |
| `rocket` | `lorc/rocket` | Confirmed |
| `laser` | `lorc/laser-blast` | Confirmed |
| `radiation` | `lorc/radioactive` | Confirmed |
| `circuit` | `lorc/circuitry` | Confirmed |
| `robot` | `lorc/robot-golem` | Confirmed |
| `wrench` | `lorc/auto-repair` | Confirmed |

### Damage / Resistance Types

| Icon Key | Selection | Status |
| :--- | :--- | :--- |
| `acid` | `sbed/acid` | Confirmed |
| `bludgeoning` | `lorc/hammer-drop` | Confirmed |
| `cold` | `lorc/snowflake-2` | Confirmed |
| `fire` | `lorc/fire-zone` | Confirmed |
| `force` | `lorc/magic-swirl` | Confirmed |
| `lightning` | `lorc/lightning-trio` | Confirmed |
| `necrotic` | `lorc/death-zone` | Confirmed |
| `piercing` | `lorc/spotted-arrowhead` | Confirmed |
| `poison` | `lorc/poison-bottle` | Confirmed |
| `psychic` | `lorc/brain` | Confirmed |
| `radiant` | `lorc/sunbeams` | Confirmed |
| `slashing` | `lorc/claw-slashes` | Confirmed |
| `thunder` | `lorc/lightning-storm` | Confirmed |

---

## 4. UI Icon Replacement Matrix (Lucide)

All UI chrome icons confirmed. Source: [lucide.dev/icons](https://lucide.dev/icons/).

### Module Toolbar / App Buttons

| Current Usage | Lucide Icon Name | Size | Status |
| :--- | :--- | :--- | :--- |
| `CV_SVG_GEAR` (Settings) | `settings` | 12×12 | Confirmed |
| `CV_SVG_CLOSE` (Close / X) | `x` | 12×12 | Confirmed |
| `CV_SVG_SORT_UP` | `chevron-up` | 10×10 | Confirmed |
| `CV_SVG_SORT_DOWN` | `chevron-down` | 10×10 | Confirmed |
| Plus sign (create/add) | `plus` | 12×12 | Confirmed |
| Edit pen | `pencil` | 12×12 | Confirmed |
| Play triangle | `play` | 12×12 | Confirmed |
| Trash can | `trash-2` | 12×12 | Confirmed |
| Kebab menu | `more-vertical` | 12×12 | Confirmed |
| Drag handle | `grip-vertical` | 12×12 | Confirmed |
| Resize handle | `move-diagonal-2` | 10×10 | Confirmed |
| Palette | `palette` | 12×12 | Confirmed |
| Expand / Inspect | `maximize-2` | 12×12 | Confirmed |
| GitHub logo | — | — | KEEP (brand mark) |
| `magnify` (search) | `search` | 16×16 | Confirmed |
| `wrench` (utility) | `wrench` | 16×16 | Confirmed |

---

## 5. Implementation Notes

### Color Inheritance (No Per-Theme Exports)

The original plan called for exporting separate colored versions per theme. This is unnecessary — all icons use `currentColor`, which inherits from whatever CSS color is applied to the parent element. The six themes already control icon color via `--cv-text`, `--cv-text-secondary`, `--cv-text-muted`, etc.

No color work is needed during icon replacement. The color token reference from the original plan remains useful as a reminder of what colors appear where, but it does not drive the icon export process.

### game-icons.net viewBox Conversion

Game-icons.net SVGs use `viewBox="0 0 512 512"`. To fit the CV standard `viewBox="0 0 24 24"`:

**Option A — Remap viewBox directly:**
Change `viewBox="0 0 512 512"` to `viewBox="0 0 512 512"` and keep the path data as-is. The `width="16" height="16"` on the SVG element handles the visual scaling. This is the simplest approach.

**Option B — Scale path data:**
Divide all coordinate values by ~21.33 (512/24) to get true 24×24 paths. Produces cleaner SVGs but requires path math.

**Recommended: Option A.** Keep the original 512×512 viewBox and path data. Let the SVG `width`/`height` handle display scaling. Simpler, less error-prone, and the rendered result is identical.

### Licensing

- **game-icons.net**: CC BY 3.0. Attribution required. Add a credit line in `LICENSE.txt` or a comment block in `shared.js`.
- **Lucide**: ISC License. Very permissive, no attribution required (though it's good practice).

### Migration Order

1. **UI icons first** (Lucide) — smallest set, highest visibility, easy to validate
2. **Damage/resistance types** — these appear in the resistance module icon picker, easy to compare side-by-side
3. **Combat/weapons** — core RPG icons, heavily used
4. **Equipment, resources, consumables** — medium usage
5. **Generic markers, time, sci-fi** — lowest priority, some may stay as-is

---

## 6. Color Token Reference

Retained from the original plan for reference. These tokens control icon color through CSS inheritance — they are NOT used during icon export.

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
