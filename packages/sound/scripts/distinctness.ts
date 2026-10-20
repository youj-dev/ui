/* Measured final-round audit. Run after render --review:
 * node packages/sound/scripts/distinctness.ts <review directory>
 * Or omit the directory for a quick, unencoded recipe check. */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { packs } from '../packs.config.ts'
import { finish } from './dsp.ts'
import { measure, type Metrics } from './measure.ts'
import { CUES, FAMILY_NAMES, variants, type Cue, type Family } from './variants/index.ts'

const NEW: Family[] = ['beacon']
const KEPT: Family[] = ['halo', 'rill', 'glyph', 'zephyr', 'glass']
interface Row extends Metrics { id: string; family: Family; cue: Cue }
const dir = process.argv[2]
const rows: Row[] = dir ? JSON.parse(readFileSync(join(dir, 'metrics.json'), 'utf8')) : variants
  .filter((v) => [...NEW, ...KEPT].some((family) => Object.values(packs[family]!).includes(v.id)))
  .map((v) => ({ id: v.id, family: v.family, cue: v.cue, ...measure(finish(v.render())) }))
const get = (family: Family, cue: Cue) => {
  // Measure what the pack actually plays, including Glass's Classic error.
  const row = rows.find((r) => r.id === packs[family]![cue])
  if (!row) throw new Error(`Missing measured cue: ${cue}.${family}`)
  return row
}
const round = (n: number, places = 0) => Number(n.toFixed(places))
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}
const summary = (family: Family) => {
  const cues = CUES.map((cue) => get(family, cue))
  const pitches = cues.flatMap((r) => r.pitchMovementHzPerSecond === null ? [] : [r.pitchMovementHzPerSecond])
  return {
    family: FAMILY_NAMES[family],
    'centroid Hz': round(median(cues.map((r) => r.centroidHz))),
    'attack ms': round(median(cues.map((r) => r.attackMs)), 2),
    'duration ms': round(median(cues.map((r) => r.audibleMs))),
    'pitch Hz/s': pitches.length ? round(median(pitches)) : 'n/a',
    'spectral drift Hz/s': round(median(cues.map((r) => r.spectralMovementHzPerSecond))),
    'pitched cues': pitches.length,
  }
}
// A conservative screening region in four dimensions, not a perceptual
// distance claim: similar spectrum, onset, length AND movement must coincide.
const ratio = (a: number, b: number) => Math.max(a, b) / Math.max(0.01, Math.min(a, b))
function sameRegion(a: Row, b: Row) {
  const pa = a.pitchMovementHzPerSecond, pb = b.pitchMovementHzPerSecond
  const pitchNear = pa === null || pb === null ? pa === pb : ratio(500 + pa, 500 + pb) <= 2
  return ratio(a.centroidHz, b.centroidHz) <= 1.25
    && (Math.abs(a.attackMs - b.attackMs) <= 2 || ratio(a.attackMs, b.attackMs) <= 1.6)
    && ratio(a.audibleMs, b.audibleMs) <= 1.35 && pitchNear
}
const pairs: { pair: string; similarCues: number; cues: string }[] = []
for (let i = 0; i < NEW.length; i++) {
  for (const b of [...NEW.slice(i + 1), ...KEPT]) {
    const a = NEW[i]!
    const cues = CUES.filter((cue) => sameRegion(get(a, cue), get(b, cue)))
    pairs.push({ pair: `${FAMILY_NAMES[a]} / ${FAMILY_NAMES[b]}`, similarCues: cues.length, cues: cues.join(', ') || 'none' })
  }
}
const knockRisks = NEW.flatMap((family) => CUES.map((cue) => get(family, cue))).filter((r) =>
  r.centroidHz < 1150 && (r.pitchMovementHzPerSecond ?? 0) < 500 && r.audibleMs < 45 && r.attackMs < 2.5,
)
const perCue = [...NEW, ...KEPT].flatMap((family) => CUES.map((cue) => {
  const r = get(family, cue)
  return {
    pack: FAMILY_NAMES[family], id: r.id, 'centroid Hz': round(r.centroidHz), 'attack ms': round(r.attackMs, 2),
    'duration ms': round(r.audibleMs), 'pitch Hz/s': r.pitchMovementHzPerSecond === null ? 'n/a' : round(r.pitchMovementHzPerSecond),
    'drift Hz/s': r.pitchDriftHzPerSecond === null ? 'n/a' : round(r.pitchDriftHzPerSecond),
    'spectral drift Hz/s': round(r.spectralMovementHzPerSecond),
  }
}))
console.log('Every final pack cue (duration is audible to −40 dB; pitch is absolute tonal-ridge travel):')
console.table(perCue)
console.log('Family medians for the six final packs:')
const summaries = [...NEW, ...KEPT].map(summary)
console.table(summaries)
console.log('Same-region cues (six or more out of ten would fail):')
console.table(pairs)
console.log(`Knock/thud screening: ${knockRisks.length ? knockRisks.map((r) => r.id).join(', ') : 'no new cues flagged'}`)
const maxShared = Math.max(...pairs.map((p) => p.similarCues))
console.log(`Distinctness summary: ${pairs.length} pairs checked; maximum ${maxShared}/10 shared cue regions; ${pairs.every((p) => p.similarCues < 6) ? 'all pairs separate across most cues' : 'FAILED majority separation'}.`)

const table = (data: object[]) => {
  const keys = Object.keys(data[0]!)
  return `| ${keys.join(' | ')} |\n| ${keys.map(() => '---').join(' | ')} |\n${data.map((r) => `| ${Object.values(r).join(' | ')} |`).join('\n')}`
}
if (dir) writeFileSync(join(dir, 'distinctness.md'), `# Final-family distinctness\n\n${pairs.length} pairs checked; maximum ${maxShared}/10 shared cue regions. ${pairs.every((p) => p.similarCues < 6) ? 'All pairs separate across most cues.' : 'FAILED majority separation.'} All five kept packs are compared, with Glass's actual Classic error. The previous measurement method and screening thresholds are unchanged.\n\nBeacon uses short, stationary pure sine pings with rounded onsets and natural exponential decays. Single-note cues stay dry; two-note gestures use distinct pitches, rising for success and gently falling for error. Halo supplies warm chord swells, Rill liquid pitch scoops, Glyph clocked pulses, Zephyr pipe breath and Glass struck modes.\n\n${table(summaries)}\n\n${table(perCue)}\n\n${table(pairs)}\n\nMeasured by scripts/measure.ts on the levelled WAV masters. Duration is the last sample within 40 dB of peak. Pitch movement is absolute travel of a periodic, dominant tonal ridge in Hz/s, with a 12 Hz hysteresis; drift preserves first-to-last direction. It includes note steps and changing dominant harmonics; it is not a fundamental-pitch assertion. Cues without a reliable periodic ridge are n/a, and spectral drift is reported separately for every cue.\n\nSame region requires centroid ratio ≤1.25, attack difference ≤2 ms or ratio ≤1.6, duration ratio ≤1.35, and pitch-speed ratio ≤2 (with a 500 Hz/s floor); pitched/unpitched must agree. Six shared cues would fail. A knock risk requires centroid <1150 Hz, movement <500 Hz/s, duration <45 ms and attack <2.5 ms. These are screening heuristics; the listening grid is the perceptual review.\n\nKnock/thud screen: ${knockRisks.length} new cues flagged.\n`)
if (pairs.some((p) => p.similarCues >= 6) || knockRisks.length) process.exitCode = 1
