# Localization Guide

Reference for adding and using translations in Character Vault.

---

## Supported Languages

| Language | Code | File section key |
|---|---|---|
| English | `en` | Always the source of truth |
| Spanish | `es` | |
| French | `fr` | |
| German | `de` | |
| Italian | `it` | |
| Portuguese (Brazil) | `pt-BR` | |
| Russian | `ru` | |

---

## Where Translations Live

All strings are in `scripts/translations.js`, inside the `CV_TRANSLATIONS` object:

```js
const CV_TRANSLATIONS = {
  en: {
    'stat.check': 'Check',
    'health.damage': 'Damage',
    // ...
  },
  es: {
    'stat.check': 'Tirada',
    'health.damage': 'Daño',
    // ...
  },
  // ... 5 more languages
};
```

Every key added to `en` **must** be added to all 7 language blocks. Missing keys fall back to English — but missing them is a bug.

---

## Adding a New String

1. Choose a namespaced key matching the module (e.g., `'weapons.attackRoll'`, `'spells.slotLevel'`).
2. Add it to **all 7 language blocks** in `translations.js`.
3. Use English text for languages you haven't translated yet — the `en` fallback will apply, but having the key present prevents missing-key returns in other locales.

```js
// In translations.js, add to EVERY language block:
'weapons.newFeature': 'New Feature',  // en
'weapons.newFeature': 'Nueva función', // es
'weapons.newFeature': 'Nouvelle fonctionnalité', // fr
// etc.
```

---

## Using Translations in Code

### Static HTML — `data-i18n` attributes

For elements whose text is set once at render time:

```html
<button data-i18n="stat.addStat"></button>
<input data-i18n-placeholder="stat.placeholder" />
<button data-i18n-title="stat.rollableOn"></button>
```

`applyTranslations()` scans the DOM for these attributes and fills them in. It runs on startup and on language change.

There is also `data-i18n-html` for elements where the translation value contains HTML (use sparingly):

```html
<span data-i18n="some.htmlKey" data-i18n-html></span>
```

### Dynamic JS — `t(key, replacements?)`

For strings built at runtime (inside `renderBody`, event handlers, etc.):

```js
titleEl.textContent = t('weapons.actionTitle');
btn.title = t('stat.rollableOn');
```

`t()` is available globally (defined in `scripts/i18n.js`, exposed on `window.t`).

### Fallback Behavior

```
t('some.key')
  → looks up CV_TRANSLATIONS[currentLang]['some.key']
  → if missing, falls back to CV_TRANSLATIONS['en']['some.key']
  → if still missing, returns the key string itself ('some.key')
```

The key-as-fallback is useful for debugging: visible raw keys in the UI = missing translation.

---

## Variable Replacements

`t()` supports named placeholders in `{curly braces}`:

```js
// In translations.js:
'health.tookDamage': 'Took {amount} {type} damage',

// In code:
t('health.tookDamage', { amount: 8, type: 'fire' })
// → 'Took 8 fire damage'
```

All occurrences of `{key}` in the string are replaced globally. Values are inserted as strings (no escaping — do not use `t()` output directly as innerHTML if values come from user input; use `escapeHtml()` separately).

---

## Pluralization

CV does not have a built-in pluralization system. Work around it with separate keys:

```js
// Two keys — one singular, one plural
'list.itemCount.one': '{n} item',
'list.itemCount.other': '{n} items',

// In code:
const key = count === 1 ? 'list.itemCount.one' : 'list.itemCount.other';
t(key, { n: count });
```

For simple cases, an inline ternary is acceptable:

```js
`${count} ${count === 1 ? t('list.item') : t('list.items')}`
```

---

## Language Switching

The user picks a language in the Settings overlay. It's stored in `localStorage` as `'cv-language'`.

On change:
1. `window.currentLang` is updated
2. `applyTranslations()` re-fills all `data-i18n` elements in the DOM
3. `refreshModuleLabels()` re-fills dynamic module labels (type labels, toolbar button titles, etc.)

Dynamically rendered content (module bodies) is **not** automatically re-rendered on language change. It re-renders on the next natural trigger (mode switch, data change, etc.). This is acceptable — full re-render on language switch is expensive and not required.

---

## Key Naming Conventions

| Pattern | Example | Use for |
|---|---|---|
| `module.action` | `'stat.check'` | Actions within a module |
| `module.label` | `'health.maxHP'` | Field labels |
| `module.verb` | `'spells.cast'` | Buttons and CTAs |
| `module.state` | `'stat.rollableOn'` | Toggle state labels |
| `common.word` | `'common.discardChanges'` | Shared strings across modules |
| `menu.word` | `'menu.edit'` | Top menu bar strings |
| `settings.word` | `'settings.theme'` | Settings overlay strings |
| `toast.event` | `'toast.saveSuccess'` | Toast notification messages |
| `delete.word` | `'delete.confirm'` | Delete confirmation dialog |
| `type.label` | `'type.stat'` | Module type display names |

---

## Common Shared Keys

These keys exist in all 7 languages — use them before creating new ones:

| Key | English value |
|---|---|
| `'common.discardChanges'` | `'Discard unsaved changes?'` |
| `'common.save'` | `'Save'` |
| `'common.cancel'` | `'Cancel'` |
| `'common.close'` | `'Close'` |
| `'common.delete'` | `'Delete'` |
| `'common.create'` | `'Create'` |
| `'common.edit'` | `'Edit'` |
| `'common.add'` | `'Add'` |
| `'delete.cancel'` | `'Cancel'` |
| `'delete.confirm'` | `'Delete'` |

---

## `refreshModuleLabels()` — When to Call

`refreshModuleLabels()` updates dynamic strings in already-rendered modules (type labels, tooltip titles, button text). It is called:
- On startup (`app.js`)
- On language change (language select handler in `settings.js`)

You do not need to call it after rendering a module — `renderModule()` calls `t()` directly during render, which picks up the current language. `refreshModuleLabels()` is only needed for strings that were already rendered in a previous language.
