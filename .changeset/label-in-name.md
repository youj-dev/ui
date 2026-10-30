---
'@youj/core': patch
'@youj/react': patch
'@youj/miniatures': patch
---

Accessibility: a control's accessible name now holds the text it shows (WCAG 2.5.3, axe's `label-content-name-mismatch`).
- **Avatars:** the initials of a decorative avatar (`aria-hidden`, or in an `aria-hidden` group) are drawn, not written, so they are not read out or counted as a label. Account, presence, upload and pin buttons are named by their own label.
- **Names that lead with what is shown:** calendar days ("October 8", not "8th"), booking slots, stage rails, flow steps, envelopes, quadrant chips, vote counts, "+3" avatar overflows, range buttons, tabs, rows and cards in the blocks. Where a name has to say more, it comes after.
- **Block copy:** a few defaults changed to match (the streak "Mark done: …", the checklist pill, the hero stage, the store bag and search labels). The week calendar's `eventLabel` became `eventContext`, and the careers `roleLabel`, integrations `details` and security `open` strings are gone (their controls are named by their content).
- **Miniatures:** a control that wears a label (STOP, PUSH, a drawer's letters, a tape's barcode) starts its name with it.
- **Core:** the motion budget probe is dropped when the last component unmounts and does nothing without a frame clock.
