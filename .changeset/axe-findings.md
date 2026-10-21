---
'@youj/react': patch
---

Accessibility: components and blocks now pass axe and the 24px target-size check in light, dark and right-to-left.
- **Contrast:** avatar initials, badge text, live cursor pills, proposal card muted options, diff viewer comments, flow lane values and the time lanes current shift read at 4.5:1.
- **Target size:** track timeline clip handles, the tour beacon and pressable presence avatars are at least 24px.
- **Labels and states:** the search landmarks in the filter field, search field and sidebar command are named. Tag input, capsule stepper and wheel picker mark disabled parts with `aria-disabled`.
- **Structure:** block headings follow the block's title level.
- **Wheel picker:** it now shows only the rows clear enough to read and press.
