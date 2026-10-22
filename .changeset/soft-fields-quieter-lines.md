---
'@youj/core': minor
'@youj/react': minor
'@youj/mcp': minor
---

Breaking: fields are soft by default, and lines are quieter. The Clean style (Basalt, Graphite and the other Clean presets, and a page with no theme) draws every field as a filled band with no border; focus and an invalid value still draw an edge. `DEFAULTS.fields` and `cleanStyle.fields` are now `'soft'`. To keep outlined fields, set `fields: 'outlined'` on your theme, for example `defineTheme({ ...basalt, fields: 'outlined' })`. The Bezel, Classic, Brutal and Terminal styles keep their outlined fields.
- **Quieter lines:** the lines of cards, dividers, menus and outline buttons (`line`, `line-strong`) are a step fainter, most in dark. Control borders (`line-control`: checkboxes, radios, outlined fields) still hold 3:1 on every surface.
- **MCP:** `create_theme` reports the control border and says when a theme's fields are soft.
