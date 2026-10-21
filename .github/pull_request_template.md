<!-- Title: "Type: Summary", e.g. "Fix: Keep full screen working after a page switch".
Types: Feat, Fix, Docs, Design, Refactor, Perf, Test, Build, CI, Chore, Security, Deps, Release, Revert.
An area may follow the type: "Fix(cli): …". The "PR conventions" check assigns you and adds the type label. -->

## What and why

<!-- One logical change. Say why, not only what. -->

## Area

<!-- Tick what you touched; read that area's CONTRIBUTING.md. -->

- [ ] core / themes
- [ ] motion
- [ ] components, blocks or templates (ui)
- [ ] loaders, icons, illustrations or miniatures
- [ ] sound
- [ ] CLI or MCP
- [ ] Figma kit
- [ ] docs site
- [ ] repo, CI or tooling

## Checklist

- [ ] Docs page, story and tests for new or changed behavior (or why not needed)
- [ ] Theme and motion tokens, no local overrides of control shape, no raw colors or durations
- [ ] Keyboard and screen reader checked; reduced motion has a designed state
- [ ] Checked in light and dark (screenshots below for a visual change)
- [ ] Generated files regenerated (`api:update`, `labels:generate`, package `generate`)
- [ ] `pnpm verify` passes
- [ ] `pnpm changeset` added if a published package changed

## Notes for the reviewer

<!-- Anything you want a second look at. -->
