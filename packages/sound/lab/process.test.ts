// @vitest-environment node
import { loudness, truePeak } from './meter'
import { encodeWav, processSound } from './process'

/* A file brought to the builder comes out like one of the pack's own: mono,
 * trimmed, levelled to the cue's loudness by the render's meter, under
 * −1 dBTP, with a warning when it's long, clipped or can't be made loud. */

const SR = 48_000
const target = { level: -23, window: 120 }
/** A decaying tone after `lead` ms of silence, then `tail` ms of silence. */
function tone({ lead = 0, ms = 150, tail = 0, freq = 880, amp = 0.5, decay = 30 } = {}) {
  const n = (x: number) => Math.round((x / 1000) * SR)
  const out = new Float32Array(n(lead + ms + tail))
  for (let i = 0; i < n(ms); i++) out[n(lead) + i] = amp * Math.sin((2 * Math.PI * freq * i) / SR) * Math.exp(-i / n(decay))
  return out
}

test('trims the silence around it, keeping a millisecond of lead, and starts and ends at silence', () => {
  const sound = processSound([tone({ lead: 100, tail: 300 })], SR, target)
  expect(sound.trimmed).toBeGreaterThanOrEqual(98)
  expect(sound.trimmed).toBeLessThanOrEqual(100)
  expect(sound.samples.length / SR).toBeLessThan(0.16)
  expect(Math.abs(sound.samples[0]!)).toBeLessThan(1e-3)
  expect(Math.abs(sound.samples.at(-1)!)).toBeLessThan(1e-4)
})

test('levels it to the cue’s loudness with the render’s own meter, under −1 dBTP', () => {
  for (const amp of [0.05, 0.9]) {
    const sound = processSound([tone({ amp })], SR, target)
    expect(Math.abs(loudness(sound.samples) - target.level)).toBeLessThan(0.1)
    expect(sound.lufs).toBeCloseTo(target.level, 0)
    expect(20 * Math.log10(truePeak(sound.samples))).toBeLessThanOrEqual(-1)
    expect(sound.issues).toEqual([])
  }
})

test('mixes stereo to mono', () => {
  const sound = processSound([tone(), new Float32Array(tone().length)], SR, target)
  expect(sound.channels).toBe(2)
  expect(Math.abs(loudness(sound.samples) - target.level)).toBeLessThan(0.1)
})

test('says when it’s long, when the file clipped, and when it can’t be made as loud as the pack', () => {
  expect(processSound([tone({ ms: 900, decay: 400 })], SR, target).issues).toEqual(['long'])
  const square = Float32Array.from(tone({ ms: 60, decay: 1000 }), (x) => Math.sign(x))
  expect(processSound([square], SR, target).issues).toContain('clipped')
  // One sharp click: its true peak reaches the ceiling long before its loudness reaches the cue's.
  const click = new Float32Array(SR / 10)
  click[100] = 0.02
  const quiet = processSound([click], SR, { level: -10, window: 120 })
  expect(quiet.issues).toContain('quiet')
  expect(20 * Math.log10(truePeak(quiet.samples))).toBeLessThanOrEqual(-0.99)
})

test('refuses a silent file, and one far too long for an interface', () => {
  expect(() => processSound([new Float32Array(SR)], SR, target)).toThrow('It’s silent.')
  expect(() => processSound([tone({ ms: 7000, decay: 1e6, amp: 0.3 })], SR, target)).toThrow(/7\.0 s long/)
})

test('draws it like the candidates, 48 bars over the cue’s window', () => {
  const { wave } = processSound([tone()], SR, target)
  expect(wave).toHaveLength(48)
  expect(Math.max(...wave)).toBe(100)
})

test('writes mono 16-bit WAV', () => {
  const bytes = encodeWav(Float32Array.from([0, 0.5, -1, 1]))
  const view = new DataView(bytes.buffer)
  const text = (at: number) => String.fromCharCode(...bytes.slice(at, at + 4))
  expect([text(0), text(8), text(12), text(36)]).toEqual(['RIFF', 'WAVE', 'fmt ', 'data'])
  expect([view.getUint16(20, true), view.getUint16(22, true), view.getUint32(24, true), view.getUint16(34, true)]).toEqual([1, 1, SR, 16])
  expect(view.getUint32(40, true)).toBe(8)
  expect([0, 1, 2, 3].map((i) => view.getInt16(44 + i * 2, true))).toEqual([0, 16384, -32767, 32767])
})
