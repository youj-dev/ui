# Working on @youj/figma

What it is: a private Figma development plugin that builds the Youj kit (variables, styles, icons, foundations, components, reference screens) from the real tokens. Read [README.md](README.md) first for how it runs.

## House rules

What typically drifts here. The root [Principles](../../CONTRIBUTING.md#principles) apply too.

- The kit is built from the real tokens and the real components. Do not hand-copy values into the plugin; read them from the other packages (`src/data`).
- **Parity:** `test/parity.test.ts` compares the kit with the code. A component or block you add either gets drawn or is listed in `parity-baseline.json`. The baseline only shrinks and the totals (`ceiling`) cannot go up on their own: draw it, or ask a maintainer before raising the ceiling.
- Target ES2017 and avoid browser globals Figma lacks (`test/syntax.test.ts`). Use the async Figma API forms.
- Fail per step, never per build: a step that fails leaves a notice and the build goes on.
- Cover new steps and components with the fake (`test/fake-figma.ts`), `integrity.test.ts` and `failures.test.ts`. Only real Figma confirms some behavior, so check the manual list before a release.
- The plugin is private. It is not published.

## Layout

```
src/plugin/      the plugin: main.ts, run.ts, steps.ts (one entry per build step), variables, styles, pages, icons, components/, sheets/
src/data/        the kit's data, taken from the other packages
scripts/         build.ts bundles code.js; blocks.ts and illustrations.ts prepare their data
test/            the Figma fake (fake-figma.ts) and the tests that run the build against it
manifest.json    the plugin manifest you import into Figma
```

## Adding a step or a component

- **A step:** add it to `src/plugin/steps.ts` so it runs on its own and fails on its own (see "Fail per step, never per build"), and cover it in `test/integrity.test.ts` and its failure in `test/failures.test.ts`.
- **A component:** draw it under `src/plugin/components/` and check it against the Figma fake in `test/`.

## Commands

`pnpm -F @youj/figma typecheck|test|build|verify`. `build` writes `dist/code.js`. Only real Figma confirms some behavior, so check the list at the end of this file by hand before a release.

## Rules

These are the constraints that the download path and a full review of the plugin showed matter.

### Keep the bundle runnable in Figma

- **Target ES2017.** The bundle must parse as ES2017 (`test/syntax.test.ts` checks the built `code.js`). No optional chaining, `??`, object spread, optional catch binding, top-level await or class fields.
- **No browser-only globals.** `structuredClone`, `TextEncoder`, `atob`, `replaceAll`, `.at()`, `Object.hasOwn`, `fetch` and `document` are not in Figma's sandbox. `Object.fromEntries` and `Array.prototype.flatMap` are fine.
- **Use the async forms for dynamic pages.** `manifest.json` sets `documentAccess: "dynamic-page"`, so use the async forms (`figma.getNodeByIdAsync`, `figma.setCurrentPageAsync`, `getMainComponentAsync` and the rest). The test fake throws on the sync forms.
- **Errors from Figma's realm are not `instanceof Error`.** Read messages with the duck-typed `message()` helper.
- **Yield.** Long unbroken loops freeze Figma's UI. The build yields every 24 icons and between steps.

### Fail per step, never per build

- Each step runs on its own (`src/plugin/steps.ts`). A failed step leaves a notice on its page and the build goes on. A step the others depend on (fonts, variables, styles, pages) skips them and says why.
- Fallbacks must fall back, not throw: fonts style by style and family by family, code syntax as an optional note, and the mode and page caps detected by the refusal rather than Figma's English error text.

### Tests

- `test/fake-figma.ts` enforces Figma's rules: fonts loaded before text layout setters, `cornerRadius` not a bindable field, BASELINE alignment only on horizontal auto layout, `findAll` descending into instances, and injected failures for each fallback path.
- `test/integrity.test.ts` builds on Professional and Starter drafts, twice each, and checks every page, component set, variable binding and text node (`test/integrity.ts`). `test/failures.test.ts` runs the same check after injected failures.

Only real Figma can confirm these, so check them by hand in the desktop app before a release: the panel painting during a build, the exact wording of Figma's cap errors, build time on a large file, and that Figma stays responsive.
