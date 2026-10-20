'use client'

import { project } from '../iso'
import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { useIsoScene } from '../iso-scene'
import { arc, band, bob, circle, Group, IllustrationStage, INK, Lathe, Link, Mark, orb, Prism, rect, type IllustrationProps, type PlanePoint } from './kit'

/* Sports: playing for the fun of it. A bike hopping off its lane, a ball
 * over the hoop about to drop through, a stopwatch with its button about to
 * click, and a ball bouncing off the strings of a racket. */

/** A rod from one point to another in plane units, `r` either side, its ends round: a frame's tube, a racket's throat. */
const tube = ([au, av]: PlanePoint, [bu, bv]: PlanePoint, r: number): PlanePoint[] => {
  const a = Math.atan2(bv - av, bu - au)
  return [...arc(bu, bv, r, a - Math.PI / 2, a + Math.PI / 2, 6), ...arc(au, av, r, a + Math.PI / 2, a + (3 * Math.PI) / 2, 6)]
}

/** The seams on a ball of radius `r` centered at `at`, as the eye sees them: a curve down either side and, for a basketball, its cross. */
function Seams({ at, r, cross, ink }: { at: readonly [number, number, number]; r: number; cross?: boolean; ink: string }) {
  const { unit } = useIsoScene()
  const [x, y] = project(at[0], at[1], at[2], unit)
  const s = r * Math.sqrt(1.5) * unit
  const sides = [-1, 1].map((k) => `M${x + k * 0.65 * s},${y - 0.76 * s} A${1.55 * s},${1.55 * s} 0 0 ${k < 0 ? 1 : 0} ${x + k * 0.65 * s},${y + 0.76 * s}`)
  const lines = cross ? [`M${x},${y - s} L${x},${y + s}`, `M${x - s},${y} Q${x},${y + 0.5 * s} ${x + s},${y}`] : []
  return [...sides, ...lines].map((d) => <path key={d} d={d} className="kg-line" style={{ fill: 'none', stroke: ink, strokeWidth: 1.5 }} />)
}

/** A bicycle side on, rear hub at the origin, front hub at WHEELBASE: its diamond frame, fork, seat post and stem, each tube as [from, to]. */
const WHEELBASE = 3.6
const FRAME: [PlanePoint, PlanePoint][] = [
  [[0, 0], [1.3, -0.12]],
  [[0, 0], [0.9, 1.46]],
  [[1.3, -0.12], [0.9, 1.46]],
  [[0.9, 1.46], [2.92, 1.41]],
  [[1.3, -0.12], [3.02, 1.02]],
  [[2.92, 1.41], [3.06, 0.9]],
  [[3.06, 0.9], [WHEELBASE, 0]],
  [[0.9, 1.46], [0.8, 1.92]],
  [[2.92, 1.41], [2.87, 1.9]],
]

/** A bicycle in the accent hovering over its lane, its shadow on the road. Hovered, it hops. */
export function IllustrationBicycle(props: IllustrationProps) {
  const [x, y, z, t] = [2.2, 3.95, 2.05, 0.14]
  const mid = y + t / 2
  return (
    <IllustrationStage id="bicycle" {...props}>
      <IsoPlatform x={0.6} y={1.1} w={6.8} d={5.8} h={0.4} lip={0.15} inset={0.3} />
      <IsoBox x={0.9} y={3.1} z={0.55} w={6.2} d={1.8} h={0.04} tone="sunken">
        <Mark plane="top" at={[0.9, 3.1, 0.59]} points={rect(0.7, 0.7, 4.8, 0.5)} fill={INK.faint} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Mark key={i} plane="top" at={[0.9, 3.1, 0.59]} points={rect(0.25 + i * 1.05, 1.62, 0.6, 0.08)} fill={INK.line} />
        ))}
      </IsoBox>
      <Group float={bob(props, 0.14)} lift={0.8}>
        {[0, WHEELBASE].map((u) => (
          <Prism key={u} plane="left" at={[x + u, y, z]} points={band(0, 0, 0.88, 1.15, -Math.PI / 2, (3 * Math.PI) / 2, 40)} depth={t} tone="raised" hue={1} />
        ))}
        {FRAME.map(([a, b], i) => (
          <Prism key={i} plane="left" at={[x, y, z]} points={tube(a, b, 0.12)} depth={t} tone="accent" />
        ))}
        {[0, WHEELBASE].map((u) => (
          <Prism key={`hub${u}`} plane="left" at={[x + u, y - 0.05, z]} points={circle(0, 0, 0.17, 16)} depth={t + 0.1} tone="neutral" />
        ))}
        <Prism plane="left" at={[x, mid - 0.16, z]} points={tube([0.44, 2.03], [1.12, 2.03], 0.11)} depth={0.32} tone="neutral" />
        <Lathe axis="y" cx={x + 2.87} cy={mid - 0.45} z={z + 1.98} profile={[[0.09, 0], [0.09, 0.9]]} tone="neutral" />
      </Group>
    </IllustrationStage>
  )
}

/** A hoop on its pole, the ball in the accent over the rim. Hovered, it drops through the net. */
export function IllustrationBasketball(props: IllustrationProps) {
  const [cx, cy, rim] = [3.4, 3.2, 3.05]
  const ball = [cx, cy, rim + 1.5] as const
  const board = { x: cx - 1.7, y: 2.05, z: 2.65, w: 3.4, d: 0.16, h: 2.15 }
  const strands = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2)
  const strand = (t: number) => <Link key={t} points={[[cx + Math.cos(t) * 0.8, cy + Math.sin(t) * 0.8, rim], [cx + Math.cos(t + 0.4) * 0.48, cy + Math.sin(t + 0.4) * 0.48, rim - 0.85]]} />
  const near = (t: number) => Math.cos(t) + Math.sin(t) > 0
  return (
    <IllustrationStage id="basketball" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3}>
        <Mark plane="top" at={[0, 0, 0.55]} points={rect(cx - 1.1, 2.2, 2.2, 3.1)} stroke={INK.line} closed />
        <Mark plane="top" at={[0, 0, 0.55]} points={arc(cx, 5.3, 1.1, 0, Math.PI, 20)} stroke={INK.line} />
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(cx, cy, 0.55, 20)} fill={INK.faint} />
      </IsoPlatform>
      <IsoBox x={cx - 0.2} y={0.9} z={0.55} w={0.4} d={0.4} h={3.1} tone="neutral" />
      <IsoBox x={cx - 0.12} y={1.3} z={3.25} w={0.24} d={0.75} h={0.2} tone="neutral" />
      <IsoBox {...board} tone="raised" hue={1}>
        <Mark plane="left" at={[board.x, 2.21, board.z]} points={rect(0.2, 0.2, 3, 1.75)} stroke={INK.line} closed />
        <Mark plane="left" at={[board.x, 2.21, board.z]} points={rect(1.15, 0.4, 1.1, 0.8)} stroke={INK.line} weight={1.5} closed />
      </IsoBox>
      <IsoBox x={cx - 0.2} y={2.21} z={rim - 0.12} w={0.4} d={0.2} h={0.16} tone="neutral" />
      <Prism plane="top" at={[0, 0, rim]} points={band(cx, cy, 0.8, 0.92, (3 * Math.PI) / 4, (7 * Math.PI) / 4, 20)} depth={0.1} tone="raised" hue={2} />
      {strands.filter((t) => !near(t)).map(strand)}
      <Lathe cx={cx} cy={cy} z={ball[2] - 0.6} profile={orb(0.6)} convex tone="accent" float={bob(props, 0.14)} lift={-1.25}>
        <Seams at={ball} r={0.6} cross ink="var(--kg-edge)" />
      </Lathe>
      <g>
        <Group delay={7}>
          <Prism plane="top" at={[0, 0, rim]} points={band(cx, cy, 0.8, 0.92, -Math.PI / 4, (3 * Math.PI) / 4, 20)} depth={0.1} tone="raised" hue={2} />
        </Group>
        {strands.filter(near).map(strand)}
      </g>
    </IllustrationStage>
  )
}

/** A stopwatch hovering on its edge, the time so far swept in the accent and its button in the accent on top. Hovered, the button clicks. */
export function IllustrationStopwatch(props: IllustrationProps) {
  const [cx, y, cz, r, t] = [4, 3.65, 2.75, 1.75, 0.7]
  const face = [cx, y + t, cz] as const
  const top = cz + r
  const mid = y + t / 2
  const hand = Math.PI / 2 - (Math.PI * 2 * 10) / 60
  return (
    <IllustrationStage id="stopwatch" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[cx, mid, 0.55]} points={circle(0, 0, 1, 32).map(([u, v]) => [u * 1.5, v * 0.5] as const)} fill={INK.faint} />
      </IsoPlatform>
      <Group float={bob(props, 0.14)}>
        <Lathe axis="y" cx={cx} cy={y} z={cz} profile={[[r - 0.12, 0], [r, 0.14], [r, t - 0.14], [r - 0.12, t]]} tone="raised" hue={1}>
          <Mark plane="left" at={face} points={circle(0, 0, 1.38, 44)} fill={INK.faint} stroke={INK.line} />
          {Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2).map((a, i) => (
            <Mark key={a} plane="left" at={face} points={[[Math.cos(a) * (i % 3 ? 1.16 : 1.0), Math.sin(a) * (i % 3 ? 1.16 : 1.0)], [Math.cos(a) * 1.28, Math.sin(a) * 1.28]]} stroke={INK.line} weight={i % 3 ? 1 : 2} />
          ))}
          <Mark plane="left" at={face} points={[[0, 0], ...arc(0, 0, 0.95, Math.PI / 2, hand, 12)]} fill={INK.accent} opacity={0.3} />
          <Mark plane="left" at={face} points={[[0, 0], [Math.cos(hand) * 1.1, Math.sin(hand) * 1.1]]} stroke={INK.accent} weight={2} />
          <Mark plane="left" at={face} points={circle(0, 0, 0.11, 12)} fill={INK.accent} />
        </Lathe>
        <IsoCylinder x={cx - 0.18} y={mid - 0.18} z={top - 0.12} r={0.18} h={0.44} tone="neutral" />
        <Group lift={-0.28}>
          <IsoCylinder x={cx - 0.4} y={mid - 0.4} z={top + 0.32} r={0.4} h={0.28} tone="accent" />
          <Prism plane="left" at={[0, mid - 0.08, 0]} points={band(cx, top + 0.98, 0.24, 0.42, -Math.PI / 2, (3 * Math.PI) / 2, 28)} depth={0.16} tone="accent" />
        </Group>
      </Group>
    </IllustrationStage>
  )
}

/** A racket lying on the court, and a ball in the accent over its strings. Hovered, it bounces up off them. */
export function IllustrationTennis(props: IllustrationProps) {
  const z = 0.55
  // Along the racket (across the screen) and across it (toward you), from its head's center, onto the floor.
  const lay = ([a, b]: PlanePoint): PlanePoint => [4.95 + (a + b) / Math.SQRT2, 3.05 + (b - a) / Math.SQRT2]
  const [A, B, rim] = [1.8, 1.38, 0.24]
  const oval = (s: number, from: number, to: number) => arc(0, 0, 1, from, to, 36).map(([a, b]) => [a * (A - s), b * (B - s)] as const)
  const chord = (v: number, along: boolean) => {
    const [a, b] = along ? [A - rim, B - rim] : [B - rim, A - rim]
    const h = a * Math.sqrt(1 - (v / b) ** 2)
    return (along ? [[-h, v], [h, v]] : [[v, -h], [v, h]]) as PlanePoint[]
  }
  const ball = [4.95, 3.05, z + 1.9] as const
  return (
    <IllustrationStage id="tennis" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3}>
        <Mark plane="top" at={[0, 0, z]} points={rect(1.2, 1.2, 5.6, 5.6)} stroke={INK.line} closed />
        <Mark plane="top" at={[0, 0, z]} points={[[1.2, 4], [6.8, 4]]} stroke={INK.line} />
      </IsoPlatform>
      <Prism plane="top" at={[0, 0, z]} points={[...oval(0, Math.PI, -Math.PI), ...oval(rim, -Math.PI, Math.PI)].map(lay)} depth={0.16} tone="raised" hue={1}>
        {[-0.84, -0.5, -0.17, 0.17, 0.5, 0.84].map((v) => (
          <Mark key={v} plane="top" at={[0, 0, z + 0.1]} points={chord(v, true).map(lay)} stroke={INK.line} />
        ))}
        {[-1.2, -0.72, -0.24, 0.24, 0.72, 1.2].map((v) => (
          <Mark key={v} plane="top" at={[0, 0, z + 0.1]} points={chord(v, false).map(lay)} stroke={INK.line} />
        ))}
        <Mark plane="top" at={[0, 0, z + 0.16]} points={circle(0, 0, 0.5, 20).map(lay)} fill={INK.faint} />
      </Prism>
      {[1, -1].map((s) => (
        <Prism key={s} plane="top" at={[0, 0, z]} points={tube([-2.6, 0], [-1.48, s * 0.78], 0.11).map(lay)} depth={0.16} tone="raised" hue={1} />
      ))}
      <Prism plane="top" at={[0, 0, z]} points={tube([-4.5, 0], [-2.55, 0], 0.22).map(lay)} depth={0.22} tone="neutral" hue={2} />
      <Lathe cx={ball[0]} cy={ball[1]} z={ball[2] - 0.55} profile={orb(0.55)} convex tone="accent" float={bob(props, 0.16)} lift={1}>
        <Seams at={ball} r={0.55} ink="var(--kg-lit)" />
      </Lathe>
    </IllustrationStage>
  )
}
