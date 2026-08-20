# Bio Submodule

Character identity card with portrait, physical traits, biography, personality subsections, and system-gated flavor fields. Contains two internal sub-tabs (Overview / Details) within a single module card.

## Data Shape

```js
content: {
    activeTab: 'overview',    // 'overview' | 'details'
    portrait: null,           // base64 data URL string or null
    name: '', pronouns: '', race: '', alignment: '',
    age: '', height: '', weight: '', eyes: '', hair: '', skin: '',
    appearance: '', biography: '',   // biography supports markdown
    showPersonality: false,
    personalityTraits: '', ideals: '', bonds: '', flaws: '',
    deity: '', birthplace: '', nationality: '', ethnicity: '', alias: '',
    likesDislikes: '', alliesEnemies: '', organizations: '',
    backgroundName: '',   // dnd5e + pf2e
    heritage: '',         // pf2e
    edicts: '',           // pf2e
    anathemas: '',        // pf2e
    occupation: '',       // coc
    ideologyBeliefs: '',  // coc
    culturalOrigin: '',   // cpred
    community: '',        // daggerheart
    lifestyle: '',        // sr6
    clan: '', generation: '', sire: '', predatorType: '', ambition: '', desire: '', // vtm
}
```

All system-gated fields are always present (empty string) regardless of the active game system. This prevents data loss when players switch systems.

## Globals Exposed on `window`

| Name | Signature | Purpose |
|---|---|---|
| `buildBioDefaultContent()` | `() → object` | Returns the full default content shape (used by `module-core.js` on wizard create) |
| `getRaceLabel(gameSystem)` | `(string) → string` | Returns the i18n key for the race/species/ancestry/metatype label for the given system |
| `getSystemFields(gameSystem)` | `(string) → {name, fields} \| null` | Returns the system-gated field config for a game system, or null if not defined |
| `shouldShowBioField(value)` | `(any) → boolean` | Returns true if a field has displayable content (non-null, non-empty string) |

## Race Label Lookup

The "Race" field label changes by game system:

| System | Label key | Rendered as |
|---|---|---|
| `dnd5e` | `bio.species` | Species |
| `pf2e` | `bio.ancestry` | Ancestry |
| `daggerheart` | `bio.ancestry` | Ancestry |
| `sr6` | `bio.metatype` | Metatype |
| `coc`, `cpred`, `vtm`, `mothership`, `custom` | `bio.race` | Race |

## System-Gated Field Map

```js
const SYSTEM_FIELDS = {
    dnd5e:       { name: 'D&D 5th Edition',        fields: ['backgroundName'] },
    pf2e:        { name: 'Pathfinder 2e',           fields: ['backgroundName', 'heritage', 'edicts', 'anathemas'] },
    coc:         { name: 'Call of Cthulhu',         fields: ['occupation', 'ideologyBeliefs'] },
    cpred:       { name: 'Cyberpunk Red',           fields: ['culturalOrigin'] },
    daggerheart: { name: 'Daggerheart',             fields: ['community'] },
    sr6:         { name: 'Shadowrun 6e',            fields: ['lifestyle'] },
    vtm:         { name: 'Vampire: The Masquerade', fields: ['clan', 'generation', 'sire', 'predatorType', 'ambition', 'desire'] },
};
```

When `window.gameSystem === 'custom'`, all system groups are shown so users of unsupported systems can pick whichever fields apply.

## Portrait Storage

- Input: `<input type="file" accept=".png,.jpg,.jpeg,.webp">` (hidden, triggered via button click)
- Size cap: 1 MB (`file.size > 1048576` rejects with inline error)
- Storage: base64 data URL via `FileReader.readAsDataURL()` stored in `content.portrait`
- Serializes cleanly as a JSON string in the character save blob

## Sub-Tab Mechanism

The tab bar (`.bio-tab-bar`) sits inside the module body. `content.activeTab` stores `'overview'` or `'details'`. On tab click:
1. `syncBioInputs()` flushes current inputs into `content` before switching
2. `content.activeTab` updates
3. `.bio-tab-content` is re-rendered for the new tab in the current mode
4. `scheduleSave()` is called

The active sub-tab is tracked in `content.activeTab` and persisted across renders.

## Personality Collapse

The personality section uses a chevron-based collapsible header (`.bio-collapse-header`):
- Chevron points right (`→`) by default (collapsed)
- `.expanded` class rotates chevron 90° downward
- `content.showPersonality` stores the open/closed state
- Clicking toggles `showPersonality`, the class, and `grid`/`none` display on `.bio-personality-grid`

## Play Mode Empty-Field Hiding

In play mode, any field with an empty/null value is simply not rendered. Entire section dividers (Physical, Biography) are omitted if no fields in that section have content. Personality blocks only render if `showPersonality` is true AND at least one personality field is non-empty.

## Textarea Fields

The following fields use `<textarea>` in edit mode and `.bio-field-value.block` (white-space: pre-wrap) in play mode:

Overview: `appearance`, `biography`, `personalityTraits`, `ideals`, `bonds`, `flaws`
Details: `likesDislikes`, `alliesEnemies`, `organizations`, `edicts`, `anathemas`, `ideologyBeliefs`
