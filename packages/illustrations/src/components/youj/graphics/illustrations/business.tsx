'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { arc, bob, circle, Group, IllustrationStage, INK, Lathe, Link, Mark, Prism, rect, type IllustrationProps, type PlanePoint } from './kit'

/* Business: the work between people and companies. A dart about to land in
 * the bullseye, a contract being signed, a pitch on its easel, and the
 * scales a case is weighed on. */

/** A dart's point and barrel, bottom up. */
const BARREL = [
  [0, 0],
  [0.035, 0.34],
  [0.1, 0.42],
  [0.16, 0.52],
  [0.17, 1.08],
  [0.1, 1.2],
] as const

/** Half a flight on a dart whose axis is at `c`, from `z` up, out to side `s` (1 or -1). */
const vane = (c: number, z: number, s: number): PlanePoint[] => [
  [c, z],
  [c + 0.24 * s, z + 0.16],
  [c + 0.44 * s, z + 0.52],
  [c + 0.5 * s, z + 0.8],
  [c + 0.38 * s, z + 1.02],
  [c, z + 1],
]

/** A target on the floor in rings, and a dart in the accent over the bullseye: point, barrel, shaft and crossed flights, the far vane first. Hovered, it lands. */
export function IllustrationTarget(props: IllustrationProps) {
  const [cx, cy] = [4, 4]
  const face = 1.05
  const rings = [
    [1.85, 'sunken'],
    [1.28, 'raised'],
    [0.68, 'sunken'],
  ] as const
  const tip = face + rings.length * 0.05 + 0.9
  const top = tip + BARREL.at(-1)![1]
  const flights = top + 0.28
  return (
    <IllustrationStage id="target" {...props}>
      <IsoPlatform x={0.8} y={0.8} w={6.4} d={6.4} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoCylinder x={cx - 2.45} y={cy - 2.45} z={0.55} r={2.45} h={face - 0.55} tone="raised">
        {rings.map(([r, tone], i) => (
          <IsoCylinder key={r} x={cx - r} y={cy - r} z={face + i * 0.05} r={r} h={0.05} tone={tone} hue={2} />
        ))}
      </IsoCylinder>
      <Group float={bob(props, 0.08)} lift={-0.98}>
        <Lathe cx={cx} cy={cy} z={tip} profile={BARREL} convex tone="accent" />
        <IsoCylinder x={cx - 0.05} y={cy - 0.05} z={top} r={0.05} h={0.6} tone="accent" />
        <Prism plane="left" at={[0, cy - 0.015, 0]} points={vane(cx, flights, -1)} depth={0.03} tone="accent" />
        <Prism plane="right" at={[cx - 0.015, 0, 0]} points={[...vane(cy, flights, -1), ...vane(cy, flights, 1).slice(1, -1).reverse()]} depth={0.03} tone="accent" />
        <Prism plane="left" at={[0, cy - 0.015, 0]} points={vane(cx, flights, 1)} depth={0.03} tone="accent" />
      </Group>
    </IllustrationStage>
  )
}

/** Along a pen in the left plane whose nib is at (u, v), leaning `lean` radians off upright: `s` up its length and `t` across it. */
const alongPen = (u: number, v: number, lean: number) => (s: number, t: number): PlanePoint => [u + Math.sin(lean) * s + Math.cos(lean) * t, v + Math.cos(lean) * s - Math.sin(lean) * t]

/** A pen's outline, `length` long and `r` round: from the nib, up one side, round the cap and down the other. */
const penOutline = (at: ReturnType<typeof alongPen>, length: number, r: number): PlanePoint[] => [
  at(0, 0),
  at(0.5, r * 0.75),
  at(0.62, r),
  ...Array.from({ length: 9 }, (_, i) => at(length - r + Math.sin((i / 8) * Math.PI) * r, r * Math.cos((i / 8) * Math.PI))),
  at(0.62, -r),
  at(0.5, -r * 0.75),
]

/** A contract on the desk, a copy under it, and the pen in the accent over the line it's just signed. Hovered, the pen lifts. */
export function IllustrationContract(props: IllustrationProps) {
  const [x, y, z, w, d] = [1.9, 2, 0.59, 3.7, 4.7]
  const sheet = [x, y, z + 0.04] as const
  const nib = [3.05, 3.92] as const
  const at = alongPen(x + nib[0], z + 0.3, 0.5)
  const [r, length] = [0.17, 3.3]
  const sign = Array.from({ length: 12 }, (_, i) => [1.8 + i * 0.1, 3.84 - Math.sin(i * 1.35) * 0.15] as const)
  const front = [0, y + nib[1] + 0.12, 0] as const
  return (
    <IllustrationStage id="contract" {...props}>
      <IsoPlatform x={0.8} y={1.1} w={6.4} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x + 0.4} y={y - 0.3} z={0.55} w={w} d={d} h={0.04} tone="neutral" hue={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={0.04} tone="raised">
        <Mark plane="top" at={sheet} points={rect(0.45, 0.45, 1.9, 0.26)} fill={INK.text} />
        {[2.8, 2.6, 2.8, 2.2, 1.5].map((len, i) => (
          <Mark key={i} plane="top" at={sheet} points={rect(0.45, 1.05 + i * 0.4, len, 0.12)} fill={INK.text} />
        ))}
        <Mark plane="top" at={sheet} points={circle(0.95, 3.7, 0.42, 24)} fill={INK.faint} stroke={INK.line} />
        <Mark plane="top" at={sheet} points={[[1.7, 4.08], [3.3, 4.08]]} stroke={INK.line} />
        <Mark plane="top" at={sheet} points={[...sign, nib]} stroke={INK.accent} weight={1.5} />
      </IsoBox>
      <Prism plane="left" at={[0, y + nib[1] - 0.12, 0]} points={penOutline(at, length, r)} depth={0.24} tone="accent" float={bob(props, 0.12)} lift={0.9}>
        {[0.62, 1.9].map((s) => (
          <Mark key={s} plane="left" at={front} points={[at(s, -r), at(s, r)]} stroke={INK.onAccent} opacity={0.6} />
        ))}
      </Prism>
    </IllustrationStage>
  )
}

/** The pie on the board: where it sits on the face, its radius, and the slice that's lit. */
const PIE = { u: 1.35, v: 1.1, r: 0.9, from: Math.PI * 0.1, to: Math.PI * 0.6 }

/** A leg of the easel in the left plane, from its foot at `u` on the floor up to the apex at (`top`, `apex`). */
const leg = (u: number, top: number, apex: number): PlanePoint[] => [
  [u - 0.13, 0.55],
  [u + 0.13, 0.55],
  [top + 0.12, apex],
  [top - 0.12, apex],
]

/** A pitch on an easel: bullet points and a pie, its key slice in the accent coming off the board. Hovered, it lifts out. */
export function IllustrationPresentation(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.6, 3.8, 1.9, 4.6, 0.2, 2.7]
  const face = [x, y + d, z] as const
  const mid = (PIE.from + PIE.to) / 2
  const slice: PlanePoint[] = [[PIE.u, PIE.v], ...arc(PIE.u, PIE.v, PIE.r, PIE.from, PIE.to, 12)]
  const out = [x + Math.cos(mid) * 0.22, y + d + 0.45, z + Math.sin(mid) * 0.22] as const
  return (
    <IllustrationStage id="presentation" {...props}>
      <IsoPlatform x={0.6} y={1} w={6.8} d={6.2} h={0.4} lip={0.15} inset={0.3} grid={1} />
      {[1.45, 6.35].map((u) => (
        <Prism key={u} plane="left" at={[0, y - 0.16, 0]} points={leg(u, x + w / 2, z + h + 0.35)} depth={0.14} tone="raised" hue={2} />
      ))}
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Mark plane="left" at={face} points={rect(0.35, h - 0.5, 2.1, 0.22)} fill={INK.text} />
        <Mark plane="left" at={face} points={circle(PIE.u, PIE.v, PIE.r, 40)} fill={INK.faint} stroke={INK.line} />
        {[PIE.to, Math.PI * 1.3].map((a) => (
          <Mark key={a} plane="left" at={face} points={[[PIE.u, PIE.v], [PIE.u + Math.cos(a) * PIE.r, PIE.v + Math.sin(a) * PIE.r]]} stroke={INK.line} />
        ))}
        <Mark plane="left" at={face} points={slice} fill={INK.well} stroke={INK.line} dashed />
        {[1.75, 1.25, 0.75].map((v, i) => (
          <g key={v}>
            <Mark plane="left" at={face} points={circle(2.75, v, 0.08, 12)} fill={INK.line} />
            <Mark plane="left" at={face} points={rect(2.98, v - 0.07, [1.45, 1.1, 1.3][i]!, 0.14)} fill={INK.text} />
          </g>
        ))}
      </IsoBox>
      <IsoBox x={x - 0.15} y={y + d} z={z - 0.12} w={w + 0.3} d={0.32} h={0.12} tone="neutral" hue={2} />
      <Prism plane="left" at={out} points={slice} depth={0.2} tone="accent" float={bob(props, 0.14)} lift={0.8} />
    </IllustrationStage>
  )
}

/** A pan of the scales, bottom up: a shallow dish. */
const PAN = [
  [0.22, 0],
  [0.56, 0.07],
  [0.8, 0.18],
  [0.92, 0.3],
] as const

/** A weight, bottom up. */
const WEIGHT = [
  [0.44, 0],
  [0.43, 0.08],
  [0.33, 0.46],
  [0.22, 0.52],
] as const

/** A balance on its post, a pan hanging from each end of the beam, and a weight in the accent over the near one. Hovered, it's set down. */
export function IllustrationScales(props: IllustrationProps) {
  const [cx, cy] = [4, 4]
  const [beam, pan, reach] = [3.9, 1.45, 1.95]
  const rim = pan + PAN.at(-1)![1]
  const weight = rim + 0.7
  return (
    <IllustrationStage id="scales" {...props}>
      <IsoPlatform x={0.9} y={0.9} w={6.2} d={6.2} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <IsoCylinder x={cx - 0.95} y={cy - 0.95} z={0.55} r={0.95} h={0.2} tone="raised" hue={1} />
      <IsoCylinder x={cx - 0.55} y={cy - 0.55} z={0.75} r={0.55} h={0.18} tone="raised" hue={1} />
      <IsoCylinder x={cx - 0.12} y={cy - 0.12} z={0.93} r={0.12} h={beam + 0.1 - 0.93} tone="neutral" />
      {[-1, 1].map((s) => {
        const px = cx + s * reach
        return (
          <Lathe key={s} cx={px} cy={cy} z={pan} profile={PAN} convex tone="raised" hue={1}>
            <Mark plane="top" at={[px, cy, rim]} points={circle(0, 0, 0.78, 36)} fill={INK.well} />
            {[0.75, 1.25, 1.75].map((t) => (
              <Link key={t} points={[[px, cy, beam - 0.06], [px + Math.cos(t * Math.PI) * 0.9, cy + Math.sin(t * Math.PI) * 0.9, rim]]} />
            ))}
          </Lathe>
        )
      })}
      <Lathe axis="x" cx={cx - reach - 0.12} cy={cy} z={beam} profile={[[0.09, 0], [0.09, reach * 2 + 0.24]]} tone="raised" />
      <Lathe axis="y" cx={cx} cy={cy + 0.12} z={beam} profile={[[0.18, 0], [0.18, 0.12]]} tone="neutral" />
      <Lathe cx={cx} cy={cy} z={beam + 0.1} profile={[[0.12, 0], [0.17, 0.1], [0.17, 0.2], [0.1, 0.3], [0, 0.33]]} convex tone="raised" />
      <Group float={bob(props, 0.1)} lift={-0.62}>
        <Lathe cx={cx + reach} cy={cy} z={weight} profile={WEIGHT} convex tone="accent" />
        <IsoCylinder x={cx + reach - 0.1} y={cy - 0.1} z={weight + 0.52} r={0.1} h={0.14} tone="accent" />
      </Group>
    </IllustrationStage>
  )
}

/** A point on the handshake's face (the left plane, u along x and v up), placed to read upright on screen: `sx` across and `sy` up from its center, at 1.3 × scale. */
const upright = (sx: number, sy: number): PlanePoint => [4 + (1.3 * sx) / Math.cos(Math.PI / 6), 2.8 + 1.3 * (sy + sx * Math.tan(Math.PI / 6))]

/** A strip from a to b, `r` either side, as it should look on screen: square at the ends like a sleeve, or round like a hand. */
const strip = ([ax, ay]: PlanePoint, [bx, by]: PlanePoint, r: number, round = false): PlanePoint[] => {
  const t = Math.atan2(by - ay, bx - ax)
  const n = round ? 6 : 1
  return [...arc(bx, by, r, t - Math.PI / 2, t + Math.PI / 2, n), ...arc(ax, ay, r, t + Math.PI / 2, t + (3 * Math.PI) / 2, n)].map(([x, y]) => upright(x, y))
}

/** One arm of the handshake, mirrored for the right: sleeve, cuff and hand, as they look on screen. */
const arm = (s: 1 | -1) => ({
  sleeve: strip([-2.85 * s, -1.25], [-1.48 * s, -0.36], 0.36),
  cuff: strip([-1.52 * s, -0.39], [-1.2 * s, -0.18], 0.44),
  hand: s === 1 ? strip([-0.84, -0.12], [0.72, 0.18], 0.34, true) : strip([0.84, -0.12], [-0.62, -0.02], 0.36, true),
})

/** Two arms meeting over a round plinth, sleeves and cuffs, and the clasp of their hands in the accent. The pair bobs as a shake does; hovered, it rises. */
export function IllustrationHandshake(props: IllustrationProps) {
  const [back, front, depth] = [3.72, 4.06, 0.28]
  const [left, right] = [arm(1), arm(-1)]
  const face = [0, front + depth, 0] as const
  return (
    <IllustrationStage id="handshake" {...props}>
      <IsoPlatform x={0.9} y={0.9} w={6.2} d={6.2} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(4, 4, 2.4, 48)} stroke={INK.line} dashed closed />
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(4, 4, 1.4, 40)} fill={INK.faint} />
      </IsoPlatform>
      <Group float={bob(props, 0.16)} lift={0.7}>
        <Prism plane="left" at={[0, back, 0]} points={left.sleeve} depth={depth} tone="sunken" hue={1} />
        <Prism plane="left" at={[0, back, 0]} points={left.cuff} depth={depth} tone="raised" />
        <Prism plane="left" at={[0, back, 0]} points={left.hand} depth={depth} tone="accent" />
        <Prism plane="left" at={[0, back, 0]} points={strip([-0.78, 0.2], [0.02, 0.56], 0.15, true)} depth={depth} tone="accent" />
        <Prism plane="left" at={[0, front, 0]} points={right.sleeve} depth={depth} tone="sunken" hue={2} />
        <Prism plane="left" at={[0, front, 0]} points={right.cuff} depth={depth} tone="raised" />
        <Prism plane="left" at={[0, front, 0]} points={right.hand} depth={depth} tone="accent">
          {[-0.62, -0.36, -0.1].map((sx) => (
            <Mark key={sx} plane="left" at={face} points={[upright(sx, 0.26), upright(sx + 0.08, -0.3)]} stroke={INK.onAccent} opacity={0.55} />
          ))}
        </Prism>
      </Group>
    </IllustrationStage>
  )
}

/** An office chair at (x, y) with its back on one side: `far` (-y), `start` (-x) or `end` (+x). */
function chair(x: number, y: number, back: 'far' | 'start' | 'end') {
  const [cx, cy] = [x + 0.45, y + 0.45]
  const rest = { far: { x, y, w: 0.9, d: 0.14 }, start: { x, y, w: 0.14, d: 0.9 }, end: { x: x + 0.76, y, w: 0.14, d: 0.9 } }[back]
  return (
    <Group key={`${x}-${y}`}>
      <IsoCylinder x={cx - 0.36} y={cy - 0.36} z={0.55} r={0.36} h={0.06} tone="sunken" />
      <IsoCylinder x={cx - 0.06} y={cy - 0.06} z={0.61} r={0.06} h={0.44} tone="neutral" />
      <IsoBox x={x} y={y} z={1.05} w={0.9} d={0.9} h={0.12} tone="raised" hue={2} />
      <IsoBox {...rest} z={1.17} h={0.85} tone="raised" hue={2} />
    </Group>
  )
}

/** A speech bubble in plane units: a rounded box and its tail, off the bottom edge. */
const speech = (u: number, v: number, w: number, h: number): PlanePoint[] => {
  const q = Math.PI / 2
  const r = 0.36
  return [
    ...arc(u + w - r, v + h - r, r, 0, q, 5),
    ...arc(u + r, v + h - r, r, q, 2 * q, 5),
    ...arc(u + r, v + r, r, 2 * q, 3 * q, 5),
    [u + 0.8, v],
    [u + 0.55, v - 0.5],
    [u + 1.35, v],
    ...arc(u + w - r, v + r, r, 3 * q, 4 * q, 5),
  ]
}

/** A boardroom table, chairs drawn up round it and a paper at each place, and over it what's being said, in the accent. Hovered, it rises. */
export function IllustrationMeeting(props: IllustrationProps) {
  const [x, y, w, d, top] = [1.7, 3.1, 4.6, 2, 1.6]
  const places = [2.15, 3.55, 4.95]
  return (
    <IllustrationStage id="meeting" {...props}>
      <IsoPlatform x={0.4} y={0.8} w={7.2} d={6.4} h={0.4} lip={0.15} inset={0.3} grid={1} />
      {places.map((px) => chair(px, 2.05, 'far'))}
      {chair(0.65, 3.65, 'start')}
      {[x + 0.35, x + w - 0.53].map((lx) => (
        <IsoBox key={lx} x={lx} y={y + 0.45} z={0.55} w={0.18} d={d - 0.9} h={top - 0.69} tone="neutral" />
      ))}
      <IsoBox x={x} y={y} z={top - 0.14} w={w} d={d} h={0.14} tone="raised" hue={1}>
        {places.map((px) => (
          <Mark key={px} plane="top" at={[px, y, top]} points={rect(0.1, 0.18, 0.7, 0.5)} fill={INK.faint} stroke={INK.line} />
        ))}
        <Mark plane="top" at={[x, y, top]} points={rect(0.18, 0.75, 0.5, 0.5)} fill={INK.faint} stroke={INK.line} />
      </IsoBox>
      {chair(6.45, 3.65, 'end')}
      <Prism plane="left" at={[0, y + d / 2 - 0.12, 0]} points={speech(3.05, 2.55, 2.1, 1.2)} depth={0.24} tone="accent" float={bob(props, 0.14)} lift={0.8}>
        {[0.55, 0.85].map((v, i) => (
          <Mark key={v} plane="left" at={[0, y + d / 2 + 0.12, 0]} points={rect(3.4, 2.55 + v - 0.07, i ? 0.9 : 1.4, 0.14)} fill={INK.onAccent} opacity={0.7} />
        ))}
      </Prism>
    </IllustrationStage>
  )
}

/** Someone on a card, drawn on its face: a head and shoulders, `s` tall, centered on (u, v). */
function Person({ at, u, v, s, ink }: { at: readonly [number, number, number]; u: number; v: number; s: number; ink: string }) {
  return (
    <>
      <Mark plane="left" at={at} points={arc(u, v - s * 0.5, s * 0.42, 0, Math.PI, 12)} fill={ink} />
      <Mark plane="left" at={at} points={circle(u, v + s * 0.2, s * 0.22, 16)} fill={ink} />
    </>
  )
}

/** Where the cards hang on the board, [u, v, w, h] on its face: the head, the two who report to them, and theirs. */
const HEAD = [2.05, 2.65, 1.5, 1.05] as const
const LEADS = [0.82, 3.48].map((u) => [u, 1.4, 1.3, 0.9] as const)
const TEAM = [0.28, 1.61, 2.94, 4.27].map((u) => [u, 0.25, 1.05, 0.8] as const)

/** A card's center across the board. */
const middle = ([u, , w]: readonly number[]) => u! + w! / 2

/** The line on the board from a card down to the two under it: a bar at `v`, a drop to each. */
const bracket = (a: number, b: number, v: number): PlanePoint[] => [
  [a, v - 0.15],
  [a, v],
  [b, v],
  [b, v - 0.15],
]

/** An org chart on a standing board: the team, their two leads, and at the top the head in the accent, lifting off it. */
export function IllustrationOrgChart(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.2, 3.1, 0.7, 5.6, 0.22, 3.95]
  const face = [x, y + d, z] as const
  const [hu, hv, hw, hh] = HEAD
  const lines: PlanePoint[][] = [
    [[middle(HEAD), hv], [middle(HEAD), 2.45]],
    bracket(middle(LEADS[0]!), middle(LEADS[1]!), 2.45),
    ...LEADS.flatMap((lead, i) => [
      [[middle(lead), 1.4], [middle(lead), 1.2]] as PlanePoint[],
      bracket(middle(TEAM[i * 2]!), middle(TEAM[i * 2 + 1]!), 1.2),
    ]),
  ]
  return (
    <IllustrationStage id="org-chart" {...props}>
      <IsoPlatform x={0.6} y={1} w={6.8} d={6.2} h={0.4} lip={0.15} inset={0.3} grid={1} />
      {[x + 0.5, x + w - 0.8].map((fx) => (
        <IsoBox key={fx} x={fx} y={y - 0.5} z={0.55} w={0.3} d={1.2} h={0.15} tone="neutral" />
      ))}
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised">
        {lines.map((points, i) => (
          <Mark key={i} plane="left" at={face} points={points} stroke={INK.line} weight={1.5} />
        ))}
        <Mark plane="left" at={face} points={rect(hu, hv, hw, hh)} stroke={INK.line} dashed closed />
      </IsoBox>
      {[...LEADS, ...TEAM].map(([u, v, cw, ch]) => (
        <IsoBox key={`${u}-${v}`} x={x + u} y={y + d} z={z + v} w={cw} d={0.1} h={ch} tone="neutral" hue={1}>
          <Person at={[x + u, y + d + 0.1, z + v]} u={cw / 2} v={ch / 2} s={ch * 0.62} ink={INK.text} />
        </IsoBox>
      ))}
      <IsoBox x={x + hu} y={y + d + 0.3} z={z + hv} w={hw} d={0.12} h={hh} tone="accent" float={bob(props, 0.14)} lift={0.8}>
        <Person at={[x + hu, y + d + 0.42, z + hv]} u={hw / 2} v={hh / 2} s={hh * 0.62} ink={INK.onAccent} />
      </IsoBox>
    </IllustrationStage>
  )
}
