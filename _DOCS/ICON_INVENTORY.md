# Character Vault SVG Icon Inventory

This document catalogs all SVG icons used in the Character Vault project. Icons are organized by their source and intended usage.

## 1. Centralized Shared Icons (`scripts/shared.js`)
These icons are part of the `CV_ICONS` object and are used across multiple modules (Counters, Lists, Resistances, etc.). They all use `viewBox="0 0 24 24"`.

| Icon Key | Preview (Snippet) | Category | Description |
| :--- | :--- | :--- | :--- |
| `star` | `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"/>` | Generic | Five-pointed star |
| `circle` | `<circle cx="12" cy="12" r="10"/>` | Generic | Simple circle |
| `square` | `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>` | Generic | Rounded square |
| `triangle` | `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>` | Generic | Warning triangle style |
| `diamond` | `<path d="M2.7 10.3l7.6 7.6c.8.8 2 .8 2.8 0l7.6-7.6c.8-.8.8-2 0-2.8l-7.6-7.6c-.8-.8-2-.8-2.8 0l-7.6 7.6c-.8.8-.8 2 0 2.8z"/>` | Generic | Diamond shape |
| `hourglass` | `<path d="M5 2h14M5 22h14M15 2l-6 10 6 10M9 2l6 10-6 10"/>` | Time | Hourglass / Duration |
| `clock` | `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>` | Time | Analog clock |
| `stopwatch` | `<circle cx="12" cy="12" r="10"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>` | Time | Stopwatch |
| `bell` | `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>` | Time | Notification bell |
| `timer` | `<path d="M10 2h4M12 14l3-3M3.34 19l1.59-1.59M19.07 4.93L17.48 6.52M9 21h6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>` | Time | Digital timer / watch |
| `sword` | `<path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6 6M16 16l3 3M19 13l6 6"/>` | Combat | Weapon / Attack |
| `shield` | `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>` | Combat | Defense / Armor |
| `flame` | `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>` | Combat | Fire / Energy |
| `bolt` | `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>` | Combat | Lightning / Speed |
| `target` | `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>` | Combat | Accuracy / Aim |
| `coin` | `<circle cx="12" cy="12" r="8"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>` | Resources | Currency / Wealth |
| `gem` | `<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M11 3L8 9l4 12 4-12-3-6"/>` | Resources | Treasure / Gems |
| `potion` | `<path d="M4.5 14l3.5-3.5M10.5 8l3.5-3.5M14 4.5l3.5 3.5"/><path d="M6.5 12l5.5 5.5c.8.8 2 .8 2.8 0l2.5-2.5c.8-.8.8-2 0-2.8L12 6.5"/>` | Resources | Magic / Health potion |
| `apple` | `<path d="M12 2c3.08 0 5.62 2.25 6 5.23a4 4 0 0 1-1 7.75c-1.33.66-2.67 1.02-4 1.02s-2.67-.36-4-1.02a4 4 0 0 1-1-7.75C8.38 4.25 10.92 2 12 2z"/><path d="M12 2v4"/>` | Resources | Food / Healing |
| `water` | `<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>` | Resources | Hydration / Mana |
| `scroll` | `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>` | Miscellaneous | Document / Spell |
| `skull` | `<path d="M12 2a8 8 0 0 0-8 8c0 3.18 1.46 5.27 3.42 6.5C7.57 17.22 8 18.26 8 19v2h8v-2c0-.74.43-1.78.58-2.5 1.96-1.23 3.42-3.32 3.42-6.5a8 8 0 0 0-8-8z"/><path d="M9 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM15 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/><path d="M12 16c-1 0-1.5.5-1.5 1s.5 1 1.5 1 1.5-.5 1.5-1-.5-1-1.5-1z"/>` | Miscellaneous | Death / Danger |
| `skull-crossbones` | `<path d="M9 2a5 5 0 0 0-5 5c0 2.3 1.2 3.8 2.7 4.7C6.8 12.3 7 13.1 7 14v1h4v-1c0-.9.2-1.7.3-2.3C12.8 10.8 14 9.3 14 7a5 5 0 0 0-5-5z"/><path d="M7 6a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1zM11 6a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1z"/><path d="M1 21l3-3m0 3l-3-3m17 3l3-3m0 3l-3-3"/>` | Miscellaneous | Lethal Danger |
| `eye` | `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>` | Miscellaneous | Perception / Vision |
| `hand` | `<path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>` | Miscellaneous | Interaction / Touch |
| `armour` | `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4M8 12h8"/>` | Equipment | Armor / Protection |
| `axe` | `<path d="M14 12l6 6M15 13l-3-3 4-4 3 3-4 4z"/><path d="M15 13l-3-3-4 4L4 10l8-8 4 4-4 4z"/>` | Equipment | Melee Weapon |
| `boots` | `<path d="M4 16v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/><path d="M4 12V4l4-2 4 2v8l-4 2-4-2z"/><path d="M12 12V4l4-2 4 2v8l-4 2-4-2z"/>` | Equipment | Footwear |
| `bottle` | `<path d="M8 22V7c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v15"/><path d="M9 5V2h6v3M12 11v4"/>` | Equipment | Container |
| `bow` | `<path d="M8 3l13 9-13 9"/><path d="M8 3A14 14 0 0 1 8 21M3 12h18"/>` | Equipment | Ranged Weapon |
| `bread` | `<path d="M7 13c-2 0-4-1-4-3s2-3 4-3 4 1 4 3-2 3-4 3z"/><path d="M17 13c-2 0-4-1-4-3s2-3 4-3 4 1 4 3-2 3-4 3z"/><path d="M7 13h10v3H7z"/>` | Equipment | Sustenance |
| `dagger` | `<path d="M18.5 5.5l3 3M11 13l7.5-7.5M10 11l3 3"/><path d="M11 13L4 21l-1-1 8-7"/>` | Equipment | Small Melee Weapon |
| `flash` | `<path d="M18 8a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8z"/><path d="M10 2h4v4h-4z"/><circle cx="12" cy="12" r="2"/>` | Equipment | Light Source |
| `gloves` | `<path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M6 18c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V11"/>` | Equipment | Handwear |
| `gun` | `<path d="M5 10h11a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H5V10z"/><path d="M5 15v4a2 2 0 0 0 2 2h2v-6"/><path d="M12 10V7a2 2 0 0 0-2-2H5"/>` | Equipment | Ranged Weapon |
| `hash` | `<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>` | Equipment | Number / Quantity |
| `helmet` | `<path d="M12 2a10 10 0 0 0-10 10v2a10 10 0 0 0 20 0v-2A10 10 0 0 0 12 2z"/><path d="M12 12V2M2 12h20M12 22v-6"/>` | Equipment | Headwear |
| `key` | `<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zM12 13l3 3m0 0l4-4m-4 4l-4-4"/>` | Equipment | Access |
| `magnify` | `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>` | Equipment | Investigation |
| `pants` | `<path d="M6 2v18a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V10l2 2v8a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V2H6z"/>` | Equipment | Lower Body |
| `power` | `<path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>` | Equipment | Active / Toggle |
| `crosshair` | `<circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>` | Equipment | Targeting |
| `shirt` | `<path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a2 2 0 0 0 2 1.68H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10.84h1.14a2 2 0 0 0 2-1.68l.58-3.47a2 2 0 0 0-1.34-2.23z"/>` | Equipment | Upper Body |
| `shoes` | `<path d="M3 18h18a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z"/><path d="M4 18V9l4-2 4 2v9M12 18V9l4-2 4 2v9"/>` | Equipment | Footwear |
| `staff` | `<path d="M9 22l6-20M8 2l2 2M14 20l2 2"/>` | Equipment | Magic / Reach |
| `torch` | `<path d="M18 2l-4 4 4 4"/><path d="M6 22l8-8M10 10l-4 4"/>` | Equipment | Light Source |
| `wand` | `<path d="M15 2l6 6M10 7l7.5 7.5M9 11l3 3M4 16l8-8M3 21l8-8"/>` | Equipment | Magic |
| `rocket` | `<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.39 1.24-1.01 1.5-1.75l-2.75-2.75c-.74.26-1.36.79-1.75 1.5z"/><path d="M15 3s-5 1-8 6c-1.4 2.35-1 6-1 6s3.65.4 6-1c5-3 6-8 6-8z"/><path d="M9 12l3 3M10 10l2 2"/>` | Sci-Fi | Propulsion / Space |
| `laser` | `<path d="M3 12h18M3 11h18M3 13h18"/><path d="M2 12l2-2 2 2-2 2-2-2zM18 12l2-2 2 2-2 2-2-2z"/>` | Sci-Fi | Energy Weapon |
| `radiation` | `<circle cx="12" cy="12" r="2"/><path d="M12 7l5-5M12 17l-5 5M7 12l-5-5M17 12l5 5"/>` | Sci-Fi | Hazard |
| `circuit` | `<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10v10H7z"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>` | Sci-Fi | Technology |
| `energy` | `<path d="M12 2l-4 9h8l-4 9"/><circle cx="12" cy="12" r="10"/>` | Sci-Fi | Power / Battery |
| `robot` | `<rect x="7" y="10" width="10" height="8" rx="2"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/><circle cx="10" cy="14" r="1"/><circle cx="14" cy="14" r="1"/><path d="M12 2v2"/>` | Sci-Fi | Artificial Intelligence |
| `wrench` | `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z"/>` | Sci-Fi | Repair / Engineering |
| `acid` | `<path d="M7 16a5 5 0 0 0 10 0c0-3-5-10-5-10s-5 7-5 10z"/><path d="M12 11v4M10 13h4"/>` | Damage Types | Acid damage |
| `bludgeoning` | `<circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12M8.47 8.47l7.06 7.06M8.47 15.53l7.06-7.06"/>` | Damage Types | Physical / Impact |
| `cold` | `<path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/><circle cx="12" cy="12" r="3"/>` | Damage Types | Cold damage |
| `fire` | (Same as `flame`) | Damage Types | Fire damage |
| `force` | `<circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20M2 12a10 10 0 0 1 20 0"/>` | Damage Types | Force damage |
| `lightning` | (Same as `bolt`) | Damage Types | Electrical damage |
| `necrotic` | `<path d="M12 2a10 10 0 0 0-10 10c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6v6l4 2"/>` | Damage Types | Decay / Undeath |
| `piercing` | `<path d="M3 21l18-18M15 3h6v6M10 14l-7 7"/>` | Damage Types | Physical / Point |
| `poison` | `<path d="M12 2L3 7v6c0 5.25 3.75 9.5 9 11 5.25-1.5 9-5.75 9-11V7l-9-5z"/><circle cx="12" cy="12" r="2"/>` | Damage Types | Toxic damage |
| `psychic` | `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="4"/><path d="M12 15v3"/>` | Damage Types | Mental damage |
| `radiant` | `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41"/>` | Damage Types | Holy / Light damage |
| `slashing` | `<path d="M3 21l18-18M18 3H6L3 6v12l3 3h12l3-3V6l-3-3z"/>` | Damage Types | Physical / Edge |
| `thunder` | `<path d="M11 22h2M7 18h10M3 14h18M7 10h10M11 6h2"/>` | Damage Types | Sonic / Sound damage |

---

## 2. Condition Icons (`scripts/module-condition.js`)
These icons are specific to the Conditions module and provide a wider variety of status effects.

| Icon Key | Preview (Snippet) | Description |
| :--- | :--- | :--- |
| `dazed` | `<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM12 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM12 14v4"/>` | Dazed / Confused |
| `stunned` | `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>` | Stunned / Paralyzed |
| `prone` | `<path d="M2 20h20M3 15l4-4h10l4 4"/>` | Prone / Fallen |
| `blinded` | `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><line x1="1" y1="1" x2="23" y2="23"/>` | Blinded / Vision Obscured |
| `deafened` | `<path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>` | Deafened / No Hearing |
| `frightened` | `<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 15a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm1-4h-2V7h2z"/>` | Frightened / Scared |
| `poisoned` | `<path d="M12 2L3 7v6c0 5.25 3.75 9.5 9 11 5.25-1.5 9-5.75 9-11V7l-9-5z"/><circle cx="12" cy="12" r="2"/><path d="M10 10l4 4m0-4l-4 4"/>` | Poisoned Status |
| `charmed` | `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>` | Charmed / Loved |
| `invisible` | `<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4z" opacity="0.3"/>` | Invisible / Hidden |
| `bleeding` | `<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><path d="M12 12v4M10 14h4"/>` | Bleeding / Wounded |
| `burning` | `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>` | Burning / On Fire |
| `exhausted` | `<path d="M12 2v20M2 12h20M5.64 5.64l12.72 12.72M18.36 5.64L5.64 18.36"/>` | Exhausted / Tired |
| `restrained` | `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M7 7l10 10M17 7L7 10"/>` | Restrained / Bound |
| `petrified` | `<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M9 9h6v6H9z"/>` | Petrified / Stone |
| `dying` | `<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 7v5l3 3"/><path d="M8 21l8-8M16 21l-8-8"/>` | Dying / Unconscious |

---

## 3. Application UI Icons
These icons are used for buttons, menus, and general interface elements.

| Location | Icon Description | SVG Path | Usage |
| :--- | :--- | :--- | :--- |
| `main.html` | Settings Gear | `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 ..."/>` | Settings button |
| `main.html` | Plus Sign | `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>` | New Module button |
| `main.html` | Edit Pen | `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 ..."/>` | Edit Mode toggle |
| `main.html` | Play Triangle | `<polygon points="2,1 10,6 2,11" fill="currentColor"/>` | Play Mode toggle |
| `main.html` | GitHub Logo | `<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87..."/>` | GitHub link |
| `main.html" | Close X | `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>` | Modal close buttons |
| `module-core.js` | Kebab Menu | `<circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>` | Module overflow menu |
| `module-core.js` | Drag Handle | `&#x2807;` (Unicode Braille Pattern) | Draggable items/modules |
| `module-core.js` | Resize Handle | `<path d="M15 15l6 6M18 15l3 3M21 15l0 0"/>` | Module resizing (Resizer) |
| `module-core.js` | Palette Icon | `<path d="M18.37 2.63..."/><path d="M9 3.5a7.5..."/>` | Change Theme menu item |
| `module-activity.js`| Trash Can | `<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2..."/>` | Delete icons |
| `module-list.js` | Expand/Inspect | `<polyline points="15 3 21 3..."/><line x1="21" y1="3" x2="14" y2="10"/>` | Item inspect button |
| `shared.js` | Sort Up | `<path d="M7 11l5-5 5 5"/>` | Column sorting (asc) |
| `shared.js` | Sort Down | `<path d="M7 13l5 5 5-5"/>` | Column sorting (desc) |

---

## 4. Summary of ViewBox Specifications
To maintain visual consistency during your iconography pass:
- **Shared/Condition Icons**: `viewBox="0 0 24 24"`, `stroke-width="2"`, `fill="none"`.
- **UI Small Icons**: Generally `width="14" height="14"` or `width="18" height="18"`.
- **Theme Segments**: The play mode triangle uses a non-standard `viewBox="0 0 12 12"`.

> [!TIP]
> When sourcing replacements, aim for SVG sets with consistent stroke weights and corner rounding (e.g., Lucide, Feather, or Heroicons) to match the current aesthetic.
