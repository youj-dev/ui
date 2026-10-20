# promo

The Youj promo film, its square cut, the homepage hero loop, the topic loops, their posters and the social images. They're rendered with [Remotion](https://www.remotion.dev) from the real `@youj/core`, `@youj/motion`, `@youj/loaders` and `@youj/react` source. Nothing on screen is a mock-up: the easing curves and springs, the theme contract, the icons, the components, the hero examples and the theme presets are the library's own, driven frame by frame.

```bash
pnpm -F promo studio            # Remotion Studio: previews in real time, approximately
pnpm -F promo render            # every deliverable, to apps/promo/exports/review for approval (the site's files in review/site, the rest in exports/)
pnpm -F promo approve           # after review: approved videos and posters to exports/approved, manifest.json and og.png to apps/docs/public/promo
pnpm -F docs media:upload       # maintainers only: hosts the approved files and records them in apps/docs/lib/media.json
pnpm -F promo render masters    # or any steps: masters encode posters stills captions publish verify check
ONLY=hero-loop pnpm -F promo render masters encode posters publish verify
ONLY='loop-themes*' pnpm -F promo render masters encode posters publish verify check
ONLY='loop-*-tall' pnpm -F promo render masters encode posters publish   # the social cuts, to apps/promo/exports
pnpm -F promo verify            # typecheck and tests
pnpm -F promo cues              # after the Glass pack changes: the sound loop's waveforms, decoded from the pack
```

`out/` (gitignored) holds the PNG masters, the encodes and the frames `verify` and `check` decode. Only `publish` writes outside it, and only to `apps/promo/exports` (gitignored, local only): the site's own files to `exports/review/site` (carrying over what it didn't render from `exports/approved`, so `ONLY` never drops anything), the rest to `exports/`, and a `manifest.json` from what the site plays. **Nothing is published from a render.** The review-first rule holds: you look at `exports/review`, and only then `pnpm -F promo approve` copies the approved set to `exports/approved` (and `manifest.json` and `og.png` to `apps/docs/public/promo`), and a maintainer's `pnpm -F docs media:upload` publishes those videos and posters (the site reads `apps/docs/lib/media.json`).

**No numbers on screen that the library can outgrow.** Counts, sizes and versions go stale the day an icon or a component is added, so the film, the loops and the stills say what they show in words ("Icons that move with intent", not a count). The icon wall is fitted between the HUD and its caption, so a bigger set scales the wall rather than running under either. The products' own content (Folio's inbox, a table's rows) is theirs.

## What it makes

The site plays two things: the homepage film and each topic's wide loop. Once approved, their videos and posters are served from the media host; `apps/docs/public/promo` keeps only `manifest.json` and `og.png` (`apps/docs/components/landing/promo-files.test.ts` checks it, and that every file the manifest names is published). Everything else renders to `apps/promo/exports`.

| The site's set (`exports/review/site`; published once approved; `manifest.json` and `og.png` in `apps/docs/public/promo`) | What |
| --- | --- |
| `home-film.av1.webm`, `.webm`, `.mp4`, `.jpg` and `home-film-light.*` | The homepage film, in its "In motion" section: 1280×720 at 30fps, 22s, seamless, silent, one per scheme, each file under 1.25 MB. See [HOME-FILM.md](HOME-FILM.md) |
| `home-film-v2.*` and `home-film-v2-light.*` | Its second version, with the kit as it is now (an isometric scene, the ActionIsland, a loader animation, the sounds drawn as waveforms, the motion personalities): 25s, the same stage, format and budget. Once rendered, the manifest's `home` names it instead of the first. See [HOME-FILM-V2.md](HOME-FILM-V2.md) |
| `loop-<topic>.av1.webm`, `.webm`, `.mp4`, `.jpg` | A topic loop (`icons`, `themes`, `motion`, `components`, `illustrations`, `sound`, `entrances`): 1280×720 at 30fps (the icons loop at 60), 10 to 12s, seamless, muted, each file under 1.25 MB, for the top of its docs overview. Only `sound` has a track (see below) |
| `og.png` | 1200×630: the lockup and tagline beside the tokens specimen |
| `manifest.json` | What the site plays, with each file's size, bytes, codecs and alt text. `home` names the homepage film by scheme (`dark`, `light`); `loops` names each topic's wide cut (`loops.<topic>.wide`; the readers also take `tall` and `tile.dark` / `tile.light`, all optional, if a manifest names them); `images` and `og` name the OG image. Every video is `muted: true`; one with a track also has `audio: true`, and its sources name the track's codec (`vp9, opus`, `avc1.…, mp4a.40.2`) |

| In `apps/promo/exports` (gitignored, local only) | What |
| --- | --- |
| `loop-<topic>-tall.*` | The same loop laid out for a 4:5 post, 720×900: the social cuts (the site doesn't play them; the sound loop's with its track) |
| `loop-<topic>-tile.*`, `-tile-light.*` | The same loop as a 960×384 strip for a homepage tile, in each scheme, each file under 0.75 MB, always silent. The homepage's tiles are live sketches, so the site doesn't play them (`<Family>` plays a strip when given `loops`) |
| `promo.webm`, `.mp4`, `.jpg`, `.vtt` | The film: 1920×1080 at 60fps, 77s, silent, with captions for what it shows |
| `promo-square.webm`, `.mp4`, `.jpg` | The square cut, 1080×1080, 38s: the origin, the icons, Save and the motion personalities, Tandem in three presets and the promise, laid out for the square (not cropped) |
| `hero-loop.av1.webm`, `.webm`, `.mp4`, `.jpg` | The homepage loop: 1920×1080, 11s, seamless, no titles, and each file under 1.25 MB: one icon morphs star, heart, bell, then the whole set plays in a wave |
| `social-tokens.png`, `social-icons.png` | 1080×1080: the specimen, and the icon wall under a line in words |

The homepage's film section reads `home` (`readHomeFilm()`) and plays the cut in the page's scheme. `readLoops()` reads `loops`: an overview shows a loop only when its wide cut is published. A loop's title, like the film's, is its accessible label.

Every video is encoded three ways at 30 fps (the masters are 60; the loops' motion is eased and slow enough to hold it), except the icons loop, whose pans and swipes are too fast for 30 and stays at 60 (`KEEP_60` in `scripts/render.mjs`): AV1 (`.av1.webm`, SVT-AV1), VP9 (`.webm`) and H.264 (`.mp4`, High, faststart), all BT.709 and tagged as such, all silent (`-an`). Each has a small cut for phones next to it (`<name>-sm.*`: 854×480 wide, 640×256 tiles). `manifest.json` lists the sources in the order a player should take them: the small cut first (each with `media: "(max-width: 640px)"`, which `LoopVideo` checks itself, since browsers ignore `media` on video sources), then AV1, VP9, H.264. Each poster is an AVIF, a WebP (when `cwebp` is installed) and a JPG at each of those sizes, described by `poster.srcset` in the manifest. `FROM=<dir>` encodes from published 1080p60 MP4s instead of the masters (for when the masters aren't at hand; a generation is lost, so re-render when you can). The masters stay lossless PNG until the encoder.

### Social cuts and other exports

`publish` puts every export in `apps/promo/exports/` (not `review/site`) and leaves it out of `manifest.json`. The folder is gitignored, so it stays on the machine that rendered it and nothing in it is deployed. Which cuts go where is `destination` on each cut in `src/loops/beats.ts` (`to` on the videos and stills in `scripts/render.mjs`). To render the 4:5 loops for posts:

```bash
ONLY='loop-*-tall' pnpm -F promo render masters encode posters publish
```

Each lands in `apps/promo/exports/` as `loop-<topic>-tall.mp4` (H.264, which social platforms take), `.webm` and `.av1.webm`, and its poster (`.jpg`, `.avif`, `.webp`). `ONLY` takes comma-separated names, and `*` stands for any run of characters: `loop-icons-tall` is one loop, `'loop-*-tile*'` every tile strip (`loop-*-tile` and `loop-*-tile-light`), `'loop-*-tall,loop-*-tile*'` both. Quote it, so the shell leaves the `*` alone. The portrait cut is encoded at the web size (720×900) under the same budget as the site's; the lossless masters `masters` leaves in `out/master/loop-<topic>-tall` are 1080×1350, if a post wants the full size.

## The film

From the atom to the product: about two thirds foundations (motion, tokens, icons, components), then the payoff (the same parts composed, and three products through the presets). One subject per shot; close-ups are locked off or push in slowly. Each chapter starts while the one before is leaving; every beat is in `src/film/beats.ts`.

| From | Chapter | What happens |
| --- | --- | --- |
| 0:00 | origin | On a keyline grid the emphasized easing curve draws itself, the settle spring plots over it, and the graph resolves into the mark; the lockup forms and takes the HUD |
| 0:07 | tokens | A living specimen of the theme contract (type, colour ramps, control sizes, radius, motion) retunes Basalt → Graphite → Brutal → Basalt, then pushes into its icon board |
| 0:18 | icons | Match cut to one icon at macro on its drawing board, morphing star → heart → bell; bell, loader and check play their states; pull back to the whole set as a wave passes |
| 0:28 | components | A close-up each: Button's onAction (saving → saved), Tabs, a Popover from its trigger, the toast stack, InputOTP, a DataTable re-sort, the command palette; then the same presses in precise, calm and lively side by side, and reduced motion joining as a calm crossfade |
| 0:51 | composition | The parts fly into one Security block: "made of the same parts" |
| 0:55 | themes | The block becomes a window. Tandem (a task dragged two days, dependents glide, the verdict turns) in Basalt → Graphite; Folio (letters filed with E) in Graphite → Terminal; the Ledger (drivers selected, the band moves) in Terminal → Brutal → Basalt light. Each preset opens as a circle from the picker's key |
| 1:12 | end | The lockup comes home over the tagline; `npx youj init` decodes and is copied |

The square cut keeps the origin, the icons, Save and the personalities (two excerpts of the same bench), Tandem in three presets and the end. The loop is the icons chapter's field on a round trip, simulated from a short pre-roll: its last frame leads straight back into its first.

**The products** are the hero examples exactly as the docs ship them (`src/film/products.tsx`: which ones, their addresses, and what to scroll into view), each laid out at a laptop's viewport (1280×800, 810 wide in the square) and scaled into the window. Each preset is a copy of the product in its own ThemeScope, under the one showing; `scenes/themes.tsx` works every copy with the same events at the same frames (the drag, the keys, the clicks), so the copies agree when the circle opens. Their toasts would double, so the film's Toaster sits the chapter out. To swap a product, change `HEROES` and its moment in `THEMES_SCRIPT` / `MOMENTS`.

## The topic loops

One loop per part of the kit, each built from the film's own scenes and parts, each ending on the frame it starts on (at rest, so the seam is exact, and that frame is the poster; the sound loop's tape never stops, so its last frame is exactly one step of it before its first). Every beat is in `src/loops/beats.ts`; each scene is laid out for all three cuts.

| Loop | What happens |
| --- | --- |
| `icons` | At macro, the camera steps along a row of drawing boards and each icon plays as it arrives: menu to close, play to pause, the bell rings, the check draws, then two of the newest (a battery charging, an arrow hitting its target). It pulls back until the set fills the frame as a ripple spreads from the last board, then pushes back in to the menu as a second wave gathers toward it |
| `themes` | The registry's Usage & billing block under an app bar, in the Youj palette and the Bezel style, in the page's mode. Lines wipe across it one after another, each carrying one layer of Cinnabar in the Brutal style and named as it goes (colour, the chart palette, radius and density, type, stroke and shadow, then the style, bezel to classic), while the camera leans in. It pulls back as three lines slide in and stop a quarter apart: Youj in Bezel, Heather in Clean, Seaglass in Terminal and Cinnabar in Brutal side by side on the one screen. The pointer sets the chart to seven days and its bars regroup in every look at once; a line rises to the middle, and below it each look is in the other mode (light, or dark on the light tile), tuned for it rather than inverted; the chart goes back to thirty days. A last line brings Youj and Bezel home as the camera leans in again |
| `motion` | Close-ups, each about half the frame: Save through saving to saved, the tab underline gliding, a switch, a dialog opening and closing, toasts stacking, a list re-sorting. Then the same list twice, with motion and under reduced motion, where the change lands at once |
| `components` | A security settings screen, whole; someone saves. It comes apart into its components, which wait on their own, then fly back in on the settle spring as its surface draws in around them |
| `illustrations` | Every scene in the registry on one isometric floor, a plot each. At macro a house gives way to a present, which assembles piece by piece, comes apart as it does on hover (the lid lifts off the open box) and closes. The camera pulls back until a few dozen scenes fill the frame, the rest of the library assembling around it in a ripple, each scene as it comes into view. It holds while lines sweep the floor under the scenes, and each scene takes the preset its line brings as it passes: Graphite, Terminal, Brutal, then Basalt again. The library fades as the camera pushes in to the house on the next plot, at rest, as it began |
| `sound` | Five real components stand one above the other at a playhead, each over its own strip of tape: Send, a switch, a Day, Week and Month segmented control, Publish and a toast. The score comes in from the right, faint. As each note reaches the playhead its component plays it, the way someone would (a press, a click, a promise settling, a toast arriving), and the note, that cue's real waveform, lights in the accent as it passes and settles back into the score. At macro the camera steps down the parts (a press, toggle on, a choice, Publish's press and its success); as it pulls back to all five, each part plays once its lane is in frame (a choice, an arrival, toggle off, a press); Publish is pressed again and fails, and the camera pushes back in to Send, at rest, as Send presses once more |
| `entrances` | One dashboard built once, each part by a different entrance look on the motion package's shared runtime, handing over like a relay. It starts finished, with `npx youj add blueprint` under it, and dissolves to the empty paper. The frame is drafted in Blueprint pencil; as its ruled edge sweeps down, a Trace signal comes in beside the frame and lights the sidebar; a signal runs on to the stat cards, which lock in with Prism; another to the chart, which builds through the render passes (layout, paint, composite); another to the list, whose rows appear through the Inspector's box models. The screen tilts back to Layers' angle, the stack rises out of it and collapses into the finished dashboard. Each look runs on the dashboard's real DOM, paused and moved to the loop's moment with `seek`, so renders are frame-exact |

The tile cut is a 2.5:1 strip for tiles 224px tall and 273 to 559px wide, cropped from the middle: what matters sits in its middle 546px (the narrowest tile), and each loop frames its subject bigger there (the icons at macro, the daily-cost chart, the close-ups larger). The themes loop's copies of its screen are made once, each in its own ThemeScope; only their clips move, and each is mounted only around the frames it shows.

### The sound loop

- **The waveforms are the pack's own.** `pnpm -F promo cues` decodes each Glass MP3 exactly as the SoundProvider gets it, starts it where the player starts it (the first sample within 50 dB of its peak, less a millisecond), and writes the highest and lowest sample in each 0.5 ms to `src/loops/sound-cues.ts`, with a hash of each file so a test knows when it's stale. The scene draws them on a true time axis (240 stage px a second) and on one amplitude scale for every cue, so a press is a spike, a toggle shows its two taps and an outcome rings on.
- **The parts really play them.** The scene listens on the cue bus (`SoundCueContext`) and a render stops at any note whose part didn't emit its cue on the note's frame. Every note lands on a beat (100 BPM, twenty beats); `SOUND_LOOP` in `src/loops/beats.ts` holds the score, and its tests hold the parts' states round the seam.

## Stages

Every composition is laid out in CSS px and rendered at a device scale, so the UI is the size a laptop shows it rather than blown up:

| Stage | Laid out at | Scale | Renders at |
| --- | --- | --- | --- |
| Film, topic loops | 1440×810 | 4/3 | 1920×1080 |
| Square cut, social squares | 810×810 | 4/3 | 1080×1080 |
| Hero loop | 1200×675 | 1.6 | 1920×1080 (reads at the homepage's ~1100px) |
| Topic loops' portrait cut | 864×1080 | 1.25 | 1080×1350 |
| Topic loops' tile strip | 1120×448 | 1 | 1120×448 |
| OG image | 960×504 | 1.25 | 1200×630 |

`src/film/format.ts` holds the stages; `useFormat()` tells a scene which one it's on. Every stage is at least 864px wide: media queries answer to the stage, not to the window a scene draws an app in, so the apps lay out at their desktop breakpoints.

## How the real library renders frame-exactly

Remotion renders frames out of real time, in several browser tabs at once. The components animate on Motion's frameloop, on CSS transitions, on their own rAF loops and on timers. So while rendering, `src/sim/clock.ts` (the entry's first import) replaces the clock they read:

- `performance.now()` returns virtual time, and `requestAnimationFrame` queues into a virtual frame that only a step runs. Each frame a step runs gets its own timestamp (a microsecond apart; the next step starts exactly on time): Motion does its layout work once per timestamp, so frames sharing one would skip an instant layout transition. Remotion's renderer still gets real frames and real timers for its own waits.
- `setTimeout` and `setInterval` fire on virtual time, in order, as a step reaches them. `Date` reads a fixed morning (9:41) plus virtual time, so "9:41 AM" and "2 min ago" never change between renders.
- WAAPI is hidden from Motion, so every Motion animation takes its JS path on that frameloop.
- CSS and WAAPI animations are paused as they appear and seeked to virtual time.
- `Math.random` is seeded per frame.
- The browser renders whenever it likes, and each screenshot resizes the viewport for a moment. So ResizeObserver and IntersectionObserver reports are held and handed over at fixed points in a step (only what really changed, resize reports first, each kind in the order its observers were made). An IntersectionObserver report the browser has queued but not yet sent is taken then too. Styles are brought up to date after every DOM change, resize events never reach the page, and media queries keep their first answer.

Components hold state (a spring mid-flight, a popup still leaving), so `<Simulation>` (`src/sim/simulation.tsx`) replays the composition from frame 0 to the frame Remotion asks for, one step per frame. A step starts by letting whatever the last one left queued run (in the tab that captured the last frame, it ran during the capture). It settles before it ends: it takes real rendering updates until one passes with no DOM change, no observer report and no animation starting or finishing. Nothing of the library runs between steps, so a frame doesn't depend on which tab rendered it or how busy the machine was. Frames of the film re-rendered on their own (each replayed from frame 0 in a fresh tab) match the master rendered in chunks at `--concurrency=10`: of five checked across the chapters, four are byte-identical and one (mid-drag in the products chapter) differs only in antialiasing, at 59.1 dB PSNR. The `check` step does the same for the topic loops on every render: three frames of each cut, each rendered on its own, against its master (identical, or at least 50 dB).

**Rules for scene code:**

- **Read time with `useFrame()`**, never Remotion's `useCurrentFrame()`. Mount chapters with `<Seq>`, and ease values with `src/lib/timing.ts`.
- **Act like a user or an app would.** From `useAction(frame, fn)`, set props, call `toast()`, or use `src/film/user.ts` (pointer moves with enter and leave events, presses, keys, typing). `<Cursor>` moves the visible pointer and sends the same events along its path. Don't reach into a component.
- **Don't re-render an example app every frame.** Keep its element in a module constant (`const MAIL = <MailExample />`); its own animations run on the clock without the scene's help.
- **Scale with `<Camera>`.** It is a plain CSS transform plus `MotionConfig transformPagePoint`, so Motion's layout animations (sliding indicators, morphing labels, presence lists) measure correctly at any magnification. Popovers portal into the camera through their `container`; the Toaster is zoomed to match through `--film-toast-zoom`.
- **Keep viewport units out of anything that transitions.** A screenshot moves them for a moment, which restarts the transition. Inside a `<Window>`, `promo.css` maps the apps' `vh`/`dvh` heights to the window, and pins the palette's list cap.
- **Keep class names literal.** Tailwind scans the source.

## Where things live

```
src/brand.ts          name, npm scope, module names, tagline and install lines: the one place to rename
src/film/beats.ts     every beat in frames at 60fps; import-free, so the pipeline reads it too
src/film/products.tsx the products in the window (the hero examples), and what each scrolls into view
src/film/scenes/      the chapters, one file each
src/film/             the film (film.tsx), the travelling lockup (brand.tsx), and what scenes share:
                      window, camera, cursor, user input, moments and captions, stage formats, backdrop
src/loop/, stills/    the hero loop, the OG image and the social squares, built from the same scenes
src/loops/            the topic loops: their beats, cuts and titles (beats.ts), one scene each
src/sim/              the virtual clock and the Simulation
src/proof/            Checks/Proof: icons, a decoding line and a CSS transition, for determinism
src/styles/promo.css  the Tailwind root (youj.css, ui.css), the layer slicing and the film's overrides
scripts/render.mjs    the pipeline; scripts/sheet.mjs makes contact sheets for reviewing choreography
exports/              gitignored: what `render publish` puts here, the cuts the site doesn't play
```

The Scenes folder in the Studio has the origin, the bench (parts and assembly) and the products chapter on their own, and Stills has the OG image and the social squares.

## The brand

The name, npm scope, package names, tagline and install lines (`npx youj init`, `npx youj add button`) live in `src/brand.ts`. Every on-screen line, install command, caption, alt text and manifest entry comes from there. The lockup is the motion package's own logo component, sized from its `LOCKUP_EM` and imported once in `src/film/brand.tsx`, so the film always draws the library's current wordmark. When its geometry changes, `pnpm -F promo render` re-renders and republishes everything.
