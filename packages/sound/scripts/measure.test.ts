import { glide, noise, sine, swell } from './dsp.ts'
import { measure } from './measure.ts'

test('measures a stationary tone without inventing pitch movement', () => {
  const m = measure(swell(sine(0.12, 1000), 0.004, 0.116))
  expect(m.centroidHz).toBeCloseTo(1000, -1)
  expect(m.pitchedPercent).toBeGreaterThan(95)
  expect(m.pitchMovementHzPerSecond).toBeLessThan(30)
})

test('tracks the direction and speed of an exponential pitch sweep', () => {
  for (const [from, to] of [[600, 1200], [1200, 600]]) {
    const m = measure(swell(sine(0.12, glide(from!, to!, 0.12)), 0.002, 0.118))
    expect(m.pitchMovementHzPerSecond).toBeGreaterThan(3500)
    expect(m.pitchMovementHzPerSecond).toBeLessThan(6500)
    expect(Math.sign(m.pitchDriftHzPerSecond!)).toBe(Math.sign(to! - from!))
  }
})

test('does not present broadband noise motion as a pitch', () => {
  const m = measure(swell(noise(0.15, 181), 0.005, 0.145))
  expect(m.pitchMovementHzPerSecond).toBeNull()
  expect(m.pitchedPercent).toBeLessThan(10)
})

test('resolves the pitch step in a chip-length microcue', () => {
  const stepped = new Float64Array([...sine(0.009, 1200), ...sine(0.009, 900)])
  const m = measure(stepped)
  expect(m.pitchMovementHzPerSecond).toBeGreaterThan(10_000)
  expect(m.pitchDriftHzPerSecond).toBeLessThan(-10_000)
})
