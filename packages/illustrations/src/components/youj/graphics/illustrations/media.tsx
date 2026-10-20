'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { bob, circle, curve, Group, IllustrationStage, INK, Lathe, Link, Mark, Prism, rect, smooth, type IllustrationProps, type PlanePoint } from './kit'

/* Media: making and playing things. A camera with its lens out, a record on
 * its turntable with a note rising off it, and a screen with its play
 * button lifting toward you. Then a canvas on its easel with the palette
 * lifted, a guitar by its amp, a film reel running out across the floor,
 * and the pen tool over the curve it's drawing. */

/** A camera hovering over its plinth, its lens barrel in the accent. */
export function IllustrationCamera(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.6, 2.6, 0.85, 4.6, 2, 2.3]
  const top = z + h
  const front = y + d
  const [lx, lz] = [x + 2.35, z + 1.1]
  return (
    <IllustrationStage id="camera" {...props}>
      <IsoPlatform x={0.8} y={0.8} w={6.4} d={6.4} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(4, 4, 2.3, 48)} stroke={INK.line} dashed closed />
      </IsoPlatform>
      <Group float={bob(props, 0.14)} lift={0.7}>
        <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
          <Mark plane="left" at={[x, front, z]} points={rect(w - 1.15, h - 0.65, 0.8, 0.38)} fill={INK.faint} stroke={INK.line} />
          <Mark plane="right" at={[x + w, y, z]} points={rect(0.4, 0.5, d - 0.8, 0.12)} fill={INK.faint} />
        </IsoBox>
        <IsoBox x={x} y={front} z={z} w={0.95} d={0.24} h={h} tone="neutral" />
        <IsoBox x={x + 1.55} y={y + 0.3} z={top} w={1.6} d={1.3} h={0.5} tone="raised" hue={1}>
          <Mark plane="left" at={[x + 1.55, y + 1.6, top]} points={rect(0.4, 0.14, 0.8, 0.22)} fill={INK.well} />
        </IsoBox>
        <IsoCylinder x={x + 3.65} y={y + 0.5} z={top} r={0.3} h={0.18} tone="neutral" />
        <IsoCylinder x={x + 0.3} y={y + 0.55} z={top} r={0.38} h={0.2} tone="neutral" />
        <Lathe axis="y" cx={lx} cy={front} z={lz} profile={[[1.05, 0], [1.05, 0.26]]} tone="neutral" />
        <Lathe axis="y" cx={lx} cy={front + 0.26} z={lz} profile={[[0.88, 0], [0.88, 0.72]]} tone="accent">
          <Mark plane="left" at={[lx, front + 0.98, lz]} points={circle(0, 0, 0.64, 40)} fill={INK.well} />
          <Mark plane="left" at={[lx, front + 0.98, lz]} points={circle(0, 0, 0.36, 32)} stroke={INK.line} closed />
          <Mark plane="left" at={[lx, front + 0.98, lz]} points={circle(-0.22, 0.24, 0.1, 12)} fill={INK.faint} />
        </Lathe>
      </Group>
    </IllustrationStage>
  )
}

/** An eighth note in plane units, its head at (cu, cv), `s` to scale. */
const note = (cu: number, cv: number, s: number): PlanePoint[] => {
  const tilt = -0.35
  const head = Array.from({ length: 15 }, (_, i) => {
    const a = ((70 + (270 * i) / 14) * Math.PI) / 180
    const [u, v] = [0.34 * Math.cos(a), 0.25 * Math.sin(a)]
    return [u * Math.cos(tilt) - v * Math.sin(tilt), u * Math.sin(tilt) + v * Math.cos(tilt)] as const
  })
  const rest: PlanePoint[] = [
    [0.32, 0.05],
    [0.32, 1.2],
    [0.62, 0.9],
    [0.72, 1.18],
    [0.32, 1.6],
    [0.2, 1.6],
    [0.2, 0.25],
  ]
  return [...head, ...rest].map(([u, v]) => [cu + u * s, cv + v * s] as const)
}

/** A record on its turntable, the arm on its edge, and a note in the accent rising off it. */
export function IllustrationMusic(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.1, 1.5, 0.55, 5.8, 5, 0.75]
  const top = z + h
  const [cx, cy] = [3.55, 4.05]
  return (
    <IllustrationStage id="music" {...props}>
      <IsoPlatform x={0.6} y={0.9} w={6.8} d={6.2} h={0.4} lip={0.15} inset={0.3} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Mark plane="left" at={[x, y + d, z]} points={rect(0.4, 0.3, 0.7, 0.14)} fill={INK.line} />
        <Mark plane="left" at={[x, y + d, z]} points={circle(w - 0.6, h / 2, 0.16, 16)} fill={INK.faint} stroke={INK.line} />
      </IsoBox>
      <IsoCylinder x={cx - 2} y={cy - 2} z={top} r={2} h={0.1} tone="sunken">
        <IsoCylinder x={cx - 1.85} y={cy - 1.85} z={top + 0.1} r={1.85} h={0.05} tone="neutral">
          {[1.6, 1.35, 1.1].map((r) => (
            <Mark key={r} plane="top" at={[cx, cy, top + 0.15]} points={circle(0, 0, r, 48)} stroke={INK.line} closed />
          ))}
          <Mark plane="top" at={[cx, cy, top + 0.15]} points={circle(0, 0, 0.6, 32)} fill={INK.faint} />
          <Mark plane="top" at={[cx, cy, top + 0.15]} points={circle(0, 0, 0.08, 12)} fill={INK.line} />
        </IsoCylinder>
      </IsoCylinder>
      <IsoCylinder x={5.75} y={1.95} z={top} r={0.35} h={0.3} tone="neutral" />
      <IsoBox x={6.05} y={2.3} z={top + 0.22} w={0.1} d={2.15} h={0.08} tone="neutral" />
      <IsoBox x={5.15} y={4.35} z={top + 0.16} w={1} d={0.28} h={0.12} tone="neutral" />
      <Prism plane="left" at={[0, cy + 0.2, 0]} points={note(3.2, 2.55, 1.35)} depth={0.3} tone="accent" float={bob(props, 0.22)} lift={0.9} />
    </IllustrationStage>
  )
}

/** A screen on its stand, and its round play button in the accent lifting off it toward you. */
export function IllustrationVideo(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1, 3.5, 1.25, 6, 0.35, 3.3]
  const face = [x, y + d, z] as const
  return (
    <IllustrationStage id="video" {...props}>
      <IsoPlatform x={0.8} y={1.1} w={6.4} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={3} y={3.1} z={0.55} w={2} d={1.3} h={0.1} tone="raised" />
      <IsoBox x={3.8} y={3.55} z={0.65} w={0.4} d={0.3} h={z - 0.65} tone="raised" />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Mark plane="left" at={face} points={rect(0.25, 0.3, w - 0.5, h - 0.55)} fill={INK.faint} stroke={INK.line} />
        <Mark plane="left" at={face} points={[[0.25, 0.95], [1.7, 2.25], [2.9, 1.3], [3.6, 1.85], [w - 0.25, 0.95]]} fill={INK.text} />
        <Mark plane="left" at={face} points={circle(4.55, 2.3, 0.28, 20)} fill={INK.text} />
        <Mark plane="left" at={face} points={rect(0.6, 0.6, w - 1.2, 0.1)} fill={INK.text} />
        <Mark plane="left" at={face} points={rect(0.6, 0.6, 1.9, 0.1)} fill={INK.line} />
        <Mark plane="left" at={face} points={circle(2.5, 0.65, 0.12, 16)} fill={INK.line} />
      </IsoBox>
      <Lathe axis="y" cx={x + w / 2} cy={y + d + 0.3} z={z + 1.75} profile={[[0.95, 0], [0.95, 0.22]]} tone="accent" float={bob(props, 0.18)} lift={0.9}>
        <Mark plane="left" at={[x + w / 2, y + d + 0.52, z + 1.75]} points={[[-0.26, -0.42], [0.46, 0], [-0.26, 0.42]]} fill={INK.onAccent} />
      </Lathe>
    </IllustrationStage>
  )
}

/** A painter's palette in plane units round (0, 0): a rounded blob with a notch for the thumb's side. */
const PALETTE = smooth([[-1.15, 0], [-0.85, -0.7], [0, -0.88], [0.9, -0.62], [1.18, 0.1], [0.85, 0.72], [0.15, 0.78], [-0.15, 0.42], [-0.5, 0.68], [-1, 0.52]])

/** A canvas on its easel with a landscape on it, and the palette in the accent with its paints and brush. Hovered, it's picked up. */
export function IllustrationEasel(props: IllustrationProps) {
  const [cx, cy, ledge] = [3.35, 3, 1.7]
  const canvas = { x: cx - 1.45, y: cy + 0.18, z: ledge + 0.14, w: 2.9, d: 0.12, h: 2.3 }
  const face = [canvas.x, canvas.y + canvas.d, canvas.z] as const
  const leg = (s: number): PlanePoint[] => [[cx + s * 1.25 - 0.13, 0.55], [cx + s * 1.25 + 0.13, 0.55], [cx + s * 0.2 + 0.13, 4.6], [cx + s * 0.2 - 0.13, 4.6]]
  const [px, py, pz] = [5.3, 5.3, 1.2]
  const paint = [px, py, pz + 0.08] as const
  return (
    <IllustrationStage id="easel" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <Prism plane="right" at={[cx - 0.1, 0, 0]} points={[[cy - 1.6, 0.55], [cy - 1.34, 0.55], [cy - 0.02, 4.45], [cy - 0.28, 4.45]]} depth={0.2} tone="neutral" hue={2} />
      {[-1, 1].map((s) => (
        <Prism key={s} plane="left" at={[0, cy, 0]} points={leg(s)} depth={0.18} tone="neutral" hue={2} />
      ))}
      <IsoBox x={cx - 1.75} y={cy + 0.18} z={ledge} w={3.5} d={0.45} h={0.14} tone="neutral" hue={2} />
      <IsoBox {...canvas} tone="raised">
        <Mark plane="left" at={face} points={rect(0.18, 0.18, canvas.w - 0.36, canvas.h - 0.36)} stroke={INK.line} closed />
        <Mark plane="left" at={face} points={circle(2.05, 1.55, 0.3, 20)} fill={INK.text} />
        <Mark plane="left" at={face} points={[[0.18, 0.18], [0.18, 0.85], [0.95, 1.35], [1.5, 0.95], [2.1, 1.25], [2.72, 0.8], [2.72, 0.18]]} fill={INK.faint} stroke={INK.line} />
      </IsoBox>
      <IsoBox x={cx - 0.3} y={cy + 0.12} z={canvas.z + canvas.h} w={0.6} d={0.24} h={0.16} tone="neutral" />
      <Group float={bob(props, 0.14)} lift={0.8}>
        <Prism plane="top" at={[px, py, pz]} points={PALETTE} depth={0.08} tone="accent">
          <Mark plane="top" at={paint} points={circle(-0.52, 0.12, 0.17, 16)} fill={INK.well} />
          {[[0.55, -0.35, 0.85], [0.02, -0.55, 0.6], [-0.48, -0.4, 0.35], [0.72, 0.28, 0.7]].map(([u, v, o]) => (
            <Mark key={u} plane="top" at={paint} points={circle(u!, v!, 0.18, 16)} fill={INK.onAccent} opacity={o} />
          ))}
        </Prism>
        <Lathe axis="y" cx={px + 0.25} cy={py - 1.05} z={pz + 0.16} profile={[[0.04, 0], [0.07, 1.3], [0.08, 1.35], [0.08, 1.7], [0.1, 1.85], [0.03, 2.15]]} convex tone="raised" />
      </Group>
    </IllustrationStage>
  )
}

/** An acoustic guitar's body, across it (u) and up it from the bottom (v): the lower bout, the waist, the upper bout. */
const GUITAR = smooth([[0, -0.02], [0.72, 0.18], [1.02, 0.78], [0.88, 1.32], [0.6, 1.62], [0.76, 2.02], [0.6, 2.5], [0, 2.72], [-0.6, 2.5], [-0.76, 2.02], [-0.6, 1.62], [-0.88, 1.32], [-1.02, 0.78], [-0.72, 0.18]])

/** An acoustic guitar in the accent, leaning as if on a stand, its amp behind it. Hovered, it's picked up. */
export function IllustrationGuitar(props: IllustrationProps) {
  const [gx, gy, gz, tilt, k] = [3.25, 3.9, 0.95, 0.35, 0.88]
  const pose = (points: readonly PlanePoint[]) => points.map(([u, v]) => [gx + k * (u * Math.cos(tilt) - v * Math.sin(tilt)), gz + k * (u * Math.sin(tilt) + v * Math.cos(tilt))] as const)
  const face = [0, gy + 0.5, 0] as const
  const board = [0, gy + 0.66, 0] as const
  const strings = [-0.09, -0.03, 0.03, 0.09]
  const [ax, ay, az] = [4.9, 1.4, 0.55]
  const amp = [ax, ay + 1.2, az] as const
  return (
    <IllustrationStage id="guitar" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={ax} y={ay} z={az} w={1.85} d={1.2} h={2.1} tone="raised" hue={1}>
        <Mark plane="left" at={amp} points={rect(0.18, 0.2, 1.49, 1.35)} fill={INK.faint} stroke={INK.line} />
        {[0.45, 0.75, 1.05, 1.35].map((v) => (
          <Mark key={v} plane="left" at={amp} points={[[0.3, v], [1.55, v]]} stroke={INK.line} />
        ))}
        {[0.4, 0.75, 1.1].map((u) => (
          <Mark key={u} plane="left" at={amp} points={circle(u, 1.82, 0.09, 12)} fill={INK.line} />
        ))}
      </IsoBox>
      <Group float={bob(props, 0.16)} lift={0.8}>
        <Prism plane="left" at={[0, gy, 0]} points={pose(GUITAR)} depth={0.5} tone="accent">
          <Mark plane="left" at={face} points={pose(circle(0, 1.95, 0.34, 28))} fill={INK.well} />
          <Mark plane="left" at={face} points={pose(rect(-0.42, 0.6, 0.84, 0.16))} fill={INK.onAccent} opacity={0.6} />
          {strings.map((u) => (
            <Mark key={u} plane="left" at={face} points={pose([[u, 0.68], [u, 2.6]])} stroke={INK.onAccent} opacity={0.55} />
          ))}
        </Prism>
        <Prism plane="left" at={face} points={pose(rect(-0.17, 2.5, 0.34, 2.1))} depth={0.16} tone="accent">
          {[2.95, 3.3, 3.65, 4, 4.3].map((v) => (
            <Mark key={v} plane="left" at={board} points={pose([[-0.17, v], [0.17, v]])} stroke={INK.onAccent} opacity={0.35} />
          ))}
          {strings.map((u) => (
            <Mark key={u} plane="left" at={board} points={pose([[u, 2.5], [u, 4.6]])} stroke={INK.onAccent} opacity={0.55} />
          ))}
        </Prism>
        <Prism plane="left" at={face} points={pose([[-0.2, 4.55], [0.2, 4.55], [0.27, 5.3], [-0.27, 5.3]])} depth={0.16} tone="accent">
          {[4.8, 5.08].flatMap((v) => [-0.12, 0.12].map((u) => (
            <Mark key={`${u}-${v}`} plane="left" at={board} points={pose(circle(u, v, 0.06, 10))} fill={INK.onAccent} opacity={0.7} />
          )))}
        </Prism>
      </Group>
    </IllustrationStage>
  )
}

/** A film reel in the accent standing on its edge, the film wound between its flanges and run out across the floor. Hovered, it lifts. */
export function IllustrationFilmReel(props: IllustrationProps) {
  const [cx, cy, cz, r] = [3.2, 2.7, 2.95, 1.95]
  const [flange, film] = [0.1, 0.8]
  const front = [cx, cy + flange * 2 + film, cz] as const
  const strip = { x: cx + 0.3, y: cy + flange, w: 3.6, d: film }
  const top = [strip.x, strip.y, 0.58] as const
  return (
    <IllustrationStage id="film-reel" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoCylinder x={5.1} y={0.95} z={0.55} r={0.9} h={0.3} tone="raised" hue={1}>
        <Mark plane="top" at={[6, 1.85, 0.85]} points={circle(0, 0, 0.72, 32)} stroke={INK.line} closed />
      </IsoCylinder>
      <IsoBox x={strip.x} y={strip.y} z={0.55} w={strip.w} d={strip.d} h={0.03} tone="sunken">
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <Mark key={k} plane="top" at={top} points={rect(0.15 + k * 0.58, 0.14, 0.48, film - 0.28)} fill={INK.faint} stroke={INK.line} />
        ))}
        {Array.from({ length: 18 }, (_, k) => k).flatMap((k) => [0.04, film - 0.1].map((v) => (
          <Mark key={`${k}-${v}`} plane="top" at={top} points={rect(0.1 + k * 0.195, v, 0.07, 0.06)} fill={INK.text} />
        )))}
      </IsoBox>
      <Group float={bob(props, 0.12)} lift={0.8}>
        <Lathe axis="y" cx={cx} cy={cy} z={cz} profile={[[r, 0], [r, flange]]} tone="accent" />
        <Lathe axis="y" cx={cx} cy={cy + flange} z={cz} profile={[[r - 0.4, 0], [r - 0.4, film]]} tone="sunken" />
        <Lathe axis="y" cx={cx} cy={cy + flange + film} z={cz} profile={[[r, 0], [r, flange]]} tone="accent">
          {[0, 1, 2, 3, 4].map((k) => {
            const a = Math.PI / 2 + (k * Math.PI * 2) / 5
            return <Mark key={k} plane="left" at={front} points={circle(Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0.46, 24)} fill={INK.well} />
          })}
          <Mark plane="left" at={front} points={circle(0, 0, 0.36, 20)} fill={INK.onAccent} opacity={0.5} />
          <Mark plane="left" at={front} points={circle(0, 0, 0.1, 12)} fill={INK.well} />
          <Mark plane="left" at={front} points={circle(0, 0, r - 0.14, 48)} stroke={INK.onAccent} opacity={0.4} closed />
        </Lathe>
      </Group>
    </IllustrationStage>
  )
}

/** The pen tool's nib in plane units, its point down at (0, 0). */
const NIB: PlanePoint[] = [[0, 0], [0.62, 1], [0.74, 1.55], [0.44, 2], [-0.44, 2], [-0.74, 1.55], [-0.62, 1]]

/** A curve being drawn across the table, its anchors and handles out, a set square and a ruler by it, and the pen nib in the accent over its last point. Hovered, it lifts off the stroke. */
export function IllustrationDesignTools(props: IllustrationProps) {
  const z = 0.56
  const [a, c1, c2, b] = [[1.5, 2.4], [3.6, 1.5], [2.3, 4.9], [4.4, 4.5]] as const
  const handle = (p: PlanePoint, q: PlanePoint) => [[p[0], p[1], z], [p[0] + (q[0] - p[0]) * 0.55, p[1] + (q[1] - p[1]) * 0.55, z]] as const
  const tip = 1.2
  const nib = [0, b[1] - 0.14, 0] as const
  return (
    <IllustrationStage id="design-tools" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <Prism plane="top" at={[0, 0, 0.55]} points={[[4.4, 1.05], [6.9, 1.05], [4.4, 3.55]]} depth={0.06} tone="raised" hue={1}>
        <Mark plane="top" at={[0, 0, 0.61]} points={[[4.85, 1.5], [5.95, 1.5], [4.85, 2.6]]} stroke={INK.line} closed />
      </Prism>
      <IsoBox x={1.1} y={5.55} z={0.55} w={5.6} d={0.8} h={0.1} tone="raised" hue={2}>
        {Array.from({ length: 22 }, (_, i) => (
          <Mark key={i} plane="top" at={[1.1, 5.55, 0.65]} points={[[0.2 + i * 0.25, 0.8], [0.2 + i * 0.25, 0.8 - (i % 4 ? 0.18 : 0.34)]]} stroke={INK.line} />
        ))}
      </IsoBox>
      <Link points={curve(a, c1, c2, b, 24).map(([x, y]) => [x, y, z] as const)} lit />
      {[handle(a, c1), handle(b, c2)].map((line, i) => (
        <Link key={i} points={line} />
      ))}
      {[handle(a, c1)[1], handle(b, c2)[1]].map(([x, y], i) => (
        <Mark key={i} plane="top" at={[x, y, z]} points={circle(0, 0, 0.1, 12)} fill={INK.line} />
      ))}
      {[a, b].map(([x, y]) => (
        <IsoBox key={x} x={x - 0.14} y={y - 0.14} z={0.55} w={0.28} d={0.28} h={0.06} tone="raised" />
      ))}
      <Group float={bob(props, 0.14)} lift={0.8}>
        <Prism plane="left" at={nib} points={NIB.map(([u, v]) => [b[0] + u, tip + v] as const)} depth={0.28} tone="accent">
          <Mark plane="left" at={[b[0], b[1] + 0.14, tip]} points={[[0, 0.12], [0, 0.95]]} stroke={INK.onAccent} weight={1.5} opacity={0.8} />
          <Mark plane="left" at={[b[0], b[1] + 0.14, tip]} points={circle(0, 1.12, 0.17, 16)} fill={INK.well} />
        </Prism>
        <Prism plane="left" at={nib} points={rect(b[0] - 0.5, tip + 2.12, 1, 0.42)} depth={0.28} tone="accent" />
      </Group>
    </IllustrationStage>
  )
}
