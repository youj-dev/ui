---
'@youj/core': patch
'@youj/react': patch
---

New component: Inline Edit (`InlineEdit` from `@youj/react`, experimental), text that edits in place, for a name, a title or a description. Press it and the same words sit in a field at the same spot: a click puts the caret where it landed, Enter saves, Escape cancels and leaving the field saves. `validate` can refuse a draft, and `onSave` can return a promise: the field stays open with a spinner while it saves, closes with a drawn check when it resolves, and keeps the draft with the reason under it when it rejects. `multiline` edits in a textarea that grows, with Save and Cancel in its frame. Core adds its strings (`inlineEditTrigger`, `inlineEditHint`, `inlineEditHintMultiline`) in English and in the 14 language packs.
