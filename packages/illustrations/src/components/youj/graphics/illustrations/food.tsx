'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPiece } from '../iso-scene'
import { IsoPlatform } from '../iso-platform'
import { arc, band, bob, circle, Group, Hollow, IllustrationStage, INK, Lathe, Link, Mark, orb, Prism, rect, type IllustrationProps, type PlanePoint } from './kit'

/* Food: eating and everything round it. A cup of coffee steaming on its
 * saucer, a table set with the cloche about to lift, and a basket of
 * groceries with the last thing dropping in. Then a pizza with a slice
 * taken, a loaf with its first slice falling away, a cocktail with the
 * cherry over it, and a pot on the hob with its lid rattling. */

/** A wisp of steam rising from (x, y, z), swaying across the screen as it goes. */
const wisp = (x: number, y: number, z: number, phase: number) =>
  Array.from({ length: 9 }, (_, k) => {
    const sway = Math.sin(k * 0.85 + phase) * 0.12
    return [x + sway, y - sway, z + k * 0.17] as const
  })

/** A cup of coffee in the accent on its saucer, steam rising off it. */
export function IllustrationCoffee(props: IllustrationProps) {
  const [cx, cy] = [3.9, 3.9]
  const base = 0.69
  const rim = base + 1.55
  return (
    <IllustrationStage id="coffee" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <IsoCylinder x={cx - 1.9} y={cy - 1.9} z={0.55} r={1.9} h={0.14} tone="raised" hue={1}>
        <Mark plane="top" at={[cx, cy, base]} points={circle(0, 0, 1.25, 40)} stroke={INK.line} closed />
      </IsoCylinder>
      <Lathe cx={cx} cy={cy} z={base} profile={[[0.82, 0], [0.92, 0.1], [1.02, 0.6], [1.12, 1.2], [1.18, 1.55]]} convex tone="accent">
        <Mark plane="top" at={[cx, cy, rim]} points={circle(0, 0, 1.02, 40)} fill={INK.well} />
      </Lathe>
      <Prism plane="left" at={[0, cy - 0.12, 0]} points={band(cx + 1.02, base + 0.82, 0.3, 0.52, -Math.PI / 2, Math.PI / 2, 14)} depth={0.24} tone="accent" />
      <IsoPiece float={bob(props, 0.14)} delay={6}>
        {[-0.45, 0, 0.45].map((s, i) => (
          <Link key={s} points={wisp(cx + s, cy - s, rim + 0.35 + (i % 2) * 0.15, i * 1.7)} />
        ))}
      </IsoPiece>
    </IllustrationStage>
  )
}

/** The cloche's dome, bottom up. */
const CLOCHE = [
  [1.1, 0],
  [1.08, 0.15],
  [1, 0.42],
  [0.84, 0.66],
  [0.6, 0.86],
  [0.3, 0.97],
  [0, 1],
] as const

/** A table set for one, and the cloche over the plate in the accent, about to lift. Hovered, it does. */
export function IllustrationRestaurant(props: IllustrationProps) {
  const [cx, cy] = [4, 4]
  const top = 2.2
  return (
    <IllustrationStage id="restaurant" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoCylinder x={cx - 0.8} y={cy - 0.8} z={0.55} r={0.8} h={0.1} tone="raised" />
      <IsoCylinder x={cx - 0.22} y={cy - 0.22} z={0.65} r={0.22} h={top - 0.81} tone="raised" />
      <IsoCylinder x={cx - 2.1} y={cy - 2.1} z={top - 0.16} r={2.1} h={0.16} tone="raised" hue={1}>
        {/* Far to near: the glass and the fork behind the plate, the knife in front of it. */}
        <IsoCylinder x={cx + 0.6} y={cy - 1.75} z={top} r={0.3} h={0.75} variant="wire" />
        <IsoBox x={cx - 1.6} y={cy - 0.6} z={top} w={0.14} d={1.3} h={0.03} tone="neutral" />
        <IsoCylinder x={cx - 1.15} y={cy - 1.15} z={top} r={1.15} h={0.06} tone="neutral">
          <Mark plane="top" at={[cx, cy, top + 0.06]} points={circle(0, 0, 0.8, 36)} stroke={INK.line} closed />
        </IsoCylinder>
        <Lathe cx={cx} cy={cy} z={top + 0.06} profile={[[0.55, 0], [0.5, 0.18], [0.36, 0.32], [0.14, 0.4], [0, 0.42]]} convex tone="raised" />
        <IsoBox x={cx + 1.45} y={cy - 0.6} z={top} w={0.14} d={1.3} h={0.03} tone="neutral" />
      </IsoCylinder>
      <Group float={bob(props, 0.12)} lift={1.1}>
        <Lathe cx={cx} cy={cy} z={top + 0.3} profile={CLOCHE.map(([r, h]) => [r * 1.12, h * 1.12] as const)} convex tone="accent" />
        <IsoCylinder x={cx - 0.15} y={cy - 0.15} z={top + 1.38} r={0.15} h={0.22} tone="accent" />
      </Group>
    </IllustrationStage>
  )
}

/** The basket's handle: an arch over it, from rim to rim. */
const ARCH = band(0, 0, 1.72, 1.9, 0, Math.PI, 16).map(([u, v]) => [u, v * 0.82] as const)

/** A basket of groceries, a bottle and a box standing in it, and an apple in the accent dropping in. */
export function IllustrationGroceries(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.9, 2.9, 0.55, 4.2, 2.5, 1.45]
  const top = z + h
  const face = [x, y + d, z] as const
  const floor = z + 0.35
  return (
    <IllustrationStage id="groceries" {...props}>
      <IsoPlatform x={0.6} y={1} w={6.8} d={6.2} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Hollow x={x + 0.1} y={y + 0.1} top={top} w={w - 0.2} d={d - 0.2} depth={h - 0.3} />
      </IsoBox>
      <Lathe cx={x + 3.1} cy={y + 0.6} z={floor} profile={[[0.42, 0], [0.42, 1.3], [0.34, 1.52], [0.17, 1.72], [0.16, 2.15]]} tone="neutral" />
      <IsoCylinder x={x + 2.92} y={y + 0.42} z={floor + 2.15} r={0.18} h={0.2} tone="sunken" />
      <IsoBox x={x + 0.4} y={y + 0.3} z={floor} w={1.35} d={0.6} h={1.9} tone="raised" hue={2}>
        <Mark plane="left" at={[x + 0.4, y + 0.9, floor]} points={rect(0.2, 1.2, 0.95, 0.4)} fill={INK.text} />
      </IsoBox>
      <Prism plane="left" at={[x + w / 2, y + d / 2 - 0.06, top]} points={ARCH} depth={0.12} tone="raised" />
      {/* The basket's front walls again, over the lower part of what's in it. */}
      <IsoBox x={x} y={y + d - 0.02} z={z} w={w} d={0.02} h={h} tone="raised" hue={1}>
        {[0.45, 0.9].map((v) => (
          <Mark key={v} plane="left" at={face} points={[[0.15, v], [w - 0.15, v]]} stroke={INK.line} />
        ))}
        {[0.7, 1.4, 2.1, 2.8, 3.5].map((u) => (
          <Mark key={u} plane="left" at={face} points={[[u, 0.15], [u, h - 0.15]]} stroke={INK.faint} weight={2} />
        ))}
      </IsoBox>
      <IsoBox x={x + w - 0.02} y={y} z={z} w={0.02} d={d - 0.02} h={h} tone="raised" hue={1}>
        {[0.45, 0.9].map((v) => (
          <Mark key={v} plane="right" at={[x + w, y, z]} points={[[0.15, v], [d - 0.15, v]]} stroke={INK.line} />
        ))}
      </IsoBox>
      <Lathe
        cx={x + 2.75}
        cy={y + 2.05}
        z={top + 0.95}
        profile={[[0.16, 0], [0.46, 0.08], [0.62, 0.25], [0.66, 0.45], [0.62, 0.68], [0.48, 0.85], [0.3, 0.92], [0.12, 0.9]]}
        convex
        tone="accent"
        float={bob(props, 0.18)}
        lift={1}
      >
        <Link points={[[x + 2.75, y + 2.05, top + 1.82], [x + 2.83, y + 1.97, top + 2.12]]} />
      </Lathe>
    </IllustrationStage>
  )
}

/** A wedge of a disc in plane units: its point at (cu, cv), its crust from angle `a` round to `b`. */
const wedge = (cu: number, cv: number, r: number, a: number, b: number, n: number): PlanePoint[] => [[cu, cv], ...arc(cu, cv, r, a, b, n)]

/** A pizza on its board, cut in six, and the slice in the accent lifted out of it. Hovered, it rises away. */
export function IllustrationPizza(props: IllustrationProps) {
  const [cx, cy, r] = [4.05, 4.25, 2.35]
  const board = 0.69
  const [cheese, crust] = [0.16, 0.3]
  const cut = Math.PI / 3
  const polar = (d: number, a: number) => [cx + d * Math.cos(a), cy + d * Math.sin(a)] as const
  const lifted = board + 1.05
  // The toppings, two to a slice, and two on the one taken: [distance, angle].
  const pepperoni = [[1.5, 1.35], [0.8, 1.8], [1.55, 2.4], [0.85, 2.95], [1.5, 3.45], [0.8, 3.95], [1.55, 4.5], [0.85, 5.05], [1.5, 5.6]] as const
  return (
    <IllustrationStage id="pizza" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={cx - 0.35} y={0.85} z={0.55} w={0.7} d={1.3} h={0.14} tone="neutral">
        <Mark plane="top" at={[cx, 1.25, board]} points={circle(0, 0, 0.14, 16)} fill={INK.well} />
      </IsoBox>
      <IsoCylinder x={cx - 2.6} y={cy - 2.6} z={0.55} r={2.6} h={0.14} tone="neutral" />
      <Prism plane="top" at={[0, 0, board]} points={wedge(cx, cy, r - 0.28, cut, Math.PI * 2, 40)} depth={cheese} tone="raised" hue={2}>
        {[2, 3, 4, 5].map((i) => (
          <Mark key={i} plane="top" at={[0, 0, board + cheese]} points={[[cx, cy], polar(r - 0.3, i * cut)]} stroke={INK.line} />
        ))}
        {pepperoni.map(([d, a]) => (
          <Mark key={a} plane="top" at={[0, 0, board + cheese]} points={circle(...polar(d, a), 0.28, 18)} fill={INK.line} />
        ))}
      </Prism>
      <Prism plane="top" at={[0, 0, board]} points={band(cx, cy, r - 0.3, r, cut, Math.PI * 2, 40)} depth={crust} tone="raised" />
      <Group float={bob(props, 0.14)} lift={0.9}>
        <Prism plane="top" at={[0, 0, lifted]} points={wedge(cx, cy, r - 0.28, 0, cut, 10)} depth={cheese} tone="accent">
          {[[1.5, 0.5], [0.8, 0.3]].map(([d, a]) => (
            <Mark key={d} plane="top" at={[0, 0, lifted + cheese]} points={circle(...polar(d!, a!), 0.28, 18)} fill={INK.onAccent} opacity={0.45} />
          ))}
        </Prism>
        <Prism plane="top" at={[0, 0, lifted]} points={band(cx, cy, r - 0.3, r, 0, cut, 10)} depth={crust} tone="accent" />
      </Group>
    </IllustrationStage>
  )
}

/** A slice of bread in plane units, `w` across its base: straight sides, and the crust domed over them. */
const bread = (u: number, v: number, w: number): PlanePoint[] => [
  [u + 0.1, v],
  [u + w - 0.1, v],
  [u + w, v + 0.62],
  ...arc(u + w / 2, v + 1.02, w * 0.54, -0.32, Math.PI + 0.32, 18).map(([a, b]) => [a, v + 1.02 + (b - v - 1.02) * 0.82] as const),
  [u, v + 0.62],
]

/** A cut face's crumb: the shape's own top shade, so it reads lighter than the crust round it. */
const CRUMB = 'var(--kg-top)'

/** The same outline drawn in by a margin: the crumb inside the crust. */
const crumb = (points: readonly PlanePoint[], k = 0.8): PlanePoint[] => {
  const [cu, cv] = points.reduce(([a, b], [u, v]) => [a + u / points.length, b + v / points.length], [0, 0])
  return points.map(([u, v]) => [cu + (u - cu) * k, cv + (v - cv) * k] as const)
}

/** A loaf on its board with the bread knife in front, and its first slice in the accent falling away. Hovered, it lifts off. */
export function IllustrationBakery(props: IllustrationProps) {
  const board = 0.73
  const [x, y, len] = [1.45, 2.35, 2.55]
  const section = bread(y, board, 2.3)
  const end = x + len
  const cut = [end + 1.4, 0, 0.45] as const
  const blade: PlanePoint[] = [[2.1, 5.3], [5.25, 5.3], [5.6, 5.42], [5.4, 5.62], [2.1, 5.62]]
  return (
    <IllustrationStage id="bakery" {...props}>
      <IsoPlatform x={0.6} y={1.1} w={6.8} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={1.1} y={1.6} z={0.55} w={5.8} d={4.6} h={0.18} tone="neutral" />
      <Prism plane="right" at={[x, 0, 0]} points={section} depth={len} tone="raised" hue={2}>
        <Mark plane="right" at={[end, 0, 0]} points={crumb(section)} fill={CRUMB} stroke={INK.line} />
        {[0.45, 1.15, 1.85].map((sx) => (
          <Link key={sx} points={arc(0, 0, 1, 1.15, 2, 5).map(([c, s]) => [x + sx - c * 0.9, y + 1.15 + c * 1.24, board + 1.02 + s * 1.02] as const)} />
        ))}
      </Prism>
      <Prism plane="right" at={cut} points={section} depth={0.3} tone="accent" float={bob(props, 0.14)} lift={0.8}>
        <Mark plane="right" at={[cut[0] + 0.3, 0, cut[2]]} points={crumb(section)} fill={CRUMB} />
        {[[3.2, 1.3], [3.75, 1.75], [4.05, 1.15], [2.95, 1.95]].map(([u, v]) => (
          <Mark key={u} plane="right" at={[cut[0] + 0.3, 0, cut[2]]} points={circle(u!, v!, 0.07, 8)} fill={INK.onAccent} opacity={0.4} />
        ))}
      </Prism>
      <IsoBox x={1.2} y={5.3} z={board} w={0.9} d={0.32} h={0.2} tone="sunken" />
      <Prism plane="top" at={[0, 0, board]} points={blade} depth={0.04} tone="raised">
        <Mark plane="top" at={[0, 0, board + 0.04]} points={Array.from({ length: 16 }, (_, i) => [2.25 + i * 0.2, 5.55 + (i % 2) * 0.05] as const)} stroke={INK.line} />
      </Prism>
      {[[5.2, 4.9], [5.55, 4.55], [4.9, 4.65]].map(([cx, cy]) => (
        <IsoBox key={cx} x={cx!} y={cy!} z={board} w={0.12} d={0.12} h={0.08} tone="raised" />
      ))}
    </IllustrationStage>
  )
}

/** A cocktail on its stem, and over it a cherry in the accent. Hovered, it drops in. */
export function IllustrationCocktail(props: IllustrationProps) {
  const [cx, cy] = [4, 4]
  const stem = 0.65
  const bowl = stem + 1.55
  const rim = bowl + 1.7
  const cherry = rim + 0.9
  const [wx, wy] = [cx + 1.5, cy - 1.52]
  return (
    <IllustrationStage id="cocktail" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[cx, cy, 0.55]} points={circle(0, 0, 2.3, 48)} stroke={INK.line} dashed closed />
      </IsoPlatform>
      <IsoCylinder x={cx - 1.2} y={cy - 1.2} z={0.55} r={1.2} h={0.1} tone="raised" />
      <IsoCylinder x={cx - 0.09} y={cy - 0.09} z={stem} r={0.09} h={bowl - stem + 0.1} tone="raised" />
      <Lathe cx={cx} cy={cy} z={bowl} profile={[[0.12, 0], [0.32, 0.2], [2.1, rim - bowl]]} convex tone="raised" hue={1}>
        <Mark plane="top" at={[cx, cy, rim]} points={circle(0, 0, 1.88, 48)} fill={INK.well} />
        <Lathe axis="y" cx={wx} cy={wy} z={rim + 0.15} profile={[[0.7, 0], [0.7, 0.14]]} tone="raised" hue={2}>
          <Mark plane="left" at={[wx, wy + 0.14, rim + 0.15]} points={circle(0, 0, 0.58, 28)} stroke={INK.line} closed />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Mark key={i} plane="left" at={[wx, wy + 0.14, rim + 0.15]} points={[[0, 0], [Math.cos((i * Math.PI) / 3) * 0.58, Math.sin((i * Math.PI) / 3) * 0.58]]} stroke={INK.line} />
          ))}
        </Lathe>
      </Lathe>
      <Group float={bob(props, 0.16)} lift={-0.85}>
        <Lathe cx={cx - 0.25} cy={cy + 0.25} z={cherry} profile={orb(0.44)} convex tone="accent">
          <Link points={[[cx - 0.25, cy + 0.25, cherry + 0.86], [cx - 0.1, cy + 0.1, cherry + 1.2], [cx + 0.3, cy - 0.3, cherry + 1.5]]} lit />
        </Lathe>
      </Group>
    </IllustrationStage>
  )
}

/** The pot's lid, bottom up: a low dome. */
const LID = [
  [1.42, 0],
  [1.4, 0.06],
  [1.22, 0.22],
  [0.86, 0.34],
  [0.4, 0.4],
  [0, 0.42],
] as const

/** A pot on the hob, the empty ring beside it, and its lid in the accent rattling on a head of steam. Hovered, it lifts. */
export function IllustrationCooking(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.1, 2.3, 0.55, 5.8, 3.6, 0.4]
  const top = z + h
  const face = [x, y + d, z] as const
  const [cx, cy, r] = [3, 4.1, 1.4]
  const rim = top + 1.45
  return (
    <IllustrationStage id="cooking" {...props}>
      <IsoPlatform x={0.6} y={1.1} w={6.8} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="neutral">
        {[0.95, 0.62].map((rr) => (
          <Mark key={rr} plane="top" at={[5.45, cy, top]} points={circle(0, 0, rr, 36)} stroke={INK.line} closed />
        ))}
        <Mark plane="top" at={[5.45, cy, top]} points={circle(0, 0, 0.26, 20)} fill={INK.faint} />
        {[3.9, 4.8].map((u) => (
          <g key={u}>
            <Mark plane="left" at={face} points={circle(u, h / 2, 0.15, 16)} fill={INK.faint} stroke={INK.line} />
            <Mark plane="left" at={face} points={[[u, h / 2], [u, h / 2 + 0.13]]} stroke={INK.line} />
          </g>
        ))}
      </IsoBox>
      <IsoBox x={cx - r - 0.5} y={cy - 0.14} z={rim - 0.42} w={0.5} d={0.28} h={0.14} tone="raised" hue={1} />
      <IsoCylinder x={cx - r} y={cy - r} z={top} r={r} h={rim - top} tone="raised" hue={1}>
        <Mark plane="top" at={[cx, cy, rim]} points={circle(0, 0, r - 0.1, 40)} fill={INK.well} />
      </IsoCylinder>
      <IsoBox x={cx + r} y={cy - 0.14} z={rim - 0.42} w={0.5} d={0.28} h={0.14} tone="raised" hue={1} />
      <IsoPiece float={bob(props, 0.14)} lift={0.6} delay={6}>
        {[-0.95, 0.9].map((s, i) => (
          <Link key={s} points={wisp(cx + s, cy - s, rim + 0.35 + i * 0.1, i * 1.9)} />
        ))}
      </IsoPiece>
      <Group float={bob(props, 0.08)} lift={0.9}>
        <Lathe cx={cx} cy={cy} z={rim + 0.12} profile={LID} convex tone="accent" />
        <IsoCylinder x={cx - 0.2} y={cy - 0.2} z={rim + 0.5} r={0.2} h={0.2} tone="accent" />
      </Group>
    </IllustrationStage>
  )
}
