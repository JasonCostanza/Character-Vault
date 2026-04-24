# Character Vault SVG Icon Inventory

This document catalogs all SVG icons used in the Character Vault project. Icons are organized by their source and intended usage.

## 1. Centralized Shared Icons (`scripts/shared.js`)
These icons are part of the `CV_ICONS` object and are used across multiple modules (Counters, Lists, Resistances, etc.). They all use `viewBox="0 0 24 24"`.

| Icon Key | Colors | Category | Description |
| :--- | :--- | :--- | :--- |
| `star` | `--cv-text-secondary` | Generic | Five-pointed star (Counters/Markers) |
| `circle` | `--cv-text-secondary` | Generic | Simple circle (Counters/Markers) |
| `square` | `--cv-text-secondary` | Generic | Rounded square (Counters/Markers) |
| `triangle` | `--cv-text-secondary`, `--cv-warning` | Generic | Warning triangle style |
| `diamond` | `--cv-text-secondary` | Generic | Diamond shape (Markers) |
| `hourglass` | `--cv-text-secondary` | Time | Hourglass / Duration tracking |
| `clock` | `--cv-text-secondary` | Time | Analog clock (Time tracking) |
| `stopwatch` | `--cv-text-secondary` | Time | Stopwatch (Combat rounds) |
| `bell` | `--cv-text-secondary`, `--cv-accent` | Time | Notification bell (Alerts) |
| `timer` | `--cv-text-secondary` | Time | Digital timer / watch |
| `sword` | `--cv-text`, `--cv-text-secondary` | Combat | Weapon / Attack (Weapons/Counters) |
| `shield` | `--cv-text`, `--cv-text-secondary` | Combat | Defense / Armor (Weapons/Counters) |
| `flame` | `--cv-text-secondary`, `--cv-accent` | Combat | Fire / Energy (Counters) |
| `bolt` | `--cv-text-secondary`, `--cv-accent` | Combat | Lightning / Speed (Counters) |
| `target` | `--cv-text-secondary`, `--cv-accent` | Combat | Accuracy / Aim (Counters) |
| `coin` | `--cv-text-secondary` | Resources | Currency / Wealth tracking |
| `gem` | `--cv-text-secondary` | Resources | Treasure / Gems tracking |
| `potion` | `--cv-text-secondary`, `--cv-success` | Resources | Magic / Health potion tracking |
| `apple` | `--cv-text-secondary`, `--cv-success` | Resources | Food / Healing tracking |
| `water` | `--cv-text-secondary`, `--cv-accent-secondary` | Resources | Hydration / Mana tracking |
| `scroll` | `--cv-text-secondary` | Miscellaneous | Document / Spell tracking |
| `skull` | `--cv-text-secondary`, `--cv-danger` | Miscellaneous | Death / Danger (Lethal states) |
| `skull-crossbones` | `--cv-text-secondary`, `--cv-danger` | Miscellaneous | Lethal Danger (Critical states) |
| `eye` | `--cv-text-secondary` | Miscellaneous | Perception / Vision tracking |
| `hand` | `--cv-text-secondary` | Miscellaneous | Interaction / Touch tracking |
| `armour` | `--cv-text-secondary` | Equipment | Armor / Protection tracking |
| `axe` | `--cv-text-secondary`, `--cv-text` | Equipment | Melee Weapon (Inventory/Weapons) |
| `boots` | `--cv-text-secondary` | Equipment | Footwear tracking |
| `bottle` | `--cv-text-secondary` | Equipment | Container tracking |
| `bow` | `--cv-text-secondary`, `--cv-text` | Equipment | Ranged Weapon (Inventory/Weapons) |
| `bread` | `--cv-text-secondary`, `--cv-success` | Equipment | Sustenance tracking |
| `dagger` | `--cv-text-secondary`, `--cv-text` | Equipment | Small Melee Weapon (Inventory/Weapons) |
| `flash` | `--cv-text-secondary`, `--cv-warning` | Equipment | Light Source tracking |
| `gloves` | `--cv-text-secondary` | Equipment | Handwear tracking |
| `gun` | `--cv-text-secondary`, `--cv-text` | Equipment | Ranged Weapon (Inventory/Weapons) |
| `hash` | `--cv-text-secondary` | Equipment | Number / Quantity tracking |
| `helmet` | `--cv-text-secondary` | Equipment | Headwear tracking |
| `key` | `--cv-text-secondary`, `--cv-accent` | Equipment | Access / Quest item tracking |
| `magnify` | `--cv-text-secondary` | Equipment | Investigation tracking |
| `pants` | `--cv-text-secondary` | Equipment | Lower Body tracking |
| `power` | `--cv-text-secondary`, `--cv-accent` | Equipment | Active / Toggle tracking |
| `crosshair` | `--cv-text-secondary`, `--cv-accent` | Equipment | Targeting tracking |
| `shirt` | `--cv-text-secondary` | Equipment | Upper Body tracking |
| `shoes` | `--cv-text-secondary` | Equipment | Footwear tracking |
| `staff` | `--cv-text-secondary`, `--cv-text` | Equipment | Magic / Reach (Inventory/Weapons) |
| `torch` | `--cv-text-secondary`, `--cv-warning` | Equipment | Light Source tracking |
| `wand` | `--cv-text-secondary`, `--cv-text` | Equipment | Magic (Inventory/Weapons) |
| `rocket` | `--cv-text-secondary` | Sci-Fi | Propulsion / Space tracking |
| `laser` | `--cv-text-secondary`, `--cv-accent` | Sci-Fi | Energy Weapon (Inventory/Weapons) |
| `radiation` | `--cv-text-secondary`, `--cv-warning` | Sci-Fi | Hazard tracking |
| `circuit` | `--cv-text-secondary` | Sci-Fi | Technology tracking |
| `energy` | `--cv-text-secondary`, `--cv-accent` | Sci-Fi | Power / Battery tracking |
| `robot` | `--cv-text-secondary` | Sci-Fi | AI / Bot tracking |
| `wrench` | `--cv-text-secondary` | Sci-Fi | Repair / Engineering tracking |
| `acid` | `--cv-text-secondary` | Damage Types | Acid damage resistance |
| `bludgeoning` | `--cv-text-secondary` | Damage Types | Physical impact resistance |
| `cold` | `--cv-text-secondary`, `--cv-accent-secondary` | Damage Types | Cold damage resistance |
| `fire` | `--cv-text-secondary`, `--cv-danger` | Damage Types | Fire damage resistance |
| `force` | `--cv-text-secondary`, `--cv-accent` | Damage Types | Force damage resistance |
| `lightning` | `--cv-text-secondary`, `--cv-accent-secondary` | Damage Types | Electrical damage resistance |
| `necrotic` | `--cv-text-secondary`, `--cv-text-muted` | Damage Types | Decay / Undeath resistance |
| `piercing` | `--cv-text-secondary` | Damage Types | Physical point resistance |
| `poison` | `--cv-text-secondary`, `--cv-success` | Damage Types | Toxic damage resistance |
| `psychic` | `--cv-text-secondary`, `--cv-accent-secondary` | Damage Types | Mental damage resistance |
| `radiant` | `--cv-text-secondary`, `--cv-warning` | Damage Types | Holy / Light damage resistance |
| `slashing` | `--cv-text-secondary` | Damage Types | Physical edge resistance |
| `thunder` | `--cv-text-secondary`, `--cv-accent` | Damage Types | Sonic / Sound damage resistance |

---

## 2. Condition Icons (`scripts/module-condition.js`)
These icons are specific to the Conditions module and provide a wider variety of status effects.

| Icon Key | Colors | Description |
| :--- | :--- | :--- |
| `dazed` | `--cv-text` | Dazed / Confused |
| `stunned` | `--cv-text` | Stunned / Paralyzed |
| `prone` | `--cv-text` | Prone / Fallen |
| `blinded` | `--cv-text` | Blinded / Vision Obscured |
| `deafened` | `--cv-text` | Deafened / No Hearing |
| `frightened` | `--cv-text` | Frightened / Scared |
| `poisoned` | `--cv-text` | Poisoned Status |
| `charmed` | `--cv-text` | Charmed / Loved |
| `invisible` | `--cv-text` | Invisible / Hidden |
| `bleeding` | `--cv-text`, `--cv-danger` | Bleeding / Wounded |
| `burning` | `--cv-text`, `--cv-warning` | Burning / On Fire |
| `exhausted` | `--cv-text` | Exhausted / Tired |
| `restrained` | `--cv-text` | Restrained / Bound |
| `petrified` | `--cv-text` | Petrified / Stone |
| `dying` | `--cv-text`, `--cv-danger` | Dying / Unconscious |

---

## 3. Application UI Icons
These icons are used for buttons, menus, and general interface elements.

| Location | Icon Description | Colors | Usage |
| :--- | :--- | :--- | :--- |
| `main.html` | Settings Gear | `--cv-text-muted`, `--cv-text` | Settings button (Default/Hover) |
| `main.html` | Plus Sign | `--cv-text-muted`, `--cv-accent` | New Module button (Menu/Primary) |
| `main.html` | Edit Pen | `--cv-accent` | Edit Mode toggle (Active state) |
| `main.html` | Play Triangle | `--cv-accent` | Play Mode toggle (Active state) |
| `main.html` | GitHub Logo | `--cv-text-muted` | GitHub link in footer |
| `main.html" | Close X | `--cv-text-muted`, `--cv-danger` | Modal close / Cancel buttons |
| `module-core.js` | Kebab Menu | `--cv-text-muted` | Module overflow menu trigger |
| `module-core.js` | Drag Handle | `--cv-text-muted` | Draggable items/modules |
| `module-core.js` | Resize Handle | `--cv-text-muted` | Module resizing (Resizer) |
| `module-core.js` | Palette Icon | `--cv-text-muted` | Change Theme menu item |
| `module-activity.js`| Trash Can | `--cv-danger` | Delete icons / Destructive actions |
| `module-list.js` | Expand/Inspect | `--cv-text-muted` | Item inspect button |
| `shared.js` | Sort Up | `--cv-accent` | Column sorting (asc) |
| `shared.js` | Sort Down | `--cv-accent` | Column sorting (desc) |

---

## 4. Summary of ViewBox Specifications
To maintain visual consistency during your iconography pass:
- **Shared/Condition Icons**: `viewBox="0 0 24 24"`, `stroke-width="2"`, `fill="none"`.
- **UI Small Icons**: Generally `width="14" height="14"` or `width="18" height="18"`.
- **Theme Segments**: The play mode triangle uses a non-standard `viewBox="0 0 12 12"`.

> [!TIP]
> When sourcing replacements, aim for SVG sets with consistent stroke weights and corner rounding (e.g., Lucide, Feather, or Heroicons) to match the current aesthetic.
