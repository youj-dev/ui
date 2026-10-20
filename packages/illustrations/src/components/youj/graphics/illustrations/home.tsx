'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { bob, circle, Group, Hollow, IllustrationStage, INK, Lathe, Mark, Prism, rect, type IllustrationProps, type PlanePoint } from './kit'

/* Home: the life around the work. A house whose roof lifts off, a pot with
 * its first shoot, and a present with its lid rising. */

/** A leaf in plane units, from its base to its tip, `width` across at its widest. */
const leaf = ([bu, bv]: PlanePoint, [tu, tv]: PlanePoint, width: number): PlanePoint[] => {
  const [du, dv] = [tu - bu, tv - bv]
  const len = Math.hypot(du, dv)
  const [nu, nv] = [-dv / len, du / len]
  const edge = (side: 1 | -1) =>
    Array.from({ length: 10 }, (_, i) => {
      const s = side === 1 ? i / 9 : 1 - i / 9
      const out = Math.sin(Math.PI * s) * width * 0.5 * side
      return [bu + du * s + nu * out, bv + dv * s + nv * out] as const
    })
  return [...edge(1), ...edge(-1).slice(1, -1)]
}

/** Squares on a face for a window, with its glazing bars. */
function Window({ plane, at, u, v, s }: { plane: 'left' | 'right'; at: readonly [number, number, number]; u: number; v: number; s: number }) {
  return (
    <>
      <Mark plane={plane} at={at} points={rect(u, v, s, s)} fill={INK.faint} stroke={INK.line} />
      <Mark plane={plane} at={at} points={[[u + s / 2, v], [u + s / 2, v + s]]} stroke={INK.line} />
      <Mark plane={plane} at={at} points={[[u, v + s / 2], [u + s, v + s / 2]]} stroke={INK.line} />
    </>
  )
}

/** A house with its door and windows, a tree beside it, and its roof in the accent. Hovered, the roof lifts off. */
export function IllustrationHome(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.9, 2.5, 0.55, 3.2, 3.2, 1.9]
  const top = z + h
  const face = [x, y + d, z] as const
  const [eave, ridge] = [0.3, 1.55]
  // The chimney's foot follows the slope it stands on.
  const slope = (u: number) => ridge - ((u - w / 2) * ridge) / (w / 2 + eave)
  return (
    <IllustrationStage id="home" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1}>
        {[0, 1].map((i) => (
          <Mark key={i} plane="top" at={[x, y + d, 0.56]} points={rect(1.25, 0.25 + i * 0.55, 0.6, 0.35)} fill={INK.faint} />
        ))}
      </IsoPlatform>
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Mark plane="left" at={face} points={rect(1.2, 0, 0.8, 1.3)} fill={INK.well} stroke={INK.line} />
        <Window plane="left" at={face} u={0.3} v={0.65} s={0.6} />
        <Window plane="left" at={face} u={2.3} v={0.65} s={0.6} />
        <Window plane="right" at={[x + w, y, z]} u={0.45} v={0.65} s={0.6} />
        <Window plane="right" at={[x + w, y, z]} u={1.95} v={0.65} s={0.6} />
      </IsoBox>
      <Prism plane="left" at={[x, y - 0.15, top]} points={[[-eave, 0], [w + eave, 0], [w / 2, ridge]]} depth={d + 0.3} tone="accent" float={bob(props, 0.05)} lift={0.9}>
        <Prism plane="left" at={[x, y + 0.55, top]} points={[[2.35, slope(2.35)], [2.8, slope(2.8)], [2.8, ridge + 0.35], [2.35, ridge + 0.35]]} depth={0.45} tone="raised" />
      </Prism>
      <IsoCylinder x={6.05} y={5.55} z={0.55} r={0.12} h={0.6} tone="neutral" />
      <Lathe cx={6.17} cy={5.67} z={1.05} profile={[[0.2, 0], [0.5, 0.14], [0.66, 0.42], [0.66, 0.78], [0.5, 1.08], [0.24, 1.26], [0, 1.3]]} convex tone="raised" hue={2} />
    </IllustrationStage>
  )
}

/** A pot hovering over its saucer, and the first shoot in the accent, two leaves unfolding. Hovered, it grows. */
export function IllustrationPlant(props: IllustrationProps) {
  const [cx, cy] = [4, 4]
  const base = 0.85
  const rim = base + 1.45
  const soil = rim + 0.25
  const stem = 1.05
  return (
    <IllustrationStage id="plant" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <IsoCylinder x={cx - 1.55} y={cy - 1.55} z={0.55} r={1.55} h={0.12} tone="neutral" />
      <Group float={bob(props, 0.14)}>
        <Lathe cx={cx} cy={cy} z={base} profile={[[0.88, 0], [0.98, 0.7], [1.12, 1.45]]} convex tone="raised" hue={2} />
        <IsoCylinder x={cx - 1.28} y={cy - 1.28} z={rim} r={1.28} h={0.25} tone="raised" hue={2}>
          <Mark plane="top" at={[cx, cy, soil]} points={circle(0, 0, 1.08, 40)} fill={INK.well} />
        </IsoCylinder>
        <Group lift={0.7}>
          <IsoCylinder x={cx - 0.07} y={cy - 0.07} z={soil} r={0.07} h={stem} tone="accent" />
          <Prism plane="left" at={[0, cy - 0.03, 0]} points={leaf([cx, soil + stem - 0.05], [cx - 1.25, soil + stem + 0.7], 0.62)} depth={0.06} tone="accent" />
          <Prism plane="right" at={[cx - 0.03, 0, 0]} points={leaf([cy, soil + stem - 0.05], [cy - 1.2, soil + stem + 0.8], 0.6)} depth={0.06} tone="accent" />
        </Group>
      </Group>
    </IllustrationStage>
  )
}

/** A present tied with a ribbon in the accent, its lid and bow rising off it. Hovered, it opens. */
export function IllustrationGift(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [2.4, 2.4, 0.55, 3.2, 3.2, 2]
  const top = z + h
  const band = 0.44
  const lid = { x: x - 0.15, y: y - 0.15, z: top + 0.2, w: w + 0.3, d: d + 0.3, h: 0.5 }
  const lidTop = lid.z + lid.h
  const [cx, cy] = [x + w / 2, y + d / 2]
  return (
    <IllustrationStage id="gift" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Hollow x={x + 0.1} y={y + 0.1} top={top} w={w - 0.2} d={d - 0.2} depth={h - 0.3} />
        <Mark plane="left" at={[x, y + d, z]} points={rect(w / 2 - band / 2, 0, band, h)} fill={INK.accent} />
        <Mark plane="right" at={[x + w, y, z]} points={rect(d / 2 - band / 2, 0, band, h)} fill={INK.accent} />
      </IsoBox>
      <IsoBox {...lid} tone="raised" hue={1} float={bob(props, 0.14)} lift={1.2}>
        <Mark plane="top" at={[lid.x, lid.y, lidTop]} points={rect(lid.w / 2 - band / 2, 0, band, lid.d)} fill={INK.accent} />
        <Mark plane="top" at={[lid.x, lid.y, lidTop]} points={rect(0, lid.d / 2 - band / 2, lid.w, band)} fill={INK.accent} />
        <Mark plane="left" at={[lid.x, lid.y + lid.d, lid.z]} points={rect(lid.w / 2 - band / 2, 0, band, lid.h)} fill={INK.accent} />
        <Mark plane="right" at={[lid.x + lid.w, lid.y, lid.z]} points={rect(lid.d / 2 - band / 2, 0, band, lid.h)} fill={INK.accent} />
        {/* The bow, far loops first: one loop along each way the ribbon runs. */}
        <Prism plane="left" at={[0, cy - 0.12, 0]} points={leaf([cx, lidTop], [cx - 1.05, lidTop + 0.6], 0.62)} depth={0.24} tone="accent" />
        <Prism plane="right" at={[cx - 0.12, 0, 0]} points={leaf([cy, lidTop], [cy - 1.05, lidTop + 0.6], 0.62)} depth={0.24} tone="accent" />
        <IsoCylinder x={cx - 0.22} y={cy - 0.22} z={lidTop} r={0.22} h={0.28} tone="accent" />
        <Prism plane="left" at={[0, cy - 0.12, 0]} points={leaf([cx, lidTop], [cx + 1.05, lidTop + 0.6], 0.62)} depth={0.24} tone="accent" />
        <Prism plane="right" at={[cx - 0.12, 0, 0]} points={leaf([cy, lidTop], [cy + 1.05, lidTop + 0.6], 0.62)} depth={0.24} tone="accent" />
      </IsoBox>
    </IllustrationStage>
  )
}
