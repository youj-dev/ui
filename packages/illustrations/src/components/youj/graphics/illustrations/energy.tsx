'use client'

import { useEffect, type ReactNode } from 'react'
import { m, useMotionValue, useTransform, type MotionValue } from 'motion/react'
import { project, toPoints } from '../iso'
import { IsoBox } from '../iso-box'
import { IsoPlatform } from '../iso-platform'
import { useIsoScene } from '../iso-scene'
import { bob, circle, flat, IllustrationStage, INK, Lathe, Link, Mark, Prism, rect, type IllustrationProps, type PlanePoint } from './kit'

/* Energy: where the power comes from and where it goes. A solar panel
 * tilting to the sun, a wind turbine turning in the breeze, a battery taking
 * its last bar of charge, and a charging post with its plug lifting out. */

type Vec = readonly [number, number, number]

/** A direction in the scene as it runs on screen, per grid unit. */
const across = ([x, y, z]: Vec) => [(x - y) * Math.cos(Math.PI / 6), (x + y) / 2 - z] as const

/**
 * The screen transform, as CSS, that carries a flat part drawn in the plane
 * through `o` along (a, b) onto the plane through `o` along (a2, b2): a turn
 * of that part about `o`, projected. Exact for anything flat on the plane.
 */
function reframe(o: Vec, [a, b]: readonly [Vec, Vec], [a2, b2]: readonly [Vec, Vec], unit: number) {
  const [p, q, p2, q2] = [across(a), across(b), across(a2), across(b2)]
  const det = p[0] * q[1] - q[0] * p[1]
  const [i00, i01, i10, i11] = [q[1] / det, -q[0] / det, -p[1] / det, p[0] / det]
  const [ma, mc] = [p2[0] * i00 + q2[0] * i10, p2[0] * i01 + q2[0] * i11]
  const [mb, md] = [p2[1] * i00 + q2[1] * i10, p2[1] * i01 + q2[1] * i11]
  const [ox, oy] = project(o[0], o[1], o[2], unit)
  return `matrix(${ma}, ${mb}, ${mc}, ${md}, ${ox - ma * ox - mc * oy}, ${oy - mb * ox - md * oy})`
}

/** Parts drawn as they stand at rest and carried round by a `reframe` transform. Draw it as a shape's child, so it assembles with the shape. */
function Turned({ transform, children }: { transform: MotionValue<string>; children: ReactNode }) {
  // Turned about the scene's own origin: the matrix already carries the pivot.
  return <m.g style={{ transform, originX: 0, originY: 0, transformBox: 'view-box' }}>{children}</m.g>
}

/**
 * An angle that runs on the scene's clock, `rate` turns per bob and `gust`
 * times that again at full separation (hovered): it picks up and slows down
 * with the separation spring, so it never jumps. Still under reduced motion,
 * or when the scene was asked to hold still.
 */
function useTurning(hold: boolean, rate: number, gust: number) {
  const { clock, period, explode, addFloater, reduced } = useIsoScene()
  const angle = useMotionValue(0)
  const turning = !hold && !reduced
  useEffect(() => (turning ? addFloater() : undefined), [turning, addFloater])
  useEffect(() => {
    let last = clock.get()
    return clock.on('change', (now) => {
      angle.set(angle.get() + ((now - last) / period) * rate * Math.PI * 2 * (1 + gust * explode.get()))
      last = now
    })
  }, [clock, period, explode, angle, rate, gust])
  return angle
}

/** A blade from the hub out in plane units round (hu, hv), the `k`th of three: a slim airfoil, widest near the root. */
const blade = (hu: number, hv: number, k: number): PlanePoint[] => {
  const a = Math.PI / 2 + (k * 2 * Math.PI) / 3
  return [[-0.1, 0.3], [-0.07, 1.4], [-0.03, 2.3], [0.05, 2.36], [0.13, 1.7], [0.25, 0.85], [0.25, 0.45], [0.12, 0.3]].map(
    ([u, v]) => [hu + v! * Math.cos(a) - u! * Math.sin(a), hv + v! * Math.sin(a) + u! * Math.cos(a)] as const,
  )
}

/** Three blades on the plane facing +y, turning about the hub. */
function Rotor({ hub: [hx, hy, hz], hold }: { hub: Vec; hold: boolean }) {
  const { unit } = useIsoScene()
  const angle = useTurning(hold, 0.5, 2)
  const transform = useTransform(() => {
    const [c, s] = [Math.cos(angle.get()), Math.sin(angle.get())]
    return reframe([hx, hy, hz], [[1, 0, 0], [0, 0, 1]], [[c, 0, s], [-s, 0, c]], unit)
  })
  return (
    <Turned transform={transform}>
      {[0, 1, 2].map((k) => (
        <Prism key={k} plane="left" at={[0, hy, 0]} points={blade(hx, hz, k)} depth={0.06} tone="accent" />
      ))}
    </Turned>
  )
}

/** A wind turbine on its mast, its blades in the accent turning slowly. Hovered, a gust spins them up. */
export function IllustrationWindTurbine(props: IllustrationProps) {
  const [tx, ty, hz] = [3.9, 3.2, 4.45]
  return (
    <IllustrationStage id="wind-turbine" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(tx, ty, 0.75, 32)} fill={INK.faint} />
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(tx + 0.3, ty + 0.9, 2.45, 48)} stroke={INK.line} dashed closed />
      </IsoPlatform>
      <Lathe cx={tx} cy={ty} z={0.55} profile={[[0.34, 0], [0.26, 2], [0.18, hz - 0.8]]} tone="raised" />
      <Lathe axis="y" cx={tx} cy={ty - 0.6} z={hz} profile={[[0.24, 0], [0.32, 0.3], [0.32, 1.15], [0.28, 1.45]]} tone="raised" hue={1}>
        <Rotor hub={[tx, ty + 0.86, hz]} hold={props.float === false} />
        <Lathe axis="y" cx={tx} cy={ty + 0.85} z={hz} profile={[[0.3, 0], [0.25, 0.18], [0.14, 0.34], [0.03, 0.42]]} convex tone="accent" />
      </Lathe>
    </IllustrationStage>
  )
}

/** The panel's tilt at rest, and how much further it turns to the sun when hovered, radians. */
const TILT = 0.5
const TURN = 0.3

/** A solar panel tilted on its rail, `half` up and down the slope from it and `span` along it: it sways a breath as it tracks, and turns further while hovered. */
function Panel({ o, half, span, hold }: { o: Vec; half: number; span: number; hold: boolean }) {
  const { unit, clock, period, explode, reduced, addFloater } = useIsoScene()
  const [ox, oy, oz] = o
  // Down the slope from the rail at a tilt: toward you (+y) and down.
  const down = (t: number): Vec => [0, Math.cos(t), -Math.sin(t)]
  const at = (u: number, s: number, t = TILT): Vec => [ox + u, oy + down(t)[1] * s, oz + down(t)[2] * s]
  const sway = hold || reduced ? 0 : 1
  useEffect(() => (sway ? addFloater() : undefined), [sway, addFloater])
  const transform = useTransform(() => {
    const t = TILT + TURN * explode.get() + sway * 0.03 * Math.sin((clock.get() / period) * Math.PI * 2)
    return reframe(o, [[1, 0, 0], down(TILT)], [[1, 0, 0], down(t)], unit)
  })
  const [n0, n1] = [-Math.sin(TILT) * 0.12, -Math.cos(TILT) * 0.12]
  const [top, low] = [at(0, -half), at(0, half)]
  return (
    <Turned transform={transform}>
      <Prism
        plane="right"
        at={[ox, 0, 0]}
        points={[[top[1], top[2]], [low[1], low[2]], [low[1] + n0, low[2] + n1], [top[1] + n0, top[2] + n1]]}
        depth={span}
        tone="accent"
      >
        {[-half / 3, half / 3].map((s) => (
          <Link key={s} points={[at(0.12, s), at(span - 0.12, s)]} />
        ))}
        {[1, 2, 3].map((i) => (
          <Link key={i} points={[at((span * i) / 4, -half + 0.1), at((span * i) / 4, half - 0.1)]} />
        ))}
      </Prism>
    </Turned>
  )
}

/** A solar panel in the accent between its posts, its cells ruled across it. Hovered, it tilts to face the sun. */
export function IllustrationSolarPanel(props: IllustrationProps) {
  const [x, span, rail, pz] = [2.1, 3.8, 3.9, 2.3]
  return (
    <IllustrationStage id="solar-panel" {...props}>
      <IsoPlatform x={0.6} y={0.9} w={6.8} d={6.2} h={0.4} lip={0.15} inset={0.3} grid={1}>
        <Mark plane="top" at={[0, 0, 0.56]} points={rect(x, rail - 0.3, span, 2)} fill={INK.faint} />
      </IsoPlatform>
      {[x - 0.42, x + span + 0.18].map((px) => (
        <IsoBox key={px} x={px} y={rail - 0.12} z={0.55} w={0.24} d={0.24} h={pz - 0.55 + 0.1} tone="raised" />
      ))}
      <Lathe axis="x" cx={x - 0.42} cy={rail} z={pz - 0.08} profile={[[0.08, 0], [0.08, span + 0.84]]} tone="neutral">
        <Panel o={[x, rail, pz]} half={1.4} span={span} hold={props.float === false} />
      </Lathe>
    </IllustrationStage>
  )
}

/** A lightning bolt drawn upright on a top face, `s` to scale, centered on its box. */
const bolt = (s: number): PlanePoint[] =>
  [[0.1, -0.5], [-0.3, 0.05], [-0.02, 0.05], [-0.12, 0.5], [0.3, -0.08], [0.02, -0.08], [0.14, -0.5]].map(([u, v]) => flat(u! * s, v! * s))

/** A battery lying down, its case glass: three bars of charge in it and the fourth in the accent over its place. Hovered, it drops in. */
export function IllustrationBattery(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.5, 2.9, 0.55, 4.4, 2.1, 1.75]
  const [gap, cell] = [0.14, (w - 0.28 - 0.14 * 3) / 4]
  const cellAt = (i: number) => x + 0.14 + i * (cell + gap)
  const [cy, cd, ch] = [y + 0.18, d - 0.36, h - 0.3]
  const lit = { x: cellAt(3), z: z + h + 0.4 }
  return (
    <IllustrationStage id="battery" {...props}>
      <IsoPlatform x={0.6} y={1.1} w={6.8} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      {[0, 1, 2].map((i) => (
        <IsoBox key={i} x={cellAt(i)} y={cy} z={z + 0.15} w={cell} d={cd} h={ch} tone="raised" hue={1} />
      ))}
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} variant="wire" />
      <IsoBox x={x + w} y={y + d / 2 - 0.4} z={z + h / 2 - 0.4} w={0.34} d={0.8} h={0.8} tone="raised" />
      <IsoBox x={lit.x} y={cy} z={lit.z} w={cell} d={cd} h={ch} tone="accent" float={bob(props, 0.14)} lift={-(lit.z - z - 0.15)}>
        <Mark plane="top" at={[lit.x + cell / 2, cy + cd / 2, lit.z + ch]} points={bolt(0.9)} fill={INK.onAccent} opacity={0.75} />
      </IsoBox>
    </IllustrationStage>
  )
}

/** A cable hanging through points in the scene, heavier than a hairline. */
function Cable({ points }: { points: readonly Vec[] }) {
  const { unit } = useIsoScene()
  return <polyline points={toPoints(points.map(([a, b, c]) => project(a, b, c, unit)))} className="kg-line" style={{ fill: 'none', stroke: INK.line, strokeWidth: 2.5 }} />
}

/** A charging post with its screen, a bay marked out in front of it, and its plug in the accent sitting in the holster. Hovered, it's lifted out. */
export function IllustrationEvCharger(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [3.5, 1.7, 0.55, 1.6, 1.2, 3.4]
  const face = [x, y + d, z] as const
  // The holster, a ledge on the post's face, and the plug standing in it.
  const [hx, hy, hz] = [x + 0.12, y + d, z + 1.05]
  const plug = { x: hx + 0.1, y: hy + 0.07, z: hz + 0.3, w: 0.74, d: 0.58, h: 1.2 }
  // The cable sags from the plug's foot and back into the post's face.
  const sag = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8
    return [plug.x + plug.w - 0.15 + t * 0.6, (plug.y + plug.d - 0.1) * (1 - t) + hy * t + Math.sin(t * Math.PI) * 0.25, plug.z - Math.sin(t * Math.PI) * 0.9 + t * 0.1] as const
  })
  return (
    <IllustrationStage id="ev-charger" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1}>
        <Mark plane="top" at={[0, 0, 0.56]} points={rect(x - 0.9, y + d + 0.55, w + 1.8, 3.6)} stroke={INK.line} dashed closed />
        <Mark plane="top" at={[x + w / 2, y + d + 2.35, 0.56]} points={bolt(1.9)} fill={INK.text} />
      </IsoPlatform>
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Mark plane="left" at={face} points={rect(0.25, h - 1.25, w - 0.5, 0.9)} fill={INK.well} />
        <Mark plane="left" at={face} points={rect(0.45, h - 0.95, 0.7, 0.14)} fill={INK.line} />
        <Mark plane="left" at={face} points={rect(0.45, h - 0.7, 0.4, 0.14)} fill={INK.text} />
        <Mark plane="right" at={[x + w, y, z]} points={rect(0.3, h - 0.5, d - 0.6, 0.14)} fill={INK.faint} />
      </IsoBox>
      <IsoBox x={hx} y={hy} z={hz} w={0.94} d={0.72} h={0.3} tone="sunken" />
      <IsoBox {...plug} tone="accent" float={bob(props, 0.06)} lift={0.75}>
        <Mark plane="left" at={[plug.x, plug.y + plug.d, plug.z]} points={rect(0.16, plug.h - 0.36, plug.w - 0.32, 0.14)} fill={INK.onAccent} opacity={0.55} />
        <Cable points={sag} />
      </IsoBox>
    </IllustrationStage>
  )
}
