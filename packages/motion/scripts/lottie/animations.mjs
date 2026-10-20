// The youj sample animations. Every color is a slot named after the token
// it follows; every timing is a token converted to frames.
import {
  animated,
  composition,
  ellipse,
  f,
  fill,
  group,
  impulseFor,
  polyline,
  rect,
  shapeLayer,
  springKeys,
  stagger,
  stroke,
  trim,
  value,
} from './lib.mjs'

/**
 * success-check — the ring draws on a long emphasized tail, the check strokes
 * in as the ring lands, then the mark settles with the one allowed overshoot
 * while a hairline echo expands and fades.
 */
export function successCheck() {
  const ringEnd = f('deliberate') // 38
  const checkStart = ringEnd - f('fast') // overlap: the check starts before the ring lands
  const checkEnd = checkStart + f('slow')
  const settle = springKeys(checkEnd, [100, 100, 100], [100, 100, 100], 'settle', { velocity: impulseFor(6, 'settle') })
  const op = settle.at(-1)[0] + f('fast')

  const ring = group('Ring', [
    ellipse(136),
    trim({ e: animated([[0, 0, 'emphasized'], [ringEnd, 100]]) }),
    stroke('success', 8),
  ])

  const check = group('Check', [
    polyline([[-29, 1], [-9, 21], [29, -18]]),
    trim({ e: animated([[checkStart, 0, 'enter'], [checkEnd, 100]]) }),
    stroke('success', 9),
  ])

  const echoStart = checkEnd
  const echo = group('Echo', [
    ellipse(136),
    stroke('success', 2, {
      opacity: animated([[0, 0, 'hold'], [echoStart, 45, 'exit'], [echoStart + f('deliberate'), 0]]),
    }),
  ], { s: animated([[echoStart, [100, 100], 'enter'], [echoStart + f('deliberate'), [132, 132]]]) })

  return composition({
    nm: 'success-check',
    w: 200,
    h: 200,
    op,
    layers: [
      shapeLayer('Mark', [check, ring], { p: value([100, 100, 0]), s: animated(settle) }),
      shapeLayer('Echo', [echo], { p: value([100, 100, 0]) }),
    ],
  })
}

/**
 * upload-progress — an indeterminate loader. The arc's head leads and its
 * tail catches up (the pair eased on `standard`) while the whole ring turns
 * at a constant rate; the rotation is solved so frame 120 renders exactly
 * like frame 0. The arrow rides a conveyor: exits up, re-enters from below.
 */
export function uploadProgress() {
  const op = 120
  const head = [3, 75]
  const tail = [0, 72]
  // Tail travels 72% of a turn per cycle; the group adds the rest so the
  // arc ends where it began: 0.72 * 360 + turn ≡ 0 (mod 360).
  const turn = 360 * 2 - tail[1] * 3.6

  const track = group('Track', [ellipse(128), stroke('line', 12)])
  const arc = group('Arc', [
    ellipse(128),
    trim({
      s: animated([[0, tail[0], 'hold'], [56, tail[0], 'standard'], [op, tail[1]]]),
      e: animated([[0, head[0], 'standard'], [64, head[1]]]),
    }),
    stroke('accent', 12),
  ], { r: animated([[0, 0, 'linear'], [op, turn]]) })

  const outStart = 36
  const outEnd = outStart + f('slow')
  const inEnd = outEnd + f('deliberate') - f('fast')
  const arrow = group('Arrow', [
    polyline([[0, 15], [0, -14]]),
    polyline([[-12, -2], [0, -14], [12, -2]]),
    stroke('fg', 10),
  ], {
    p: animated([[0, [0, 0], 'hold'], [outStart, [0, 0], 'exit'], [outEnd, [0, -20], 'hold'], [outEnd + 1, [0, 20], 'enter'], [inEnd, [0, 0]]], { spatial: true }),
    o: animated([[0, 100, 'hold'], [outStart, 100, 'exit'], [outEnd, 0, 'hold'], [outEnd + 1, 0, 'enter'], [inEnd, 100]]),
  })

  return composition({
    nm: 'upload-progress',
    w: 200,
    h: 200,
    op,
    layers: [
      shapeLayer('Arrow', [arrow], { p: value([100, 100, 0]) }),
      shapeLayer('Ring', [arc, track], { p: value([100, 100, 0]) }),
    ],
  })
}

/**
 * logo-sting — an abstract "Y." built from three strokes. The stem rises to
 * the junction, the arms fan out from it on a loose stagger, the baseline opens
 * from the center, an accent streak runs across it, and the accent period
 * drops in on the settle spring as the arrival beat.
 */
export function logoSting() {
  const w = 480
  const h = 270
  const draw = f('slow') + f('fast') // 34f: a stroke's travel
  const step = stagger('loose') // 6f
  const stemAt = 0
  const upperAt = stemAt + draw - f('fast') // arms leave as the stem lands
  const lowerAt = upperAt + step
  const ruleAt = lowerAt + step
  const streakAt = ruleAt + f('fast')
  const dotAt = lowerAt + draw - step
  const op = 150

  // Geometry: a 132px-tall "Y" with its period, optically centered on the canvas.
  const cx = 216
  const top = 58
  const bottom = 190
  const weight = 18
  const junction = [cx, 128]
  const drawOn = (start, ease = 'emphasized') => trim({ e: animated([[start, 0, ease], [start + draw, 100]]) })
  const bar = (token) => stroke(token, weight, { cap: 'butt', join: 'miter' })

  // The stem runs a little past the junction so the arms' butt ends sit inside it.
  const stem = group('Stem', [polyline([[cx, bottom], [cx, junction[1] - weight / 2]]), drawOn(stemAt), bar('fg')])
  const upper = group('Right arm', [polyline([junction, [cx + 62, top]]), drawOn(upperAt), bar('fg')])
  const lower = group('Left arm', [polyline([junction, [cx - 62, top]]), drawOn(lowerAt), bar('fg')])

  const dotSize = 18
  const dotRest = [cx + 98, bottom - dotSize / 2]
  const dotDrop = springKeys(dotAt, [dotRest[0], dotRest[1] - 32], dotRest, 'settle')
  const dotScale = springKeys(dotAt, [0, 0], [100, 100], 'settle')
  const dot = group('Period', [rect(dotSize, dotSize, 2), fill('accent')], {
    p: animated(dotDrop, { spatial: true }),
    s: animated(dotScale),
  })

  const ruleY = 224
  const ruleSpan = [w / 2 - 96, w / 2 + 96]
  const rule = group('Baseline', [
    polyline([[ruleSpan[0], ruleY], [ruleSpan[1], ruleY]]),
    trim({
      s: animated([[ruleAt, 50, 'emphasized'], [ruleAt + f('deliberate'), 0]]),
      e: animated([[ruleAt, 50, 'emphasized'], [ruleAt + f('deliberate'), 100]]),
    }),
    stroke('line-strong', 2, { cap: 'butt' }),
  ])
  const streakTravel = f('deliberate') + f('slow')
  const streak = group('Streak', [
    polyline([[ruleSpan[0], ruleY], [ruleSpan[1], ruleY]]),
    trim({
      s: animated([[streakAt + step * 2, 0, 'standard'], [streakAt + step * 2 + streakTravel, 100]]),
      e: animated([[streakAt, 0, 'standard'], [streakAt + streakTravel, 100]]),
    }),
    stroke('accent', 2, { cap: 'butt' }),
  ])

  return composition({
    nm: 'logo-sting',
    w,
    h,
    op,
    layers: [
      shapeLayer('Period', [dot]),
      shapeLayer('Mark', [upper, lower, stem], {
        a: value([w / 2, (top + bottom) / 2, 0]),
        p: value([w / 2, (top + bottom) / 2, 0]),
        s: animated([[0, [96, 96, 100], 'emphasized'], [f('deliberate') * 2, [100, 100, 100]]]),
      }),
      shapeLayer('Baseline', [streak, rule]),
    ],
  })
}
