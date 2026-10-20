# Agents: working in the Youj monorepo

Youj is a pnpm monorepo for one design language: React components (`@youj/react`), blocks, motion (`@youj/motion`), loaders, icons, illustrations, miniatures, sounds (`@youj/sound`), the theme contract (`@youj/core`), a setup CLI (`youj`), an MCP server (`@youj/mcp`), a Figma kit and the docs site (`apps/docs`). Packages are `packages/*`; the layout and dependency direction are in [CLAUDE.md](CLAUDE.md).

## Principles in one breath

Use theme tokens for color, shape and space and motion tokens for time and easing (never local overrides of a control's shape; `// shape: <reason>` if truly needed). Accessibility and reduced motion first. Every shipped piece has a docs page, a story and tests. Respect the layers and dependency direction. Generated files stay generated. US English. Fictional names in demos; real marks only with a `THIRD_PARTY_NOTICES.md` entry. One logical change, no repo-wide codemods on files you don't own. Full list: [CONTRIBUTING.md](CONTRIBUTING.md#principles).

## Before you edit

Read the `CONTRIBUTING.md` of the area you touch (`packages/<name>/CONTRIBUTING.md`, `apps/docs/CONTRIBUTING.md`); the map is in the root [CONTRIBUTING.md](CONTRIBUTING.md#map-where-to-read-next). Match the surrounding code and keep changes surgical.

## Verify

- `pnpm -F <package> verify` for each package you changed (fast, while working).
- `pnpm verify` once before you finish: lint, import direction, labels, tints, sleeps, API snapshot, shapes, tokens, structure and every package's tests.
- Regenerate what you changed (`pnpm api:update`, `pnpm labels:generate`, `pnpm -F @youj/react generate`, the other generators listed in CONTRIBUTING.md). A stale generated file fails `verify`.
- Look at visual changes in both themes and with reduced motion.

## Don't

- Push to `main`, deploy or upload media; maintainers do that.
- Add or change dependencies on your own: say what's needed and why.
- Edit generated files, CI, release config or `THIRD_PARTY_NOTICES.md` without a reason.
- Commit secrets, `.env` files or build output.
