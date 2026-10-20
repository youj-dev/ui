'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { arc, bob, circle, curve, flat, Group, IllustrationStage, INK, Lathe, Link, Mark, Prism, rect, rounded, smooth, type IllustrationProps, type PlanePoint } from './kit'

/* Health: the body and looking after it. A monitor tracing a pulse with
 * the heart beside it, a dumbbell mid-rep over its mat, and a first-aid
 * kit under its cross. Then a pill bottle with a capsule rising out of it,
 * a stethoscope laid on the table, a tooth over its brush, and someone
 * meditating over the mat. */

/** A heart in plane units, centered on (cu, cv), `s` wide. */
const heart = (cu: number, cv: number, s: number): PlanePoint[] =>
  Array.from({ length: 48 }, (_, i) => {
    const t = (i / 48) * Math.PI * 2
    const k = s / 32
    return [cu + 16 * Math.sin(t) ** 3 * k, cv + (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * k] as const
  })

/** One beat and the flat line either side of it, across the screen. */
const PULSE: PlanePoint[] = [
  [0.5, 1.35],
  [1.1, 1.35],
  [1.3, 1.6],
  [1.48, 1.35],
  [1.66, 1.35],
  [1.82, 0.85],
  [2.02, 2.3],
  [2.22, 1.1],
  [2.36, 1.35],
  [2.7, 1.35],
  [2.9, 1.55],
  [3.1, 1.35],
  [3.3, 1.35],
]

/** A monitor tracing one beat across its screen, and the heart beside it in the accent. */
export function IllustrationHeartRate(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1, 2.2, 0.55, 4.5, 1.7, 2.8]
  const face = [x, y + d, z] as const
  return (
    <IllustrationStage id="heart-rate" {...props}>
      <IsoPlatform x={0.6} y={1.2} w={6.8} d={5.6} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Mark plane="left" at={face} points={rect(0.3, 0.45, 3.2, 1.95)} fill={INK.faint} stroke={INK.line} />
        <Mark plane="left" at={face} points={PULSE} stroke={INK.line} weight={2} />
        {[0.7, 1.25, 1.8].map((v) => (
          <Mark key={v} plane="left" at={face} points={circle(4.05, v, 0.17)} fill={INK.faint} stroke={INK.line} />
        ))}
        {[0.6, 0.95, 1.3].map((u) => (
          <Mark key={u} plane="right" at={[x + w, y, z]} points={rect(u - 0.06, 1.2, 0.12, 1)} fill={INK.faint} />
        ))}
      </IsoBox>
      <Prism plane="left" at={[0, 4.5, 0]} points={heart(5.9, 2.3, 1.9)} depth={0.5} tone="accent" float={bob(props, 0.18)} lift={0.9} />
    </IllustrationStage>
  )
}

/** A dumbbell's parts along its bar, far end first: [radius, length, tone]. */
const DUMBBELL = [
  [0.14, 0.25, 'raised'],
  [0.85, 0.35, 'raised'],
  [0.68, 0.3, 'raised'],
  [0.24, 0.2, 'neutral'],
  [0.18, 2, 'accent'],
  [0.24, 0.2, 'neutral'],
  [0.68, 0.3, 'raised'],
  [0.85, 0.35, 'raised'],
  [0.14, 0.25, 'raised'],
] as const

/** A dumbbell mid-rep over its mat, the end of the mat still rolled, the grip in the accent. */
export function IllustrationFitness(props: IllustrationProps) {
  const [cy, cz] = [4.05, 2.15]
  const starts = DUMBBELL.map((_, i) => DUMBBELL.slice(0, i).reduce((at, [, len]) => at + len, 1.8))
  return (
    <IllustrationStage id="fitness" {...props}>
      <IsoPlatform x={0.6} y={1.1} w={6.8} d={5.8} h={0.4} lip={0.15} inset={0.3} />
      <IsoBox x={1.7} y={2.4} z={0.55} w={5.2} d={3.3} h={0.08} tone="raised" hue={1}>
        {[0.3, 4.7].map((u) => (
          <Mark key={u} plane="top" at={[1.7, 2.4, 0.63]} points={rect(u, 0.25, 0.2, 2.8)} fill={INK.faint} />
        ))}
      </IsoBox>
      <Lathe axis="y" cx={1.3} cy={2.4} z={0.95} profile={[[0.4, 0], [0.4, 3.3]]} tone="raised">
        <Mark plane="left" at={[1.3, 5.7, 0.95]} points={circle(0, 0, 0.22, 24)} stroke={INK.line} closed />
      </Lathe>
      <Group float={bob(props, 0.22)} lift={1}>
        {DUMBBELL.map(([r, len, tone], i) => (
          <Lathe key={i} axis="x" cx={starts[i]!} cy={cy} z={cz} profile={[[r, 0], [r, len]]} tone={tone} />
        ))}
      </Group>
    </IllustrationStage>
  )
}

/** A plus in plane units, centered on (cu, cv): arms `a` thick, `l` long. */
const plus = (cu: number, cv: number, l: number, a: number): PlanePoint[] => [
  [cu - a, cv - l],
  [cu + a, cv - l],
  [cu + a, cv - a],
  [cu + l, cv - a],
  [cu + l, cv + a],
  [cu + a, cv + a],
  [cu + a, cv + l],
  [cu - a, cv + l],
  [cu - a, cv + a],
  [cu - l, cv + a],
  [cu - l, cv - a],
  [cu - a, cv - a],
]

/** A first-aid kit with its handle and latches, and over it the cross, in the accent. */
export function IllustrationFirstAid(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.7, 2.7, 0.55, 4.6, 2.4, 2.3]
  const top = z + h
  const face = [x, y + d, z] as const
  const seam = h - 0.55
  return (
    <IllustrationStage id="first-aid" {...props}>
      <IsoPlatform x={0.8} y={1.1} w={6.4} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Mark plane="left" at={face} points={[[0, seam], [w, seam]]} stroke={INK.line} />
        <Mark plane="right" at={[x + w, y, z]} points={[[0, seam], [d, seam]]} stroke={INK.line} />
        {[0.7, w - 0.95].map((u) => (
          <Mark key={u} plane="left" at={face} points={rect(u, seam - 0.28, 0.25, 0.46)} fill={INK.line} />
        ))}
        <Mark plane="left" at={face} points={plus(w / 2, 0.85, 0.55, 0.19)} fill={INK.faint} stroke={INK.line} />
      </IsoBox>
      <Prism
        plane="left"
        at={[x + w / 2 - 0.8, y + d / 2 - 0.15, top]}
        points={[[0, 0], [0.24, 0], [0.24, 0.32], [1.36, 0.32], [1.36, 0], [1.6, 0], [1.6, 0.55], [0, 0.55]]}
        depth={0.3}
        tone="raised"
      />
      <Prism plane="left" at={[0, y + d / 2 - 0.2, 0]} points={plus(x + w / 2, top + 2.05, 1, 0.34)} depth={0.45} tone="accent" float={bob(props, 0.18)} lift={0.8} />
    </IllustrationStage>
  )
}

/** One rounded end of a capsule, [radius, length] from its tip. */
const CAPSULE_END = [[0.02, 0], [0.2, 0.05], [0.32, 0.14], [0.4, 0.28], [0.43, 0.45]] as const

/** An open pill bottle with its label, the cap on its side and two tablets by it, and a capsule in the accent rising out. Hovered, it rises further. */
export function IllustrationPills(props: IllustrationProps) {
  const [cx, cy, r] = [3.05, 3.85, 1.05]
  const base = 0.55
  const top = base + 2.05
  const mouth = top + 0.22
  const [px, pz, half] = [cx - 0.95, mouth + 1.05, 0.95]
  return (
    <IllustrationStage id="pills" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <IsoCylinder x={cx - r} y={cy - r} z={base} r={r} h={0.5} tone="neutral" />
      <IsoCylinder x={cx - r - 0.03} y={cy - r - 0.03} z={base + 0.5} r={r + 0.03} h={1.05} tone="raised" hue={1} />
      <IsoCylinder x={cx - r} y={cy - r} z={base + 1.55} r={r} h={top - base - 1.55} tone="neutral" />
      <IsoCylinder x={cx - 0.84} y={cy - 0.84} z={top} r={0.84} h={mouth - top} tone="neutral">
        <Mark plane="top" at={[cx, cy, mouth]} points={circle(0, 0, 0.68, 32)} fill={INK.well} />
      </IsoCylinder>
      <Lathe axis="y" cx={5.45} cy={2.75} z={base + 1.1} profile={[[1.1, 0], [1.1, 0.5]]} tone="neutral">
        <Mark plane="left" at={[5.45, 3.25, base + 1.1]} points={circle(0, 0, 0.9, 32)} fill={INK.well} />
      </Lathe>
      {[[4.3, 5.35], [5.3, 4.85]].map(([tx, ty]) => (
        <IsoCylinder key={tx} x={tx! - 0.42} y={ty! - 0.42} z={base} r={0.42} h={0.16} tone="raised" hue={1}>
          <Mark plane="top" at={[tx!, ty!, base + 0.16]} points={[flat(-0.3, 0), flat(0.3, 0)]} stroke={INK.line} />
        </IsoCylinder>
      ))}
      <Group float={bob(props, 0.16)} lift={0.9}>
        <Lathe axis="x" cx={px} cy={cy} z={pz} profile={[...CAPSULE_END, [0.43, half]]} convex tone="accent" />
        <Lathe axis="x" cx={px + half} cy={cy} z={pz} profile={[[0.43, 0], ...CAPSULE_END.map(([rr, h]) => [rr, half - h] as const).reverse()]} convex tone="raised" />
      </Group>
    </IllustrationStage>
  )
}

/** A tube `w` across along a path in plane units, as one outline: out along one side and back along the other. */
const tube = (path: readonly PlanePoint[], w: number): PlanePoint[] => {
  const off = path.map((_, i) => {
    const [a, b] = [path[Math.max(i - 1, 0)]!, path[Math.min(i + 1, path.length - 1)]!]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    return [((a[1] - b[1]) / len) * (w / 2), ((b[0] - a[0]) / len) * (w / 2)] as const
  })
  const side = (s: number) => path.map(([u, v], i) => [u + s * off[i]![0], v + s * off[i]![1]] as const)
  return [...side(1), ...side(-1).reverse()]
}

/** A stethoscope laid on the table, its tubing looped round, and its chest piece in the accent. Hovered, it's picked up to listen. */
export function IllustrationStethoscope(props: IllustrationProps) {
  const z = 0.55
  const [ux, uy, ur] = [2.4, 2.45, 1.2]
  const q = Math.PI / 4
  const at = (a: number, back = 0) => [ux + ur * Math.cos(a) - back, uy + ur * Math.sin(a) - back] as const
  const [cx, cy, cr] = [5.5, 5.6, 1]
  const tips = [at(3 * q, 0.4), at(-q, 0.4)]
  const [ex, ey] = at(q)
  const hose = curve([ex, ey], [ex + 1.1, ey + 1.1], [2.5, 6.5], [cx - cr + 0.05, cy + 0.12])
  return (
    <IllustrationStage id="stethoscope" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <Prism plane="top" at={[0, 0, z]} points={tube([tips[0]!, ...arc(ux, uy, ur, 3 * q, -q, 20), tips[1]!], 0.3)} depth={0.28} tone="raised" hue={1} />
      {tips.map(([tx, ty]) => (
        <IsoCylinder key={tx} x={tx - 0.24} y={ty - 0.24} z={z} r={0.24} h={0.42} tone="neutral" />
      ))}
      <Prism plane="top" at={[0, 0, z]} points={tube(hose, 0.36)} depth={0.34} tone="raised" hue={1} />
      <Group float={bob(props, 0.14)} lift={0.8}>
        <IsoCylinder x={cx - cr} y={cy - cr} z={z + 0.3} r={cr} h={0.36} tone="accent">
          <Mark plane="top" at={[cx, cy, z + 0.66]} points={circle(0, 0, cr - 0.22, 36)} stroke={INK.onAccent} opacity={0.6} closed />
          <Mark plane="top" at={[cx, cy, z + 0.66]} points={circle(0, 0, 0.16, 14)} fill={INK.onAccent} opacity={0.6} />
        </IsoCylinder>
      </Group>
    </IllustrationStage>
  )
}

/** A molar in plane units, crown up, centered on u = 0: two cusps over two roots. */
const MOLAR = smooth([[-0.85, 0], [-0.5, 0.35], [0, 1.05], [0.5, 0.35], [0.85, 0], [1.2, 1.1], [1.42, 2.3], [1.1, 3], [0.5, 2.85], [0, 2.65], [-0.5, 2.85], [-1.1, 3], [-1.42, 2.3], [-1.2, 1.1]])

/** A tooth in the accent, shining, over the brush that keeps it so. Hovered, it rises. */
export function IllustrationTooth(props: IllustrationProps) {
  const [cx, ty, tz, depth] = [4, 3, 1.35, 1.35]
  const face = [cx, ty + depth, tz] as const
  const sparkle = (x: number, y: number, z: number, s: number) => [
    [[x - s * 0.6, y + s * 0.6, z], [x + s * 0.6, y - s * 0.6, z]],
    [[x, y, z - s], [x, y, z + s]],
  ] as const
  return (
    <IllustrationStage id="tooth" {...props}>
      <IsoPlatform x={0.8} y={1.1} w={6.4} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={2.1} y={5.3} z={0.55} w={3.1} d={0.3} h={0.16} tone="raised" hue={1} />
      <IsoBox x={5.2} y={5.22} z={0.55} w={0.85} d={0.46} h={0.22} tone="raised" hue={1}>
        <IsoBox x={5.26} y={5.28} z={0.77} w={0.73} d={0.34} h={0.36} tone="neutral">
          {[0.15, 0.3, 0.45, 0.6].map((u) => (
            <Mark key={u} plane="left" at={[5.26, 5.62, 0.77]} points={[[u, 0.04], [u, 0.32]]} stroke={INK.line} />
          ))}
        </IsoBox>
      </IsoBox>
      <Group float={bob(props, 0.18)} lift={0.8}>
        <Prism plane="left" at={[cx, ty, tz]} points={MOLAR} depth={depth} tone="accent">
          <Mark plane="left" at={face} points={arc(-0.35, 2.05, 0.6, Math.PI * 0.58, Math.PI * 0.92, 10)} stroke={INK.onAccent} weight={2} opacity={0.7} />
        </Prism>
        {[sparkle(cx + 1.95, ty + 0.7, tz + 3.05, 0.3), sparkle(cx - 2.05, ty + 0.7, tz + 2, 0.22)].flat().map((pts, i) => (
          <Link key={i} points={pts} lit />
        ))}
      </Group>
    </IllustrationStage>
  )
}

/** Someone meditating, cut from the accent like a standee: crossed legs, hands on the knees. It floats over the mat, a block beside it. Hovered, it rises. */
export function IllustrationYoga(props: IllustrationProps) {
  const [cx, cy] = [4.1, 4.3]
  const mat = 0.63
  const seat = mat + 0.7
  const at = [0, cy - 0.25, 0] as const
  const part = (points: readonly PlanePoint[]) => points.map(([u, v]) => [cx + u * 1.22, seat + v * 1.22] as const)
  const legs = smooth([[-1.4, 0.3], [-0.9, 0.64], [0, 0.74], [0.9, 0.64], [1.4, 0.3], [0.9, 0], [-0.9, 0]])
  const torso = smooth([[-0.45, 0.5], [0.45, 0.5], [0.6, 1.25], [0.58, 1.78], [0, 1.95], [-0.58, 1.78], [-0.6, 1.25]])
  const arm = (s: number): PlanePoint[] => [[s * 0.52, 1.7], [s * 1.08, 1.08], [s * 1.12, 0.6]]
  return (
    <IllustrationStage id="yoga" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={1.2} y={2.55} z={0.55} w={5.6} d={3.1} h={0.08} tone="raised" hue={1}>
        <Mark plane="top" at={[1.2, 2.55, mat]} points={rounded(0.2, 0.2, 5.2, 2.7, 0.3)} stroke={INK.line} closed />
        <Mark plane="top" at={[cx, cy, mat]} points={circle(0, 0, 1.4, 36)} fill={INK.faint} />
      </IsoBox>
      <IsoBox x={5.2} y={1.15} z={0.55} w={1.5} d={0.95} h={0.62} tone="neutral" hue={2} />
      <Group float={bob(props, 0.18)} lift={0.9}>
        <Prism plane="left" at={at} points={part(legs)} depth={0.5} tone="accent" />
        {[1, -1].map((s) => (
          <Prism key={s} plane="left" at={at} points={part(tube(arm(s), 0.3))} depth={0.5} tone="accent" />
        ))}
        <Prism plane="left" at={at} points={part(torso)} depth={0.5} tone="accent" />
        <Prism plane="left" at={at} points={part(circle(0, 2.4, 0.38, 24))} depth={0.5} tone="accent" />
      </Group>
    </IllustrationStage>
  )
}
