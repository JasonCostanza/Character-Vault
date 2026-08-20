# Feature Design Docs
All features are captured in break-out documents in the `.\_DOCS` directory. Refer to the required files to understand the feature's intended design.

## Edit mode
Several features offer options, settings, and configurations to the user but these are only exposed while in `Edit` mode. During Play mode, these extra controls hide as to not clutter the UI. Examples are things like color pickers, renaming tabs or stats, etc.

## Changing Mode
To change mode, the user toggles between `Edit` and `Play` by clicking the button in the top right corner of the UI.

## Deletion UX Policy

All deletion interactions follow a tiered confirmation model based on risk level:

| Context | Confirmation Required? | Rationale |
|---|---|---|
| **Inline row delete** (list items, counter rows in layout mode) | No | Low-risk; easily re-added. Instant delete reduces friction. |
| **Modal/overlay delete** (counter edit modal, item inspect overlay) | Yes | User is in a focused context; accidental clicks are more likely. |
| **Destructive operations** (removing an attribute that affects all items) | Yes | Irreversible data loss across multiple entities. |
| **Module-level delete** | Yes | Removes the entire module via `openDeleteConfirm()` in `module-core.js`. |

Confirmation dialogs use the `.delete-confirm-overlay` / `.delete-confirm-panel` CSS classes at `z-index: 300`.