# The home film, v2

A new cut of the film in the homepage's "In motion" section, next to the first one (`HOME-FILM.md`), so the two can be compared. Same idea, same frame, same camera: the site's construction sheet comes alive, one card drafts itself from the system's primitives, plays, takes a new theme, and the camera pulls back to the whole system moving and re-theming as one. What changed is what the system is made of now: the card is drawn with an isometric scene from `@youj/illustrations`, its actions are an `ActionIsland`, it waits on a real `@youj/motion` animation (Offshoot: a branch leaves main and merges back), its sounds are drawn as the Glass pack's own waveforms, and the cells around it show the motion personalities, the sound and the newer components.

**What it says:** Youj is one system that moves, re-themes and composes as one. One card, one line ("Designed as one."), no feature tour.

- 25s, 60fps masters, 30fps on the web, seamless (the last frame hands straight back to the first), silent.
- Laid out on the homepage loop's stage (1200 × 675 at 1.6), like v1.
- Rendered twice: `home-film-v2` (dark) and `home-film-v2-light`. Once published, the manifest's `home` names these (it falls back to v1 while they aren't rendered).
- Type as the site sets it now: the line in Youj Display (400, a hair open), everything else in Geist, labels in sentence case. Cue names are in Geist Mono, as the home hero's sound plane sets them. No numbers.
- Source: `src/home/beats-v2.ts` (every beat), `src/home/film-v2.tsx` (the scene).

## Storyboard

Frames are the film's own at 60fps (0 is the first frame shown).

| # | When | Beat | On screen |
| --- | --- | --- | --- |
| 1 | 0:00–0:01 | **Rest** | The sheet: rails, rules, registration marks, the dot grid and the accent glow. In the middle the **release card**: an icon tile (a pull request), "Release" and a `Badge`; under them a canvas holding the **Deploy** scene from `@youj/illustrations` (a rocket over its pad), with an **`ActionIsland`** floating at its foot (a branch mark, Preview, Tell the team pressed, and the primary Deploy). "Designed as one." under the card. Four cells around it: **Components** (a `SegmentedControl`, an `HistoryStrip`, an `AvatarStack` with Invite), **Motion** (the `settle` spring plotted in the three personalities, precise, calm and lively), **Sound** (the Glass pack's tap, success and notify on a strip of tape) and **Themes** (the presets in a `SegmentedControl`, an "Aa" in Youj Display and the four swatches). This frame is the poster and what reduced motion shows. |
| 2 | 0:01–0:02.7 | **Dive and undo** | The line leaves; the camera dives into the card in log scale on `emphasized` as the sheet fades. The card comes apart, last part first, to its construction lines and registration marks. |
| 3 | 0:02.9–0:05.5 | **Draft** | The card drafts itself from the primitives, each named in the margin on a leader: **Layout** (a hairline box draws itself), **Radius**, **Surface**, **Type**, then **Scene**: the Deploy scene assembles itself, parts dropping in far to near on the kit's own spring. **Icon**: the tile arrives. |
| 4 | 0:05.5–0:08.2 | **Icon** | Push to macro on the tile and its 24-unit drawing board; the keyline circle morphs into the pull request (`IconSwap`), and back out to the card. |
| 5 | 0:07.6–0:08.6 | **Spring and accent** | The badge and the island's tiles land on the `settle` spring; **Accent** lands last, on Deploy. The names leave. |
| 6 | 0:09.1–0:15.5 | **Deploy** | The camera leans in to the island. The pointer presses Deploy: the kit Button's own pending state (its spinner and "Deploying"), in one fixed box. The scene gives the canvas to **`LoaderOffshoot`** (`@youj/loaders`, software): a branch leaves main, takes two commits and merges back, for at least one whole loop. It resolves: the Button's drawn check and "Deployed", the badge reads Live, the tile's pull request morphs into a merge, the scene returns, and the bell rings. Each sound is drawn, never played: the cue's real Glass waveform hangs on a dotted leader over the part that makes it, **tap**, **success**, **notify**, rings spread from the part, and the accent sweeps through the waveform as it sounds. |
| 7 | 0:15.5–0:16.9 | **A theme passes through** | Back on the card, **Terminal** passes through it (the preset's own palette, mixed in OKLab, and its square radius, the Deploy button's corners included). |
| 8 | 0:17–0:20.9 | **The system** | The camera pulls back to the whole sheet, in Terminal, moving on one clock: the tape runs under its playhead and the same three cues light as it passes them; the playhead runs the three springs (lively overshoots, calm doesn't); the components' segment glides and returns; the Themes segment already sits on Terminal. The card sets itself back (Deployed → Deploy, merge → pull request, Ready) and the line returns. |
| 9 | 0:21.3–0:25.2 | **One contract, then rest** | Terminal turns back to its home theme (Basalt in dark, Graphite in light) across everything at once, and it's still, on the first frame. |

## Real parts

- **Components:** `ActionIsland` (`ActionIslandMark`, `ActionIslandTile` with `pressed`, `ActionIslandSeparator`), `Button` (its async `status`: pending, success), `Badge`, `SegmentedControl`, `HistoryStrip`, `AvatarStack`, `Button`, from `@youj/react`.
- **Loader:** `LoaderOffshoot` (`@youj/loaders`, software): what the canvas waits on while the change deploys, on its own canvas and clock.
- **Illustration:** `IllustrationDeploy` from the registry (`@youj/illustrations`), assembling on mount.
- **Icons:** `IconSwap` morphs (circle → pull request, pull request → merge), `Keylines`, the bell's own ring.
- **Motion:** `emphasized` for the camera; the `settle` spring of each personality from `motionPersonalities`, through Motion's own generator.
- **Sound:** the Glass pack's tap, success and notify, as decoded by `pnpm -F promo cues` (`src/loops/sound-cues.ts`).
- **Themes:** `tuningOf`/`mixTuning` for Basalt ↔ Terminal (Graphite ↔ Terminal in the light cut); the presets' names in the Themes cell.

## Render

```bash
ONLY='home-film-v2*' pnpm -F promo render masters encode posters publish verify
```
