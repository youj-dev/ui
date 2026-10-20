import type { SoundCue } from '@youj/core'
import { lab as everyCandidate, labPacks, type LabCue } from '@youj/sound/lab'

/* The Sound builder's state and what it exports, as plain functions. Built-in
 * picks live in the page's link (`?tap=halo&notify=glyph`: each cue that
 * differs from the default, by family); files someone adds stay in the tab.
 * The export is lib/sounds.ts, a definePack that names the built-ins by
 * candidate and each file by the path it's served from. */

const packOrder = labPacks.map((pack) => pack.name)
const played = new Set(labPacks.flatMap((pack) => Object.values(pack.picks)))
/** The default first, then the packs in order; Classic (Glass's error) last. */
function rank(id: string, defaultId: string) {
  if (id === defaultId) return -1
  const index = packOrder.indexOf(id.split('.')[1]!)
  return index < 0 ? packOrder.length : index
}

/**
 * The cues as the builder shows them: each with the candidates the built-in
 * packs play (the default first, then the other packs in their order; Glass's
 * error is Classic). The earlier materials stay in `candidates` for code, out
 * of the builder.
 */
export const lab: LabCue[] = everyCandidate.map((entry) => ({
  ...entry,
  variants: entry.variants.filter((v) => played.has(v.id)).sort((a, b) => rank(a.id, entry.defaultId) - rank(b.id, entry.defaultId)),
}))

/** Each cue's built-in pick, by candidate id: `tap.halo`. */
export type Picks = Record<SoundCue, string>

export const DEFAULTS = Object.fromEntries(lab.map(({ cue, defaultId }) => [cue, defaultId])) as Picks

/** The picks a query string names; every other cue plays its default, and anything unknown is ignored. */
export function readPicks(search: string): Picks {
  const params = new URLSearchParams(search)
  return Object.fromEntries(lab.map(({ cue, defaultId, variants }) => [cue, variants.find((v) => v.family === params.get(cue))?.id ?? defaultId])) as Picks
}

/** `search` with the picks that differ from the default, and every other parameter kept. */
export function picksQuery(picks: Picks, search = ''): string {
  const params = new URLSearchParams(search)
  for (const { cue, defaultId } of lab) {
    params.delete(cue)
    if (picks[cue] !== defaultId) params.set(cue, picks[cue].split('.')[1]!)
  }
  return params.toString()
}

/** Where a cue's own file is served from, in the app's public folder. */
export const filePath = (cue: SoundCue) => `/sounds/${cue}.wav`

/** The built-in packs, as the builder and the docs name them, each in a line. */
export const PACKS: Record<string, { name: string; line: string }> = {
  beacon: { name: 'Beacon', line: 'Pure, dry sine pings with a natural decay: calm and exact.' },
  halo: { name: 'Halo', line: 'Soft chord swells with a slow shimmer: ambient and warm.' },
  rill: { name: 'Rill', line: 'Round droplets that rise and fall: playful and wet.' },
  glyph: { name: 'Glyph', line: 'Square pulses and quick arpeggios: precise, retro-modern.' },
  zephyr: { name: 'Zephyr', line: 'A tiny blown pipe in a quiet room: airy and pentatonic.' },
  glass: { name: 'Glass', line: 'Struck glass beads, rods and a small bell: the first default.' },
}

export type Install = 'package' | 'source'
export const PACK_PATH = 'lib/sounds.ts'
const IMPORT: Record<Install, string> = { package: '@youj/sound', source: '@/lib/youj/sound' }

export interface PackOptions {
  picks: Picks
  /** The cues that play a file of the app's own. */
  files: SoundCue[]
  install: Install
  /** The builder, with these picks. */
  link: string
}

/** lib/sounds.ts. */
export function packFile({ picks, files, install, link }: PackOptions): string {
  const lines = lab.flatMap(({ cue, defaultId }) =>
    files.includes(cue) ? [`    ${cue}: '${filePath(cue)}',`] : picks[cue] !== defaultId ? [`    ${cue}: candidates.${picks[cue]},`] : [],
  )
  const names = lines.some((line) => line.includes('candidates.')) ? 'candidates, definePack' : 'definePack'
  const notes = [
    `// Made in the Youj Sound builder: ${link}`,
    '// The cues it leaves out play the default, the Beacon pack.',
    ...(files.length ? ['// Your own files go in public/sounds/.'] : []),
  ]
  const sounds = lines.length ? `{\n${lines.join('\n')}\n  }` : '{}'
  return `import { ${names} } from '${IMPORT[install]}'\n\n${notes.join('\n')}\nexport const sounds = definePack({\n  sounds: ${sounds},\n})\n`
}

/** The .zip's README: what's in it and how to wire it. */
export function readme({ files, link }: Pick<PackOptions, 'files' | 'link'>): string {
  return [
    '# Your Youj sounds',
    '',
    `Made in the Sound builder: ${link}`,
    ...(files.length ? ['The link has your choice of built-in sounds; your own files are only here.'] : []),
    '',
    `- \`${PACK_PATH}\`: the pack. The cues it leaves out play the default, the Beacon pack.`,
    ...(files.length ? ['- `public/sounds/`: your files, trimmed and matched in loudness to the pack, as WAV.'] : []),
    '',
    '## Use it',
    '',
    `1. Copy \`${PACK_PATH}\`${files.length ? ' and `public/sounds/`' : ''} into your app.`,
    '2. Give the pack to your YoujProvider:',
    '',
    '```tsx',
    "import { sounds } from '@/lib/sounds'",
    '',
    '<YoujProvider sound={sounds}>{children}</YoujProvider>',
    '```',
    '',
  ].join('\n')
}
