# Stats

## Stats Block Summary
Stat blocks are core attributes of any character sheet. These can be anything the user desires but common examples are things from common fantasy-based games like Strength, Constitution, Intelligence, Wisdom, and Charisma. Each stat has an associated modifier commonly displayed in the corner of the stat block. Stats can be renamed, value changed, and modifier changed at-will by entering `Edit` mode.

## Rolling a Stat Check
When in `Play` mode, the user can click on any stat block and the symbiote sends the appropriate roll information to Talespire. Example, if the stat block says 18 Strength, with a +3 modifier, when the user clicks on this it will send a roll group to Talespire with a name "Strength Check" and the dice information will be `1d20+3`.

All information on how to send dice rolls to Talespire can be found at: https://symbiote-docs.talespire.com/api_doc_v0_1.md.html#calls/dice.

## Modifying a Stat Block Value
When in `Edit` mode, all stat blocks change from static text to editable text fields. Pressing `Enter`, or `Escape` while typing drops focus from that text field. Pressing `Tab` cycles to the next neighboring text field. All newly added stat blocks default to a value of 0 with a +0 modifier.

If the user is in `Play` mode and uses the keyboard shortcut `Control` + `Left Click` on a stat block, the user can quickly modify the value or modifier for that stat without going into `Edit` mode. The stat is changed to an editable text field to allow for quick modification. Any loss of focus will lock the stat. This shortcut should bypass rolling the stat.

## Stat Block Style
Each stat block is a 1x1 object on the overall grid and fits within its `Module` container. Each stat block has a `Name` field at the top of it, a `value` in the middle in large text, then a `modifier` in the lower right corner in the format "+x" where x is the modifier the user provides. each stat block has a border around the main stat and a border around the modifier.

The stat values can be swapped between the `Primary` and `Secondary` element.
- `Primary` element: The center text field which is larger size text to stand out. Typically used for the raw stat value of strength, constitution, wisdom, etc.
- `Secondary` element: this element sits in the bottom right corner of the primary element and stores the modifier value in the form of "+x", where x is the modifier.

Example: `images\_REFERENCE\stats.png`

## Adding a stat
When a new stat is added to a module, it will always be spawned "Unnamed" and have a default value of 0 and a modifier of +0.