import { spring } from 'motion/react'
import { motionPersonalities, springPhysics, type SpringToken } from './tokens'

type Options = Parameters<typeof spring>[0] & object

const sample = (options: Omit<Options, 'keyframes'>, from: number, to: number, ms: number[]) => {
  const generator = spring({ keyframes: [from, to], ...options } as Options)
  return ms.map((t) => generator.next(t).value as number)
}

const TIMES = Array.from({ length: 61 }, (_, i) => i * 20) // 0 to 1.2s

test.each(Object.entries(motionPersonalities).flatMap(([name, p]) => (Object.keys(p.springs) as SpringToken[]).map((t) => [name, t] as const)))(
  "the %s %s spring settles on the curve its duration form draws",
  (personality, token) => {
    const shape = motionPersonalities[personality as keyof typeof motionPersonalities].springs[token]
    for (const timeScale of [0.5, 1, 4]) {
      const ms = TIMES.map((t) => t * timeScale)
      const timed = sample({ visualDuration: shape.visualDuration * timeScale, bounce: shape.bounce }, 0, 100, ms)
      const physical = sample(springPhysics(shape, timeScale), 0, 100, ms)
      physical.forEach((v, i) => expect(v).toBeCloseTo(timed[i]!, 6))
    }
  },
)

test('a retarget carries the running velocity instead of restarting from rest', () => {
  const shape = motionPersonalities.precise.springs.smooth
  // 0 → 100, interrupted 60ms in; then sent back to 0, as a rapid toggle does.
  const [before, at] = sample(springPhysics(shape), 0, 100, [59, 60])
  const velocity = (at! - before!) * 1000 // units per second, Motion's unit for `velocity`
  expect(velocity).toBeGreaterThan(100)

  const reversed = (options: Omit<Options, 'keyframes'>) => sample({ ...options, velocity }, at!, 0, [0, 16, 32])
  const physical = reversed(springPhysics(shape))
  const timed = reversed({ visualDuration: shape.visualDuration, bounce: shape.bounce })

  // Physics keeps moving the way it was going for a moment, then turns: no hitch.
  expect(physical[1]).toBeGreaterThan(at!)
  // A duration-defined spring drops the velocity and starts back from a dead stop.
  expect(timed[1]).toBeLessThan(at!)
})

test('a vanishing time scale still gives valid physics', () => {
  const { stiffness, damping } = springPhysics({ visualDuration: 0.2, bounce: 0 }, 0)
  expect(Number.isFinite(stiffness) && Number.isFinite(damping)).toBe(true)
})
