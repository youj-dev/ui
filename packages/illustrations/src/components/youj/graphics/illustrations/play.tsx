'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { arc, bob, circle, Group, IllustrationStage, INK, Mark, Prism, rect, type IllustrationProps, type PlanePoint } from './kit'

/* Play: games and the hours that go into them. A controller lifting off the
 * table, a cabinet with a sprite jumping out of its screen, dice mid-roll,
 * and a jigsaw with its last piece about to drop in. */

/** Points given across the screen and toward you (a, b), laid on the floor from (u, v): for things lying flat that face you square. */
const lay = (u: number, v: number) => ([a, b]: PlanePoint): PlanePoint => [u + (a + b) / Math.SQRT2, v + (b - a) / Math.SQRT2]

/** A plus in plane units, centered on (cu, cv): arms `a` thick, `l` long. */
const plus = (cu: number, cv: number, l: number, a: number): PlanePoint[] =>
  [[-a, -l], [a, -l], [a, -a], [l, -a], [l, a], [a, a], [a, l], [-a, l], [-a, a], [-l, a], [-l, -a], [-a, -a]].map(([u, v]) => [cu + u!, cv + v!] as const)

/** Half a gamepad, as `lay` takes it: from the right shoulder round its grip to the middle of the notch between the grips. */
const HALF: PlanePoint[] = [...arc(1.7, -0.5, 0.6, -Math.PI / 2, 0, 6), ...arc(1.62, 1.02, 0.78, -0.2, 2.7, 12), ...arc(0, 1.58, 1.02, -0.55, -Math.PI / 2, 5)]
const PAD = [...HALF, ...HALF.slice(0, -1).reverse().map(([a, b]) => [-a, b] as const)]

/** A gamepad in the accent hovering over its shadow, pad and buttons up. Hovered, it's picked up. */
export function IllustrationGameController(props: IllustrationProps) {
  const [z, h] = [1.45, 0.5]
  const top = z + h
  const on = lay(3.75, 3.75)
  const peg = (key: string, [a, b]: PlanePoint, r: number, tall: number, tone: 'raised' | 'neutral') => {
    const [u, v] = on([a, b])
    return <IsoCylinder key={key} x={u - r} y={v - r} z={top} r={r} h={tall} tone={tone} hue={1} />
  }
  return (
    <IllustrationStage id="game-controller" {...props}>
      <IsoPlatform x={0.8} y={0.8} w={6.4} d={6.4} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={PAD.map(on)} fill={INK.faint} />
      </IsoPlatform>
      <Group float={bob(props, 0.16)} lift={0.9}>
        <Prism plane="top" at={[0, 0, z]} points={PAD.map(on)} depth={h} tone="accent">
          {[-0.28, 0.28].map((a) => (
            <Mark key={a} plane="top" at={[0, 0, top]} points={rect(a - 0.16, -0.18, 0.32, 0.12).map(on)} fill={INK.onAccent} opacity={0.6} />
          ))}
        </Prism>
        <Prism plane="top" at={[0, 0, top]} points={plus(-1.55, -0.1, 0.46, 0.15).map(on)} depth={0.1} tone="raised" hue={1} />
        {[[1.55, -0.44], [1.93, -0.1], [1.17, -0.1], [1.55, 0.24]].map(([a, b]) => peg(`${a}-${b}`, [a!, b!], 0.15, 0.1, 'raised'))}
        {[-0.72, 0.72].map((a) => peg(`s${a}`, [a, 0.62], 0.3, 0.2, 'neutral'))}
      </Group>
    </IllustrationStage>
  )
}

/** An arcade cabinet's side from the back of its foot: the coin door, the controls jutting out, the screen set back and the marquee over it. */
const CABINET: PlanePoint[] = [[0, 0], [2, 0], [2, 1.3], [2.5, 1.45], [2.5, 1.62], [1.72, 1.86], [1.72, 3.2], [2.08, 3.3], [2.08, 3.95], [0, 3.95]]

/** A pixel heart, the extra life a game hands out, in cells from the bottom tip. */
const HEART: PlanePoint[] = [[3, 0], [4, 0], [4, 1], [5, 1], [5, 2], [6, 2], [6, 3], [7, 3], [7, 5], [6, 5], [6, 6], [4, 6], [4, 5], [3, 5], [3, 6], [1, 6], [1, 5], [0, 5], [0, 3], [1, 3], [1, 2], [2, 2], [2, 1], [3, 1]]

/** An arcade cabinet, stick and buttons on its panel, and a pixel heart in the accent coming out of the screen. Hovered, it jumps clear. */
export function IllustrationArcade(props: IllustrationProps) {
  const [x, y, z, w] = [2.35, 2.1, 0.55, 2.3]
  const screen = [x, y + 1.72, z] as const
  // The heart floats just clear of the marquee, shifted as far across and up as it stands forward, so it reads centered on the screen.
  const [px, ahead] = [0.18, 0.58]
  const heart = { u: x + w / 2 + ahead - 3.5 * px, y: y + 2.2, v: z + 2.8 + ahead - 3 * px }
  return (
    <IllustrationStage id="arcade" {...props}>
      <IsoPlatform x={0.6} y={0.9} w={6.8} d={6.2} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <Prism plane="right" at={[x, y, z]} points={CABINET} depth={w} tone="raised" hue={1}>
        <Mark plane="left" at={screen} points={rect(0.22, 1.98, w - 0.44, 1.1)} fill={INK.well} stroke={INK.line} />
        <Mark plane="left" at={screen} points={[[0.35, 2.2], [w - 0.35, 2.2]]} stroke={INK.line} />
        {[0.5, 1.6].map((u) => (
          <Mark key={u} plane="left" at={screen} points={rect(u, 2.2, 0.2, 0.2)} fill={INK.text} />
        ))}
        <Mark plane="left" at={[x, y + 2.08, z]} points={rect(0.3, 3.45, w - 0.6, 0.3)} fill={INK.text} />
        {[0.55, 1.35].map((u) => (
          <Mark key={u} plane="left" at={[x, y + 2, z]} points={rect(u, 0.4, 0.4, 0.55)} fill={INK.faint} stroke={INK.line} />
        ))}
      </Prism>
      <IsoCylinder x={x + 0.62} y={y + 2.02} z={z + 1.72} r={0.06} h={0.34} tone="neutral" />
      <IsoCylinder x={x + 0.5} y={y + 1.9} z={z + 2.02} r={0.18} h={0.16} tone="neutral" />
      {[1.3, 1.7].map((u) => (
        <IsoCylinder key={u} x={x + u} y={y + 2.02} z={z + 1.72} r={0.12} h={0.07} tone="sunken" />
      ))}
      <Prism plane="left" at={[0, heart.y, 0]} points={HEART.map(([u, v]) => [heart.u + u * px, heart.v + v * px] as const)} depth={0.2} tone="accent" float={bob(props, 0.14)} lift={1.1} />
    </IllustrationStage>
  )
}

/** Where a face's pips go for each number, in steps from its center. */
const PIPS: Record<number, PlanePoint[]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
}

/** A die `s` on a side, its top, left (+y) and right (+x) faces showing these numbers. */
function die(x: number, y: number, z: number, s: number, faces: readonly [number, number, number], tone: 'raised' | 'accent', extra?: { float?: number | boolean; lift?: number }) {
  const ink = tone === 'accent' ? INK.onAccent : INK.line
  const planes = [['top', [x, y, z + s]], ['left', [x, y + s, z]], ['right', [x + s, y, z]]] as const
  return (
    <IsoBox key={`${x}-${y}`} x={x} y={y} z={z} w={s} d={s} h={s} tone={tone} hue={1} {...extra}>
      {planes.flatMap(([plane, at], f) =>
        PIPS[faces[f]!]!.map(([a, b]) =><Mark key={`${plane}${a}${b}`} plane={plane} at={at} points={circle(s / 2 + a * s * 0.27, s / 2 + b * s * 0.27, s * 0.085, 14)} fill={ink} />),
      )}
    </IsoBox>
  )
}

/** A die at rest and another in the accent in the air over its shadow. Hovered, it's thrown higher. */
export function IllustrationDice(props: IllustrationProps) {
  const s = 1.75
  const air = [4.3, 2.3, 2.1] as const
  return (
    <IllustrationStage id="dice" {...props}>
      <IsoPlatform x={0.8} y={0.8} w={6.4} d={6.4} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[air[0], air[1], 0.55]} points={rect(0.1, 0.1, s - 0.2, s - 0.2)} fill={INK.faint} />
      </IsoPlatform>
      {die(1.9, 3.6, 0.55, s, [5, 3, 6], 'raised')}
      {die(air[0], air[1], air[2], s, [6, 5, 4], 'accent', { float: bob(props, 0.2), lift: 1 })}
    </IllustrationStage>
  )
}

/** A jigsaw piece's side and the pieces' layout. */
const S = 1.65
const [PX, PY] = [4 - 1.5 * S, 4 - 1.5 * S]

/** One side of a piece from p to q, with its knob out (1), in (-1) or none (0). */
const side = ([pu, pv]: PlanePoint, [qu, qv]: PlanePoint, k: number): PlanePoint[] => {
  const [tu, tv] = [(qu - pu) / S, (qv - pv) / S]
  const at = ([a, b]: PlanePoint): PlanePoint => [pu + tu * a + tv * b * k, pv + tv * a - tu * b * k]
  if (!k) return [[pu, pv]]
  return [[pu, pv], at([S / 2 - 0.09, 0]), ...arc(S / 2, 0.28, 0.24, (4 * Math.PI) / 3 + 0.12, -Math.PI / 3 - 0.12, 14).map(at), at([S / 2 + 0.09, 0])]
}

/** The outline of the piece in column c, row r of a three-by-three jigsaw: knobs and holes where it meets its neighbors, straight at the border. */
const piece = (c: number, r: number) => {
  const [x, y] = [PX + c * S, PY + r * S]
  const corners: PlanePoint[] = [[x, y], [x + S, y], [x + S, y + S], [x, y + S]]
  const down = (c: number, r: number) => ((c + r) % 2 ? 1 : -1)
  const knobs = [r > 0 ? -down(c, r - 1) : 0, c < 2 ? -down(c, r) : 0, r < 2 ? down(c, r) : 0, c > 0 ? down(c - 1, r) : 0]
  return corners.flatMap((p, i) => side(p, corners[(i + 1) % 4]!, knobs[i]!))
}

/** A jigsaw with its middle piece missing, and the piece in the accent hovering over the gap. Hovered, it drops into place. */
export function IllustrationPuzzle(props: IllustrationProps) {
  const cells = [0, 1, 2].flatMap((c) => [0, 1, 2].map((r) => [c, r] as const)).filter(([c, r]) => c !== 1 || r !== 1)
  const [z, h, over] = [0.55, 0.22, 2.05]
  return (
    <IllustrationStage id="puzzle" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3}>
        <Mark plane="top" at={[0, 0, z]} points={piece(1, 1)} stroke={INK.line} dashed closed />
      </IsoPlatform>
      {cells.map(([c, r]) => (
        <Prism key={`${c}-${r}`} plane="top" at={[0, 0, z]} points={piece(c, r)} depth={h} tone="raised" hue={1} />
      ))}
      <Prism plane="top" at={[0, 0, over]} points={piece(1, 1)} depth={h} tone="accent" float={bob(props, 0.1)} lift={-(over - z - 0.12)} />
    </IllustrationStage>
  )
}
