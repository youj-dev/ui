# Samples

## Lottie (original, Youj)

| File | What it is |
| --- | --- |
| `success-check.json` | Ring draws on, check strokes in, and the mark settles with the `settle` spring while a hairline echo fades out. |
| `upload-progress.json` | An indeterminate loader that loops seamlessly every 120 frames, with an up-arrow moving through on a conveyor. |
| `logo-sting.lottie` | An abstract "Y." mark (dotLottie v2 container) with a baseline and an accent streak. |

These are original works made for Youj by `scripts/lottie/generate.mjs`. Regenerate them with `node scripts/lottie/generate.mjs`. The generator reads timing from `packages/core/src/lib/youj/tokens.ts`: durations become frames at 60 fps, easing tokens become bezier tangents, and springs are simulated and baked into per-frame keys. Every color is a Lottie slot (`sid`) named after the Youj color token it follows (`success`, `accent`, `fg`, `line`, `line-strong`). The baked default is that token's light-theme value, and `LottiePlayer` re-binds each slot to the live token.
