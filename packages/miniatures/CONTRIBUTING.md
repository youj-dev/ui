# Working on @youj/miniatures

What it is: interactive isometric objects on one shared engine, each drawn in its own shadow root, one entry per miniature (`@youj/miniatures/turntable`) and a metadata catalogue at the root. What they do for users is in [README.md](README.md).

## House rules

What typically drifts here. The root [Principles](../../CONTRIBUTING.md#principles) apply too.

- Edit `src/figures/<id>.ts` and `src/meta/<id>.ts` directly, then `generate`. The component, `exports` and catalogue are generated and `generate:check` fails when stale.
- One shared engine (`src/engine`) and its iso helpers (`kit.ts`, `projection.ts`). Use the isometric projection; do not reimplement it per figure.
- Nothing from Youj: React is the only import (`package.test.ts`). Follow the page theme and reduced motion by reading `data-yj-reduced` and `--yj-motion`.
- Never reach outside the host: no page key handlers, no global listeners that outlive the miniature, no `AudioContext` before a gesture, nothing written to `<html>` or `<body>`.
- Naming: `Miniature<Name>` with the props `mode`, `autoPlay` and `reducedMotion`. The caption (name, keys, readout) belongs to the page, not the component.
- Each miniature keeps its story and a test with `describeMiniature`. After a change run `pnpm api:update` and commit `api/`.

## Layout

```
src/figures/<id>.ts          the drawing: CSS, defs and script
src/meta/<id>.ts             name, spec, key hints, viewBox
src/<id>.tsx                 the component (generated), <id>.stories.tsx, <id>.test.tsx
src/engine/                  the shared engine: one copy per app
scripts/                     generate, size
```

## Adding or changing a miniature

Edit `src/figures/<id>.ts` and `src/meta/<id>.ts`, then run `pnpm -F @youj/miniatures generate`. It writes the component, the `exports` lists and the catalogue, and `generate:check` (part of `verify`) fails when any is stale. Keep the story and the test next to it, and keep `describeMiniature` in the test. "What a miniature is" below has the five files.

## Commands

`pnpm -F @youj/miniatures typecheck|test|generate|generate:check|size|verify`. After changing a miniature, also run `pnpm api:update` at the root and commit `api/youj-miniatures.api.md`.

**Edit `src/figures/<id>.ts` (and `src/meta/<id>.ts`) directly.** The figures began as standalone HTML prototypes; those are no longer in the repo, and there is no porting script. The HTML prototypes these figures were ported from were drawn for this project; nothing is taken from third parties.

## What a miniature is

A figure began as one HTML page: a stylesheet, an `<svg id="machine">`, a caption (name, readout, key buttons) and a script that draws the object and runs it. A miniature keeps that stylesheet and script, kept verbatim, running inside a React component that stands in for the page. Five files per miniature:

| File | What | Written by |
|---|---|---|
| `src/figures/<id>.ts` | the prototype's CSS (minus the page chrome), its extra `<defs>`, and its script (minus the engine prelude), exported as one `FigureModule` | `generate` / by hand |
| `src/meta/<id>.ts` | the metadata: name, model, maker, spec, label, description, key hints, first readout, viewBox, `progress` | `generate` / by hand |
| `src/<id>.tsx` | the component (`<MiniatureTurntable>`), its handle and key types, re-exporting the metadata | `generate` / by hand |
| `src/<id>.stories.tsx` | Storybook: `Miniatures/<Name>`, as the showroom shows it, light, dark, and still | scaffolded, then yours |
| `src/<id>.test.tsx` | the miniature contract (`describeMiniature`) plus what this figure does, key by key | scaffolded, then yours |

`package.json` lists each miniature in `exports` and `publishConfig.exports`, and `src/index.ts` (the catalogue) lists its metadata. `pnpm -F @youj/miniatures generate` writes the component, both lists and the catalogue from `src/meta/<id>.ts` (so a changed description or key hint reaches the component's JSDoc), and `generate:check`, part of `verify`, fails when any is stale. The weather station's component is hand-written (its `wind` prop) and the generator leaves it alone. `src/package.test.ts` fails until all of it is in place.

## How it runs

`src/engine/` is shared by every miniature (one copy per app):

- `miniature.tsx`: `useMiniature`, the controller every miniature runs on (it mounts the figure into the host on the client, keeps the props it reads live through refs so changing one never redraws it, publishes the snapshot and exposes the handle), and the `Miniature` shell every component renders with it: a host `<div>` sized by the viewBox's aspect ratio (that's all the server renders).
- `env.ts`: mounts a figure into the host's **shadow root** and gives its script the page it expects (see its header for the full table). `document.getElementById('machine' | 'drawing' | 'readout' | 'state' | 'announcement')` are the svg, its drawing group, the snapshot store's two lines and a live region; `document.documentElement` is the shadow root's wrapper, `.yjm-root` (so `:root.night` modes land there); the caption's `[data-k]` buttons are stand-ins that record `aria-pressed` in the snapshot; key listeners go to a bus the `keyboard` prop routes; window `pointerdown`/`click` listeners go to the host; `window.AudioContext` is nothing until `sound` is on and someone interacted; `window.figure = { setProgress, done }` becomes the handle's; `matchMedia` answers the host's mode and reduced motion; `requestAnimationFrame` and timers run on a clock that holds offscreen and stops on unmount. Everything else is the real document and window.
- `css.ts`: adapts the figure's CSS for the shadow root at runtime: `:root` → `.yjm-root`, dark blocks under `[data-dark]`, reduced-motion blocks under `[data-reduced]` (both set by the env from the props, the page's theme and the OS, inside `:where()` so specificity is untouched), root tokens themeable as `--yjm-<token>`.
- `kit.ts`, `projection.ts`: the drawing helpers (P, TOP/FRONT/SIDE, el, group, rect… box, cylinder, frame), typed.
- `defs.ts` (the shared stage gradients and soft/glow/bloom filters), `palette.ts` (the shared materials and the night-studio `relight`), `keys.ts`, `media.ts`, `audio.ts`, `clock.ts`, `store.ts`, `types.ts`.

A figure body is ported JavaScript under `// @ts-nocheck`: its types live at the boundary (`FigureModule` in, the handle and snapshot out), and it's checked by the contract tests and by pixels instead.

## Figure notes

What the shadow-root environment does for the figures that need more than the default:

- **weather-station**: its wind setting is an `<input type=range>` in the caption (`getElementById('wind')`, `'windSetting'`) and its `max-width` block styles it; make the wind a part (a dial on the station) or keys only. Its `box` differs (kept automatically).
- **mixing-desk**: a tuned glow filter; handled (`sharedDefs: false`).
- **telescope**: frames itself; handled.
- **packaging-line**, **repair-bench**: set `window.figure` like the hourglass, so they're progress indicators (`progress: true`, `MiniatureProgressHandle`); test `setProgress`/`done` as `hourglass.test.tsx` does.
- **home-router**, **nas**, **network-switch**, **sbc-cluster**, **tape-library**, **workstation**: the `<svg>` starts with a class (`svgClass`, carried over).
- **greenhouse**, **lighthouse**, **nixie-clock**, **weather-station** (and the server cabinet) put night or lights-out modes on `document.documentElement`, and **stage-synth** a CSS variable: they land on `.yjm-root`, and its `:root.night` CSS follows. Pass `stage` in stories so the room goes dark with them.
- **instant-camera**, **microscope**, **mixing-desk**, **robot-arm**, **telescope**: read `document.activeElement`; the env answers with the focused element inside the shadow root.
- **orrery**, **pinball**, **pipe-organ**: window `blur`, `pointerup`, `pointercancel` listeners go to the real window (a drag can end outside), and are removed on unmount.
- 19 figures animate with CSS `@keyframes` (blinks, spins): they run as written in the shadow root.

## Rules

- A figure body started as its prototype's script, verbatim. Change the drawing or behaviour in `src/figures/<id>.ts` itself.
- The component is the drawing and its behaviour. Its caption (name, keys, readout) is the page's, from the metadata and the snapshot.
- Never reach outside the host: no page keys (the env routes them), no global listeners that outlive the miniature, no `AudioContext` before a gesture, nothing on `<html>` or `<body>`.
- Nothing from Youj: React is the only import (`package.test.ts` checks).
- Components take the `Miniature` prefix (`MiniatureTurntable`, like `LoaderVortex` and `IllustrationBank`) and the props `mode`, `autoPlay` and `reducedMotion`, as the provider has them. They follow its reduced motion by reading `data-yj-reduced` and `--yj-motion`, with no Youj import.
- Miniatures are shown at `/miniatures` on the docs site.
