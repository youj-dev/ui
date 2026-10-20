# youj workspace

Rules for everyone (people and agents) are in [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md); this file adds the workspace layout.

This pnpm monorepo holds one package per product, sharing one design language and released together at one version:

| Package | What | Rules |
|---|---|---|
| `packages/core` → `@youj/core` | the contract the others build on: motion tokens, `YoujProvider`, themes, labels, locales, `cn`, the sound cue bus, the token stylesheet | `packages/core/CONTRIBUTING.md` |
| `packages/motion` → `@youj/motion` | motion primitives, transitions, effects, interactions, backgrounds and Lottie player | `packages/motion/CONTRIBUTING.md` |
| `packages/loaders` → `@youj/loaders` | the loading animations, one entry each | `packages/loaders/CONTRIBUTING.md` |
| `packages/ui` → `@youj/react` | accessible components on shadcn + Base UI, animated via `@youj/motion` | `packages/ui/CONTRIBUTING.md` |
| `packages/icons` → `@youj/icons` | the animated icon set and its engine | `packages/icons/CONTRIBUTING.md` |
| `packages/illustrations` → `@youj/illustrations` | the isometric kit, its scenes and the illustration builder's format and renderer | `packages/illustrations/CONTRIBUTING.md` |
| `packages/miniatures` → `@youj/miniatures` | interactive isometric objects on one shared engine, one entry per miniature | `packages/miniatures/CONTRIBUTING.md` |
| `packages/sound` → `@youj/sound` | interface sound packs for `<YoujProvider sound>`, `definePack`, the offline render | `packages/sound/CONTRIBUTING.md` |
| `packages/cli` → `youj` | the setup CLI: `init`, `add`, `create`, `doctor`, `mcp` | `packages/cli/CONTRIBUTING.md` |
| `packages/mcp` → `@youj/mcp` | MCP server for AI coding tools, also a remote Worker at mcp.youj.dev | `packages/mcp/CONTRIBUTING.md` |
| `packages/figma` → `@youj/figma` (private) | Figma plugin that builds the Youj kit from the real tokens | `packages/figma/CONTRIBUTING.md` |
| `apps/docs` | public docs site (Next.js + Fumadocs); also hosts the combined registry at `/r` | `apps/docs/README.md` |
| `apps/promo` | Remotion promo film rendered from the real components | `apps/promo/README.md` |

- **Dependency direction:** motion, loaders, icons, illustrations and sound → core; miniatures → nothing from Youj (React only); ui → core, motion and icons (its copy-in blocks also use illustrations and miniatures, devDependencies their registry items name). Never the reverse: core imports no other Youj package (`packages/core/src/boundary.test.ts`), and motion imports no icon or scene (AsyncFeedback draws its own two marks). Core is the peer every package shares (one copy per app: it holds YoujProvider's contexts). `pnpm check:imports` (part of `pnpm verify`) fails on a package importing one it doesn't declare, or one this direction forbids (by name or by a relative path, tests and stories included; `scripts/check-imports.mjs` lists the few documented path exceptions).
- **Source layout:** core's, motion's, loaders', icons' and illustrations' `src/` each mirror the path `youj add` installs to (`lib/youj/`, `components/youj/`, `components/youj/loaders/`, `components/youj/icons/`, `components/youj/graphics/`), so copied files keep their relative imports; `scripts/youj-sources.mjs` resolves imports across them (the loaders' per-item entries are read from the folders) (and `sourceEntryImports` points source-path imports at the published entries).
- **One Storybook** at the root (`pnpm storybook`, :6006) shows every package. The toolbar has Theme (light/dark), Preset (theme preset), Motion (reduced), Speed and Direction (LTR/RTL).
- **The `@/` alias** resolves to the importing file's own package `src/` (see `.storybook/main.ts`).
- **Scripts:**
  - `pnpm typecheck`, `pnpm test` and `pnpm verify` run across all packages.
  - `pnpm -F <package> <script>` (e.g. `pnpm -F @youj/motion verify`) runs a script for one package.
- **Dependencies:** don't add or change them on your own; say in the pull request what's needed and why.
- **Deploys and media:** maintainers deploy the docs site and upload promo media; a contribution doesn't touch either.

## Distribution
Users import each thing from the versioned npm package that owns it (published under the `@youj` scope): components from `@youj/react` and its optional-peer entries, the provider, themes, tokens and locales from `@youj/core`, motion components from `@youj/motion`, loaders from `@youj/loaders/<id>`, icons from `@youj/icons`, scenes from `@youj/illustrations`, sounds from `@youj/sound`. There are no re-exports across packages. Copy-in source stays possible, but only through our CLI (`npx youj add <item>`); docs never show `npx shadcn add` or `@/components/ui/...` imports as the way to use Youj. Blocks and the illustration kit are copy-in only, so their snippets use the path the CLI writes.
