'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { arc, band, bob, circle, Group, IllustrationStage, INK, Lathe, Link, Mark, Prism, rect, rounded, type IllustrationProps, type PlanePoint } from './kit'

/* Social: people talking to people. A message and its reply being typed, a
 * call with the one speaking lifting out of the grid, and a megaphone with
 * the news going out. Then the rest of it: a desk phone ringing, the
 * newsletter in the mailbox, a podcast mic, a circle of people holding
 * hands, and a heart rising off a post. */

/** A speech bubble in plane units: a rounded box and its tail, off the bottom-left corner or, mirrored, the bottom-right. */
const bubble = (u: number, v: number, w: number, h: number, tail: 'left' | 'right'): PlanePoint[] => {
  const r = 0.42
  const body = rounded(u, v, w, h, r)
  const spur: PlanePoint[] = tail === 'left' ? [[u + 0.28, v - 0.5], [u + 1.1, v]] : [[u + w - 1.1, v], [u + w - 0.28, v - 0.5]]
  return [...body, ...spur]
}

/** A message, its lines of text, and in front of it the reply being typed, in the accent. */
export function IllustrationChat(props: IllustrationProps) {
  const [ay, by] = [3.1, 4.5]
  return (
    <IllustrationStage id="chat" {...props}>
      <IsoPlatform x={0.8} y={1.1} w={6.4} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <Prism plane="left" at={[0, ay, 0]} points={bubble(0.9, 2.5, 3.6, 2, 'left')} depth={0.35} tone="raised" hue={1} float={bob(props, 0.1)}>
        {[
          [3.95, 2.6],
          [3.5, 2.3],
          [3.05, 1.4],
        ].map(([v, len]) => (
          <Mark key={v} plane="left" at={[0, ay + 0.35, 0]} points={rect(1.35, v!, len!, 0.18)} fill={INK.text} />
        ))}
      </Prism>
      <Prism plane="left" at={[0, by, 0]} points={bubble(3.5, 1.35, 2.9, 1.55, 'right')} depth={0.35} tone="accent" float={bob(props, 0.18)} lift={0.9}>
        {[0, 1, 2].map((i) => (
          <Mark key={i} plane="left" at={[0, by + 0.35, 0]} points={circle(4.35 + i * 0.6, 2.12, 0.16, 16)} fill={INK.onAccent} opacity={0.85 - i * 0.2} />
        ))}
      </Prism>
    </IllustrationStage>
  )
}

/** Someone on a call, drawn on a tile: a head and shoulders. */
function Caller({ at, u, v, w, h, ink }: { at: readonly [number, number, number]; u: number; v: number; w: number; h: number; ink: string }) {
  const [cu, cv] = [u + w / 2, v + h * 0.28]
  return (
    <>
      <Mark plane="left" at={at} points={arc(cu, cv, h * 0.3, 0, Math.PI, 12)} fill={ink} />
      <Mark plane="left" at={at} points={circle(cu, cv + h * 0.42, h * 0.17, 16)} fill={ink} />
    </>
  )
}

/** A laptop on a call, four faces on its screen, and the one speaking in the accent, lifting out of the grid. */
export function IllustrationVideoCall(props: IllustrationProps) {
  const [x, y, z, w] = [1.4, 3.3, 0.55, 5.2]
  const screen = { y: y - 0.2, z: z + 0.18, h: 3.1 }
  const face = [x, y, screen.z] as const
  const [tw, th, gap] = [2.27, 1.22, 0.16]
  const tiles = [0, 1].flatMap((c) => [0, 1].map((r) => ({ c, r, u: 0.25 + c * (tw + gap), v: 0.3 + r * (th + gap) })))
  const lit = tiles[3]!
  const card = { x: x + lit.u, y: y + 0.35, z: screen.z + lit.v }
  return (
    <IllustrationStage id="video-call" {...props}>
      <IsoPlatform x={0.8} y={1.1} w={6.4} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={3.2} h={0.18} tone="raised" hue={1}>
        {[0, 1, 2].flatMap((r) =>
          Array.from({ length: 9 }, (_, c) => (
            <Mark key={`${r}-${c}`} plane="top" at={[x, y, z + 0.18]} points={rect(0.45 + c * 0.48, 0.35 + r * 0.42, 0.36, 0.3)} fill={INK.faint} />
          )),
        )}
        <Mark plane="top" at={[x, y, z + 0.18]} points={rect(1.8, 1.8, 1.6, 1.05)} fill={INK.faint} stroke={INK.line} />
      </IsoBox>
      <IsoBox x={x} y={screen.y} z={screen.z} w={w} d={0.2} h={screen.h} tone="raised" hue={1}>
        {tiles.map((t) =>
          t === lit ? (
            <Mark key="ghost" plane="left" at={face} points={rect(t.u, t.v, tw, th)} stroke={INK.line} dashed closed />
          ) : (
            <g key={`${t.c}-${t.r}`}>
              <Mark plane="left" at={face} points={rect(t.u, t.v, tw, th)} fill={INK.faint} />
              <Caller at={face} u={t.u} v={t.v} w={tw} h={th} ink={INK.text} />
            </g>
          ),
        )}
      </IsoBox>
      <IsoBox x={card.x} y={card.y} z={card.z} w={tw} d={0.08} h={th} tone="accent" float={bob(props, 0.14)} lift={0.8}>
        <Caller at={[card.x, card.y + 0.08, card.z]} u={0} v={0} w={tw} h={th} ink={INK.onAccent} />
      </IsoBox>
    </IllustrationStage>
  )
}

/** An arc `s` out from (x, y, z), drawn across the screen and opening toward +x, the way the megaphone points. */
const wave = (x: number, y: number, z: number, s: number) =>
  Array.from({ length: 13 }, (_, i) => {
    const a = (-75 + (100 * i) / 12) * (Math.PI / 180)
    const across = (Math.cos(a) * s) / Math.sqrt(3)
    return [x + across, y - across, z + Math.sin(a) * s] as const
  })

/** A megaphone in the accent hovering over its plinth, the rings of what it's saying spreading ahead of it. */
export function IllustrationAnnouncement(props: IllustrationProps) {
  const [cy, cz] = [4, 2.75]
  const mouth = 5.1
  return (
    <IllustrationStage id="announcement" {...props}>
      <IsoPlatform x={0.9} y={0.9} w={6.2} d={6.2} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(4, 4, 2.4, 48)} stroke={INK.line} dashed closed />
      </IsoPlatform>
      <Group float={bob(props, 0.18)} lift={0.8}>
        <Lathe axis="x" cx={1.55} cy={cy} z={cz} profile={[[0.3, 0], [0.3, 0.7]]} tone="raised" hue={1} />
        <IsoBox x={2.55} y={cy - 0.13} z={cz - 1.25} w={0.34} d={0.26} h={0.95} tone="raised" hue={1} />
        <Lathe axis="x" cx={2.25} cy={cy} z={cz} profile={[[0.42, 0], [1.3, mouth - 2.25]]} tone="accent">
          <Mark plane="right" at={[mouth, cy, cz]} points={circle(0, 0, 1.08, 40)} fill={INK.well} />
          <Mark plane="right" at={[mouth, cy, cz]} points={circle(0, 0, 0.35, 24)} fill={INK.faint} />
        </Lathe>
        {[2.05, 2.6, 3.15].map((s) => (
          <Link key={s} points={wave(mouth - 0.35, cy, cz, s)} />
        ))}
      </Group>
    </IllustrationStage>
  )
}

/** A handset seen side on, lying along x from `u`: earpiece, the grip arching over, mouthpiece. */
const handset = (u: number, v: number): PlanePoint[] =>
  [
    [0.12, 0],
    [0.95, 0],
    [1.05, 0.12],
    [1.12, 0.34],
    [2.28, 0.34],
    [2.35, 0.12],
    [2.45, 0],
    [3.28, 0],
    [3.4, 0.14],
    [3.38, 0.5],
    [3.2, 0.72],
    [2.9, 0.8],
    [0.5, 0.8],
    [0.2, 0.72],
    [0.02, 0.5],
    [0, 0.14],
  ].map(([a, b]) => [u + a!, v + b!] as const)

/** A desk phone with its dial, and the handset in the accent over its cradle. Hovered, it's picked up. */
export function IllustrationPhoneCall(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [2.2, 2.7, 0.55, 3.6, 3, 0.85]
  const top = z + h
  const dial = [x + 1.8, y + 2.05, top] as const
  const rest = top + 0.5
  return (
    <IllustrationStage id="phone-call" {...props}>
      <IsoPlatform x={0.8} y={1.1} w={6.4} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Mark plane="top" at={dial} points={circle(0, 0, 0.75, 40)} fill={INK.faint} stroke={INK.line} />
        {Array.from({ length: 10 }, (_, i) => (i / 12) * Math.PI * 2 + Math.PI * 0.7).map((a) => (
          <Mark key={a} plane="top" at={dial} points={circle(Math.cos(a) * 0.53, Math.sin(a) * 0.53, 0.11, 12)} fill={INK.well} />
        ))}
        <Mark plane="top" at={dial} points={circle(0, 0, 0.24, 20)} fill={INK.line} />
        <Mark plane="left" at={[x, y + d, z]} points={rect(0.4, 0.3, w - 0.8, 0.14)} fill={INK.faint} />
      </IsoBox>
      {[x + 0.35, x + w - 0.95].map((px) => (
        <IsoBox key={px} x={px} y={y + 0.4} z={top} w={0.6} d={0.8} h={0.3} tone="neutral" />
      ))}
      <Prism plane="left" at={[0, y + 0.45, 0]} points={handset(x + 0.1, rest)} depth={0.7} tone="accent" float={bob(props, 0.12)} lift={0.9} />
    </IllustrationStage>
  )
}

/** A mailbox on its post, the day's newsletter rolled in its open door, and its flag in the accent up. Hovered, the flag rises. */
export function IllustrationNewsletter(props: IllustrationProps) {
  const [cx, base, r] = [4, 2.15, 0.95]
  const [y, d] = [2.6, 3]
  const arch: PlanePoint[] = [[cx - r, base], [cx + r, base], ...arc(cx, base + 0.8, r, 0, Math.PI, 16)]
  const door: PlanePoint[] = [[cx - r + 0.16, base + 0.14], [cx + r - 0.16, base + 0.14], ...arc(cx, base + 0.8, r - 0.16, 0, Math.PI, 16)]
  const front = [0, y + d, 0] as const
  return (
    <IllustrationStage id="newsletter" {...props}>
      <IsoPlatform x={0.9} y={0.9} w={6.2} d={6.2} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <IsoBox x={cx - 0.2} y={3.9} z={0.55} w={0.4} d={0.4} h={base - 0.55} tone="neutral" />
      <Prism plane="left" at={[0, y, 0]} points={arch} depth={d} tone="raised" hue={1}>
        <Mark plane="left" at={front} points={door} fill={INK.well} stroke={INK.line} />
      </Prism>
      <Lathe axis="y" cx={cx - 0.1} cy={y + d} z={base + 0.5} profile={[[0.3, 0], [0.3, 0.55]]} tone="neutral">
        <Mark plane="left" at={[cx - 0.1, y + d + 0.55, base + 0.5]} points={circle(0, 0, 0.18, 20)} stroke={INK.line} closed />
      </Lathe>
      <Prism
        plane="right"
        at={[cx + r, 0, 0]}
        points={[[4.6, base + 0.3], [4.78, base + 0.3], [4.78, base + 2.2], [3.72, base + 2.2], [3.72, base + 1.5], [4.6, base + 1.5]]}
        depth={0.08}
        tone="accent"
        float={bob(props, 0.1)}
        lift={0.6}
      />
    </IllustrationStage>
  )
}

/** A studio mic's capsule, bottom up: a pill. */
const CAPSULE = [
  [0.28, 0],
  [0.44, 0.1],
  [0.52, 0.3],
  [0.52, 1.25],
  [0.44, 1.5],
  [0.28, 1.64],
  [0, 1.7],
] as const

/** A studio mic on its stand, its capsule in the accent, and headphones standing beside it. Hovered, the mic rises. */
export function IllustrationPodcast(props: IllustrationProps) {
  const [cx, cy] = [4.4, 3.6]
  const foot = 0.75
  const cap = foot + 1.3
  const [px, py, pz] = [2.55, 5.2, 0.96]
  const cup = (x: number) => <Lathe axis="x" cx={x} cy={py} z={pz - 0.05} profile={[[0.36, 0], [0.36, 0.3]]} tone="neutral" hue={1} />
  return (
    <IllustrationStage id="podcast" {...props}>
      <IsoPlatform x={0.9} y={0.9} w={6.2} d={6.2} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(cx, cy, 1.25, 40)} stroke={INK.line} dashed closed />
      </IsoPlatform>
      <Group float={bob(props, 0.16)} lift={0.8}>
        <IsoCylinder x={cx - 0.62} y={cy - 0.62} z={foot} r={0.62} h={0.14} tone="raised" />
        <IsoCylinder x={cx - 0.07} y={cy - 0.07} z={foot + 0.14} r={0.07} h={cap - foot - 0.22} tone="neutral" />
        <Prism plane="left" at={[0, cy - 0.05, 0]} points={band(cx, cap + 0.7, 0.78, 0.9, Math.PI, Math.PI * 2, 14)} depth={0.1} tone="neutral" />
        <Lathe cx={cx} cy={cy} z={cap} profile={CAPSULE} convex tone="accent">
          {[0.95, 1.12, 1.29].map((h) => (
            <Link key={h} points={arc(0, 0, 0.53, -Math.PI / 4, (Math.PI * 3) / 4, 10).map(([a, b]) => [cx + a, cy + b, cap + h] as const)} />
          ))}
        </Lathe>
      </Group>
      {cup(px - 1.15)}
      <Prism plane="left" at={[0, py - 0.09, 0]} points={band(px, pz, 0.78, 0.92, 0, Math.PI, 16)} depth={0.18} tone="raised" hue={1} />
      {cup(px + 0.85)}
    </IllustrationStage>
  )
}

/** Where the circle stands, as places round its middle: the first, at the front, is kept for the one joining. */
const RING = [45, 105, 165, 225, 285, 345].map((deg) => [4 + Math.cos((deg * Math.PI) / 180) * 1.9, 4 + Math.sin((deg * Math.PI) / 180) * 1.9] as const)

/** An arm from one place in the circle toward another, from `from` to `to` of the way there: a slim bar at shoulder height. */
const reach = ([ax, ay]: readonly [number, number], [bx, by]: readonly [number, number], from: number, to: number): PlanePoint[] => {
  const [dx, dy] = [bx - ax, by - ay]
  const [nx, ny] = [(-dy / Math.hypot(dx, dy)) * 0.07, (dx / Math.hypot(dx, dy)) * 0.07]
  return [[ax + dx * from + nx, ay + dy * from + ny], [ax + dx * to + nx, ay + dy * to + ny], [ax + dx * to - nx, ay + dy * to - ny], [ax + dx * from - nx, ay + dy * from - ny]]
}

/** Someone standing at (x, y) from `z` up, a body and a head. */
const person = ([x, y]: readonly [number, number], z: number, tone: 'raised' | 'accent') => [
  <Lathe key="body" cx={x} cy={y} z={z} profile={[[0.34, 0], [0.37, 0.3], [0.35, 0.52], [0.26, 0.68], [0.1, 0.76]]} convex tone={tone} hue={1} />,
  <Lathe key="head" cx={x} cy={y} z={z + 0.8} profile={[[0.1, 0], [0.19, 0.06], [0.22, 0.19], [0.19, 0.33], [0.1, 0.41], [0, 0.43]]} convex tone={tone} hue={1} />,
]

/** People holding hands in a circle, and over the place kept for them the one joining, in the accent. Hovered, they step in and the circle closes. */
export function IllustrationCommunity(props: IllustrationProps) {
  const [floor, drop] = [0.55, 0.95]
  const arm = floor + 0.48
  const [place, circle5] = [RING[0]!, RING.slice(1)]
  const [first, last] = [circle5[0]!, circle5.at(-1)!]
  return (
    <IllustrationStage id="community" {...props}>
      <IsoPlatform x={0.9} y={0.9} w={6.2} d={6.2} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, floor]} points={circle(4, 4, 1.15, 40)} fill={INK.faint} />
        <Mark plane="top" at={[place[0], place[1], floor]} points={circle(0, 0, 0.42, 24)} stroke={INK.line} dashed closed />
      </IsoPlatform>
      {circle5.map((at) => (
        <Group key={at[0]}>{person(at, floor, 'raised')}</Group>
      ))}
      {circle5.slice(1).map((at, i) => (
        <Prism key={at[0]} plane="top" at={[0, 0, arm]} points={reach(circle5[i]!, at, 0.16, 0.84)} depth={0.1} tone="raised" hue={1} />
      ))}
      {[first, last].map((at) => (
        <Prism key={at[0]} plane="top" at={[0, 0, arm]} points={reach(at, place, 0.16, 0.5)} depth={0.1} tone="raised" hue={1} />
      ))}
      <Group float={bob(props, 0.1)} lift={-drop}>
        {person(place, floor + drop, 'accent')}
        {[first, last].map((at) => (
          <Prism key={at[0]} plane="top" at={[0, 0, arm + drop]} points={reach(place, at, 0.16, 0.5)} depth={0.1} tone="accent" />
        ))}
      </Group>
    </IllustrationStage>
  )
}

/** A heart in plane units, centered on (cu, cv), `s` wide. */
const heart = (cu: number, cv: number, s: number): PlanePoint[] =>
  Array.from({ length: 48 }, (_, i) => {
    const t = (i / 48) * Math.PI * 2
    const k = s / 32
    return [cu + 16 * Math.sin(t) ** 3 * k, cv + (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * k] as const
  })

/** A post and the reactions under it, and a heart in the accent rising off them. Hovered, it floats up. */
export function IllustrationReactions(props: IllustrationProps) {
  const [post, bar] = [3.1, 3.55]
  const chips = [3.45, 4.1, 4.75]
  const face = [0, bar + 0.22, 0] as const
  return (
    <IllustrationStage id="reactions" {...props}>
      <IsoPlatform x={0.8} y={1.1} w={6.4} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <Prism plane="left" at={[0, post, 0]} points={bubble(0.9, 1.9, 4.3, 2.3, 'left')} depth={0.35} tone="raised" hue={1}>
        <Mark plane="left" at={[0, post + 0.35, 0]} points={rect(1.35, 2.35, 1.5, 1.4)} fill={INK.faint} stroke={INK.line} />
        {[3.45, 3.1, 2.75, 2.4].map((v, i) => (
          <Mark key={v} plane="left" at={[0, post + 0.35, 0]} points={rect(3.1, v, i === 3 ? 0.8 : 1.6, 0.16)} fill={INK.text} />
        ))}
      </Prism>
      <Prism plane="left" at={[0, bar, 0]} points={rounded(3.05, 1.12, 2.1, 0.66, 0.33)} depth={0.22} tone="neutral">
        {chips.map((u) => (
          <Mark key={u} plane="left" at={face} points={circle(u, 1.45, 0.2, 20)} fill={INK.text} />
        ))}
      </Prism>
      <Prism plane="left" at={[0, bar + 0.4, 0]} points={heart(6, 2.95, 1.55)} depth={0.34} tone="accent" float={bob(props, 0.18)} lift={1} />
    </IllustrationStage>
  )
}
