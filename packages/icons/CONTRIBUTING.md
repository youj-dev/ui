# Working on @youj/icons

What it is: the animated icon set and its engine (`createIcon`, `IconSwap`, `useIconState`, `YoujIcon`). What it does for users is in [README.md](README.md).

## House rules

What typically drifts here. The root [Principles](../../CONTRIBUTING.md#principles) apply too.

- Draw on the 24 x 24 viewBox with strokes only, round caps and joins, and `currentColor`. The engine sets the stroke width; never set one on a path.
- File `kebab-case.tsx` exports `<Name>Icon`; `category` comes from `ICON_CATEGORIES`; `keywords` are what people would search for; a one-sentence JSDoc above the export is the description.
- Every part defines `rest` and `active`; durations come from `k`, never raw numbers. The motion should mean something (a lid opens), not decorate.
- Icons are original. `originality.test.ts` compares each one with lucide-react. Brand marks (`brand-*`) are the brand owner's official asset, linked in the file and listed in `THIRD_PARTY_NOTICES.md`.
- No fixed ids for masks or clip paths (use the per-instance `id`), and no top-level side effects: `check:treeshake` holds a one-icon import near 4 KB.
- Imports are `m` from `motion/react` and `./icon-base` only. After adding one, run `icons:generate`.

## Layout

```
src/components/youj/icons/   one file per icon (the path `npx @youj/cli add icon-<name>` installs it at),
                             icon-base.tsx (createIcon and the categories), index.ts (generated)
src/test/                    the shared contract tests and the SSR cases
scripts/generate-icons.mjs   writes the barrel and registry/icons.json
registry/icons.json          generated
```

## Adding an icon

1. Create `src/components/youj/icons/<name>.tsx` (kebab-case) exporting `<Name>Icon = createIcon({ … })`. Copy a neighbor such as `activity.tsx`.
2. Put a one-sentence JSDoc directly above the export. The generator reads it as the icon's description.
3. Run `pnpm -F @youj/icons icons:generate`. It writes the barrel and `registry/icons.json`; `verify` fails until they are current.
4. If the icon morphs between two shapes or names two states, add it to the matching list in the contract tests (`describeMorphs`, `describeStateLabels` in `src/test/icon-contract.tsx`, used by the `*.test.tsx` files beside the icons).
5. Run `pnpm -F @youj/icons verify`, and look at it in Storybook (`gallery.stories.tsx`) in both themes and with reduced motion.

### Authoring rules

- **Grid and stroke:** draw on the 24 by 24 viewBox, as strokes only, with round caps and joins. The engine sets the stroke width (1.5 by default, scaled by `--yj-icon-weight`), so don't set one on a path. Fill only where the shape is a solid dot.
- **Color:** `currentColor` and nothing else. No theme colors, no hard-coded values.
- **Metadata:** `name` is the file name, `category` is one of `ICON_CATEGORIES` in `icon-base.tsx` (add a category there, never in a story), and `keywords` are the words someone would search for (the docs and the MCP index search them).
- **Choreography:** every part defines a `rest` and an `active` variant. Take durations and easings from the `k` argument (`k.tween('base')`, `seq(k, 'deliberate', …)`), never raw numbers. The motion should say what the icon means (a pulse runs, a lid opens), not decorate it.
- **State icons** (menu to close, play to pause) name their two states in `states` and morph the same paths. A controlled `active` wins over hover.
- **Pivots:** use `origin(x, y)` from `icon-base.tsx` to rotate a part around a point; Motion owns `transform-origin` on SVG.
- **Reduced motion:** the engine renders every variant's final pose with no transition. Check that the `active` pose still reads as the icon.
- **Masks and clip paths** get no fixed ids: `render` receives a per-instance `id` to build them from.
- **Imports:** `motion/react`'s `m` and `./icon-base` only. Never `motion`, and no other Youj package.

## Commands

`pnpm -F @youj/icons typecheck|test|lint:tokens|icons:generate|icons:check|registry:check|check:treeshake|verify`

`verify` builds `dist/` and `check:treeshake` bundles a one-icon, a five-icon and a whole-set app against it; a one-icon import must stay near 4 KB (the set is 400 KB), so keep icon modules free of top-level side effects and shared registries.

## Rules

Timing and color follow motion's rules ([packages/motion/CONTRIBUTING.md](../motion/CONTRIBUTING.md)) on core's tokens and provider ([packages/core/CONTRIBUTING.md](../core/CONTRIBUTING.md)): tokens from `useYouj()`, `currentColor`, a designed reduced-motion state. `lint:tokens` checks them.
