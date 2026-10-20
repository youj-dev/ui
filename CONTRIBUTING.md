# Contributing

Thanks for helping with Youj. The full guide, with the repository layout and every convention, is at [www.youj.dev/docs/contributing](https://www.youj.dev/docs/contributing). People and AI agents follow the same rules, and `pnpm verify` is the judge.

## Principles

These apply to every package and app. Each area's guide (the map below) adds what typically drifts there.

1. **Use the design system.** Color, shape and space come from theme tokens; time and easing from motion tokens. No raw colors, no hard-coded durations, no stock Tailwind palette. Never override a control's corner, height or edge locally: use its props or the family token, and if there is truly no other way, say why in a `// shape: <reason>` comment (`lint:shapes`).
2. **Accessibility and reduced motion come first.** Correct roles, full keyboard support, visible focus, and a designed reduced-motion state that still says the same thing. Check light and dark.
3. **Every shipped piece has a docs page, a story and tests.** Parity tests fail without them.
4. **Put it in the right layer.** Core owns the contract, motion owns movement, ui owns the things users touch. Dependencies run one way (`pnpm check:imports`).
5. **Generated files stay generated.** Never edit them by hand; rerun the generator and commit the result (see below).
6. **US English,** plain and short, in code, docs and UI strings.
7. **Demos use fictional names and brands.** A real mark appears only with an entry in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Icons and sounds are original work, not copies.
8. **Stay in your lane.** One logical change per pull request. No repo-wide codemods or reformatting of files you don't own.
9. **Public API changes are deliberate.** Run `pnpm api:update`, commit `api/`, and deprecate before you remove (details below).
10. **Run `pnpm verify` before you open a pull request.** Don't add dependencies, commit secrets or edit CI without asking first.

## Set up

You need Node.js 22.22 or newer (`nvm use` reads `.nvmrc`) and pnpm 10 (`corepack enable` installs the version `packageManager` pins).

```bash
pnpm install
pnpm storybook        # http://localhost:6006: build and review components in both themes
pnpm -F docs dev      # http://localhost:3100: the docs site
```

## Before you open a pull request

- **Run the checks** for each package you changed (`pnpm -F <package> verify`), or `pnpm verify` for all of them (it includes `pnpm lint`, Biome). CI runs `pnpm verify` itself, then the coverage floor, builds the packages, Storybook and the docs.
- **Regenerate what you changed.** The common generators: `pnpm labels:generate` (core labels), `pnpm api:update` (the `api/` snapshots, MCP index and surface), `pnpm -F @youj/react generate` (ui entries and registry), `pnpm -F @youj/icons icons:generate`, `pnpm -F @youj/loaders loaders:generate`, `pnpm -F @youj/illustrations generate`, `pnpm -F @youj/miniatures generate`, `pnpm -F @youj/sound render`, `pnpm -F @youj/mcp generate` and `pnpm -F docs generate`. A stale file fails `verify`.
- **Describe it for the changelog.** If it changes a published package, run `pnpm changeset`, pick the bump and write one line. While the packages are 0.x, a breaking change is a `minor` and anything else a `patch`; never `major` (`pnpm check:changesets` stops it). [RELEASING.md](RELEASING.md#1-describe-each-change) has examples.
- **Keep the API snapshot current.** `api/<package>.api.md` records each package's public API: exports, signatures, defaults and props. If you changed it on purpose, run `pnpm api:update` and commit `api/`; `pnpm check:api` fails otherwise. A removed or renamed export or prop, or a changed default, is breaking: deprecate first where it's cheap (keep the old name working, mark it `@deprecated` in its JSDoc), as the [versioning policy](https://www.youj.dev/docs/versioning) describes.
- **Use the template.** The pull request template asks for what and why, the areas touched and a short checklist.

## Map: where to read next

Open the guide for the area you touch. Each has the same shape: what it is, its layout, how to add something, its commands and its house rules.

| Area | Guide |
|---|---|
| Theme contract, tokens, provider, labels, locales (`@youj/core`) | [packages/core](packages/core/CONTRIBUTING.md) |
| Motion primitives, transitions, effects (`@youj/motion`) | [packages/motion](packages/motion/CONTRIBUTING.md) |
| Components and blocks (`@youj/react`) | [packages/ui](packages/ui/CONTRIBUTING.md) |
| Loading animations (`@youj/loaders`) | [packages/loaders](packages/loaders/CONTRIBUTING.md) |
| Animated icons (`@youj/icons`) | [packages/icons](packages/icons/CONTRIBUTING.md) |
| Isometric scenes and the kit (`@youj/illustrations`) | [packages/illustrations](packages/illustrations/CONTRIBUTING.md) |
| Interactive objects (`@youj/miniatures`) | [packages/miniatures](packages/miniatures/CONTRIBUTING.md) |
| Interface sounds (`@youj/sound`) | [packages/sound](packages/sound/CONTRIBUTING.md) |
| Setup CLI (`@youj/cli`) | [packages/cli](packages/cli/CONTRIBUTING.md) |
| MCP server (`@youj/mcp`) | [packages/mcp](packages/mcp/CONTRIBUTING.md) |
| Figma kit (`@youj/figma`, private) | [packages/figma](packages/figma/CONTRIBUTING.md) |
| Docs site and registry host (`apps/docs`) | [apps/docs](apps/docs/CONTRIBUTING.md) |
| Promo film (`apps/promo`) | [apps/promo/README.md](apps/promo/README.md) |

Agents: [AGENTS.md](AGENTS.md) is the short version of this page.

## Dependency overrides

The root `package.json` pins some transitive packages with `pnpm.overrides`:

- `shell-quote`, `source-map-js`, `undici@7`, `sharp` and `@modelcontextprotocol/sdk` are floors at patched releases. They fix known security advisories in dev-tool dependencies that CI otherwise fails on.
- `yuku-ast`, `yuku-parser`, `yuku-codegen` and `yuku-analyzer` are held at `~0.17`, the line whose install warnings are gone; older releases print deprecation warnings.

## Reporting

- **A bug:** [open an issue](https://github.com/youj-dev/ui/issues/new) with the component, the browser, the steps to reproduce and what you expected.
- **A question or an idea:** start a [discussion](https://github.com/youj-dev/ui/discussions) before writing a large change.
- **A vulnerability:** report it privately, as [SECURITY.md](SECURITY.md) describes. Don't open a public issue.

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).

By contributing you agree that your work is released under the [MIT license](LICENSE).

## Improving a language

The language packs in `packages/core/src/locales/<code>.ts` hold every built-in string of the components (close buttons, screen-reader announcements, placeholders, empty states). They were translated for Youj and still need native review. If you speak one of them, your fixes are welcome.

1. Edit the pack. Each key has the same name as in the English `packages/core/src/lib/youj/labels-defaults.ts`, and `packages/core/src/lib/youj/labels-types.ts` explains where each string appears.
2. Keep the conventions noted in the pack's header comment (the register, the quotation marks, the punctuation), or fix the header too if the convention itself is wrong.
3. Function keys receive values. Put each value where the grammar needs it, pick word forms with the pack's `Intl.PluralRules` helper (never with `n === 1`), and format numbers with its `Intl.NumberFormat`.
4. If a word is correct in English too (a loanword like "Dock"), add the key to that language's line in `sameAsEnglish` in `packages/core/src/locales/locales.test.ts`. The test flags any other string left in English.
5. Run `pnpm -F @youj/core test src/locales` and open a pull request. Say in it which language you are a native speaker of.

To add a language, copy the closest pack, translate every key (`satisfies YoujLabels` fails typecheck on a missing key), add its code to `LANGUAGES` in `locales.test.ts`, and list it in `apps/docs/content/docs/guides/i18n.mdx`. The build publishes the new file as `@youj/core/locales/<code>` on its own. It also needs a registry item in `packages/core/registry/locales.json`. There is one import path for a pack, `@youj/core/locales/<code>`, and no re-export from another package.
