# Working on @youj/core

What it is: the contract every Youj package builds on: motion tokens, `YoujProvider` and its hooks (`useYouj`, `useYoujScope`, `useMotionBudget`…), themes and the theme contract, labels and locales, `cn`, the sound cue bus, `MotionFeatures`, and the token + motion-preset stylesheet. `@youj/motion`, `@youj/react`, `@youj/icons`, `@youj/illustrations` and `@youj/sound` all build on it; **core imports none of them** (`src/boundary.test.ts`, plus `pnpm check:imports`). The art direction and the component rules are in [packages/motion/CONTRIBUTING.md](../motion/CONTRIBUTING.md). What core does for users is in [README.md](README.md).

## House rules

What typically drifts here. The root [Principles](../../CONTRIBUTING.md#principles) apply too.

- A theme sets **inputs**; every color role is derived. If a look is out of reach, add an input, never a role override. Every palette x style must pass `checkTheme` (AA contrast, white light cards).
- Core imports no other Youj package and never touches Web Audio (`boundary.test.ts`, `sound-cue.test.tsx`).
- Every built-in string is a key in `labels-defaults.ts` and in **every** locale pack. After editing, run `pnpm labels:generate`; `pnpm check:labels` and `locales.test.ts` fail on a missing key or English left in a pack. Plurals use `Intl.PluralRules`, never `n === 1`.
- Public or internal: `src/index.ts` lists names (no `export *`). What only sibling packages need goes in `src/internal.ts`.
- Time is `token x --yj-motion`. Never add a raw duration; add or reuse a motion token.
- A new `@theme` text or spacing token also goes in the `cn` lists in `src/lib/youj/cn.ts`, or tailwind-merge drops its classes.
- Theme sheets (`palettes.css`, `styles.css`, `themes/*.css`) are written from the TypeScript: `UPDATE_THEME_SHEETS=1 pnpm -F @youj/core test layers`.

## Layout
```
src/lib/youj/          tokens.ts, provider.tsx (YoujProvider, useYouj), cn.ts, features, budget, labels, sound   ← shared contract, do not rename
src/lib/youj/theme/    theme contract, derivation, presets (themes/*.ts + *.css), checkTheme, observeThemeChange
src/styles/youj.css    Tailwind v4 + color/ease/duration tokens (colours derive from the theme contract `--yj-*`)  ← shared contract
src/styles/presets.css Base UI overlay presets (yj-pop, yj-dialog, …), imported by youj.css
src/locales/<code>.ts  language packs for <YoujProvider labels>
src/docs/              Storybook foundations (Color, Motion, Principles) and the logo (docs/brand)
src/test/setup.ts      jsdom stubs + preloaded Motion features; every package's test setup imports it
src/test-utils.tsx     installObservers, renderReduced, renderFull (`@youj/core/test-utils`, tests only, not published)
src/index.ts, internal.ts   public entry points (plus `./locales/*`, `./styles.css`, `./presets.css` when published); labels.ts is the workspace path for the component labels, which a build points at `@youj/core/internal`
registry/              youj-core (lean: provider, theme contract, Basalt + Graphite), youj-labels-<component> (generated: each component's own English strings), youj-presets, youj-locale-*, youj-theme-* (stylesheets), youj-theme-check, youj-labels (built by scripts/build-registry.mjs, which inlines presets.css)
registry/stubs/        copy-in stand-ins that ship under another file's path (theme/index.ts without the check, a no-op theme/check.ts); stubs.test.mjs keeps the barrel in step
```
`src/` mirrors the app layout `youj add` writes (`lib/youj/…`), so the copied files keep their relative imports.

## Adding a thing

- **A language pack:** see "Improving a language" in the [root CONTRIBUTING.md](../../CONTRIBUTING.md#improving-a-language).
- **A label:** The key and type go in `labels-types.ts`, the English in `labels-defaults.ts`, the key in its component's group in `scripts/label-groups.json`; then `pnpm labels:generate` writes `src/lib/youj/labels/<component>.ts`, the `labels-components.ts` barrel, `registry/stubs/labels.ts`, the `youj-labels-<component>` items and the components' registryDependencies (`pnpm check:labels` fails when they're stale). Never edit those by hand. Copy-in gets an open `YoujLabels` (`registry/stubs/labels-types.ts`) since a copy carries only some keys; a locale pack is one file per language and its extra keys are inert.

## Rules
- Other packages import core by entry (`@youj/core`, `@youj/core/internal`) or by source path (`@youj/core/lib/youj/provider`); a package build maps a source path to the entry that exports the names (`sourceEntryImports` in `scripts/youj-sources.mjs`), so a name used by published code must be exported by an entry.
- **Public or internal:** `src/index.ts` lists its exports by name (no `export *`). What the other @youj packages need and an app doesn't (`SoundCueContext`, `springPhysics`, `ROLES`, `deriveRoles`, `checkRoles`, `CARD_SECTION_INK`, `resolveInView`, `observeOnScreen`, and every component's labels: `useComponentLabels` and the `<component>Labels` sets) is in `src/internal.ts`, published as `@youj/core/internal` with no stability promise. It is the kit's channel between its own packages (every other @youj package imports it), not an API for apps; docs and app code never import it.
- **One word, one meaning:** the theme's `controlSize` (control heights) and `motionPersonality` (timing) are not the provider's `density` (layout room) and `motion` (animation on or off).
- **Defaults:** `DEFAULTS` in `theme/contract.ts` is Basalt's, what `:root` in youj.css sets and a complete theme (one with an `id`) takes for what it leaves out; its neutral ramp and unset accent and status inks are the Youj palette's (Basalt's amber in dark, Graphite's ultramarine in light; derive.ts `INK_DEFAULTS`, the fallbacks in youj.css, held equal by tests), and its chart is Youj's while the theme sets no colour of its own, else drawn from the accent. An unknown preset id warns once in development.
- **Palette × style:** a theme is a palette (colour: `neutral`, the inks, `chart`) and a style (form: radius, control size, fonts, stroke, shadow, actions, controls, surfaces, headings, labels, motion, and its `look`), in `theme/layers.ts` (`definePalette`, `defineStyle`, `composeTheme`), the five styles in `theme/styles.ts`, the seven palettes in `themes/` (Youj, the default, and the six Wada ones beside their presets). A preset is a named pair (Graphite, Terminal, Brutal and Basalt are Youj in the Clean, Terminal, Brutal and Bezel styles); `DEFAULTS` is Basalt = Youj × Bezel. Whites stay white: palettes keep `neutral.wash` 0 and a gray page, and every palette × style passes `checkTheme` and draws white light cards (`layers.test.ts`). `palettes.css`/`styles.css` are written from the TS: `UPDATE_THEME_SHEETS=1 pnpm -F @youj/core test layers` (also rewrites `themes/*.css`). YoujProvider/ThemeScope take `palette` and `style`; the look follows the style (or the theme's `look`) unless `look` is given.
- **Mode:** `YoujProvider mode` (`'dark'` default, `'light'`, `'system'`), `useMode()` and `ModeScript` live in `src/lib/youj/mode.tsx`, the plain lists (`COLOR_MODES`, `SCALINGS`, `DENSITIES`) in `src/lib/youj/settings.ts` so a server component can read them; the top-level provider writes `data-theme` on `<html>`, nested ones on their subtree, and with no `mode` set nothing is written.
- **Timing contract:** every CSS duration is `token × --yj-motion` (1 = motion, 0 = reduced). The provider sets `--yj-motion` and `data-yj-reduced`, and `useYoujScope()` returns the same props for portals.
- **Roles and tone:** a preset sets inputs only; every colour role (`ROLES` in `theme/derive.ts`, mirrored by `youj.css` section 3) is derived, and `deriveRoles` must match the CSS (`derive.test.ts` parity). `tone { chrome: 'match'|'dark'|'light', overlays: 'content'|'chrome' }` becomes `--yj-tone-chrome-fixed`/`-dark` and `--yj-tone-overlay-chrome`; `[data-yj-tone]` scopes re-derive every role in the tone's mode. A look a preset can't reach is a new input, never a role override. `checkRoles` (in `checkTheme`) holds every preset, mode and tone variant to AA; `info` defaults to the accent.
- **Theming:** canvas and WebGL code resolves colours through a probe element plus `observeThemeChange`, never `getPropertyValue`; `--color-*` values are formulas derived from the theme contract. `fg-subtle` passes AA as text (≥4.5:1) in every preset.
- **Sound:** `YoujProvider`'s `sound` (a `SoundRuntime`: `arm`, `play`, or a `SoundSettings` object: `pack`, `volume`, `muted`, `onMutedChange`, `whenReduced`) lives in `src/lib/youj/sound-scope.ts` with the cue bus (`SoundCueContext`, internal; `soundCues`); `sound-cue.ts` has `useSoundCue` and `useSound`. Core never imports `@youj/sound` or touches Web Audio (`sound-cue.test.tsx`).
- `YoujProvider motion={false}`: `MotionEnabledContext` (features.tsx) makes every `MotionFeatures` load nothing, `MotionConfig isStatic` renders `m` elements at their `animate` target, `reducedMotion` is forced to `always`.
- `scripts/check-tokens.mjs` (token discipline) lives here; motion, icons and illustrations run it as their `lint:tokens`.

## Commands
`pnpm -F @youj/core typecheck|test|registry:check|verify`; `pnpm labels:generate` and `pnpm check:labels` at the repo root.
