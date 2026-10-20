'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { arc, band, bob, circle, Group, Hollow, IllustrationStage, INK, Lathe, Link, Mark, orb, Prism, rounded, type IllustrationProps, type PlanePoint } from './kit'

/* Pets: the ones waiting at home. A kennel with its roof about to lift, a
 * goldfish leaping from its bowl, a treat dropping into a bowl of kibble,
 * and a cat tree with its toy swinging on a string. */

/** A dog bone in plane units, centered on (cu, cv), `s` long: a shaft between two round knuckles at each end. */
const bone = (cu: number, cv: number, s: number): PlanePoint[] =>
  [...arc(0.38, 0.12, 0.14, 3.43, -1.03, 10), ...arc(0.38, -0.12, 0.14, 1.03, -3.43, 10), ...arc(-0.38, -0.12, 0.14, 0.29, -4.17, 10), ...arc(-0.38, 0.12, 0.14, -2.11, -6.57, 10)].map(
    ([u, v]) => [cu + u * s, cv + v * s] as const,
  )

/** A kennel with its arched door, a bone on its gable and its roof in the accent. Hovered, the roof lifts to show inside. */
export function IllustrationDogHouse(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [2.4, 2.2, 0.55, 3.2, 3.3, 1.9]
  const top = z + h
  const face = [x, y + d, z] as const
  const [eave, ridge] = [0.35, 1.55]
  const door: PlanePoint[] = [[w / 2 + 0.6, 0], ...arc(w / 2, 0.95, 0.6, 0, Math.PI, 14), [w / 2 - 0.6, 0]]
  return (
    <IllustrationStage id="dog-house" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Hollow x={x + 0.15} y={y + 0.15} top={top} w={w - 0.3} d={d - 0.3} depth={h - 0.25} />
        <Mark plane="left" at={face} points={door} fill={INK.well} stroke={INK.line} />
        {[0.5, 0.95, 1.4].map((v) => (
          <Mark key={v} plane="right" at={[x + w, y, z]} points={[[0.12, v], [d - 0.12, v]]} stroke={INK.line} />
        ))}
      </IsoBox>
      <Prism plane="left" at={[x, y - 0.2, top]} points={[[-eave, 0], [w + eave, 0], [w / 2, ridge]]} depth={d + 0.4} tone="accent" float={bob(props, 0.06)} lift={1}>
        <Mark plane="left" at={[0, y + d + 0.2, 0]} points={bone(x + w / 2, top + 0.5, 1.4)} fill={INK.onAccent} opacity={0.7} />
      </Prism>
      <Lathe cx={1.9} cy={6} z={0.55} profile={orb(0.34)} convex tone="neutral" hue={2} />
    </IllustrationStage>
  )
}

/** A fish in plane units, nose along +u: an oval body and a forked tail. */
const fish = (cu: number, cv: number, s: number): PlanePoint[] => [
  ...arc(0, 0, 1, 0.5 - Math.PI, Math.PI - 0.5, 20).map(([a, b]) => [cu + a * 0.7 * s, cv + b * 0.42 * s] as const),
  [cu - 1.05 * s, cv + 0.42 * s],
  [cu - 0.88 * s, cv],
  [cu - 1.05 * s, cv - 0.42 * s],
]

/** The water in the bowl, bottom up, and the clear glass above it up to the rim. */
const WATER = [[0.85, 0], [1.3, 0.25], [1.58, 0.7], [1.65, 1.15], [1.58, 1.5]] as const
const GLASS = [[1.58, 0], [1.52, 0.15], [1.32, 0.45], [1.08, 0.65]] as const

/** Toward the scheme's light in either scheme: a glint on glass. */
const SHINE = 'color-mix(in oklab, var(--color-surface) calc(100% - 100% * var(--yj-dark)), var(--color-fg))'

/** A glass bowl of water, a ripple on it, and a goldfish in the accent swimming inside. Hovered, it leaps out. */
export function IllustrationFishBowl(props: IllustrationProps) {
  const [cx, cy, z] = [4, 4, 0.6]
  const [surface, rim] = [z + 1.5, z + 2.15]
  return (
    <IllustrationStage id="fish-bowl" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <Lathe cx={cx} cy={cy} z={z} profile={WATER} convex tone="neutral" hue={1}>
        <Mark plane="top" at={[cx, cy, surface]} points={circle(0, 0, 0.7, 28)} stroke={INK.line} closed />
      </Lathe>
      {/* The clear glass above the waterline and its rim, drawn before the fish so it stays crisp and leaps clear of them. */}
      <g style={{ opacity: 0.4 }}>
        <Group delay={1}>
          <Lathe cx={cx} cy={cy} z={surface} profile={GLASS} convex tone="raised" />
        </Group>
      </g>
      <g>
        <Group delay={2}>
          <Prism plane="top" at={[0, 0, rim]} points={band(cx, cy, 0.96, 1.1, -Math.PI / 2, (3 * Math.PI) / 2, 40)} depth={0.06} tone="raised">
            <Mark plane="left" at={[0, cy, 0]} points={arc(cx, z + 1.05, 1.3, 2.3, 2.95, 10)} stroke={SHINE} weight={2} opacity={0.75} />
          </Prism>
        </Group>
      </g>
      <Prism plane="left" at={[0, cy + 0.25, 0]} points={fish(cx + 0.25, z + 0.85, 1)} depth={0.22} tone="accent" float={bob(props, 0.14)} lift={2}>
        <Mark plane="left" at={[0, cy + 0.47, 0]} points={circle(cx + 0.62, z + 0.95, 0.08, 12)} fill={INK.onAccent} />
      </Prism>
    </IllustrationStage>
  )
}

/** A food bowl of kibble and a water bowl on their mat, and a bone-shaped treat in the accent over the food. Hovered, it drops in. */
export function IllustrationPetBowl(props: IllustrationProps) {
  const [cx, cy, z] = [5, 3.65, 0.65]
  const rim = z + 0.8
  const kibble = [[-0.5, -0.3], [0.1, -0.55], [0.55, -0.1], [-0.15, 0.1], [0.35, 0.45], [-0.55, 0.35], [0.7, -0.6], [-0.2, 0.7]] as const
  const water = [3, 4.85] as const
  return (
    <IllustrationStage id="pet-bowl" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <Prism plane="top" at={[0, 0, 0.55]} points={rounded(1.5, 1.8, 5.4, 4.6, 0.5)} depth={0.1} tone="sunken">
        {[[0, 0, 0.3], [-0.42, -0.34, 0.13], [-0.12, -0.52, 0.13], [0.22, -0.46, 0.13], [0.44, -0.2, 0.13]].map(([u, v, r]) => (
          <Mark key={`${u}${v}`} plane="top" at={[2.5, 2.9, z]} points={circle(u!, v!, r!, 16)} fill={INK.faint} />
        ))}
      </Prism>
      <Lathe cx={water[0]} cy={water[1]} z={z} profile={[[0.72, 0], [0.78, 0.06], [0.98, 0.45], [1.06, 0.6]]} convex tone="raised" hue={1}>
        <Mark plane="top" at={[water[0], water[1], z + 0.6]} points={circle(0, 0, 0.9, 32)} fill={INK.well} />
        <Mark plane="top" at={[water[0], water[1], z + 0.6]} points={circle(0, 0, 0.45, 24)} stroke={INK.line} closed />
      </Lathe>
      <Lathe cx={cx} cy={cy} z={z} profile={[[1, 0], [1.08, 0.08], [1.32, 0.55], [1.45, 0.8]]} convex tone="raised" hue={1}>
        <Mark plane="top" at={[cx, cy, rim]} points={circle(0, 0, 1.28, 40)} fill={INK.well} />
        {kibble.map(([u, v]) => (
          <Mark key={`${u}${v}`} plane="top" at={[cx, cy, rim]} points={circle(u, v, 0.15, 10)} fill={INK.text} stroke={INK.line} />
        ))}
      </Lathe>
      <Prism plane="left" at={[0, cy - 0.15, 0]} points={bone(cx, rim + 1.35, 2)} depth={0.3} tone="accent" float={bob(props, 0.14)} lift={-0.95} />
    </IllustrationStage>
  )
}

/** A cat sitting, bottom up: haunches narrowing to the shoulders. */
const CAT = [[0.5, 0], [0.56, 0.16], [0.53, 0.4], [0.42, 0.64], [0.28, 0.8], [0.18, 0.86]] as const

/** A cat tree: a cubby, a post wound in sisal, the cat up on the top deck and its toy in the accent hanging below. Hovered, it's batted up. */
export function IllustrationCatTree(props: IllustrationProps) {
  const [floor, deck] = [0.85, 3.4]
  const post = { x: 4.75, y: 2.75, w: 0.55 }
  const top = deck + 0.25
  const [cx, cy] = [5.05, 3.05]
  const toy = [6.2, 3.35, 1.8] as const
  const sisal = Array.from({ length: 8 }, (_, i) => 0.3 + i * 0.3)
  return (
    <IllustrationStage id="cat-tree" {...props}>
      <IsoPlatform x={0.6} y={0.6} w={6.8} d={6.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={1.9} y={2.2} z={0.55} w={4.4} d={3.9} h={floor - 0.55} tone="neutral" />
      <IsoBox x={2.2} y={4} z={floor} w={2.2} d={1.8} h={1.4} tone="raised" hue={1}>
        <Mark plane="left" at={[2.2, 5.8, floor]} points={circle(1.1, 0.66, 0.46, 24)} fill={INK.well} stroke={INK.line} />
      </IsoBox>
      <IsoBox x={post.x} y={post.y} z={floor} w={post.w} d={post.w} h={deck - floor} tone="raised" hue={2}>
        {sisal.map((v) => (
          <g key={v}>
            <Mark plane="left" at={[post.x, post.y + post.w, floor]} points={[[0.04, v], [post.w - 0.04, v]]} stroke={INK.line} />
            <Mark plane="right" at={[post.x + post.w, post.y, floor]} points={[[0.04, v], [post.w - 0.04, v]]} stroke={INK.line} />
          </g>
        ))}
      </IsoBox>
      <Lathe cx={toy[0]} cy={toy[1]} z={toy[2]} profile={orb(0.36)} convex tone="accent" float={bob(props, 0.14)} lift={0.8}>
        <Link points={[[toy[0], toy[1], toy[2] + 0.72], [toy[0], toy[1], deck + 0.15]]} />
      </Lathe>
      <IsoBox x={3.85} y={1.85} z={deck} w={2.5} d={2.4} h={0.25} tone="raised" hue={1}>
        <IsoCylinder x={cx - 0.85} y={cy - 0.85} z={top} r={0.85} h={0.12} tone="neutral" />
      </IsoBox>
      <Group>
        <Lathe cx={cx} cy={cy} z={top + 0.12} profile={CAT} convex tone="raised" />
        <Lathe cx={cx} cy={cy} z={top + 0.84} profile={orb(0.42)} convex tone="raised" />
        {[-1, 1].map((s) => (
          <Prism key={s} plane="left" at={[0, cy - 0.05, 0]} points={[[cx + s * 0.08, top + 1.58], [cx + s * 0.38, top + 1.4], [cx + s * 0.32, top + 1.98]]} depth={0.1} tone="raised" />
        ))}
      </Group>
    </IllustrationStage>
  )
}
