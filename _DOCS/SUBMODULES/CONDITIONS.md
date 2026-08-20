# Conditions Module

## Summary
The Conditions module is a fairly simple module that allows the user to track conditions affecting their character.

**NOTE**: It will be very similar to the `Resistances` module except it only has one area and not 3 columns, and instead of tracking resistances, it will track conditions. It will have a similar layout to the `Resistances` module, but with a different set of icons and a different set of options.

## Conditions Module UX
The user can sort the list of conditions applied to their character in by clicking the header of the list columns.
- Sorting options:
    - Alphabetical
    - Value (Ascending/Descending)
        - If possible, treat toggleable conditions as a value of 1 or 0 for sorting purposes.
- The module settings has a section for the user to select the template game they are playing, which will populate the list of conditions with the conditions for that game. An option for `Custom` is available if they're playing a game system not listed as a template.
- in `Edit` mode:
    - Hovering over a condition will show a tooltip with the condition's description.
    - Clicking on a condition will open a modal to edit the condition's value or remove it.
- in `Play` mode:
    - Hovering over a condition will show a tooltip with the condition's description.
    - Clicking on a condition's name will toggle it on and off.
    - Clicking on a condition's value will increment the value by 1.
    - Right-clicking on a condition's value will decrement the value by 1.
    - Clicking the `Expand` button will open a modal to edit the condition's value or remove it.

# Conditions List
Primarily focused around the selection of template games available in the `Stat module` (D&D 5e, Pathfinder 2e, Daggerheart, Call of Cthulu, Vampire: The Masquerade, Cyberpunk Red, Mothership, and Shadowrun), but with the ability to add custom conditions. Some of these are shared between the two systems, but with different names. It is also **important to note** that some of these conditions are **not** mutually exclusive, and can be applied to a character at the same time.

## D&D 5e Conditions
- Blinded
- Charmed
- Deafened
- Exhaustion
- Frightened
- Grappled
- Incapacitated
- Invisible
- Paralyzed
    - Incapacitated
- Petrified
    - Incapacitated
- Poisoned
- Prone
- Restrained
- Stunned
    - Incapacitated
- Unconscious
    - Incapacitated
    - Prone
- Custom Condition

## Pathfinder 2e Conditions
- Blinded
- Clumsy
- Concealed
- Confused
- Controlled
- Crippled
- Dazzled
- Deafened
- Dying
    - Unconscious
- Fascinated
- Fatigued
- Fleeing
- Grabbed
    - Off-Guard
    - Immobilized
- Hidden
- Impaired
- Invisible
- Paralyzed
    - Off-Guard
    - Immobilized
    - Incapacitated
- Petrified
    - Off-Guard
    - Immobilized
    - Incapacitated
- Prone
    - Off-Guard
- Restrained
    - Off-Guard
    - Immobilized
    - Incapacitated
- Sickened
- Slowed
- Stunned
- Stupefied
- Unconscious
    - Off-Guard
    - Blinded
    - Prone
- Custom Condition

## Call of Cthulhu Conditions
- Major Wound
    - Prone
- Unconscious
    - Prone
- Dying
    - Unconscious
- Prone
- Incapacitated
- Bout of Madness
- Temporary Insanity
- Indefinite Insanity
- Permanently Insane
- Amnesia
- Phobia
- Mania
- Paranoia
- Custom Condition

## Vampire: The Masquerade Conditions
- Hunger
- Impaired
- Blood Bound
- Frenzy
- Rötschreck
- Torpor
    - Incapacitated
- Incapacitated
    - Impaired
- Final Death
    - Incapacitated
- Compulsion
- Messy Critical
    - Compulsion
- Bestial Failure
    - Compulsion
- Stains
- Custom Condition

## Cyberpunk Red Conditions
- Blinded
- Deafened
- Grabbed
- On Fire
- Poisoned
- Prone
- Restrained
    - Grabbed
- Stunned
- Unconscious
    - Prone
- Dying
    - Unconscious
- Custom Condition

**Critical Injuries (Head)**
- Brain Injury
- Broken Jaw
- Concussion
- Cracked Skull
- Crushed Windpipe
- Damaged Eye
- Damaged Ear
- Destroyed Eye
    - Blinded
- Lost Ear
    - Deafened
- Shattered Jaw

**Critical Injuries (Body)**
- Broken Arm
- Broken Leg
- Broken Ribs
- Collapsed Lung
- Crushed Fingers
- Dislocated Shoulder
- Dismembered Arm
- Dismembered Hand
- Dismembered Leg
- Foreign Object
- Spinal Injury
- Sucking Chest Wound
- Torn Muscle

## Mothership Conditions
**General**
- Stress (Value)
- Wounded (Value)
- Unconscious
- Panicked (General)
- Custom Condition

**Panic Results**
- Adrenaline Rush
- Anxious
- Overwhelmed
- Cowardice
- Hallucinations
- Phobia
- Nightmares
- Loss of Confidence
- Paranoid
- Catatonic
    - Unconscious
- Rage
- Spiraling

**Wounds**
- Bleeding
- Broken
- Concussed

**Environmental**
- Exhausted
- Cryosick
- Addicted
- Irradiated


## Shadowrun Conditions
- Blinded
- Burning
- Chilled
- Confused
- Corrosive
- Dazed
- Deafened
- Fatigued
- Frightened
- Heightened
- Immobilized
- Invisible
- Nauseated
- Panicked
- Paralyzed
    - Immobilized
- Petrified
    - Immobilized
- Poisoned
- Prone
- Silent
- Stunned
- Unconscious
    - Prone
- Wet
- Zapped
- Custom Condition

## Daggerheart Conditions
- Bleeding
- Fearful
- Hidden
- Marked
- Poisoned
- Restrained
- Stunned
    - Restrained
- Vulnerable
- Custom Condition

## Custom Conditions
- The user can add custom conditions to the module.
- Custom conditions can be toggled on and off, or they can have a value.
- Custom conditions can have a description.
- Custom conditions can have an icon from a predefined list of icons.
- Custom conditions have a type: toggle or value.
    
# Conditions Gotchas
- Some conditions are toggled on and off, while others are toggled on with a value (e.g. dying has a value of 1-4, and can be toggled off by setting the value to 0).
- All system templates can have custom conditions added to them.