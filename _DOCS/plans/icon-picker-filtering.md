# Icon Picker Category Filtering

## Context
As of the icon centralization work, all module icons live in a single `CV_ICONS` object in `shared.js` (~68 icons). Each module still defines its own picker arrays that reference keys from `CV_ICONS`. This plan covers adding per-module category filtering so each module's icon picker shows only relevant icons.

## Current State
- `CV_ICONS` in `shared.js` — unified icon library with categories: Generic, Time, Combat, Resources, Miscellaneous, Equipment, Sci-Fi, Damage Types
- `COUNTER_ICON_CATEGORIES` in `module-counters.js` — 6 category groups for the counter icon picker
- `ATTR_WIZARD_ICONS` in `module-list.js` — flat alphabetical list for the attribute icon picker
- Resistance custom type creation uses the damage type icons from `PREDEFINED_RESISTANCE_TYPES`

## Proposed Changes
1. Create a shared `CV_ICON_CATEGORIES` metadata array in `shared.js` alongside `CV_ICONS`, defining all categories and their icon keys
2. Each module's picker can filter `CV_ICON_CATEGORIES` to show only relevant categories (e.g., counters show all categories, resistances show only Damage Types + Generic)
3. Build a shared icon picker component function that accepts a category filter and renders the categorized grid
4. Update each module's wizard/modal to use the shared picker

## Benefits
- New icons added to `CV_ICONS` automatically appear in pickers (if their category is included)
- Consistent picker UI across all modules
- Reduced per-module code for icon selection
