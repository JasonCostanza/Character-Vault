# Export & Import Character Sheets

**Status:** Implemented — all 4 phases complete (`feature/export-import-poc` branch, merged to `main`).

## Feature Summary

Export and import allow users to back up character sheets, share them with others, or transfer data between devices or campaigns. All data is exchanged as a JSON string in the same format as the internal save blob.

**Important**: These operations directly affect character data. Importing overwrites or merges existing data in ways that cannot be undone. Confirmation dialogs are required before any destructive action.

---

## Platform Constraints (Vuplex WebView)

TaleSpire embeds symbiotes via **Vuplex WebView** (a Unity WebView plugin). All file-write APIs are blocked by security policy:

| API | Result |
|---|---|
| `<a download>` | Silent no-op — file never written |
| `showSaveFilePicker()` + `writable.write()` | Picker dialog opens; write throws `DOMException` |
| `<input type="file">` + `FileReader` | **Works** — native OS file picker, reads file content |

**Export therefore uses clipboard copy. Import uses a file picker.**

---

## Export

### Mechanism
1. Call `serializeCharacter()` to produce the JSON string
2. Copy to clipboard via `document.execCommand('copy')` (the same pattern used by the GitHub URL button in settings)
3. Show a toast: *"Character data copied to clipboard. Paste into a `.json` file to save it."*

### Scope
A full export includes everything in the save blob:
- `version`, `savedAt`, `moduleIdCounter`, `tabIdCounter`
- `gameSystem`
- `tabs[]`
- `activeTabId`
- `activityLog[]`
- `modules[]` (all tabs)

There is no per-tab or partial export. Users get the full character snapshot.

### File Naming
The user is responsible for naming the file when they paste and save it. The toast message should suggest a naming convention: `character-name-YYYY-MM-DD.json`. Since CV has no top-level character name field, we cannot auto-generate a filename.

### UI
- **Export button** in the Settings overlay, under a new "Export / Import" section
- Single click → copy + toast
- No confirmation required (export is non-destructive)

---

## Import

### Mechanism
1. A hidden `<input type="file" accept=".json">` is triggered by the Import button click
2. The selected file is read via `FileReader.readAsText()`
3. The JSON string is parsed and validated before any state is touched
4. If current character data exists, a conflict resolution dialog is shown
5. On user confirmation, the import is applied

### Validation
Before presenting any conflict dialog, the imported JSON must pass all of these checks:

| Check | Failure behavior |
|---|---|
| Valid JSON (parseable) | Error toast with \[View\] button showing raw parse error |
| Has `version` field (integer) | Error toast: "Not a valid Character Vault file" |
| Has `modules` array | Error toast: "Not a valid Character Vault file" |
| Version is not newer than current app supports | Error toast: "This file was exported from a newer version of Character Vault" |
| Version is older than current → run `migrateData()` | Silent migration, proceed normally |
| Unknown module types present | Proceed with import; show warning in success toast: "X module(s) with unknown types were skipped" |

### Conflict Resolution Dialog

If any existing character data is present (modules, tabs, or activityLog), show a modal before applying the import:

**Title**: "Import Character Data"  
**Body**: A brief description of what the imported file contains (e.g., "3 tabs, 12 modules, game system: D&D 5e")  
**Options**:

| Button | Behavior |
|---|---|
| **Overwrite** | Clears all current data and replaces it entirely with the imported blob — equivalent to a fresh load |
| **Add as New Tab** | Creates a new tab (auto-named from import, or "Imported"), remaps all imported module IDs and tab IDs to avoid collisions, adds modules to the new tab only. Global state (`gameSystem`, `activityLog`) is not merged. |
| **Cancel** | Dismisses with no changes |

"Append to current tab" is intentionally excluded — the ID remapping complexity and cross-module reference breakage make it not worth the UX. "Overwrite" and "Add as New Tab" cover the two real use cases (restore a backup, or add a second character layout as a tab).

### ID Remapping (Add as New Tab)

When importing as a new tab, all IDs in the imported blob must be remapped to avoid collisions with existing data:

- Each imported `tab.id` → `generateTabId()`
- Each imported `module.id` → `generateModuleId()`; `module.tabId` updated to point at the new tab ID
- Cross-module references (`abilities.content.linkedStatModuleId`) → updated to the remapped module ID
- `moduleIdCounter` and `tabIdCounter` are advanced but not reset

The imported `activityLog` entries are **dropped** on Add as New Tab — merging log histories from different characters is not useful.

### Overwrite Behavior

On Overwrite:
- Full `deserializeCharacter()` call with the imported JSON string
- Identical to manually loading a save — `migrateData()` runs, all state is replaced
- `gameSystem` is set from the imported blob
- `activityLog` is replaced with the imported log

### Success / Failure Toast

- Success: *"Character imported successfully"* (or *"Character imported — X module(s) with unknown types skipped"* if applicable)
- Failure: error toast with a **\[View\]** button that opens a modal showing the specific validation error and the raw error message to help users diagnose corrupt files

---

## UI / UX

- Both buttons live in the Settings overlay under a new **"Export / Import"** section, placed after the existing "Save / Load" section
- All strings are i18n keys
- No file path input field — the platform doesn't support filesystem write access
- Export requires no confirmation (non-destructive)
- Import requires the conflict resolution dialog if any data exists; if the sheet is empty, import applies immediately with no dialog
- On success or failure, a toast is always shown
