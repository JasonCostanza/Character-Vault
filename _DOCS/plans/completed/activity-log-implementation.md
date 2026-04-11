# Activity Log Module — Implementation Plan (Sonnet-Targeted)

> This plan is written for Claude Sonnet to execute. Instructions are prescriptive and atomic — follow them literally. Read `_DOCS/SUBMODULES/ACTIVITY_LOG.md` for design context, and `_DOCS/NEW_MODULE_GUIDE.md` for the canonical module creation checklist.

---

## IMPORTANT RULES — READ BEFORE STARTING

- **Do NOT** create utility functions, helper abstractions, or wrappers beyond what is specified here.
- **Do NOT** add JSDoc comments, docstrings, or type annotations.
- **Do NOT** add error handling beyond what is explicitly described (e.g., content shape guards).
- **Do NOT** hardcode hex color values in CSS — always use `--cv-*` tokens.
- **Do NOT** use `undefined` — use `null` for intentionally empty values.
- **Do NOT** call `saveCharacter()` directly — always use `scheduleSave()`.
- **Do NOT** skip any language block when adding i18n keys — all 7 languages must be updated.
- **Do NOT** create any files outside of `scripts/` for JS or outside the project root for CSS/HTML.
- **Prefix** all `console.log`/`console.warn`/`console.error` with `[CV]`.
- **All UI text** must use `user-select: none` except user content.
- **All scrollable containers** must include `scrollbar-gutter: stable` and themed scrollbar styles.
- After completing ALL steps, update `_DOCS/ARCHITECTURE.md` inline (see Step 8).

---

## What Makes This Module Unique

The Activity Log is different from every other module in two ways:

1. **Character-level data**: Log entries are stored at the **top level** of the save blob (alongside `version`, `modules`, etc.), NOT inside any module's `data.content`. Multiple Activity Log module instances share the same log. This requires changes to `persistence.js`.

2. **Global event API**: The module defines a global `logActivity()` function that other modules will call. No other module does this yet. However, we are NOT adding `logActivity()` calls to other modules in this task — only defining the function and the Activity Log module itself.

---

## Step 1 — Modify `persistence.js` (Character-Level Storage)

**File**: `scripts/persistence.js`

The activity log data must be serialized/deserialized at the character level. There is currently NO precedent for character-level data outside the `modules` array — you are adding the first one.

### 1a. Add `activityLog` to `serializeCharacter()`

Find this code (around line 23-41):

```js
function serializeCharacter() {
    syncModuleState();
    return JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        moduleIdCounter,
        modules: modules.map((m) => ({
```

Change it to include `activityLog`:

```js
function serializeCharacter() {
    syncModuleState();
    return JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        moduleIdCounter,
        activityLog: window.activityLog || [],
        modules: modules.map((m) => ({
```

### 1b. Add `activityLog` restoration to `deserializeCharacter()`

Find this code (around line 64):

```js
moduleIdCounter = blob.moduleIdCounter || 0;
```

Add this line immediately AFTER it:

```js
window.activityLog = Array.isArray(blob.activityLog) ? blob.activityLog : [];
```

### 1c. Initialize the global `activityLog` array

Find this line at the top of the IIFE (but still inside it, before `migrateData`):

```js
function migrateData(blob) {
```

Add this line BEFORE it:

```js
window.activityLog = [];
```

### 1d. Export nothing new

`activityLog` is already on `window` — no additional exports needed.

---

## Step 2 — Create `scripts/module-activity.js`

**Create a new file** at `scripts/module-activity.js`.

This module is read-only for the user — there are no edit inputs. Play mode and Edit mode render the same log view. The only difference is that Edit mode could show delete buttons on entries (to clean up the log).

### Content Shape

Each Activity Log module instance stores **per-instance view settings** in `data.content`:

```js
content: {
    sortOrder: 'newest',         // 'newest' or 'oldest'
    hiddenEventTypes: [],        // array of eventType strings the user has toggled OFF
    showTimestamps: true,        // whether timestamps are visible
    maxEntries: 200              // max log entries to keep
}
```

The actual log entries live in `window.activityLog` (character-level), NOT in `data.content`.

### Log Entry Shape (reference — stored in `window.activityLog`)

```js
{
    id: 'log_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
    eventType: 'damage_taken',
    sourceModuleId: 'module-005',
    message: 'Took 8 fire damage'
}
```

### Full File Content

```js
// ── Activity Log Module Type ──
(function () {
    'use strict';

    // ── ID Generation ──
    function generateLogEntryId() {
        return 'log_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    // ── Content Shape Guard ──
    function ensureContent(data) {
        if (!data.content || typeof data.content === 'string') {
            data.content = { sortOrder: 'newest', hiddenEventTypes: [], showTimestamps: true, maxEntries: 200 };
        }
        if (!Array.isArray(data.content.hiddenEventTypes)) data.content.hiddenEventTypes = [];
        if (data.content.sortOrder !== 'newest' && data.content.sortOrder !== 'oldest') data.content.sortOrder = 'newest';
        if (typeof data.content.showTimestamps !== 'boolean') data.content.showTimestamps = true;
        if (typeof data.content.maxEntries !== 'number') data.content.maxEntries = 200;
    }

    // ── Timestamp Formatting ──
    function formatTimestamp(epochMs) {
        const d = new Date(epochMs);
        const date = d.toLocaleDateString();
        const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return date + ' \u2013 ' + time;
    }

    // ── Confirmation Dialog ──
    // Reuses the same pattern as module-counters.js showConfirm()
    function showConfirm(options, onConfirm) {
        const message = typeof options === 'string' ? options : options.message;
        const titleText = options.title || t('activity.clearAll');

        const overlay = document.createElement('div');
        overlay.className = 'delete-confirm-overlay';
        overlay.setAttribute('aria-hidden', 'true');

        const panel = document.createElement('div');
        panel.className = 'delete-confirm-panel';

        const title = document.createElement('div');
        title.className = 'delete-confirm-title';
        title.style.userSelect = 'none';
        title.textContent = titleText;

        const msg = document.createElement('div');
        msg.className = 'delete-confirm-msg';
        msg.style.userSelect = 'none';
        msg.textContent = message;

        const actions = document.createElement('div');
        actions.className = 'delete-confirm-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'delete-confirm-cancel btn-secondary';
        cancelBtn.textContent = options.cancelText || t('delete.cancel');

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'delete-confirm-delete';
        confirmBtn.textContent = options.confirmText || t('delete.confirm');

        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);
        panel.appendChild(title);
        panel.appendChild(msg);
        panel.appendChild(actions);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function close() {
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
            setTimeout(function () { overlay.remove(); }, 200);
        }

        cancelBtn.addEventListener('click', close);
        confirmBtn.addEventListener('click', function () { onConfirm(); close(); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

        requestAnimationFrame(function () {
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
        });
    }

    // ── Render Helpers ──

    function getVisibleEntries(content) {
        const log = window.activityLog || [];
        const hidden = new Set(content.hiddenEventTypes);
        let filtered = log.filter(function (entry) { return !hidden.has(entry.eventType); });

        if (content.sortOrder === 'newest') {
            filtered.sort(function (a, b) { return b.timestamp - a.timestamp; });
        } else {
            filtered.sort(function (a, b) { return a.timestamp - b.timestamp; });
        }

        return filtered;
    }

    function getUniqueEventTypes() {
        const log = window.activityLog || [];
        const types = new Set();
        log.forEach(function (entry) { types.add(entry.eventType); });
        return Array.from(types).sort();
    }

    function renderTagBar(container, content, onTagToggle) {
        container.innerHTML = '';
        const types = getUniqueEventTypes();
        if (types.length === 0) return;

        const hidden = new Set(content.hiddenEventTypes);

        types.forEach(function (eventType) {
            const tag = document.createElement('button');
            tag.className = 'activity-tag' + (hidden.has(eventType) ? '' : ' active');
            tag.textContent = t(eventType) !== eventType ? t(eventType) : eventType;
            tag.style.userSelect = 'none';
            tag.addEventListener('click', function () {
                onTagToggle(eventType);
            });
            container.appendChild(tag);
        });
    }

    function renderEntries(container, content, isPlayMode, data, bodyEl) {
        container.innerHTML = '';
        const entries = getVisibleEntries(content);

        if (entries.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'activity-empty-state';
            empty.style.userSelect = 'none';
            empty.textContent = t('activity.emptyState');
            container.appendChild(empty);
            return;
        }

        entries.forEach(function (entry) {
            const row = document.createElement('div');
            row.className = 'activity-entry';

            if (content.showTimestamps) {
                const ts = document.createElement('span');
                ts.className = 'activity-entry-timestamp';
                ts.style.userSelect = 'none';
                ts.textContent = formatTimestamp(entry.timestamp);
                row.appendChild(ts);
            }

            const msg = document.createElement('span');
            msg.className = 'activity-entry-message';
            msg.textContent = entry.message;
            row.appendChild(msg);

            if (!isPlayMode) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'activity-entry-delete';
                deleteBtn.title = t('activity.deleteEntry');
                deleteBtn.innerHTML =
                    '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
                    '</svg>';
                deleteBtn.addEventListener('click', function () {
                    const idx = window.activityLog.findIndex(function (e) { return e.id === entry.id; });
                    if (idx !== -1) {
                        window.activityLog.splice(idx, 1);
                        scheduleSave();
                        renderActivityLogBody(bodyEl, data, isPlayMode);
                    }
                });
                row.appendChild(deleteBtn);
            }

            container.appendChild(row);
        });
    }

    function renderActivityLogBody(bodyEl, data, isPlayMode) {
        ensureContent(data);
        const content = data.content;

        bodyEl.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'activity-container';

        // Tag bar
        const tagBar = document.createElement('div');
        tagBar.className = 'activity-tag-bar';

        renderTagBar(tagBar, content, function (eventType) {
            const idx = content.hiddenEventTypes.indexOf(eventType);
            if (idx !== -1) {
                content.hiddenEventTypes.splice(idx, 1);
            } else {
                content.hiddenEventTypes.push(eventType);
            }
            scheduleSave();
            renderActivityLogBody(bodyEl, data, isPlayMode);
        });

        wrapper.appendChild(tagBar);

        // Entry list
        const entryList = document.createElement('div');
        entryList.className = 'activity-entry-list';

        renderEntries(entryList, content, isPlayMode, data, bodyEl);

        wrapper.appendChild(entryList);
        bodyEl.appendChild(wrapper);
    }

    // ── Global logActivity() API ──
    window.logActivity = function (opts) {
        if (!opts || !opts.type || !opts.message) {
            console.warn('[CV] logActivity() called with invalid arguments:', opts);
            return;
        }

        const entry = {
            id: generateLogEntryId(),
            timestamp: Date.now(),
            eventType: opts.type,
            sourceModuleId: opts.sourceModuleId || null,
            message: opts.message,
        };

        window.activityLog.push(entry);

        // Enforce max entries across all Activity Log module instances (use smallest maxEntries)
        const activityModules = window.modules.filter(function (m) { return m.type === 'activity'; });
        let maxEntries = 200;
        activityModules.forEach(function (m) {
            if (m.content && typeof m.content.maxEntries === 'number' && m.content.maxEntries < maxEntries) {
                maxEntries = m.content.maxEntries;
            }
        });

        while (window.activityLog.length > maxEntries) {
            // Remove oldest entry
            let oldestIdx = 0;
            for (let i = 1; i < window.activityLog.length; i++) {
                if (window.activityLog[i].timestamp < window.activityLog[oldestIdx].timestamp) {
                    oldestIdx = i;
                }
            }
            window.activityLog.splice(oldestIdx, 1);
        }

        scheduleSave();

        // Re-render all Activity Log modules
        document.querySelectorAll('.module[data-type="activity"]').forEach(function (el) {
            const modData = window.modules.find(function (m) { return m.id === el.dataset.id; });
            if (modData) {
                const bodyEl = el.querySelector('.module-body');
                const isPlay = window.isPlayMode;
                renderActivityLogBody(bodyEl, modData, isPlay);
            }
        });

        console.log('[CV] Activity logged:', entry.eventType);
    };

    // ── Module Settings ──
    function openActivitySettings(moduleEl, data) {
        ensureContent(data);
        const existing = document.querySelector('.activity-settings-overlay');
        if (existing) existing.remove();

        const working = {
            sortOrder: data.content.sortOrder,
            showTimestamps: data.content.showTimestamps,
            maxEntries: data.content.maxEntries,
        };
        let dirty = false;

        const overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay activity-settings-overlay';

        const panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        // Header
        const header = document.createElement('div');
        header.className = 'cv-modal-header';
        const titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = t('activity.settingsTitle');
        const closeBtnEl = document.createElement('button');
        closeBtnEl.className = 'cv-modal-close';
        closeBtnEl.title = t('activity.close');
        closeBtnEl.innerHTML =
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        header.appendChild(titleEl);
        header.appendChild(closeBtnEl);

        // Body
        const body = document.createElement('div');
        body.className = 'cv-modal-body';

        // Sort order
        const sortLabel = document.createElement('label');
        sortLabel.className = 'cv-modal-label';
        sortLabel.style.userSelect = 'none';
        sortLabel.textContent = t('activity.sortOrder');
        body.appendChild(sortLabel);

        const sortSelect = document.createElement('select');
        sortSelect.className = 'cv-select';
        [
            { value: 'newest', label: t('activity.sortNewest') },
            { value: 'oldest', label: t('activity.sortOldest') },
        ].forEach(function (opt) {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === working.sortOrder) option.selected = true;
            sortSelect.appendChild(option);
        });
        sortSelect.addEventListener('change', function () { working.sortOrder = sortSelect.value; dirty = true; });
        body.appendChild(sortSelect);

        // Show timestamps toggle
        const tsLabel = document.createElement('label');
        tsLabel.className = 'cv-modal-label cv-modal-checkbox-label';
        tsLabel.style.userSelect = 'none';
        const tsCheckbox = document.createElement('input');
        tsCheckbox.type = 'checkbox';
        tsCheckbox.checked = working.showTimestamps;
        tsCheckbox.addEventListener('change', function () { working.showTimestamps = tsCheckbox.checked; dirty = true; });
        tsLabel.appendChild(tsCheckbox);
        tsLabel.appendChild(document.createTextNode('\u00a0' + t('activity.showTimestamps')));
        body.appendChild(tsLabel);

        // Max entries
        const maxLabel = document.createElement('label');
        maxLabel.className = 'cv-modal-label';
        maxLabel.style.userSelect = 'none';
        maxLabel.textContent = t('activity.maxEntries');
        body.appendChild(maxLabel);

        const maxSelect = document.createElement('select');
        maxSelect.className = 'cv-select';
        [50, 100, 200, 500, 1000].forEach(function (val) {
            const option = document.createElement('option');
            option.value = val;
            option.textContent = String(val);
            if (val === working.maxEntries) option.selected = true;
            maxSelect.appendChild(option);
        });
        maxSelect.addEventListener('change', function () { working.maxEntries = parseInt(maxSelect.value, 10); dirty = true; });
        body.appendChild(maxSelect);

        // Clear all button
        const clearBtn = document.createElement('button');
        clearBtn.className = 'btn-danger activity-clear-all-btn';
        clearBtn.style.marginTop = '16px';
        clearBtn.textContent = t('activity.clearAll');
        clearBtn.addEventListener('click', function () {
            showConfirm(
                { title: t('activity.clearAll'), message: t('activity.clearAllConfirm') },
                function () {
                    window.activityLog.length = 0;
                    scheduleSave();
                    // Re-render all activity modules
                    document.querySelectorAll('.module[data-type="activity"]').forEach(function (el) {
                        const modData = window.modules.find(function (m) { return m.id === el.dataset.id; });
                        if (modData) {
                            const bEl = el.querySelector('.module-body');
                            renderActivityLogBody(bEl, modData, window.isPlayMode);
                        }
                    });
                }
            );
        });
        body.appendChild(clearBtn);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'cv-modal-footer';
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = t('activity.cancel');
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-primary sm';
        saveBtn.textContent = t('activity.save');
        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function close() {
            overlay.remove();
            document.removeEventListener('keydown', onKeydown);
        }

        function save() {
            data.content.sortOrder = working.sortOrder;
            data.content.showTimestamps = working.showTimestamps;
            data.content.maxEntries = working.maxEntries;
            scheduleSave();
            const bEl = moduleEl.querySelector('.module-body');
            renderActivityLogBody(bEl, data, window.isPlayMode);
            close();
        }

        closeBtnEl.addEventListener('click', close);
        cancelBtn.addEventListener('click', close);
        saveBtn.addEventListener('click', save);
        overlay.addEventListener('click', function (e) {
            if (e.target !== overlay) return;
            if (dirty && !window.confirm(t('common.discardChanges'))) return;
            close();
        });

        function onKeydown(e) {
            if (e.key === 'Escape') {
                e.stopPropagation();
                if (dirty && !window.confirm(t('common.discardChanges'))) return;
                close();
            }
        }
        document.addEventListener('keydown', onKeydown);
    }

    // ── Expose settings opener for toolbar button ──
    window.openActivitySettings = openActivitySettings;

    // ── Register Module Type ──
    registerModuleType('activity', {
        label: 'type.activity',

        renderBody: renderActivityLogBody,

        onPlayMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            renderActivityLogBody(bodyEl, data, true);
        },

        onEditMode(moduleEl, data) {
            const bodyEl = moduleEl.querySelector('.module-body');
            renderActivityLogBody(bodyEl, data, false);
        },
    });
})();
```

---

## Step 3 — Add Translations to `translations.js`

**File**: `scripts/translations.js`

Add the following keys to **all 7 language blocks**. For non-English blocks, keep the English text as a placeholder (the user or a translator will fill in real translations later — do NOT machine-translate).

### Keys to Add

Insert `'type.activity': 'Activity Log'` into the type labels group (alphabetically — it goes BEFORE `'type.abilities'`). Wait — "Activity Log" comes AFTER "Abilities" alphabetically. So insert it BETWEEN `'type.abilities'` and the next type.

Actually: alphabetically by display name value, "Abilities" < "Activity Log" < "Conditions" < "Counters". So `'type.activity'` goes immediately AFTER `'type.abilities'`.

Then add a new Activity Log section for module-specific keys. Insert it near the other module-specific key groups.

### English Block (`en`) — Add These Keys

```js
// In the type labels group, after 'type.abilities':
'type.activity': 'Activity Log',

// Activity Log submodule (add as a new section near other module sections):
'activity.emptyState': 'No activity recorded yet',
'activity.deleteEntry': 'Delete entry',
'activity.clearAll': 'Clear All',
'activity.clearAllConfirm': 'Delete all activity log entries? This cannot be undone.',
'activity.settingsTitle': 'Activity Log Settings',
'activity.sortOrder': 'Sort Order',
'activity.sortNewest': 'Newest First',
'activity.sortOldest': 'Oldest First',
'activity.showTimestamps': 'Show timestamps',
'activity.maxEntries': 'Maximum Entries',
'activity.close': 'Close',
'activity.cancel': 'Cancel',
'activity.save': 'Save',
'activity.settings': 'Settings',
```

### Non-English Blocks (es, fr, de, it, pt-BR, ru)

Add the same keys with the same English values as placeholders. Example for `es`:

```js
'type.activity': 'Activity Log',
'activity.emptyState': 'No activity recorded yet',
// ... same keys, same English values
```

---

## Step 4 — Add Wizard Type Card to `main.html`

**File**: `main.html`

### 4a. Wizard Card

Insert this card into `.wizard-type-grid` AFTER the Abilities card (line 149) and BEFORE the Counters card (line 150). "Activity Log" sorts alphabetically after "Abilities" and before "Counters".

```html
                        <div class="wizard-type-card" data-type="activity">
                            <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                            <span class="wizard-type-name" data-i18n="type.activity">Activity Log</span>
                        </div>
```

The SVG is a document/log icon (same as the text module icon — a page with lines). If you want a different icon, use basic shapes. Do NOT use `mask-image`.

### 4b. Script Tag

Add this line in the scripts section of `main.html`. Insert it AFTER `module-core.js` (line 337) and BEFORE `app.js` (line 351). Place it alongside the other module scripts — alphabetically it goes first among the module-* scripts, right after module-core.js:

```html
    <script src="scripts/module-activity.js"></script>
```

Insert it at line 338, pushing the existing `module-condition.js` line down.

---

## Step 5 — Update `module-core.js`

**File**: `scripts/module-core.js`

### 5a. Creation Defaults

In the `btnWizardCreate` click handler (around line 320-477), add a new block for the `activity` type. Insert it BEFORE the `abilities` block (around line 332) since 'activity' comes before 'abilities' alphabetically by type key... Actually, the existing blocks are NOT in alphabetical order — they're in whatever order they were added. Just add it at the end of the if-chain, BEFORE `lastWizardType = moduleData.type;` (line 470):

```js
        if (moduleData.type === 'activity') {
            moduleData.colSpan = 2;
            moduleData.rowSpan = 3;
            moduleData.content = { sortOrder: 'newest', hiddenEventTypes: [], showTimestamps: true, maxEntries: 200 };
        }
```

### 5b. Settings Button in `renderModule()`

Find the `renderModule()` function (starts around line 827). Inside the header `el.innerHTML` template string, find the section where type-specific toolbar buttons are conditionally rendered. Look for a pattern like:

```js
${data.type === 'health' ? `<button class="module-health-maxmod-btn"...` : ''}
```

Add this nearby (the exact position among the conditional buttons doesn't matter, but put it near the other settings-type buttons):

```js
${data.type === 'activity' ? `<button class="module-activity-settings-btn module-toolbar-btn" title="${t('activity.settings')}" style="${isPlayMode ? 'display:none' : ''}"><svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>` : ''}
```

### 5c. Settings Button Event Handler

After the existing button handler blocks in `renderModule()` (look for patterns like `const addAbilityBtn = el.querySelector(...)` etc.), add:

```js
    const activitySettingsBtn = el.querySelector('.module-activity-settings-btn');
    if (activitySettingsBtn) {
        activitySettingsBtn.addEventListener('click', () => {
            if (typeof openActivitySettings === 'function') openActivitySettings(el, data);
        });
    }
```

### 5d. Overflow Menu Entry

Find the `openOverflowMenu()` function and its `btnDefs` array. Add this entry for the activity settings button:

```js
{ sel: '.module-activity-settings-btn', label: t('activity.settings'), icon: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
```

### 5e. Mode Switching — Hide/Show Settings Button

In `applyPlayMode()`, find the section where type-specific buttons are hidden. Add:

```js
const activitySettingsBtn = mod.querySelector('.module-activity-settings-btn');
if (activitySettingsBtn) activitySettingsBtn.style.display = 'none';
```

In `applyEditMode()`, find the corresponding show section. Add:

```js
const activitySettingsBtn = mod.querySelector('.module-activity-settings-btn');
if (activitySettingsBtn) activitySettingsBtn.style.display = '';
```

---

## Step 6 — Add CSS to `main.css`

**File**: `main.css`

Add a new section. Alphabetically, "Activity Log Module" goes AFTER the "Abilities Module" section and BEFORE the "Condition Module" section. Find the end of the Abilities section and insert before Condition.

```css
/* ── Activity Log Module ── */
.activity-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px 0;
}

.activity-tag-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 4px 8px;
}

.activity-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--cv-border-subtle);
    color: var(--cv-text-secondary);
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
    user-select: none;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.activity-tag:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--cv-border);
}

.activity-tag.active {
    background: rgba(192, 135, 74, 0.2);
    border-color: rgba(192, 135, 74, 0.4);
    color: var(--cv-accent);
}

.activity-tag.active:hover {
    background: rgba(192, 135, 74, 0.3);
    border-color: rgba(192, 135, 74, 0.6);
}

.activity-entry-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0 4px;
    overflow-y: auto;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: var(--cv-text-muted) transparent;
}

.activity-entry-list::-webkit-scrollbar {
    width: 4px;
}

.activity-entry-list::-webkit-scrollbar-track {
    background: transparent;
}

.activity-entry-list::-webkit-scrollbar-thumb {
    background: var(--cv-text-muted);
    border-radius: 2px;
}

.activity-entry {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
    line-height: 1.4;
}

.activity-entry:hover {
    background: var(--cv-surface-hover, rgba(255, 255, 255, 0.04));
}

.activity-entry-timestamp {
    flex-shrink: 0;
    font-size: 10px;
    color: var(--cv-text-muted);
    white-space: nowrap;
    user-select: none;
}

.activity-entry-message {
    flex: 1;
    color: var(--cv-text);
    user-select: text;
    word-break: break-word;
}

.activity-entry-delete {
    flex-shrink: 0;
    background: none;
    border: none;
    color: var(--cv-text-secondary);
    cursor: pointer;
    padding: 2px;
    border-radius: 3px;
    opacity: 0;
    transition: color 0.15s ease, background 0.15s ease, opacity 0.15s ease;
}

.activity-entry:hover .activity-entry-delete {
    opacity: 1;
}

.activity-entry-delete:hover {
    color: var(--cv-danger);
    background: rgba(255, 255, 255, 0.06);
}

.activity-empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px 8px;
    color: var(--cv-text-secondary);
    font-size: 11px;
    font-style: italic;
    user-select: none;
}

.activity-clear-all-btn {
    width: 100%;
}

/* ── Activity Log: Responsive ── */
.module[data-size="xs"] .module-activity-settings-btn {
    display: none !important;
}

.module[data-size="sm"] .module-activity-settings-btn {
    display: none !important;
}

.module[data-size="xs"] .activity-entry-timestamp {
    display: none;
}

.module[data-size="xs"] .activity-tag {
    font-size: 9px;
    padding: 1px 6px;
}
```

---

## Step 7 — Verify `btn-danger` CSS Exists

The "Clear All" button uses class `btn-danger`. Search `main.css` for `.btn-danger`. If it does NOT exist, add it near the other button base styles:

```css
.btn-danger {
    background: rgba(184, 64, 64, 0.15);
    border: 1px solid var(--cv-danger);
    color: var(--cv-danger);
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
}

.btn-danger:hover {
    background: rgba(184, 64, 64, 0.3);
    color: #e05050;
}
```

If it already exists, skip this step.

---

## Step 8 — Update `_DOCS/ARCHITECTURE.md`

Update these sections:

1. **Files at a Glance** — Add: `module-activity.js | Activity Log submodule — event log with tag filtering, character-level shared data`
2. **Script Load Order** — Add `module-activity.js` in its position (after module-core.js)
3. **Key Functions / Globals** — Add: `logActivity(opts)` — global function for modules to log events; `openActivitySettings(moduleEl, data)` — settings modal opener; `window.activityLog` — character-level array of log entries
4. **MODULE_TYPES registered types** — Add `'activity'` to the list
5. **Key Data Structures** — Add the Activity Log entry schema and the module content shape

---

## Step 9 — Verification

After all code changes, test in this order:

1. Open Character Vault in TaleSpire (or VS Code preview with TS API guard awareness)
2. Open the New Module wizard — verify "Activity Log" card appears between "Abilities" and "Counters"
3. Create an Activity Log module — verify it renders with empty state message
4. Open browser console, run: `logActivity({ type: 'test_event', message: 'Test log entry', sourceModuleId: null })`
5. Verify the entry appears in the Activity Log module
6. Run the command again with a different type — verify a second tag bubble appears
7. Click a tag bubble to toggle it OFF — verify entries of that type are hidden
8. Click again to toggle it ON — verify entries reappear
9. Switch to Play mode — verify delete buttons disappear, log is still readable
10. Switch to Edit mode — hover an entry, verify delete button appears, click it, verify entry is removed
11. Open settings — change sort order, toggle timestamps, save — verify changes apply
12. Open settings — click Clear All — verify confirmation prompt, confirm, verify log is empty
13. Create a second Activity Log module — verify it shows the same log data
14. Save and reload — verify log entries persist

---

## Files Modified (Summary)

| File | Change |
|---|---|
| `scripts/persistence.js` | Add `activityLog` to serialize/deserialize, init global |
| `scripts/module-activity.js` | **NEW FILE** — module type registration, logActivity API, settings modal |
| `scripts/translations.js` | Add `type.activity` + `activity.*` keys in all 7 languages |
| `main.html` | Add wizard card + script tag |
| `scripts/module-core.js` | Creation defaults, settings button in header, event handler, overflow menu, mode switching |
| `main.css` | Activity Log section (container, tags, entries, empty state, responsive) |
| `_DOCS/ARCHITECTURE.md` | Update files table, script order, globals, types list, data structures |
