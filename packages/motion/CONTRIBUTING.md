# Working on @youj/motion

What it is: the motion components: primitives, transitions, effects, interactions, backgrounds and players. They run on `@youj/core` (`packages/core`: tokens, the provider, themes, labels, the token stylesheet). The loading animations are `packages/loaders`, the animated icons `packages/icons` and the isometric kit and scenes `packages/illustrations`; this package never imports them. It's distributed as a **shadcn registry** (copy-in source) and reviewed in **Storybook**. What it does for users is in [README.md](README.md).

## Art direction: "precise & kinetic"
- Fast, confident motion that lands precisely. Default to no overshoot; a `settle` spring's bounce is reserved for success and arrival moments.
- Geometric, crisp, restrained. One accent color, and it's used sparingly. The motion is the ornament.
- Think Linear / Vercel / Raycast polish.

## House rules

What typically drifts here. The root [Principles](../../CONTRIBUTING.md#principles) apply too.

- Timing from `useYouj()` (`k.tween`, `k.spring`, `k.ms`), colors from semantic tokens. `lint:tokens` fails on raw ms, cubic-bezier, hex/rgb and stock Tailwind colors; a justified exception carries `// youj-allow: <reason>`.
- Reduced motion is a designed state: the final pose still says what the animation said. Loops stop and pointer or scroll effects turn off.
- Elements are `m.*` inside `MotionFeatures`, never `motion.*`.
- Animate only `transform`, `opacity`, `clip-path`, `filter` and SVG `pathLength`; pause offscreen loops and clean up every rAF, observer and GL context.
- Relative imports inside the package, no `@/`; a registry item must be copyable with only its declared dependencies (`registry:check`). Motion imports no icon or scene.
- Tests never sleep: wait for a condition or use fake timers (`pnpm check:sleeps` blocks new raw sleeps).
- New behavior ships with a story (a hero moment plus a "Reduced motion" story) and a docs page.

## Layout
```
src/index.ts, interactions.ts, backgrounds.ts, players.ts   public entry points
docs/ui-motion.md    API reference for UI authors: transitions, effects and presets
src/test/            SSR hydration cases, setup (imports core's), tests that span core and motion
src/components/youj/
  motion/               the primitives: Reveal, Stagger, Magnetic, TextSplit, …
  transitions/          SlidingIndicator, MorphLabel, Collapse, ContentSwap, PresenceList
  effects/              Spotlight, Shimmer, AsyncFeedback
  interactions/         ShimmerBorder, SpotlightCard, CursorFollower, PageTransition, Dock
  backgrounds/          shader and canvas backgrounds (MeshGradient, Aurora, …) and their shared GL helpers
  players/              Lottie wrapper
registry/<area>.json    registry item fragments per area, merged by scripts at build time
public/                 static assets (samples/ for Lottie files)
```

## Adding a component

1. Put it in its area's folder under `src/components/youj/`, with its story (`<name>.stories.tsx`) and test (`<name>.test.tsx`) beside it.
2. Export it from the entry for its area (`src/index.ts`, `interactions.ts`, `backgrounds.ts` or `players.ts`).
3. Add its registry item to `registry/<area>.json` (see "Registry fragments").
4. Run `pnpm -F @youj/motion verify`.

## Rules for every component
1. **Timing comes from `useYouj()`**: `k.tween('base','enter')`, `k.spring('snappy')`, `k.stagger('base')`, `k.ms('fast')`. Never hard-code ms, seconds or cubic-bezier values in component code. In CSS, use `var(--yj-duration-*)` and `ease-standard|enter|exit|emphasized`.
2. **Colors are semantic tokens only**: `bg-canvas`, `bg-surface`, `bg-well`, `border-line`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-accent`, `bg-accent`, `text-accent-contrast`, `text-success|warning|danger`. Icons use `currentColor`. For canvas/WebGL code, read the colors from computed CSS variables at runtime.
3. **Reduced motion is a first-class state.** If `k.reduced` is true, render a meaningful static or instant alternative. Don't just skip it: the final state must still communicate the same information. Loops stop, and scroll or pointer effects are disabled.
4. **Respect the time scale everywhere.** That includes rAF loops and shaders: multiply elapsed time by `1 / k.timeScale`.
5. **Accessibility:** decorative motion gets `aria-hidden`. Interactive pieces are keyboard-operable and have visible `:focus-visible` rings (`ring-2 ring-accent`). Animated text keeps its accessible text intact (e.g. `aria-label` on the wrapper, with split letters `aria-hidden`).
6. **Performance:** animate only `transform`, `opacity`, `clip-path`, `filter` and SVG `pathLength`. Pause offscreen loops (IntersectionObserver) and hidden tabs. Clean up every rAF, observer and GL context on unmount.
7. **Imports:** relative paths inside the package (so the source works both as a package and as copied registry files), core by source path (`@youj/core/lib/youj/provider`; the build points it at core's entry, and the registry at the app's `@/lib/youj/…`), plus `motion/react` and declared deps. Never the `@/` alias in package source. A registry item must be copyable on its own plus its declared dependencies.
8. **SSR-safe:** no `window`/`document` access during render.
9. **Motion elements are `m.*`** from `motion/react`, never `motion.*`, and the component wraps its output in `MotionFeatures` (`features="max"` for layout/drag), so apps load Motion's features lazily (see `lib/youj/features.tsx`). `lint:tokens` rejects `motion` imports.
10. Run `pnpm -F @youj/motion lint:tokens` after changes. Mark a justified exception on its own line with `// youj-allow: <reason>`. GLSL goes in `*.glsl.ts` files, which are exempt.

## Stories
- One `*.stories.tsx` per component, with a title under `Motion/<Name>` (the primitives), `Motion/Transitions|Effects|Interactions|Backgrounds/…`, `Players/…` or `Foundations/…`.
- Stories are the showroom: at least one **hero story** that looks like a real product moment, not a grey box. Also include Controls for every meaningful prop, and a "Reduced motion" story or note.
- Use `tags: ['autodocs']` and write a short description in `parameters.docs.description.component`.

## Registry fragments
Each area writes `registry/<area>.json`, which is a JSON array of shadcn registry items:
```json
{ "name": "reveal", "type": "registry:component", "title": "Reveal", "description": "…",
  "dependencies": ["motion"], "registryDependencies": ["youj-core"],
  "files": [{ "path": "src/components/youj/motion/reveal.tsx", "type": "registry:component" }] }
```
The `youj-core` item (tokens, provider, cn, theme, css) and `youj-presets` are core's (`packages/core/registry/`). `registry:check` (`scripts/build-registry.mjs`, on the shared `scripts/source-registry.mjs`) verifies that every import in an item lands in the item or its registry dependencies.

## Commands
`pnpm storybook` and `pnpm build-storybook` (repo root) · `pnpm -F @youj/motion typecheck|test|lint:tokens|registry:check|verify`

## Transitions, effects and presets (for UI authors)
- **Where things live:**
  - `src/components/youj/transitions/`: SlidingIndicator, MorphLabel (+ `useMorphRoot`), Collapse, ContentSwap, PresenceList/PresenceItem
  - `src/components/youj/effects/`: Spotlight, Shimmer, AsyncFeedback/useAsyncAction
  - Stories are titled `Motion/Transitions/<Name>` and `Motion/Effects/<Name>`.
- **`packages/core/src/styles/presets.css`** (imported by youj.css) provides the Base UI overlay presets as Tailwind utilities: `yj-pop`, `yj-tooltip`, `yj-dialog`, `yj-backdrop`, `yj-sheet-*`, `yj-toast*`, `yj-collapse`, `yj-fade`, `yj-duration-*`.
- **Timing contract:** see [packages/core/CONTRIBUTING.md](../core/CONTRIBUTING.md).
- **Entry points:** `src/index.ts` (primitives, transitions, effects), plus the `interactions`, `backgrounds` and `players` subpaths. Add new public APIs there; tokens, the provider, themes and labels are core's entries. Icons and illustrations are their own packages (`packages/icons`, `packages/illustrations`), which follow these rules too and run `lint:tokens` from core.
- **Reference:** [docs/ui-motion.md](docs/ui-motion.md) has the API and a Base UI snippet for every transition, effect and preset.

## Theming and sound
- The theming rules (canvas/WebGL colours through a probe plus `observeThemeChange`) and the sound cue bus are core's: `packages/core/CONTRIBUTING.md`. Components emit cues with `useSoundCue`; motion never imports `@youj/sound` or touches Web Audio.
- `YoujProvider motion={false}`: new components need nothing special, but state that is only shown through an animation (a tint, a mark) must also be correct as plain CSS/DOM.
