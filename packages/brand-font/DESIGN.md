# Youj Display (draft)

A rough, directional display face grown from the wordmark. Not a workspace package yet. Licensed under the SIL Open Font License 1.1 (`OFL.txt`). The docs site already serves the built WOFF2 for page titles and headings.
`generate.py` builds every glyph from the rules below (fontTools + skia-pathops, plus brotli for WOFF2);
`specimen.mjs` renders specimens from the built font with Playwright.

```sh
python3 generate.py OUT     # OUT/youj-display.otf, .woff2, svg/<glyph>.svg
node specimen.mjs OUT [TAG] # OUT/specimen-<sheet>[-TAG]-<light|dark>.png; reads OUT/variants.json
```

## Rules taken from y, o, u, j (`packages/core/src/docs/brand/logo.ts`)

| | grid units (24-unit grid) | font units (UPM 2000) |
|---|---|---|
| scale | 1 unit | 100 |
| ascender (the tittle's top) | 16 above baseline | 1600 |
| x-height | 11.43 | 1143 |
| descender (the y and j hooks) | -4 | -400 |
| stem (vertical stroke) | 2.19 | 219 |
| bar (horizontal stroke) | 1.95 | 195 |
| lowercase box (y, o, u) | 9.87 wide | 987 |
| hook reach (stem's outer edge to the cut) | 5.59 | 559 |
| y's bowl lift | 1.25 | 125 |
| tittle | 2.33 square, top on the ascender, centred on the stem | 233 |

- **Contrast:** slight. Bars are 0.89 of the stems (1.95 / 2.19), so horizontals look as heavy as verticals.
- **Corners:** every corner is one of three things.
  - **Sharp:** a flat terminal, or a stem that runs on past a bowl (the u's tops, the y's right stem).
  - **Outer bend:** 2.59 along the horizontal and 3.2 along the vertical, so it's taller than it is wide. Its cubic handles sit 1.20 and 0.75 from the corner point.
  - **Inner bend (counters):** 0.55 by 1.2, with handles at 0.10 and 0.40.

  The outer and inner bends aren't concentric, so a counter keeps tight corners inside a soft outside. That rounded-square tension is the face.
- **Terminals:** always flat and square to the stroke. Stems are cut horizontally (at the x-height, the ascender or the baseline). Hooks and bars are cut vertically (the y and j hooks end in a vertical cut).
- **Counters:** the o's counter is the box inset by one stem across and one bar down: 5.49 by 7.53.
- **Overshoot:** none. The o is square to the x-height and the baseline, so round and flat letters share the same lines.
- **Dots:** the tittle (a 2.33 square) is the only dot. It serves for i, j, the period, colon, semicolon, ellipsis and the dots of ! and ?, and it's the head of the comma and quotes.
- **Spacing:** measured from the wordmark's gaps. The y-to-o gap is 1.78, o-to-u is 1.75 and u-to-j is 2.06, which gives side bearings of **1.03 for a stem side** and **0.75 for a round side** (the o itself is 0.75/0.72, so "youj" sets exactly as the logo). Diagonal sides get 0.35. Open sides (c, e, r, t) use about 0.4 to 0.75. A few kerning pairs are listed under Kerning.

## The corner rule (enforced)

`soften()` runs on every built letter and figure (punctuation is kept as drawn, and y, o, u, j are the logo's own outlines). It walks each finished outline and turns every corner between two straight edges:

- **Convex corners** take the outer bend (2.59 by 3.2).
- **Concave corners** take the inner bend (0.55 by 1.2).
- **Stroke ends stay flat cuts.** A stroke's end is a short edge (3.6 or less) that's convex and roughly square at both ends: a stem's top or foot, a bar's end, a diagonal's cut.
- **Diagonal edges** take a proportional fillet: 1.8 on the outside, 0.9 inside.
- **Short edges:** bends shrink to fit them.

So no outer corner is left square. P's and R's top-left, E, F, L, B and the 7's shoulder all turn, and the T and H junctions get inner bends. A few corners are bent on purpose rather than by the rule:

- **D:** its right side swings on a bend twice the size (5.2 by 6.4), so it stays apart from O now that its left corners bend too.
- **B:** its spine corners take a tight bend (0.4 of the outer one), so it doesn't read as 8 at text sizes.
- **G:** its top bar turns down on a bend into a short spur cut flat, instead of ending square at the corner.

## Construction

Glyphs are rectilinear outlines with tagged corners, unioned and cut with path booleans, then passed through the corner rule:

- **Rings (bowls):** a box minus its counter. These build o, b, d, p, q, g, D, O, P, B, 0, 6, 8 and 9.
- **Turned u:**
  - n is the u turned over, and m adds a second counter.
  - w is the m turned over, and W is the M turned over (as the y is the u lifted).
  - The capital Y is a u standing on a stem.
  - h, b, p, d and q keep a stem straight where it runs on past the bowl.
- **Hooks:** g is the y's construction with the bowl closed (lifted 1.25, the right stem running into the j's hook). t and l stand on the hook turned over. f and r turn the bend at the top.
- **Three-bar letters:** a, e, s, S, 2 and 3, the hyphen and the &'s waist share one mid bar that splits the height into two equal counters (4.74 to 6.69 in lowercase).
- **5:** the S's bends with a taller bowl. Its stem runs on 1.7 past the bowl's top-left corner and is cut flat; that spur is what makes it a 5.
- **Brackets: x, X, k, K.** `paren()` is a ')' made of two stretched bends.
  - Its arms are flat at the corners, and its bowl swings in to half height.
  - Its handles sit 0.72 of the reach back from the corner, so the curve reads as a soft diagonal rather than a square turn.
  - Two brackets back to back, ')(' pushed together until the bowls merge into one stem's width, make x and X.
  - One '(' leaning into the stem makes k and K.
- **v, V:** the u with its sides narrowing below half height to a short flat base, every turn bent.
- **z, Z, 7:** one outline each. The diagonal leaves the top bar at the top-right corner and lands on the bottom bar at the bottom-left one, so the turns are bends and the crotches inner bends.
- **Exact logo letters:** y, o, u and j are the logo's outlines verbatim, with no boolean pass and no corner pass. The compare specimen shows zero difference.

## Variants (judgment calls)

Each alternate is in the font at a private-use code point, listed with its code point in `OUT/variants.json`. The variants sheet sets them side by side. The defaults:

| letter | A | B | default |
|---|---|---|---|
| k, K | diagonal arm and leg, joins filleted | '(' bracket on the stem | **B** |
| v, V | diagonal, apex filleted | u narrowing to a flat base | **B** |
| x, X | crossed diagonals, crotches filleted | ')(' brackets back to back | **B** |
| z, Z | one-stroke diagonal on bends | the 2's construction (no diagonal) | **A** (B reads as 2) |

## Kerning

Only the worst pairs are kerned: T, Y, V, P, F, r and f against round letters, other lowercase, stops and hyphens; L against T, V, Y and ’; round letters before T and Y. j after a descender (g p q y j) gets +160 so the hooks don't collide. None of these pairs touch y-o-u-j, so the wordmark sets as the logo.

## Decisions the logo doesn't make

- **Capitals:**
  - **Cap height:** 15.2, a step above the x-height (11.43) and short of the ascender (16).
  - **Strokes and bends:** the same stems, bars and bends as the lowercase, unscaled.
  - **Widths:** 11.0 for straight capitals and 11.8 for round ones.
  - **A and M:** both come from the bend system. A is the turned u with a bar, and M is the m at cap height.
- **Diagonals:** only N, R's leg, z, Z, 7 and the & keep straight diagonals. Their joins are bent by the corner rule. Everything else that used one (k, v, w, x, K, V, W, X, Y) is now bend-built.
- **Figures:** lining at cap height and tabular, each in a 9.87 box with stem side bearings (an advance of 11.93). 0 has no slash.

## State and next steps

- **Open question:** A's feet are stroke ends, so they stay flat cuts, like the u's stems at the x-height. If A's bottom-right should turn too, the rule needs an exception for A, or A becomes a closed form.
- **Weakest glyphs:**
  - The k/K and x/X waists meet the stem in a sharp crotch (curve against line, which the corner rule doesn't touch).
  - At text sizes, v and V sit close to u and U.
  - The @, & and Q tail are rough.
  - The quotes and comma are square stubs, kept as drawn.
- **Missing:** accents, hinting, wider kerning, and a text cut that grows the tittle 1.3x at 24px, as the logo does.
