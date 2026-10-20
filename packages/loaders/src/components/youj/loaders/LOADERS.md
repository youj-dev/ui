# Loaders

Loading animations for `@youj/loaders`. Each one is a single file that draws a **scene**; the shared kit turns it into a component with the common API. Read `packages/motion/CONTRIBUTING.md` first (its motion rules apply) and `packages/core/CLAUDE.md` (tokens, the provider).

## Layout

```
loaders/
  kit.tsx          LoaderRoot: the status, the props, the canvas, the SVG still   (shared)
  label.ts         the shown label’s clock and effects                              (shared)
  field.ts         the engine: camera, light, the Depth buffer, pens, the ticker      (shared)
  glyphs.ts        the youj letterforms (logo.ts outlines) and an outline sampler     (shared)
  categories.ts    the categories, the techniques, LoaderMeta                      (shared)
  story-kit.tsx    loaderMeta, loaderStories, Stage and the controls, for stories      (shared)
  testing.tsx      describeLoader: the tests every loader passes                (shared)
  loaders.test.tsx runs describeLoader for every loader, and the set-wide checks (shared)
  <category>/
    <id>.tsx           the loader: meta, scene, component
    <id>.stories.tsx   its stories: a few lines on loaderMeta and loaderStories
    <id>.test.tsx      optional: tests of its own (describeLoader already runs for it in loaders.test.tsx)
    <helper>.ts        optional helper shared inside the category (shipped with the loaders that import it)
registry/loaders.json              the loader-kit item (shared)
registry/loaders-<category>.json   GENERATED, one item per loader. Don't edit
package.json "exports"           GENERATED, one `@youj/loaders/<id>` entry per loader. Don't edit those
```

Categories are fixed (`categories.ts`): `color` (loaders built around color), `depth`, `geometry`, `glyph`, `interface`, `mechanics`, `orbs`, `science`, `signal`, `software`, `waves`. A new loader adds files only in its category's folder. The shared files above (kit, engine, labels, glyphs, categories, story-kit, testing) change only in their own pull request, never as a side effect of adding a loader. `meta.order` is unique within a category (the generator fails on a repeat): take the next number after the category's highest.

## Adding a loader

1. Create `<category>/<id>.tsx` from the template below. The id is kebab-case and is also the file name. The component is `Loader` + its PascalCase name (`signal-drift` → `LoaderSignalDrift`).
2. Copy any sibling's `<id>.stories.tsx`, and rename the imports and the story title (`Visuals/Loaders/<Category>/<Title>`).
3. Run `pnpm -F @youj/loaders loaders:generate`. It writes `registry/loaders-<category>.json` and the package's `exports`, so the docs gallery, the registry (`npx youj add loader-<id>`) and the public entry (`@youj/loaders/<id>`) pick the loader up.
4. Run `pnpm -F @youj/loaders verify` (typecheck, token lint, `loaders:check`, registry closure and tests). Look at it in Storybook (`Visuals/Loaders/Gallery/Stage`, `args=id:<id>;size:240`) in both themes, at 24px and 240px, with reduced motion on, and with its label (`Visuals/Loaders/Gallery/Label`, `args=id:<id>`).

```tsx
'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'my-piece',
  title: 'My piece',
  category: 'geometry',
  technique: 'lines',
  tags: ['cube', 'wireframe'],
  description: 'One or two sentences: what it shows and how it moves.',
  order: 5,
} satisfies LoaderMeta

const depth = new Depth()
const p = point()

export const scene: Scene = {
  beats: 5, // one loop = 5 × the deliberate token (2.8s in the default theme)
  still: 0.4, // the frame shown before the script runs, and under reduced motion
  draw(pen, t, view) {
    const project = camera({ yaw: 0.6, pitch: -0.5, distance: 240, cx: view.w / 2, cy: view.h / 2 })
    // … add marks to `depth` (or draw straight to `pen`), then:
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1 }

/** One line on what it is. */
export function LoaderMyPiece(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
```

`meta` holds literals only (the generator reads it from the source). `technique` is how it's mainly drawn: `particles`, `lines`, `planes`, `paths`, `type` or `mixed`.

## The contract

- **API (from the kit; don't add props):** `size` (`sm` | `default` | `lg` or px), `color` (the primary color: the ink, any CSS color; the default is `currentColor`), `accentColor` (the secondary color: the `'accent'` tone, any CSS color; the default is the theme's accent), `colors` (a multicolored loader's extra tones, below), `speed` (multiplies the tempo), `label` (the accessible name, "Loading" by default, or several that take turns; `null` makes it decorative), `labelEvery` (loops per label), `showLabel`, `labelPosition`, `labelEffect`, `paused`, `fps` (a cap on frames drawn a second, for ambient use: 30 looks the same at about half the cost; time still runs at the tempo; default every frame), `className`, `style`. The root is `role="status"` + `aria-live="polite"`, named by its label. `FIELD_SIZES` is 24/40/64px. Another `aspect` (a wide waveform, say 2) is fine; then `view.w = 100 × aspect`.
- **The shown label is the kit's, not the scene's.** `showLabel` draws it centred under the drawing (`labelPosition`: `bottom` by default, `top`, or `start` / `end` beside it, logical so they swap under RTL), the gap growing with `size` (and, on a large drawing, the type a little). `labelEffect` moves it on the drawing's own phase, from the same tick (`label.ts`): `pulse` (default) sweeps a soft bell of the ink, with a touch of the accent, through the muted text once a loop (`emphasized`, over the first two thirds, then rests); `wave` lifts the letters in a gentle wave from the first to the last (a fifth of an em at most, no overshoot), then rests; `type` types it a letter at a time (an even cadence, a long label squeezed into half the loop) behind a square-cornered accent caret, holds while the caret blinks whole blinks, and the caret glides home (`emphasized`) taking each letter as it reaches it, so the seam falls on an empty line; `scramble` fills the line with glyph noise, resolves the letters out of it one at a time from the first, holds, and breaks back into noise that clears before the seam; `slide` rolls the line up at the seam like a counter, through a soft-edged window the height of the line; `none` holds still. The accent in the light and the caret is the secondary color. The drawn text is `aria-hidden` (the status keeps the plain label in a visually hidden span), stays one text run clipped at measured letter edges (so joined scripts keep their shapes and RTL types from the right), is static on the server, through hydration and under reduced motion, and joins the loop only at a moment that looks like the static label. Letters move one by one (wave, scramble's noise) only in scripts whose letters keep their shapes alone, drawn in a layer over the run at their measured places; Arabic and other joined or conjunct scripts take the nearest whole-word effect (wave the light, scramble a plain reveal).
- **Several labels take turns.** They're stacked in one cell, so the label is as wide as the widest and nothing around it moves. The first shows until the effect joins; then each shows for `labelEvery` loops and the next takes over at the seam, the effect carrying the change (the light dips, the letters lift away and rise in, the caret clears and types, the noise resolves, the line rolls), round and round. The status says the first; a later one only as it shows, in their order, once each and at least ten seconds after the one before, then it stays quiet (a polite live region that changed every loop would keep talking over everything else). A new `label` (a real change of state) is said at once. Under reduced motion the first shows, still, and the status keeps it: nothing changes on its own for someone who asked for less movement, and the first label is the meaning.
- **The scene:** `draw(pen, t, view)` draws the frame at loop progress `t` (0–1) in units: the view is 100 tall and `view.w` wide. It must be a pure function of `t` and `view`, with no clock and no randomness unless seeded. **The frame at `t = 1` must be the frame at `t = 0`**, which the test checks. Make periodic things whole cycles per loop: one turn, two half turns, a phase advancing exactly one spacing.
- **Tempo:** a loop of 1.5–3.5s in the default theme suits a loader: about 2.5 beats for a single gesture, up to about 6.5 for a small story (a cursor's errand, a pipeline's run). Judge it at real speed in Storybook: a recording made while the page's clock keeps running plays fast.
- **Time:** never milliseconds. A loop lasts `beats` × the deliberate token, divided by `speed`, so the theme's personality, the provider's time scale and `speed` all reach it, and a speed change carries on from the current frame. Ease with the theme's curves: `view.ease.standard | enter | exit | emphasized` (functions of 0–1). `span(t, a, b)` gives progress through a window, `mix` interpolates and `hump(t)` rises and falls once a loop.
- **Detail and crispness:** pick the level of detail from `view.size` (CSS px tall). Fewer, larger marks below 32px, a middle set up to 80px, and the densest set above that. Set sizes in CSS px and convert with `view.px`: a hairline is `1 / view.px`, a particle about `clamp(view.size * 0.036, 1.25, 2.6) / view.px`. Keep everything inside the frame (the test allows 6% overhang), and keep a frame to a few hundred marks.
- **Color:** the ink (`'ink'`, the `color` prop, `currentColor` by default) draws the structure, and the accent (`'accent'`, `accentColor`, the theme's accent) the one mark that matters. Around them a loader colors a few parts in theme roles: list them in `meta.colors` (`{ part, mono, role? }`, `c1` first) and pass `tones: meta.colors` in the spec; the scene draws them as `'c1'`–`'c4'`. They are off by default (each is its `mono` tone, exactly the two-color look); `colors="theme"` or a `colors` list turns them on. The theme roles are derived from the accent so they follow every theme: `c1` what moves or works, `c2` a second layer, `c3` success (a finished state), `c4` rare (unless a part names its `role`). `blend(a, b, k)` mixes two tones (cached, fine every frame) for pulses, settling and gradients. `colors` turns the parts on (`'theme'`) or sets their colors in order (an empty entry keeps the theme color). The rules: one companion hue for most loaders, on thin or small marks, moving with the loop, never blended into the accent, and only blended with what it stands in for so the default look is exact. Loaders in `color/` are about color and may use two or three hues. Vary brightness with alpha. No raw colors (`lint:tokens` fails them).
- **Depth:** project 3D points with `camera({ yaw, pitch, roll, distance, cx, cy })` into a reused `point()`. Near is larger (`p.k`) and brighter: fade alpha by `p.z`. Collect marks in a module-level `Depth` and `flush(pen)` once a frame. It draws far to near, and marks at equal depth keep their order.
- **Marks (`Depth`, or `Pen` directly):**
  - `square(p, side, alpha, tone)`: the brand's square particle.
  - `dot(p, r, alpha, tone)`
  - `line(a, b, width, alpha, tone)`: hairlines and wireframe edges.
  - `path(xy, z, stroke)`: a stroked polyline. `stroke` is `{ width, alpha, tone, closed, dash, offset, cap, join }`.
    - To draw a path on: `dash: [shown, length + 1]` with `offset: -start`, where `length = polylineLength(xy, closed)`.
  - `poly(xy, z, alpha, tone, solid)`: a filled shape. `solid` hides what's behind it: the paper (`--yj-anim-paper`, the surface by default) goes down opaque first, then the ink at `alpha`.
  - `face(xy, z, light, tone)`: a solid face of a lit solid, with `light` from `lambert(...)`. It paints opaque, on the paper, so nothing shows through and the live frame matches the still.
    - The pen turns light into the right amount of ink for the scheme: a lit face is light in dark mode and in light mode, never inverted. Don't shade a face with alpha.
    - For the light, carry the face's world normal into view space with `orient({ yaw, pitch, roll })` (the camera's own angles), then `lambert(...)`.
    - Skip back faces when the oriented normal's z is ≤ 0 (or use `facing(a, b, c)` on projected corners).
- **Helpers:**
  - `seeded(n)`: a deterministic random (scenes stay a pure function of `t`).
  - `roundedRect(x, y, w, h, r)`: a UI shape's outline.
  - `projectPath(points, project)`: a 3D polyline to screen points plus its mean depth.
  - `span`, `mix`, `clamp`, `hump`, `TAU`.
- **Letterforms:** `glyphs.ts` has every letter's outlines (`WORDMARK`: y, o with its counter, u, j), the o's on their own (`O_OUTER`, `O_INNER`, `O_BOX`), the word's box and the j's `TITTLE`, plus `flatten(d)` and `sampleOutline(d, n)` (evenly spaced points). A test holds them to `docs/brand/logo.ts`. `glyph/word.ts` has them flattened, with the type metrics.
- **Reduced motion and the server:** the kit renders `scene.still` once as SVG: on the server, before the script runs, and as the whole of reduced motion. Choose a still that reads as busy (mid-move, depth showing), not an empty frame. Solid planes in the still mix the ink with `--yj-anim-paper` (the surface by default), because SVG can't cut out what's beneath.
- **Performance:** nothing runs offscreen, in a hidden tab or while paused (the kit owns that). Where one plays for a long time beside others (a hero, a dashboard), `fps={30}` halves its drawing. Allocate geometry at module level, per level of detail, not per frame. No DOM, canvas or `window` access in a scene.

## Names and quality

- **Original names, rooted in Youj:** the square-cornered letterforms and the j's square tittle, the isometric illustration language, the docs' blueprint frame (crop and registration marks, dimension lines), the motion tokens, and interface ideas (cursors, focus rings, layers, a build pipeline, a caret, a waveform). A word or two. Never another library's loader names, and never recreate another library's piece.
- **Variety:** particles are one tool among many. The test keeps them to about a quarter of the set, so prefer lines, wireframes, dashed paths, line-shaded surfaces, flat-lit planes, type and interface motifs.
- **The bar:** real depth where there's 3D, restraint (ink, one accent, a quiet companion hue), a perfect loop, crisp at 24px and handsome at 240px, in light and dark and in every preset. Motion is "precise & kinetic": confident, landing precisely, no overshoot except an arrival.

## Tests

`loaders.test.tsx` runs `describeLoader` (`testing.tsx`) for every loader it finds, so a new loader needs no test file. A loader drawn wider than tall adds its `aspect` to `ASPECTS` there. Behavior specific to one loader goes in its own `<id>.test.tsx` (call `describeLoader(LoaderMyPiece, meta, scene)` there too; the set run then skips it).

It checks:

- The status and its label: name, `showLabel` (drawn under the drawing, `aria-hidden`), `label={null}`.
- `size`, `color` and `paused`.
- Live canvas versus reduced-motion SVG still, and cleanup on unmount.
- The seamless loop (t = 1 equals t = 0).
- That it draws, finitely and inside its frame, at 16–160px and at several moments.

It also checks the set: placement, names, exports, the entries and the particle share. `kit.test.tsx` checks the kit itself: both colors, and the shown label (its positions, each effect on a hand-driven ticker, in both directions and in a joined script, several labels taking turns, reduced motion, the server's HTML and what assistive technology hears). Add a test of your own only for behavior specific to your loader.
