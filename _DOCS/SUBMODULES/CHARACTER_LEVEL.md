# Character Level Module

## Character Level Summary
The Character Level module allows users to track their character's overall level and experience points (XP). This module is essential for games that use a leveling system, as it helps players keep track of their progress and when they are due for a level up. The module includes features for adding XP, calculating level progression, and displaying the current level and XP in a clear and visually appealing way.

## UI/UX
The Character Level module will display the character's current level in prominent text, along with a progress bar that visually represents the character's current XP relative to the XP needed for the next level. The user can hover their mouse over the progress bar to see a detailed tooltip that shows the current XP, and the XP needed for the next level. The user can click the XP bar to call up a modal window which allows them to add or subtract XP. Once confirmed, will automatically update the progress bar. They can also cancel out of it via a cancel button or "X" button. If the XP meets or exceeds the XP needed for the next level, the detailed view will show a "Level Up" button that the user can click to increase their character's level by 1 and reset the XP to 0 (or carry over excess XP, depending on user preference settings). Alternatively, they can choose to ignore the level up and level up whenever they want by clicking the "Level Up" button, which will increase their level by 1 and either reset XP to 0 or carry over excess XP based on their settings.

## Play Mode
- The user can:
    - View their current level and XP progress.
    - Click the XP bar to add or subtract XP.
    - Click the "Level Up" button when they have enough XP to increase their level.

## Layout Mode
- The user can:
    - Manually set their current level
    - Click the XP bar to add or subtract XP.
    - Access the module settings to customize the leveling system and progress bar appearance.

## Module Settings Menu
The Module Settings menu allows the user to customize a few aspects of the module. The user can access this menu by clicking on the settings icon within the Character Level module toolbar or overlay menu.
Within the settings menu the user can:
- Choose "Milestone" or "XP" leveling system.
- If "XP" is selected, the user can input the XP thresholds for each level (e.g. Level 2: 300 XP, Level 3: 900 XP, etc.) in a list format.
    - The list defaults to just one input for the next level (e.g. Level 2: 300 XP) and the user can click an "Add Level" button to add additional levels to the list as needed. The "Add Level" button is always the last item in the list and clicking it adds a new input above itself for the next level (e.g. Level 3: 900 XP). The user can add as many levels as they want, and they can edit or delete existing levels in the list as well.
- Choose whether to carry over excess XP when leveling up or reset to 0.
- Customize the appearance of the progress bar (e.g. color, style, etc.).
    - The user can pick from colors available in the theme picker
    - The user can pick from a few different styles of progress bars (e.g. solid, segmented by 10% or 25% increments, segmented by 10 or 100 xp increments, gradient, etc.)

# Gotchas
- The module needs to be easily referenced by other modules (e.g. Abilities, Saving Throws, or spells) for level-based calculations (e.g. "... half your level rounded down"), so we need to expose an API for other modules to get the current level.
- "Milestone" leveling system does not show an experience bar, but other modules may still want to reference the current level for calculations, so we need to ensure the API works regardless of leveling system.