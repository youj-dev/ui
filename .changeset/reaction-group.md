---
'@youj/core': patch
'@youj/react': patch
---

New component: Reaction Group (`ReactionGroup` from `@youj/react`, experimental), emoji reactions under a comment, a message or a post. Each pill shows an emoji and how many reacted, pressed when you're one of them; a press adds yours or takes it away at once, popping the emoji and rolling the count, and a button at the end offers eight emoji to react with (`choices` replaces them, `renderPicker` adds your own picker under them). Hover, focus or a long press names who reacted. `onReact` can return a promise: the pill is busy while it runs, and if it rejects the press is undone, the pill shakes and the reason shows under the row. `size="sm"` fits dense chat rows. Core adds its strings (`reactionGroupLabel`, `reactionGroupAdd`, `reactionGroupItem`, `reactionGroupOthers`, `reactionGroupFailed` and the eight emoji names) in English and in the 14 language packs.
