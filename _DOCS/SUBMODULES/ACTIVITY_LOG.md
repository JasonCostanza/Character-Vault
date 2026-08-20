# Activity Log Module

## Activity Log Summary
The Activity Log module provides a way for users to keep track of various activities and events that occur during their game sessions. Every time a major action is taken (e.g. a character takes damage, casts a spell, uses an item, etc.), the Activity Log will automatically create a new entry with details about that action. This allows users to easily review what has happened during their game sessions and keep a record of important events.

The Activity Log is not designed to be manually edited by the user. The user can only view the log entries, or delete ones that are deemed unecessary, overridden in play, or invalid for some reason.

The events are always sorted chronologically but the user can sort them Newest to Oldest or Oldest to Newest via a button in the module's toolbar or overlay menu.

Timestamps are "`{Date}` - `{Time}`" format.

# Event API

Other modules communicate events to the Activity Log via a **guard-wrapped global function**:

```js
if (typeof logActivity === 'function') {
  logActivity({ type: 'damage_taken', message: 'Took 8 fire damage', sourceModuleId: mod.id });
}
```

- The `logActivity()` function is defined by the Activity Log module's script.
- The guard (`typeof logActivity === 'function'`) ensures modules don't error if no Activity Log module is loaded.
- This approach fits the existing codebase patterns (global functions, no abstractions) and is straightforward to migrate to an event bus later if needed — the call sites change mechanically but the payload stays the same.

# Log Entry Schema

Each log entry is a **string-only** record with no structured data payload:

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier for the entry |
| `timestamp` | `number` | Epoch milliseconds when the event occurred |
| `eventType` | `string` | Category string for filtering (e.g. `'damage_taken'`, `'spell_cast'`) |
| `sourceModuleId` | `string` | The `id` of the module that emitted the event |
| `message` | `string` | Human-readable display string shown to the user |

The `eventType` value should be a translatable i18n key (e.g. `'event_damage_taken'`) so the Activity Log can call `t(eventType)` for display labels.

No structured data payload (e.g. damage amounts, spell levels) is stored. The `message` field contains all the context the user needs, and `eventType` provides category-level filtering.

# Event Type Taxonomy

Event types are **dynamically collected** from whatever modules emit them. There is no central registry or fixed enum.

- Each module sends its own `eventType` string when calling `logActivity()`.
- The Activity Log scans its entries and builds the filter UI from whatever unique `eventType` values exist in the log.
- New modules automatically work — they just send their event type string.
- Event types with no entries in the log do not appear in the filter UI.

# Event Filtering

The user can filter activity log entries using **tag bubbles** displayed at the top of the module's view. Each unique `eventType` present in the log is rendered as a clickable tag bubble.

- Tags support **multi-select toggling** — multiple event types can be shown or hidden simultaneously.
- **Default state**: All tags are ON (all events visible). The user toggles off types they don't want to see.
- Clicking a tag toggles that event type's visibility in the log view.
- Tags only appear for event types that have entries in the log (dynamic, no empty categories).
- This replaces the dropdown approach — tag bubbles provide a more intuitive multi-filter experience.

# Data Ownership & Instances

The activity log data is stored at the **character level**, not inside any individual module's `data`.

- Multiple Activity Log modules can be created, but they all read from the same shared log.
- Each Activity Log module instance is a **filtered view** into the shared data (different tag filters, sort order, etc.).
- Deleting an Activity Log module does not destroy the log history — the data persists at the character level.
- The configurable max entries cap (see Module Settings) bounds the log size to prevent persistence bloat.

# Deletion

- **Individual entry deletion**: The user can delete a single log entry.
- **Clear all**: The user can clear the entire activity log via the Module Settings menu, with a confirmation prompt to prevent accidental clearing.
- No bulk operations (delete by type, delete by date range) — individual delete and clear-all cover the primary use cases.

# Empty State

When the log has no entries, the module displays a centered placeholder message (e.g. "No activity recorded yet"), consistent with how other modules handle empty states.

# Module Settings Menu
The Module Settings menu allows the user to customize a few aspects of the module. The user can access this menu by clicking on the settings icon within the Activity Log module toolbar or overlay menu.

Within the settings menu the user can:
- Enable/Disable timestamps on log entries
- Clear the entire activity log (with a confirmation prompt to prevent accidental clearing)
- Sort log entries by Newest to Oldest or Oldest to Newest
- Set a maximum number of log entries to keep (e.g. 100, 200, 500, etc.) with older entries automatically deleted when the limit is exceeded
- Date format settings (e.g. MM/DD/YYYY, DD/MM/YYYY, YYYY/MM/DD, etc.)
- Time format settings (e.g. 12-hour with AM/PM, 24-hour, etc.)
- Enable/Disable automatic log entry creation for specific types of events (e.g. damage taken, spells cast, items used, etc.) with a toggle for each event type in a list.
