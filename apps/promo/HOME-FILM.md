# The home film

The film in the homepage's "01 · In motion · See it move." section, made for that section alone. It replaces the marketing film there; the four topic loops stay with their own sections.

**What it says:** the site's own construction frame comes alive. One card drafts itself from the system's primitives, plays, takes a new theme, and the camera pulls back to show it was one part of a system that moves and re-themes as one. It's a hero statement, not a feature tour, and it rhymes with the loops (the icon on its drawing board, the settle spring, a theme passing through) without reusing their shots.

- 22s, 60fps, seamless (the last frame hands straight back to the first), silent.
- Laid out on the homepage loop's stage (1200 × 675 at 1.6, so 1920 × 1080), so at the section's ~1136px the UI is the size the site shows it.
- Rendered twice: `home-film` (dark) and `home-film-light`. The page plays the one that matches its scheme.
- One line of display type, "Designed as one.", set as the site sets `display-2` (Geist 580, −0.038em). The only other words are the construction names in mono (Layout, Radius, Surface, Type, Icon, Spring, Accent) and the cells' eyebrows (Components, Motion, Icons, Themes). There are no numbers.
- Source: `src/home/beats.ts` (every beat), `src/home/film.tsx` (the scene).

## Beats

Frames are the film's own (0 is the first frame shown). Seconds are at 60fps.

| # | When | Beat | On screen |
| --- | --- | --- | --- |
| 1 | 0:00–0:01 | **Rest** | The sheet as the site draws its sections: hairline rails and rules with registration marks, the dot grid and the accent glow. The **release card** sits in the middle column (the real `Badge`, `Switch`, `Button`s and an `IconSwap` tile) above "Designed as one.". Around it are four cells, each with a mono eyebrow and the particle. **Components** has the real `Tabs`, `Input` and `AvatarStack` with an Invite `Button`. **Motion** plots the `emphasized` ease and the `settle` spring from the tokens. **Icons** is a slice of the set. **Themes** has a segmented `ToggleGroup` (Basalt, Graphite, Terminal, Brutal), an "Aa" specimen and swatches of canvas, surface, ink and accent. This frame is the poster, and what reduced motion shows. |
| 2 | 0:01–0:02.7 | **Dive and undo** | The line leaves, and the camera dives in to the card in log scale on `emphasized` as the sheet fades around it. The card comes apart, last part first: its surface, words and controls go, leaving its construction lines and registration marks. |
| 3 | 0:02.9–0:04.7 | **Draft** | The card drafts itself again from the primitives, each named in mono on a leader line as it lands. **Layout** is a hairline box drawing itself. **Radius** rounds its corners. **Surface** brings the fill, border and shadow. **Type** brings the title and rows. |
| 4 | 0:04.7–0:07.4 | **Icon** | A push to macro on the tile, where the icon's drawing board (the 24-unit keylines) fades up. The **keyline circle morphs into the rocket** (`IconSwap`'s path morph), and the camera pulls back to the card. The tile is drawn by layout, not under the transform, so the close-up stays crisp. |
| 5 | 0:07–0:08.7 | **Spring and accent** | The Badge, Switch and Later land on the `settle` spring, one after another. **Accent** lands last, on Ship it. The names and construction lines leave once the card is whole. |
| 6 | 0:09–0:12.5 | **Play, then a theme** | The Switch flips. The pointer presses Ship it: the press is the button's own, its **send icon morphs to a check** and it reads Shipped. Then **Terminal passes through the card**: the palette is mixed in OKLab from the preset's own derivation and the pills square off, so the whole frame re-themes on one wrapper. |
| 7 | 0:12.5–0:17 | **The system** | The camera pulls back to the whole sheet, now in Terminal and moving on one clock. A wave runs through the icons, the tab underline glides and returns, and a playhead runs both curves. The Themes segment already sits on Terminal. The card sets itself back (check → send, Switch off), and the line returns. |
| 8 | 0:17.3–0:22 | **One contract, then rest** | **Terminal turns back to Basalt across everything at once**: card, cells, curves, swatches, canvas and the segment's indicator gliding home. Then it's still, on the first frame. |

## Real parts

- **Components:** `Badge`, `Switch`, `Button` (default, ghost, outline), `Tabs`, `Input`, `AvatarStack`, `ToggleGroup` (segmented), from `@youj/react`.
- **Icons:** `IconSwap` morphs (circle → rocket, send → check), `Keylines` (the set's drawing board), and the set's own `active` choreographies in the wave (bell, heart, star, play, menu, check, sparkles, copy and so on), from `@youj/icons`.
- **Motion:** the `emphasized` easing and `settle` spring (`easings`, `springs`, Motion's own generator via `lib/timing.ts`). The film's moves use the same tokens.
- **Themes:** `tuningOf`/`mixTuning` (`derivePalette` and the preset's radius) for Basalt ↔ Terminal.

## Light and dark

It's one composition, rendered on the Stage in each scheme. Every colour is a token, so the sheet, cells and card come from the Basalt palette of that scheme, and the theme beat mixes to Terminal in that same scheme (green-washed surfaces with a green accent in each). Nothing is recoloured by hand. Two things differ on purpose:

- The accent glow is a little lower in light (0.22, against 0.32 in dark), so it doesn't haze the white.
- The card is carried by its soft shadow in light and by its border in dark, as the tokens already do.

## Published

To render and publish both schemes:

```bash
ONLY='home-film*' pnpm -F promo render masters encode posters publish verify
```

This writes `home-film.*` and `home-film-light.*` to `apps/promo/exports/review/site` for review, and names the pair in the manifest under `home`. Once approved, `pnpm -F promo approve` and `pnpm -F docs media:upload` publish them. Each fitted the 3 MB budget on the first encode.

| Cut | MP4 (H.264) | WebM (VP9) | Seam (MP4 / WebM) |
| --- | --- | --- | --- |
| Dark | 1.83 MB | 2.09 MB | 47.3 / 67.5 dB |
| Light | 1.96 MB | 2.27 MB | 47.4 / 65.7 dB |

## Stills

`storyboard-rest-dark.png` (beat 1, the poster), `storyboard-build-dark.png` (beat 4, the push to the tile with the keyline circle), `storyboard-macro-light.png` (beat 4, the rocket morphing out of the circle on its keylines) and `storyboard-system-light.png` (beat 7, the sheet in Bloom, before Bloom was retired, with the playhead on the curves). All were rendered at 50%.
