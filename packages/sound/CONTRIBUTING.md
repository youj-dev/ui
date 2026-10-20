# Working on @youj/sound

What it is: interface sound packs for `<YoujProvider sound={…}>` (Beacon, Halo, Rill, Glyph, Zephyr and Glass), `definePack` for custom packs, the offline render and the Sound builder's data. What it does for users is in [README.md](README.md).

## House rules

What typically drifts here. The root [Principles](../../CONTRIBUTING.md#principles) apply too.

- Every sound is original and rendered by code from seeded generators. Nothing is sampled, and no third-party sound pack.
- Sound is opt-in: without a `sound` prop a cue is a context read and nothing else, and muted means silent. Core never imports this package.
- Edit recipes in `scripts/variants/` and picks in `packs.config.ts`, then `pnpm -F @youj/sound render`. Never edit `src/packs/*`, `src/candidates/*` or `lab/manifest.ts` by hand.
- The render fails outside the loudness rules (K-weighted loudness, true peak, no clicks or DC) and the size budgets (a file under 6 KB, a pack under 40 KB). Keep cues short and quiet.
- Only `lib/lazy.ts` imports the player, only a pack loader its audio (`code-split.test.ts`). Nothing audio loads while sound is off.
- Every cue falls back to the base pack; a new cue needs a loudness entry in `scripts/variants/types.ts`.

## Layout

```
src/components/sound-provider.tsx   resolves settings against the provider above
src/lib/                            player.ts, lazy.ts, define-pack.ts, warn.ts
src/packs/, src/candidates/         generated audio chunks; never edited
scripts/                            the render: dsp.ts, variants/, measure.ts, render.ts
packs.config.ts                     which candidate each pack plays for each cue
lab/                                the Sound builder's data (manifest.ts is generated)
registry/sound.json                 the one registry item
```

## Adding a sound or a pack

Change a recipe in `scripts/variants/`, or edit `packs.config.ts` to choose which candidate a pack plays for a cue, or to add a pack. Then run `pnpm -F @youj/sound render` (see "Making the sounds"). It writes `src/packs/*`, `src/candidates/*`, `lab/manifest.ts` and the registry item's file list, so commit them with the change.

## Commands

`pnpm -F @youj/sound typecheck|test|render|size|registry:check|verify`. `render` needs ffmpeg with libmp3lame, and `size` needs core, motion, ui and sound built first.

## Rules

- The dependency direction is sound to core, never the reverse. Core never imports this package or touches Web Audio.
- Every sound is original and rendered by code from seeded generators. Nothing is sampled.
- Stay inside the budgets and the loudness rules below: the render fails otherwise.

## How it fits

- **Dependency direction:** sound → core. Core holds the provider's sound options, the mute and the cue bus (`src/lib/youj/sound-scope.ts`: `SoundRuntime`, `SoundCueContext`, `soundCues`; `sound-cue.ts`: `useSoundCue`, `useSound`), and components emit on it. A pack satisfies core's `SoundRuntime` (`arm` fetches the player and the audio, `play` plays a cue), so core never imports this package and, without a `sound` prop, a cue is a context read and nothing else.
- **What loads when:** the entry holds `definePack`, a lazy handle (`lib/lazy.ts`), each pack's loader and the candidates' loaders. The player (`lib/player.ts`), a pack's audio (`packs/<name>.data.ts`) and each candidate (`candidates/<cue>.<family>.ts`) are chunks of their own, fetched and decoded only while sound is on and unmuted, and a candidate only when a pack plays it. Only `lib/lazy.ts` may import the player, through `import()`, only a pack's loader its audio, and only the candidates' index a candidate; `code-split.test.ts` holds all three.
- **Fallback:** a pack may name a `base` (definePack's is `glass`). The player fills every cue the pack leaves out, and any whose file won't load or decode, from the base, loading it only then, and says why in development (`lib/warn.ts`: `if (DEV)` folds away in production builds).
- **Budgets:** sound costs 0.55 KB gzipped on first load beyond the provider, the player 1.33 KB and the Glass pack 24.8 KB, both lazy; a pack of your own adds 0.96 KB to the first load (definePack and the candidates' loaders), and the candidates' audio is never in it (`pnpm -F @youj/sound size`, after building core, motion, ui and sound). Each file of a pack stays under 6 KB and a pack under 40 KB.

## Making the sounds

Every sound is original: rendered by code, from seeded generators, the same on every machine. Nothing is sampled.

| Where | What |
| --- | --- |
| `scripts/dsp.ts` | The bench: sines, FM, filtered noise, a mallet's contact pulse, modal resonator banks (glass, wood, plastic), a Karplus–Strong string, a convolved synthetic room, saturation, and a finish that removes DC, starts at zero and fades the tail |
| `scripts/variants/` | The candidates, per cue and material (Soft wood, Glass, Digital, Muted felt; Classic for the outcomes, Air and Pluck), each with its recipe in a sentence; `types.ts` holds the cues and each cue's loudness |
| `scripts/measure.ts` | Spectrum and timing: centroid, the 2–5 kHz and under-250 Hz shares, onset, clicks and DC; with `lab/meter.ts`, K-weighted loudness (BS.1770, over 400 and 100 ms), true peak and the waveform, which the Sound builder shares to level a file someone brings |
| `scripts/render.ts` | Renders and normalises every candidate, encodes MP3 (mono, 48 kHz, 96 kbps) with ffmpeg, checks it, and writes `src/packs/*`, `src/candidates/*`, `lab/manifest.ts` and the registry item's file list |
| `packs.config.ts` | Which candidate each pack plays for each cue, and which pack is the default: the one file to edit to change or add a pack |
| `lab/` | The Sound builder's data (`manifest.ts` is generated: every candidate measured, each cue's loudness and window, the default's picks), the meter, the processing a file brought to the builder goes through, and `legacy/`, the first palette's sounds as lossless masters, for A/B in a review |

```bash
pnpm -F @youj/sound render                        # after changing a recipe or packs.config.ts (needs ffmpeg with libmp3lame)
pnpm -F @youj/sound render --review <dir>         # also writes WAV masters, MP3s and a spectrogram sheet per cue, with the first palette's sounds
pnpm -F @youj/sound verify                        # typecheck, registry check, tests
```

A candidate ships only if it's normalised to its cue's loudness, stays under −1 dBTP after encoding, starts and ends at silence and has no DC; the render fails otherwise. Keep energy out of 2–5 kHz (where UI sounds turn shrill) and under 250 Hz (lost on laptop speakers), and keep the pitched sounds on E minor pentatonic so any two that overlap agree. Decoders pad an MP3's front with different amounts of silence (1105 samples in Chromium and Firefox, 576 in WebKit), so the files carry no Xing tag and the player finds each sound's first sample.

## How it works

- `src/components/sound-provider.tsx` resolves settings against the provider above (a nested provider inherits what it leaves out, and shares the user's mute), gives the components one stable cue sink that reads the latest settings, and arms the player while sound is on.
- `src/lib/player.ts` owns the page's AudioContext (created in the first gesture), decoding, the base fallback, cooldowns, quieter repeats, the four-voice cap, and suspension in hidden tabs and after 30 s of silence.
- `src/lib/define-pack.ts` is `definePack`: it checks the cues and sources as it's defined, and loads each source (a URL, bytes, or a function such as a candidate) once, leaving any that fails to the base.
- Tests run on a recording fake of Web Audio (`src/test/fake-audio.ts`).
- Registry: `registry/sound.json` is one item, `sound`, installed under `lib/youj/sound/`; the render keeps its list of generated files current, and `scripts/build-registry.mjs` rewrites its `@youj/core` imports to youj-core's files.
