/* Renders every candidate sound, measures it, encodes it, and writes the
 * packs, the candidates and the Sound builder's data. Deterministic: the same
 * sources give the same samples on any machine (the MP3 bytes also depend on
 * ffmpeg's LAME).
 *
 *   pnpm -F @youj/sound render                 write src/packs/*, src/candidates/*, lab/manifest.ts and the registry's file list
 *   pnpm -F @youj/sound render --review <dir>  also write masters (WAV), MP3s and spectrograms there, with the first palette's sounds for A/B
 *
 * Every variant is normalised to its cue's loudness (LEVEL) and must stay
 * under −1 dBTP after encoding; a pack's files must stay under 6 KB each and
 * 40 KB together. It needs ffmpeg with libmp3lame. */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { spawnSync } from 'node:child_process'
import { defaultPack, packs } from '../packs.config.ts'
import { db, finish, scale, type Signal } from './dsp.ts'
import { decode, toMp3 } from './encode.ts'
import { measure, spectrumBands, waveform, type Metrics } from './measure.ts'
import { CUES, FAMILY_NAMES, LEVEL, variants, type Cue, type Family } from './variants/index.ts'
import { encodeWav } from './wav.ts'

const root = join(import.meta.dirname, '..')
const { values } = parseArgs({ options: { review: { type: 'string' }, only: { type: 'string' } } })

/** Bitrate for every file. At 96 kbps a mono UI sound is transparent, and short enough that size stays small. */
const KBPS = 96
const MAX_FILE = 6 * 1024
const MAX_PACK = 40 * 1024
/** Encoding may overshoot a little; the masters leave room for it. */
const CEILING = -1.5
/** Seconds each cue's pictures span: one scale for every candidate of a cue, fitted to the longest. */
const WINDOW: Record<Cue, number> = {
  tick: 0.06,
  tap: 0.12,
  select: 0.12,
  toggleOn: 0.15,
  toggleOff: 0.15,
  error: 0.3,
  open: 0.3,
  close: 0.3,
  notify: 0.5,
  success: 0.5,
}

interface Rendered {
  id: string
  cue: Cue
  family: Family | 'current'
  recipe: string
  master: Signal
  mp3: Buffer
  metrics: Metrics
  decoded: Metrics
}

/** Normalises a finished sound to its cue's loudness, pulled down if its true peak would pass the ceiling. */
function level(sig: Signal, cue: Cue): Signal {
  const m = measure(sig)
  let gain = LEVEL[cue] - m.lufs100
  if (m.truePeakDb + gain > CEILING) gain = CEILING - m.truePeakDb
  return scale(sig, db(gain))
}

function render(id: string, cue: Cue, family: Rendered['family'], recipe: string, source: Signal): Rendered {
  const master = level(finish(source), cue)
  const mp3 = toMp3(master, { kbps: KBPS })
  return { id, cue, family, recipe, master, mp3, metrics: measure(master), decoded: measure(decode(mp3, 'mp3')) }
}

const only = values.only
const rendered: Rendered[] = []
for (const v of variants) {
  if (only && !v.id.startsWith(only)) continue
  rendered.push(render(v.id, v.cue, v.family, v.recipe, v.render()))
}

/* The palette these replace, for A/B in a review: rendered from the Web
 * Audio synth at commit b471181 (precise voice) and stored lossless. Tabs
 * played its tap, so it's the current select too; tick is new. */
const LEGACY: Partial<Record<Cue, string>> = { tap: 'tap', select: 'tap', toggleOn: 'toggleOn', toggleOff: 'toggleOff', success: 'success', error: 'error', notify: 'pop', open: 'open', close: 'close' }
const legacyDir = join(root, 'lab/legacy')
for (const cue of values.review ? CUES : []) {
  const file = LEGACY[cue] && join(legacyDir, `${LEGACY[cue]}.flac`)
  if (!file || !existsSync(file) || (only && !`${cue}.current`.startsWith(only))) continue
  rendered.push(render(`${cue}.current`, cue, 'current', 'The sound this cue played before: the Web Audio synth from the first palette.', decode(readFileSync(file))))
}

/* ------------------------------------------------------------ checks */

const problems: string[] = []
for (const r of rendered) {
  if (r.decoded.truePeakDb > -1) problems.push(`${r.id}: ${r.decoded.truePeakDb.toFixed(1)} dBTP after encoding`)
  if (r.metrics.startDb > -60 || r.metrics.endDb > -60) problems.push(`${r.id}: starts or ends above −60 dB (a click)`)
  // A burst of a few milliseconds has a net area by nature; only a longer sound can carry a real offset.
  if (r.metrics.ms > 50 && r.metrics.dc > 0.002) problems.push(`${r.id}: DC offset`)
}
const byId = new Map(rendered.map((r) => [r.id, r]))
if (!only) {
  for (const [name, picks] of Object.entries(packs)) {
    let total = 0
    for (const cue of CUES) {
      const pick = byId.get(picks[cue])
      if (!pick || pick.cue !== cue) {
        problems.push(`packs.config.ts: ${name}.${cue} is "${picks[cue]}", which isn't a ${cue} variant`)
        continue
      }
      if (pick.mp3.length > MAX_FILE) problems.push(`${name}.${cue}: ${pick.mp3.length} bytes, over ${MAX_FILE}`)
      total += pick.mp3.length
    }
    if (total > MAX_PACK) problems.push(`${name}: ${total} bytes, over ${MAX_PACK}`)
  }
}

const round = (n: number, places = 1) => Math.round(n * 10 ** places) / 10 ** places
console.table(
  rendered.map((r) => ({
    id: r.id,
    ms: round(r.metrics.audibleMs, 0),
    lufs100: round(r.metrics.lufs100),
    lufsM: round(r.metrics.lufsM),
    dBTP: round(r.decoded.truePeakDb),
    centroid: round(r.metrics.centroidHz, 0),
    'harsh%': round(r.metrics.harsh),
    'low%': round(r.metrics.low),
    attack: round(r.metrics.attackMs, 2),
    'pitch Hz/s': r.metrics.pitchMovementHzPerSecond === null ? 'n/a' : round(r.metrics.pitchMovementHzPerSecond, 0),
    bytes: r.mp3.length,
  })),
)

/* ------------------------------------------------------------ review */

if (values.review) {
  const dir = values.review
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  for (const r of rendered) {
    writeFileSync(join(dir, `${r.id}.wav`), encodeWav(r.master))
    writeFileSync(join(dir, `${r.id}.mp3`), r.mp3)
  }
  // A contact sheet per cue: each variant's spectrogram (100 Hz–16 kHz, log) over its waveform.
  for (const cue of CUES) {
    const ids = rendered.filter((r) => r.cue === cue).map((r) => r.id)
    if (!ids.length) continue
    const window = WINDOW[cue]
    spawnSync('node', [join(import.meta.dirname, 'contact-sheet.ts'), join(dir, `${cue}.png`), String(window), ...ids.map((id) => join(dir, `${id}.wav`))], { stdio: 'inherit' })
  }
  console.log(`review: ${dir}`)
  // Full measured evidence for the listening page and distinctness audit.
  writeFileSync(join(dir, 'metrics.json'), JSON.stringify(rendered.map((r) => ({ id: r.id, cue: r.cue, family: r.family, bytes: r.mp3.length, ...r.metrics, encodedTruePeakDb: r.decoded.truePeakDb })), null, 2) + '\n')
}
if (problems.length) {
  console.error(problems.map((p) => `  ✗ ${p}`).join('\n'))
  process.exit(1)
}
if (only) process.exit(0)

/* ------------------------------------------------------------ packs */

const HEADER = '// Generated by scripts/render.ts from packs.config.ts. Change the config, then run `pnpm -F @youj/sound render`.\n'
const title = (name: string) => `${name[0]!.toUpperCase()}${name.slice(1)}`
const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`
const shipped = rendered.filter((r): r is Rendered & { family: Family } => r.family !== 'current')
const packDir = join(root, 'src/packs')
mkdirSync(packDir, { recursive: true })
for (const file of readdirSync(packDir)) if (/\.(data\.)?ts$/.test(file) && !file.endsWith('.test.ts')) rmSync(join(packDir, file))
const names = Object.keys(packs)
for (const name of names) {
  const picks = packs[name]!
  const files = CUES.map((cue) => byId.get(picks[cue])!)
  const total = files.reduce((sum, r) => sum + r.mp3.length, 0)
  writeFileSync(
    join(packDir, `${name}.data.ts`),
    `${HEADER}// The ${name} pack's audio: one MP3 per cue (mono, 48 kHz, ${KBPS} kbps), base64. ${kb(total)} of audio.\n\n` +
      `/** The candidate each cue plays, as the Sound builder names them. */\nexport const picks = {\n${CUES.map((cue) => `  ${cue}: '${picks[cue]}',`).join('\n')}\n} as const\n\n` +
      `export const sounds = {\n${files.map((r) => `  ${r.cue}: '${r.mp3.toString('base64')}',`).join('\n')}\n}\n`,
  )
  writeFileSync(
    join(packDir, `${name}.ts`),
    `${HEADER}import { embedded, type SoundPack } from '../lib/pack'\n\n` +
      `/** The ${title(name)} pack${name === defaultPack ? ', the default' : ''}: ${CUES.map((cue) => `${cue} (${FAMILY_NAMES[byId.get(picks[cue])!.family as Family]})`).join(', ')}. ${kb(total)}, fetched only when sound is on. */\n` +
      `export const ${name}: SoundPack = embedded('${name}', () => import('./${name}.data'))\n`,
  )
}
writeFileSync(join(packDir, 'index.ts'), `${HEADER}${names.map((name) => `export { ${name} } from './${name}'`).join('\n')}\n`)

/* ------------------------------------------------------------ candidates */

/* Every candidate, a module of its own, so an app that plays one in its own
 * pack (definePack) loads that one file and no other. */
const CANDIDATE_HEADER = '// Generated by scripts/render.ts. Change a recipe in scripts/variants/, then run `pnpm -F @youj/sound render`.\n'
const candidateDir = join(root, 'src/candidates')
rmSync(candidateDir, { recursive: true, force: true })
mkdirSync(candidateDir, { recursive: true })
for (const r of shipped) {
  writeFileSync(
    join(candidateDir, `${r.id}.ts`),
    `${CANDIDATE_HEADER}// ${FAMILY_NAMES[r.family]} ${r.cue}: one MP3 (mono, 48 kHz, ${KBPS} kbps), base64. ${kb(r.mp3.length)}.\n\nexport const sound = '${r.mp3.toString('base64')}'\n`,
  )
}
const packsWith = (id: string) => names.filter((name) => Object.values(packs[name]!).includes(id))
const docOf = (r: (typeof shipped)[number]) => {
  const owners = packsWith(r.id).map((name) => ` In the ${title(name)} pack${name === defaultPack ? ', the default' : ''}.`)
  return `${FAMILY_NAMES[r.family]}. ${r.recipe} ${Math.round(r.metrics.audibleMs)} ms, ${kb(r.mp3.length)}.${owners.join('')}`
}
writeFileSync(
  join(candidateDir, 'index.ts'),
  `${CANDIDATE_HEADER}import { candidate } from '../lib/pack'\n\n` +
    `/**\n * Every built-in sound, by cue and material, for a pack of your own:\n * \`definePack({ sounds: { tap: candidates.tap.wood } })\`. Each is a chunk of\n * its own, fetched only when a pack that plays it turns sound on, and every\n * candidate of a cue is levelled to that cue's loudness.\n */\n` +
    `export const candidates = {\n${CUES.map(
      (cue) =>
        `  ${cue}: {\n${shipped
          .filter((r) => r.cue === cue)
          .map((r) => `    /** ${docOf(r)} */\n    ${r.family}: candidate(() => import('./${r.id}')),`)
          .join('\n')}\n  },`,
    ).join('\n')}\n}\n`,
)

/* ------------------------------------------------------------ builder */

const labDir = join(root, 'lab')
rmSync(join(labDir, 'audio.ts'), { force: true })
const entry = (r: (typeof shipped)[number]) => ({
  id: r.id,
  family: r.family,
  name: FAMILY_NAMES[r.family],
  recipe: r.recipe,
  ms: round(r.metrics.audibleMs, 0),
  lufs: round(r.metrics.lufs100),
  truePeak: round(r.decoded.truePeakDb),
  centroid: round(r.metrics.centroidHz, 0),
  harsh: round(r.metrics.harsh),
  bytes: r.mp3.length,
  wave: waveform(r.master, 48, WINDOW[r.cue]).map((v) => Math.round(v * 100)),
  spectrum: spectrumBands(r.master, 28).map((d) => Math.max(0, Math.round(60 + d))),
})
const manifest = CUES.map((cue) => ({
  cue,
  defaultId: packs[defaultPack]![cue],
  level: LEVEL[cue],
  window: Math.round(WINDOW[cue] * 1000),
  variants: shipped.filter((r) => r.cue === cue).map(entry),
}))
// Pretty, but each list of numbers on one line.
const json = JSON.stringify(manifest, null, 2).replace(/\[\n\s+(-?[\d.]+(?:,\n\s+-?[\d.]+)*)\n\s+\]/g, (_, list: string) => `[${list.replace(/,\n\s+/g, ', ')}]`)
writeFileSync(
  join(labDir, 'manifest.ts'),
  `// Generated by scripts/render.ts. Run \`pnpm -F @youj/sound render\` after changing a variant or packs.config.ts.\n\nimport type { LabCue, LabPack } from './types'\n\nexport const lab: LabCue[] = ${json}\n\n/** The built-in packs, the default first, as packs.config.ts names them. */\nexport const labPacks: LabPack[] = ${JSON.stringify(
    names.map((name) => ({ name, picks: packs[name] })).sort((a, b) => Number(b.name === defaultPack) - Number(a.name === defaultPack)),
    null,
    2,
  )}\n`,
)

/* ------------------------------------------------------------ registry */

/* The registry item ships every generated file; the hand-written entries stay as they are. */
interface RegistryFile {
  path: string
  type: string
  target?: string
}
const fragment = join(root, 'registry/sound.json')
const items = JSON.parse(readFileSync(fragment, 'utf8')) as { name: string; files: RegistryFile[] }[]
const item = items.find((i) => i.name === 'sound')!
const registryFile = (path: string): RegistryFile => ({ path, type: 'registry:lib', target: path.replace(/^src\//, 'lib/youj/sound/') })
item.files = [
  ...item.files.filter((f) => !/^src\/(packs|candidates)\//.test(f.path)),
  registryFile('src/packs/index.ts'),
  ...names.flatMap((name) => [registryFile(`src/packs/${name}.ts`), registryFile(`src/packs/${name}.data.ts`)]),
  registryFile('src/candidates/index.ts'),
  ...shipped.map((r) => registryFile(`src/candidates/${r.id}.ts`)),
]
writeFileSync(
  fragment,
  JSON.stringify(items, null, 2)
    // One file per line, and lists of names on one line, as it's written by hand.
    .replace(/\{\n\s+("path": [^\n]+),\n\s+("type": [^\n]+),\n\s+("target": [^\n]+)\n\s+\}/g, '{ $1, $2, $3 }')
    .replace(/\[\n\s+("[^"\n]*"(?:,\n\s+"[^"\n]*")*)\n\s+\]/g, (_, list: string) => `[${list.replace(/,\n\s+/g, ', ')}]`) + '\n',
)

for (const name of names) {
  const total = CUES.reduce((sum, cue) => sum + byId.get(packs[name]![cue])!.mp3.length, 0)
  console.log(`pack ${name}: ${kb(total)} (${CUES.map((cue) => `${cue} ${byId.get(packs[name]![cue])!.mp3.length}`).join(', ')})`)
}
console.log(`candidates: ${shipped.length} sounds, ${kb(shipped.reduce((sum, r) => sum + r.mp3.length, 0))}`)
