'use client'

import { project } from '../iso'
import { IsoPlatform } from '../iso-platform'
import { useIsoScene } from '../iso-scene'
import { arc, bob, circle, Group, IllustrationStage, INK, Lathe, Mark, orb, Prism, type IllustrationProps, type PlanePoint } from './kit'

/* Weather: what the sky is doing. The sun coming out from behind a cloud,
 * rain falling into its puddle, a snowflake settling on the drift, and a
 * bolt from a storm cloud. */

/** A cloud side on in plane units, `s` to scale, its flat base on v and about 1.5 either side of u: three puffs, the middle one tallest. */
const cloud = (u: number, v: number, s: number): PlanePoint[] =>
  [...arc(1.05, 0.52, 0.52, -Math.PI / 2, Math.PI * 0.62, 10), ...arc(0.1, 0.78, 0.86, Math.PI * 0.08, Math.PI * 0.92, 16), ...arc(-1, 0.5, 0.5, Math.PI * 0.35, Math.PI * 1.5, 10)].map(
    ([a, b]) => [u + a * s, v + b * s] as const,
  )

/** Short rays round (x, y, z) in the plane that faces you, `r` to `r + len` out, in the accent. Draw them as the sun's child. */
function Rays({ at: [x, y, z], r, len }: { at: readonly [number, number, number]; r: number; len: number }) {
  const { unit } = useIsoScene()
  // A step of c across the screen is c / √3 along x and back along y.
  const point = (a: number, s: number) => project(x + (Math.cos(a) * s) / Math.sqrt(3), y - (Math.cos(a) * s) / Math.sqrt(3), z + Math.sin(a) * s, unit)
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const [p, q] = [point((i * Math.PI) / 4, r), point((i * Math.PI) / 4, r + len)]
        return <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} className="kg-line" style={{ stroke: INK.accent, strokeWidth: 2 }} />
      })}
    </>
  )
}

/** The sun in the accent, its rays round it, half behind a cloud. Hovered, it comes out. */
export function IllustrationSunCloud(props: IllustrationProps) {
  const sun = [4.7, 2.3, 3.2] as const
  const r = 0.95
  return (
    <IllustrationStage id="sun-cloud" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(3.7, 4.7, 1.5, 40)} fill={INK.faint} />
      </IsoPlatform>
      <Lathe cx={sun[0]} cy={sun[1]} z={sun[2] - r} profile={orb(r)} convex tone="accent" float={bob(props, 0.14)} lift={1}>
        <Rays at={sun} r={r * 1.5} len={0.5} />
      </Lathe>
      <Prism plane="left" at={[0, 3.9, 0]} points={cloud(3.8, 1.5, 1.4)} depth={1.25} tone="raised" hue={1} />
    </IllustrationStage>
  )
}

/** A raindrop, bottom up: round below, drawn up to a point. */
const DROP = [
  [0, 0],
  [0.25, 0.06],
  [0.37, 0.2],
  [0.38, 0.37],
  [0.31, 0.57],
  [0.19, 0.78],
  [0.07, 0.96],
  [0, 1.04],
] as const

/** Drops in the accent falling from a cloud toward the rings of a puddle. Hovered, they fall. */
export function IllustrationRain(props: IllustrationProps) {
  const drops = [
    [2.9, 3.5, 1.75],
    [4.1, 3.3, 1.25],
    [5.2, 3.2, 1.9],
    [3.6, 4.3, 0.95],
  ] as const
  return (
    <IllustrationStage id="rain" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(4.2, 4.9, 1.4, 40)} fill={INK.faint} />
        {[0.45, 0.9].map((r) => (
          <Mark key={r} plane="top" at={[0, 0, 0.55]} points={circle(4.2, 4.9, r, 32)} stroke={INK.line} closed />
        ))}
      </IsoPlatform>
      <Prism plane="left" at={[0, 2.4, 0]} points={cloud(4, 3.05, 1.35)} depth={1.3} tone="raised" hue={1} />
      <Group float={bob(props, 0.12)} lift={-0.6}>
        {drops.map(([x, y, z]) => (
          <Lathe key={`${x}-${y}`} cx={x} cy={y} z={z} profile={DROP} convex tone="accent" />
        ))}
      </Group>
    </IllustrationStage>
  )
}

/** A snowflake in plane units round (cu, cv): six arms `r` long and `w` either side of their line, each with a pair of branches. */
const flake = (cu: number, cv: number, r: number, w: number): PlanePoint[] => {
  const [c, s] = [Math.cos(0.9), Math.sin(0.9)]
  const [b, l] = [r * 0.5, r * 0.4]
  // One arm along +u, its near side out to the tip: where it leaves the hub, the branch, the tip.
  const side: PlanePoint[] = [
    [b - w * s + (w * (1 - c) * c) / s, -w],
    [b - w * s + l * c, -w * c - l * s],
    [b + (l + w) * c, -(l + w) * s],
    [b + w * s + l * c, w * c - l * s],
    [b + w * s + (w * (1 + c) * c) / s, -w],
    [r, -w],
  ]
  const arm: PlanePoint[] = [[w * Math.sqrt(3), -w], ...side, [r + w, 0], ...side.map(([u, v]) => [u, -v] as const).reverse()]
  return [0, 1, 2, 3, 4, 5].flatMap((k) => {
    const a = Math.PI / 2 + (k * Math.PI) / 3
    return arm.map(([u, v]) => [cu + u * Math.cos(a) - v * Math.sin(a), cv + u * Math.sin(a) + v * Math.cos(a)] as const)
  })
}

/** A snowflake in the accent over the snow lying on the ground. Hovered, it settles. */
export function IllustrationSnowflake(props: IllustrationProps) {
  return (
    <IllustrationStage id="snowflake" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <Lathe cx={4} cy={4} z={0.55} profile={[[2.45, 0], [2.3, 0.14], [1.85, 0.3], [1.1, 0.41], [0, 0.45]]} convex tone="raised" hue={1}>
        <Mark plane="top" at={[0, 0, 1]} points={circle(4, 4, 0.95, 36)} stroke={INK.line} dashed closed />
      </Lathe>
      <Prism plane="left" at={[0, 3.8, 0]} points={flake(4, 3.35, 1.6, 0.11)} depth={0.18} tone="accent" float={bob(props, 0.16)} lift={-0.5} />
    </IllustrationStage>
  )
}

/** A lightning bolt, top down: the wide top, the step, the point it strikes with. */
const BOLT: PlanePoint[] = [
  [-0.15, 2],
  [0.65, 2],
  [0.2, 1.15],
  [0.72, 1.15],
  [-0.42, -0.3],
  [0, 0.8],
  [-0.5, 0.8],
]

/** A storm cloud with a bolt in the accent out of it, and the ground it's about to hit. Hovered, it strikes. */
export function IllustrationLightning(props: IllustrationProps) {
  // The cloud's front face, its base, and where the bolt's point is aimed.
  const [front, base] = [3.6, 3.05]
  const [tu, tz] = [3.55, 0.95]
  return (
    <IllustrationStage id="lightning" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(tu, front + 0.15, 0.85, 32)} fill={INK.accent} opacity={0.18} />
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(tu, front + 0.15, 1.55, 40)} stroke={INK.line} dashed closed />
      </IsoPlatform>
      <Prism plane="left" at={[0, front - 1.3, 0]} points={cloud(4.1, base, 1.45)} depth={1.3} tone="neutral" hue={1} />
      <Prism
        plane="left"
        at={[0, front + 0.02, 0]}
        points={BOLT.map(([u, v]) => [tu + (u + 0.42) * 1.5, tz + (v + 0.3) * 0.88] as const)}
        depth={0.3}
        tone="accent"
        float={bob(props, 0.1)}
        lift={-0.38}
      />
    </IllustrationStage>
  )
}
