'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { arc, bob, circle, flat, Group, IllustrationStage, INK, Lathe, Link, Mark, Prism, rect, type IllustrationProps, type PlanePoint } from './kit'

/* Finance: money coming and going. A card over the reader it's about to
 * tap, a wallet with a card drawn out of it, and a jar of savings with the
 * next coin over its slot. Then the counting: candles climbing a chart, a
 * calculator's equals key, piles of coins, and an invoice printing. */

/** A card reader with its screen and keys, and over it a card in the accent, about to tap. */
export function IllustrationPayment(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [2.5, 2.8, 0.55, 2.8, 3.4, 0.8]
  const top = z + h
  const keys = [0, 1, 2].flatMap((c) => [0, 1, 2].map((r) => [c, r] as const))
  const card = { x: 2, y: 2.3, z: 2.35, w: 3.6, d: 2.2, h: 0.08 }
  const face = [card.x, card.y, card.z + card.h] as const
  return (
    <IllustrationStage id="payment" {...props}>
      <IsoPlatform x={0.8} y={1.1} w={6.4} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Mark plane="top" at={[x, y, top]} points={rect(0.35, 0.3, w - 0.7, 1.1)} fill={INK.well} />
        {[0.22, 0.4, 0.58].map((r) => (
          <Mark key={r} plane="top" at={[x + w / 2, y + 1.05, top]} points={arc(0, 0, r, -Math.PI * 0.8, -Math.PI * 0.2, 8)} stroke={INK.line} weight={1.5} />
        ))}
        {keys.map(([c, r]) => (
          <Mark key={`${c}-${r}`} plane="top" at={[x, y, top]} points={rect(0.45 + c * 0.7, 1.7 + r * 0.52, 0.5, 0.34)} fill={INK.faint} stroke={INK.line} />
        ))}
      </IsoBox>
      <IsoBox {...card} tone="accent" float={bob(props, 0.16)} lift={0.9}>
        <Mark plane="top" at={face} points={rect(0.4, 0.4, 0.6, 0.48)} fill={INK.onAccent} opacity={0.55} />
        <Mark plane="top" at={face} points={rect(0.4, 1.35, 2.4, 0.14)} fill={INK.onAccent} opacity={0.5} />
        <Mark plane="top" at={face} points={rect(0.4, 1.7, 1.3, 0.12)} fill={INK.onAccent} opacity={0.35} />
      </IsoBox>
    </IllustrationStage>
  )
}

/** A wallet standing on its edge, its strap snapped, one card tucked in and the other drawn out of it in the accent. */
export function IllustrationWallet(props: IllustrationProps) {
  const [x, z, w, h] = [1.8, 0.55, 4.2, 2.4]
  const top = z + h
  // The wallet's back and front, and the slot between them the cards sit in.
  const [back, slot, front] = [3.3, 3.72, 3.8]
  const card = { x: x + 1.5, y: slot + 0.04, z: top - 1, w: 2.3, d: 0.04, h: 2.3 }
  const face = [x, front + 0.42, z] as const
  return (
    <IllustrationStage id="wallet" {...props}>
      <IsoPlatform x={0.8} y={0.8} w={6.4} d={6.4} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <IsoBox x={x} y={back} z={z} w={w} d={slot - back} h={h} tone="raised" hue={2} />
      <IsoBox x={x} y={slot} z={z} w={w} d={front - slot} h={h - 1.05} tone="raised" hue={2} />
      <IsoBox x={x + 0.35} y={slot} z={top - 1} w={2.3} d={0.04} h={1.85} tone="neutral" />
      <IsoBox {...card} tone="accent" float={bob(props, 0.14)} lift={0.9}>
        <Mark plane="left" at={[card.x, card.y + card.d, card.z]} points={rect(0.3, card.h - 0.62, 0.5, 0.4)} fill={INK.onAccent} opacity={0.55} />
      </IsoBox>
      <IsoBox x={x} y={front} z={z} w={w} d={0.42} h={h} tone="raised" hue={2}>
        <Mark plane="left" at={face} points={rect(0.18, 0.18, w - 0.36, h - 0.36)} stroke={INK.line} dashed closed />
        <Mark plane="left" at={face} points={rect(w - 1.35, 0.75, 1.35, 0.8)} fill={INK.faint} stroke={INK.line} />
        <Mark plane="left" at={face} points={circle(w - 0.45, 1.15, 0.14)} fill={INK.line} />
      </IsoBox>
      {[0, 1, 2].map((i) => (
        <IsoCylinder key={i} x={5.25 + (i % 2) * 0.06} y={5.1 - (i % 2) * 0.05} z={z + i * 0.15} r={0.55} h={0.15} tone="raised" hue={1} />
      ))}
    </IllustrationStage>
  )
}

/** A jar of coins, seen through the glass, and the next coin, in the accent, standing on edge over the slot in its lid. */
export function IllustrationSavings(props: IllustrationProps) {
  const [cx, cy, z] = [4, 4, 0.55]
  const r = 1.45
  const lid = z + 2.3
  return (
    <IllustrationStage id="savings" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      {Array.from({ length: 6 }, (_, i) => (
        <IsoCylinder key={i} x={cx - 1.1 + (i % 2) * 0.1} y={cy - 1.1 - (i % 2) * 0.08} z={z + i * 0.2} r={1.1} h={0.2} tone="raised" hue={1} />
      ))}
      <IsoCylinder x={cx - r} y={cy - r} z={z} r={r} h={2.3} variant="wire" />
      <IsoCylinder x={cx - r - 0.05} y={cy - r - 0.05} z={lid} r={r + 0.05} h={0.35} tone="raised">
        <Mark plane="top" at={[cx, cy, lid + 0.35]} points={rect(-0.6, -0.1, 1.2, 0.2)} fill={INK.well} />
      </IsoCylinder>
      <Lathe axis="y" cx={cx} cy={cy - 0.09} z={lid + 1.4} profile={[[0.62, 0], [0.62, 0.18]]} tone="accent" float={bob(props, 0.18)} lift={1}>
        <Mark plane="left" at={[cx, cy + 0.09, lid + 1.4]} points={circle(0, 0, 0.42)} stroke={INK.onAccent} weight={1.5} closed />
      </Lathe>
    </IllustrationStage>
  )
}

/** A day's trading, candle by candle: [open, close, low, high], grid units above the floor. */
const CANDLES = [
  [0.75, 1.35, 0.3, 1.75],
  [1.3, 1.95, 0.85, 2.35],
  [1.95, 1.55, 1.1, 2.3],
  [1.6, 2.4, 1.15, 2.8],
  [2.3, 3.4, 1.85, 3.8],
] as const

/** Candles climbing a chart, falling days darker, each on its wick, the trend dashed through their closes, and the last in the accent breaking out. Hovered, it jumps. */
export function IllustrationStockChart(props: IllustrationProps) {
  const [x, s] = [3.95, 0.68]
  // The candles run back along y, so the chart climbs to the right on screen.
  const row = (i: number) => 5.85 - i * 1.02
  return (
    <IllustrationStage id="stock-chart" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={2.75} y={1.2} z={0.55} w={0.24} d={5.6} h={3.3} tone="sunken">
        {[1.05, 1.9, 2.75].map((v) => (
          <Mark key={v} plane="right" at={[2.99, 1.2, 0.55]} points={[[0.2, v], [5.4, v]]} stroke={INK.line} dashed />
        ))}
      </IsoBox>
      {CANDLES.map(([open, close, low, high], i) => {
        const y = row(i)
        const last = i === CANDLES.length - 1
        const tone = last ? 'accent' : close < open ? 'sunken' : 'raised'
        const [bottom, top] = [0.55 + Math.min(open, close), 0.55 + Math.max(open, close)]
        const wick = { x: x + s / 2 - 0.045, y: y + s / 2 - 0.045, r: 0.045 }
        return (
          <Group key={i} float={last ? bob(props, 0.12) : false} lift={last ? 0.7 : 0}>
            <IsoCylinder {...wick} z={0.55 + low} h={bottom - 0.55 - low} tone={tone} />
            <IsoBox x={x} y={y} z={bottom} w={s} d={s} h={top - bottom} tone={tone} hue={close < open ? 2 : 1}>
              <IsoCylinder {...wick} z={top} h={0.55 + high - top} tone={tone} />
            </IsoBox>
          </Group>
        )
      })}
      <Link points={CANDLES.map(([, close], i) => [x + s / 2, row(i) + s / 2, 0.55 + close] as const)} lit dashed />
    </IllustrationStage>
  )
}

/** A calculator on the desk, its display and keys, and its tall equals key in the accent springing up out of its place. Hovered, it rises. */
export function IllustrationCalculator(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [2.3, 1.5, 0.55, 3.4, 5, 0.45]
  const top = z + h
  const [k, gap] = [0.62, 0.16]
  const keys = [0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => [c, r] as const)).filter(([c, r]) => c < 3 || r < 2)
  const at = (c: number, r: number) => [x + 0.22 + c * (k + gap), y + 1.75 + r * (k + gap)] as const
  const [ex, ey] = at(3, 2)
  const tall = 2 * k + gap
  return (
    <IllustrationStage id="calculator" {...props}>
      <IsoPlatform x={0.8} y={0.8} w={6.4} d={6.4} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Mark plane="top" at={[x, y, top]} points={rect(0.22, 0.3, w - 0.44, 1.1)} fill={INK.well} />
        {[0, 1, 2].map((i) => (
          <Mark key={i} plane="top" at={[x, y, top]} points={rect(1.55 + i * 0.52, 0.55, 0.34, 0.6)} fill={INK.faint} />
        ))}
        <Mark plane="top" at={[ex, ey, top]} points={rect(0, 0, k, tall)} stroke={INK.line} dashed closed />
      </IsoBox>
      {keys.map(([c, r]) => {
        const [kx, ky] = at(c, r)
        return <IsoBox key={`${c}-${r}`} x={kx} y={ky} z={top} w={k} d={k} h={0.12} tone={c === 3 ? 'neutral' : 'raised'} />
      })}
      <IsoBox x={ex} y={ey} z={top + 0.4} w={k} d={tall} h={0.16} tone="accent" float={bob(props, 0.1)} lift={0.7}>
        {[-0.11, 0.05].map((v) => (
          <Mark key={v} plane="top" at={[ex + k / 2, ey + tall / 2, top + 0.56]} points={[flat(-0.2, v), flat(0.2, v), flat(0.2, v + 0.06), flat(-0.2, v + 0.06)]} fill={INK.onAccent} />
        ))}
      </IsoBox>
    </IllustrationStage>
  )
}

/** Coins stacked in three piles, a few loose, and the next coin in the accent over the tallest. Hovered, it drops onto the pile. */
export function IllustrationCoins(props: IllustrationProps) {
  const r = 0.72
  const coin = 0.17
  const piles = [
    [3.3, 3.1, 7],
    [5.05, 4, 5],
    [3.1, 5.05, 3],
  ] as const
  const [px, py, count] = piles[0]
  const land = 0.55 + count * coin
  return (
    <IllustrationStage id="coins" {...props}>
      <IsoPlatform x={0.9} y={0.9} w={6.2} d={6.2} h={0.4} lip={0.15} inset={0.4} shape="round" />
      {piles.flatMap(([cx, cy, n]) =>
        Array.from({ length: n }, (_, i) => (
          <IsoCylinder key={`${cx}-${i}`} x={cx - r + (i % 2) * 0.05} y={cy - r - ((i + 1) % 3) * 0.03} z={0.55 + i * coin} r={r} h={coin} tone="raised" hue={1} />
        )),
      )}
      <IsoCylinder x={5.05 - r} y={5.75 - r} z={0.55} r={r} h={coin} tone="raised" hue={1}>
        <Mark plane="top" at={[5.05, 5.75, 0.55 + coin]} points={circle(0, 0, 0.48, 32)} stroke={INK.line} closed />
      </IsoCylinder>
      <IsoCylinder x={px - r} y={py - r} z={land + 0.95} r={r} h={coin + 0.02} tone="accent" float={bob(props, 0.12)} lift={-0.95}>
        <Mark plane="top" at={[px, py, land + 1.14]} points={circle(0, 0, 0.48, 32)} stroke={INK.onAccent} weight={1.5} closed />
      </IsoCylinder>
    </IllustrationStage>
  )
}

/** A receipt's outline in the left plane, `w` wide and `h` tall from (u, v): straight sides, a torn zigzag at the top. */
const receipt = (u: number, v: number, w: number, h: number): PlanePoint[] => [
  [u, v],
  [u + w, v],
  ...Array.from({ length: 11 }, (_, i) => [u + w - (i * w) / 10, v + h - (i % 2) * 0.16] as const),
]

/** A till with its screen and keys, and the invoice in the accent printing out of the slot at its back. Hovered, more of it comes out. */
export function IllustrationInvoice(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [2.2, 3.3, 0.55, 3.6, 2.5, 1.15]
  const top = z + h
  const paper = { u: x + 0.7, y: y - 0.1, v: z + 0.1, w: 2.2, h: 3.6 }
  const face = [0, paper.y + 0.04, 0] as const
  const items = [0.95, 0.7, 1.1]
  return (
    <IllustrationStage id="invoice" {...props}>
      <IsoPlatform x={0.8} y={1.1} w={6.4} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <Prism plane="left" at={[0, paper.y, 0]} points={receipt(paper.u, paper.v, paper.w, paper.h)} depth={0.04} tone="accent" float={bob(props, 0.08)} lift={0.8}>
        <Mark plane="left" at={face} points={rect(paper.u + 0.35, paper.v + paper.h - 0.6, 1.1, 0.16)} fill={INK.onAccent} opacity={0.7} />
        {items.map((len, i) => (
          <g key={i}>
            <Mark plane="left" at={face} points={rect(paper.u + 0.35, paper.v + paper.h - 1 - i * 0.3, len, 0.1)} fill={INK.onAccent} opacity={0.45} />
            <Mark plane="left" at={face} points={rect(paper.u + paper.w - 0.65, paper.v + paper.h - 1 - i * 0.3, 0.3, 0.1)} fill={INK.onAccent} opacity={0.45} />
          </g>
        ))}
        <Mark plane="left" at={face} points={[[paper.u + 0.35, paper.v + paper.h - 1.85], [paper.u + paper.w - 0.35, paper.v + paper.h - 1.85]]} stroke={INK.onAccent} opacity={0.5} dashed />
        <Mark plane="left" at={face} points={rect(paper.u + paper.w - 1.15, paper.v + paper.h - 2.2, 0.8, 0.18)} fill={INK.onAccent} opacity={0.75} />
      </Prism>
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Mark plane="top" at={[x, y, top]} points={rect(0.55, 0.04, 2.5, 0.14)} fill={INK.well} />
        <Mark plane="top" at={[x, y, top]} points={rect(0.35, 0.6, 1.5, 0.8)} fill={INK.well} />
        {[0, 1, 2].flatMap((c) => [0, 1].map((r) => (
          <Mark key={`${c}-${r}`} plane="top" at={[x, y, top]} points={rect(2.15 + c * 0.42, 0.62 + r * 0.42, 0.3, 0.3)} fill={INK.faint} stroke={INK.line} />
        )))}
        <Mark plane="left" at={[x, y + d, z]} points={rect(0.35, 0.35, w - 0.7, 0.14)} fill={INK.faint} />
      </IsoBox>
    </IllustrationStage>
  )
}
