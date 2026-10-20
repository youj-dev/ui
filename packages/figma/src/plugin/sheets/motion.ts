import type { Kit, Personality } from '../../kit'
import { add, box, rect, solid, text, vector } from '../draw'
import type { Pages } from '../pages'
import { CONTENT_W, label, note, section, sheet } from '../sheet'
import { PERSONALITIES } from '../variables'

/* The Motion page: the specification, drawn still. Durations as a timeline,
 * easings as curves, springs as their analytic response (the same maths
 * Motion runs), staggers as offsets. The numbers are Motion variables, one
 * mode per personality; the motion itself lives in code. */

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const fmt = (n: number) => String(Math.round(n * 1000) / 1000)
// Three columns across the sheet's content, 48px apart.
const COL_W = (CONTENT_W - 2 * 48) / 3

function themesUsing(kit: Kit, p: Personality) {
  return kit.themes.filter((t) => kit.motion.themes[t.id] === p).map((t) => t.name)
}

async function column(kit: Kit, p: Personality, body: FrameNode) {
  const users = themesUsing(kit, p)
  return box(
    { name: title(p), dir: 'col', gap: 16, w: 'fill' },
    await box(
      { name: 'Head', dir: 'col', gap: 2 },
      await text(title(p), 'UI/lg/Semibold', 'role/fg'),
      await label(users.length ? users.join(', ') : 'no preset uses it'),
    ),
    body,
  )
}

async function durations(kit: Kit, p: Personality) {
  const values = kit.motion.personalities[p].durations
  const max = Math.max(...PERSONALITIES.flatMap((x) => Object.values(kit.motion.personalities[x].durations)))
  const rows = await box({ name: 'Durations', dir: 'col', gap: 14, w: 'fill' })
  for (const [name, ms] of Object.entries(values)) {
    const track = await box({ name: 'Track', dir: 'none', w: COL_W, h: 6, radius: 3, fill: 'role/well' })
    const bar = rect('Bar', Math.max(1, Math.round((ms / max) * COL_W)), 6, 'role/accent', 3)
    add(track, bar)
    add(
      rows,
      await box(
        { name, dir: 'col', gap: 6, w: 'fill' },
        await box({ name: 'Label', dir: 'row', gap: 8, align: 'baseline', w: 'fill' }, await text(name, 'UI/base/Medium', 'role/fg'), await box({ name: 'Spacer', w: 'fill', h: 1 }), await label(`${ms}ms`, 'role/fg')),
        track,
      ),
    )
  }
  return rows
}

const PLOT = 132
const PAD = 14

async function easingPlot(curve: [number, number, number, number]) {
  const size = PLOT + PAD * 2
  const plot = await box({ name: 'Plot', dir: 'none', w: size, h: size, radius: 'radius/lg', fill: 'role/well', clip: true })
  const px = (x: number) => PAD + x * PLOT
  const py = (y: number) => PAD + (1 - y) * PLOT
  vector(plot, `M ${px(0)} ${py(0)} L ${px(1)} ${py(1)}`, { stroke: solid('role/line-strong'), strokeWidth: 1 }, 'Linear')
  const [x1, y1, x2, y2] = curve
  vector(plot, `M ${px(0)} ${py(0)} C ${px(x1)} ${py(y1)} ${px(x2)} ${py(y2)} ${px(1)} ${py(1)}`, { stroke: solid('role/accent'), strokeWidth: 2 }, 'Curve')
  for (const [x, y] of [
    [0, 0],
    [1, 1],
  ] as const) {
    const dot = rect('Point', 6, 6, 'role/accent', 3)
    add(plot, dot)
    dot.x = px(x) - 3
    dot.y = py(y) - 3
  }
  return plot
}

async function easings(kit: Kit, p: Personality) {
  const grid = await box({ name: 'Easings', dir: 'col', gap: 20, w: 'fill' })
  for (const [name, curve] of Object.entries(kit.motion.personalities[p].easings)) {
    add(
      grid,
      await box(
        { name, dir: 'row', gap: 16, align: 'center', w: 'fill' },
        await easingPlot(curve),
        await box({ name: 'Text', dir: 'col', gap: 4, w: 'fill' }, await text(name, 'UI/base/Medium', 'role/fg'), await label(`cubic-bezier(${curve.map(fmt).join(', ')})`), await text(kit.motion.usage.easings[name] ?? '', 'UI/sm/Regular', 'role/fg-muted', { w: 'fill' })),
      ),
    )
  }
  return grid
}

async function springPlot(points: number[]) {
  const w = COL_W
  const h = 96
  const top = 16
  const plot = await box({ name: 'Plot', dir: 'none', w, h: h + top * 2, radius: 'radius/lg', fill: 'role/well', clip: true })
  const px = (i: number) => 12 + (i / (points.length - 1)) * (w - 24)
  const py = (v: number) => top + (1 - v) * h
  vector(plot, `M ${px(0)} ${py(1)} L ${px(points.length - 1)} ${py(1)}`, { stroke: solid('role/line-strong'), strokeWidth: 1 }, 'Target')
  vector(plot, points.map((v, i) => `${i ? 'L' : 'M'} ${fmt(px(i))} ${fmt(py(v))}`).join(' '), { stroke: solid('role/accent'), strokeWidth: 2 }, 'Response')
  return plot
}

async function springs(kit: Kit, p: Personality) {
  const list = await box({ name: 'Springs', dir: 'col', gap: 20, w: 'fill' })
  for (const [name, shape] of Object.entries(kit.motion.personalities[p].springs)) {
    const over = Math.max(...kit.motion.springCurves[p][name]!) - 1
    add(
      list,
      await box(
        { name, dir: 'col', gap: 8, w: 'fill' },
        await springPlot(kit.motion.springCurves[p][name]!),
        await box({ name: 'Label', dir: 'row', gap: 8, align: 'baseline', w: 'fill' }, await text(name, 'UI/base/Medium', 'role/fg'), await box({ name: 'Spacer', w: 'fill', h: 1 }), await label(`${shape.visualDuration}s · bounce ${shape.bounce}${over > 0.001 ? ` · ${Math.round(over * 1000) / 10}% over` : ''}`, 'role/fg')),
        await text(kit.motion.usage.springs[name] ?? '', 'UI/sm/Regular', 'role/fg-muted', { w: 'fill' }),
      ),
    )
  }
  return list
}

async function staggers(kit: Kit, p: Personality) {
  const list = await box({ name: 'Staggers', dir: 'col', gap: 16, w: 'fill' })
  const item = kit.motion.personalities[p].durations.base!
  // One time scale for every personality, so the lanes compare.
  const all = PERSONALITIES.map((x) => kit.motion.personalities[x])
  const span = 5 * Math.max(...all.flatMap((x) => Object.values(x.staggers))) + Math.max(...all.map((x) => x.durations.base!))
  const scale = COL_W / span
  for (const [name, step] of Object.entries(kit.motion.personalities[p].staggers)) {
    const lane = await box({ name: 'Timeline', dir: 'none', w: COL_W, h: 6 * 8 })
    for (let i = 0; i < 6; i++) {
      const bar = rect(`Item ${i + 1}`, Math.max(2, item * scale), 5, i === 0 ? 'role/accent' : ['role/accent', 0.45], 2.5)
      add(lane, bar)
      bar.x = i * step * scale
      bar.y = i * 8
    }
    add(
      list,
      await box(
        { name, dir: 'col', gap: 8, w: 'fill' },
        await box({ name: 'Label', dir: 'row', gap: 8, align: 'baseline', w: 'fill' }, await text(name, 'UI/base/Medium', 'role/fg'), await box({ name: 'Spacer', w: 'fill', h: 1 }), await label(`${step}ms apart`, 'role/fg')),
        lane,
        await text(kit.motion.usage.staggers[name] ?? '', 'UI/sm/Regular', 'role/fg-muted', { w: 'fill' }),
      ),
    )
  }
  return list
}

export async function motionSheet(pages: Pages, kit: Kit) {
  const frame = await sheet(pages, 'motion', {
    title: 'Motion',
    lede: 'Fast, confident motion that lands precisely. Every animation reads its timing from these tokens through useYouj(), so the Speed and Reduced motion controls reach all of it. A theme picks one of three personalities; the token names never change, only their values.',
  })
  add(
    frame,
    await box(
      { name: 'Notes', dir: 'row', gap: 16, w: 'fill' },
      await note('Motion lives in code', 'Figma can’t play these. This page is the specification: the numbers are the Motion variables (a mode per personality) and the curves are drawn from the same maths Motion runs. Watch them move in Storybook (Foundations → Motion) or on the docs site.'),
      await note('Reduced motion is a first-class state', 'Under reduced motion every animation renders its final state: loops stop, travel drops, and the result says the same thing. Durations scale to zero (--yj-motion); nothing is simply skipped.'),
    ),
  )
  const parts: [string, string, (kit: Kit, p: Personality) => Promise<FrameNode>][] = [
    ['Durations', 'Before the Speed control scales them. Instant for hover tints and presses, base for most moves, deliberate for hero moments.', durations],
    ['Easing', 'Progress over time for each curve. Only lively overshoots (by about 3%) on arrivals.', easings],
    ['Springs', 'Defined by perceived duration and bounce, so they scale with time. settle is the one earned overshoot.', springs],
    ['Stagger', 'The step between siblings, each running the base duration. Six items, drawn to scale.', staggers],
  ]
  for (const [name, blurb, draw] of parts) {
    const row = await box({ name, dir: 'row', gap: 48, w: 'fill', align: 'start' })
    for (const p of PERSONALITIES) add(row, await column(kit, p, await draw(kit, p)))
    add(frame, await section(name, blurb, {}, row))
  }
}
