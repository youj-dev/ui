# @youj/sound

> Alpha (0.x): APIs can change between minor versions. See [Versioning](https://www.youj.dev/docs/versioning).

Designed interface sounds for Youj. The components emit **cues** as their motion starts (a press, a choice, a toggle, an outcome, a toast, a dialog), and `YoujProvider` plays them from the pack you give its `sound` option: **Beacon**, one of the other built-in packs (Halo, Rill, Glyph, Zephyr, Glass), or one of your own. Without `sound`, nothing plays and no sound code downloads; with it, nothing downloads until sound is on and unmuted.

```bash
pnpm add @youj/sound @youj/core
```

```tsx
'use client'

import { YoujProvider } from '@youj/core'
import { beacon } from '@youj/sound'

export function Providers({ children }: { children: React.ReactNode }) {
  return <YoujProvider sound={beacon}>{children}</YoujProvider>
}
```

A pack is an object of functions, so in the Next.js App Router it goes to the provider from a Client Component like this one (hence `'use client'`); a server layout renders `<Providers>` instead of passing `sound={beacon}` itself.

Pass an object to tune it, `sound={{ pack: beacon, volume, muted, onMutedChange, whenReduced }}`; `useSound()` from `@youj/core` reads and sets the mute from anywhere; `sound={false}` on a nested provider silences its subtree. A pack of your own names the sounds it changes (a built-in candidate, or your own file) and plays the Beacon pack's for the rest:

```ts
import { candidates, definePack } from '@youj/sound'

export const sounds = definePack({
  sounds: {
    tap: candidates.tap.halo,
    error: '/sounds/error.wav',
  },
})
// <YoujProvider sound={sounds}>
```

The docs site's Sound section has the rules, the API, the guide to custom sounds and the Sound builder, where every candidate for every cue can be heard, swapped for a file of your own, and exported as a pack.

## Contributing

## Packs

The final packs are Beacon (the default), Halo, Rill, Glyph, Zephyr and Glass. Each covers all ten cues on one coherent instrument and loads only when selected with sound on. The original Wood, Digital, Felt, Classic, Air and Pluck candidates are unchanged.

| Pack | Character and instrument |
| --- | --- |
| Beacon | Pure, dry and calm: short, steady sine pings with rounded onsets and natural decay. Notify is a single clear ping; success rises in two distinct notes; error gently falls in two lower notes. |
| Halo | Calm, ambient and soft: warm swelling chords, opening upper voices and a slower, subtler shimmer. Refined with stronger roots, softer high harmonics and less tuning drift; tap/tick remain miniature chord blooms. |
| Rill | Playful, round and wet: sine droplets with fast exponential pitch sweeps, tiny bubbles and a small mono chorus. Open/success rise; close/error fall. |
| Glyph | Precise, retro-modern pulses: band-limited square/pulse gates, fast arpeggios and exact pitch steps, with light bitcrush and sample-and-hold. |
| Zephyr | A tiny blown pipe: harmonic partials and filtered breath under smooth swells; pentatonic notify/success phrases in a quiet synthetic room. |
| Glass | The first default, still available: struck glass rods, beads and a small bell; the Classic error supplies its clear downward answer. |

```tsx
import { YoujProvider } from '@youj/core'
import { halo } from '@youj/sound'

// Choose any final pack here.
<YoujProvider sound={halo}>{children}</YoujProvider>
```

Working on this package itself: [CONTRIBUTING.md](https://github.com/youj-dev/ui/blob/main/packages/sound/CONTRIBUTING.md) in the repository.
