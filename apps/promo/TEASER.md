# The launch teaser: "Signal"

A silent, wordless teaser for LinkedIn and other feeds. The screen tunes in, and every cut is a glitch that lands a change: a theme, a component style, an icon's shape, a gallery loader. Four beats build up on a 120 BPM grid, then the signal drops and the wordmark comes up in the quiet.

- **1920 × 1080, 60 fps, 15.0 s (900 frames), H.264, no audio track.** It's laid out on the film's wide stage (1440 × 810 at 4/3), so the UI is the size a laptop shows it, then pushed in by the camera.
- **Why 60 fps:** springs, the tab indicator and the icon morphs play smoothly at 60. Every glitch state holds for two frames and every cut lands on an even frame (a test checks this), so a platform that re-encodes to 30 fps keeps every tear and flash.
- **No words** except the wordmark and `youj.dev` at the end. The components are the icon-only, text-free variants: a switch, icon buttons, icon tabs, a slider, progress rows and a segmented control.
- **Real rendering only.** Everything on screen comes from `@youj/react`, `@youj/icons`, `@youj/core`, `@youj/motion` and `@youj/loaders` (including the loaders gallery and the logo component). Each look is a preset (`basalt`, `graphite`, `terminal` or `brutal`) with a style (bezel or classic) and a mode, applied through `ThemeScope`.
- **The glitches are seeded** (`src/teaser/glitch.tsx`): each tear's bands, slips and offsets come from a seed tied to its cut and frame pair. The filter is SVG floods, a displacement map and a channel split, so it needs no images. A frame that isn't glitching has no filter on it.
- **Photosensitive safety:** dark/light flips stay well under 3 flashes a second (a test checks this). The fast cuts in beat IV are all dark looks; the light mode shows twice: once for a full half-beat and once as a 2-frame flash.

Source: `src/teaser/beats.ts` (every beat), `src/teaser/teaser.tsx` (the shots), `src/teaser/glitch.tsx` (the glitch). Render: `pnpm -F promo teaser board` (storyboard), then `pnpm -F promo teaser master encode`. Output goes only to `apps/promo/exports/review/teaser/`.

## Shot list

Frames at 60 fps. A beat is 30 frames (0.5 s).

| # | Time | Frames | Beat | On screen |
| --- | --- | --- | --- | --- |
| I | 0:00–0:02 | 0–120 | **Tune in** | Dark. A beam draws a line across the frame (f10). The picture opens out of it and rolls up into lock (f24–48): the **Phosphor** signal animation, with a scope trace sweeping its graticule. Two short glimpses of what's coming tear through it: a sliver of the kit (f64) and the wifi icon (f92). |
| II | 0:02–0:06 | 120–360 | **The kit, re-themed** | Hard cut to a rack of six bezel cards, with a slow push in. The **looks change on the beats**, each through a tear: Basalt · bezel → Basalt · classic (style only, f180) → Graphite (f240) → Terminal (f270) → Brutal (f300) → Graphite light (f330). One frame of Terminal flashes early (f212). **Components react on the off-beats:** the switch flips (f135), the tab indicator slides (f165, f285), the send button presses into its spinner (f195) and its check draws (f225), the slider glides (f204), the segmented control slides sun → moon (f255), the progress rows re-sort (f315) and the switch flips back (f345). |
| III | 0:06–0:09 | 360–540 | **Icons** | Macro on the icon drawing board (keylines), one morph per beat, a tear and a new look each time: wifi-off → wifi (Terminal), moon → sun (Graphite), lock → open (Brutal), menu → x (Basalt). At f480 it pulls back to the whole set, and a wave of the icons' own animations spreads out from the centre. |
| IV | 0:09–0:11.5 | 540–688 | **Gallery, accelerating** | Gallery loaders fill the frame, cutting faster and faster (a beat each, then half-beats, then eighths), each in a different look: Chordal, Casement, Sustain, Halite, Verdict, Ridge, Armature, Quire, Tempo, Chorus, Refine and Vitals. **Overload** (f672–688): a tear every 2 frames through the kit, the icon set and the gallery, with one frame of the light mode (f680). |
| V | 0:11.5–0:15 | 682–900 | **Signal drops, then the wordmark** | The picture collapses into a line (f682–694), the line into a point (f694–702), and the point goes out (f712). Silence. At f720 the **youj** wordmark plays its own stamp, exactly as on the site (`YoujLockup`, display cut): the letters rise in reading order and the accent tittle lands last on the settle spring. At f780, `youj.dev` decodes beneath it (`ScrambleText`). A clean hold to the end. |

## Real parts

- **Components:** `Card` (the rack's tiles), `Switch`, `Button` (outline icon, and the async icon button driven by `status`: idle, pending, success), `Tabs` (pill, icons only), `Slider`, `Progress` in a `PresenceList` that re-sorts, and `ToggleGroup` (segmented, icons only).
- **Icons:** `IconSwap` path morphs (wifi-off → wifi, moon → sun, lock → lock-open, menu → x) and the whole set with each icon's `active` choreography.
- **Loaders** (`@youj/loaders`): Phosphor, Chordal, Casement, Sustain, Halite, Verdict, Ridge, Armature, Quire, Tempo, Chorus, Refine and Vitals (software, signal, geometry, orbs, science and interface).
- **Themes:** Basalt, Graphite, Terminal and Brutal, with bezel and classic, dark and light.
- **Brand:** `YoujLockup animated optical="display"`, the site's own logo component and animation, unchanged.

## Review

`exports/review/teaser/storyboard.png` holds 12 frames (`BOARD` in beats.ts), and each one is in `board/` at 1920 × 1080 with its timecode and beat burned in. The MP4 and the poster (`teaser.mp4`, `teaser-poster.png`) go to the same folder only after the storyboard is approved.
