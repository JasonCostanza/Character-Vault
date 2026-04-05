# Activity Log Module

## Activity Log Summary
The Activity Log module provides a way for users to keep track of various activities and events that occur during their game sessions. Every time a major action is taken (e.g. a character takes damage, casts a spell, uses an item, etc.), the Activity Log will automatically create a new entry with details about that action. This allows users to easily review what has happened during their game sessions and keep a record of important events.

The Activity Log is not designed to be manually edited by the user. The user can only view the log entries, or delete ones that are deemed unecessary, overridden, or invalid for some reason.

The events are always sorted chronologically but the user can sort them Newest to Oldest or Oldest to Newest via a button in the module's toolbar or overlay menu.

Timestamps are "`{Date}` - `{Time}`" format.

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

# Open Questions
Do we need to invent a whole new Activity Log API for modules to communicate events to the Activity Log module?