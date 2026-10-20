'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { band, bob, Group, Hollow, IllustrationStage, INK, Link, Mark, Prism, rect, type IllustrationProps } from './kit'

/* Commerce: where people buy things. A shop front under its striped
 * awning, a bag with the day's find rising out of it, and parcels at the
 * end of their route. */

/** The awning's section, out from the wall and down: the sloped canopy and the valance hanging off its edge. */
const AWNING = [
  [0, 0.42],
  [0.62, 0.02],
  [0.62, -0.24],
  [0.72, -0.24],
  [0.72, 0.06],
  [0, 0.56],
] as const

/** A shop with its window and door, and over them an awning striped in the accent. Hovered, the awning rolls up. */
export function IllustrationStorefront(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.4, 1.8, 0.55, 4.8, 2.8, 3.3]
  const face = [x, y + d, z] as const
  const stripe = w / 6
  return (
    <IllustrationStage id="storefront" {...props}>
      <IsoPlatform x={0.6} y={1} w={6.8} d={6.2} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Mark plane="left" at={face} points={rect(0.3, 0.3, 2.7, 1.1)} fill={INK.faint} stroke={INK.line} />
        <Mark plane="left" at={face} points={[[1.65, 0.3], [1.65, 1.4]]} stroke={INK.line} />
        <Mark plane="left" at={face} points={rect(3.35, 0, 1.1, 1.45)} fill={INK.well} stroke={INK.line} />
        <Mark plane="left" at={face} points={rect(3.55, 0.65, 0.12, 0.3)} fill={INK.line} />
        <Mark plane="left" at={face} points={rect(0.3, 2.78, 2.4, 0.26)} fill={INK.text} />
        <Mark plane="right" at={[x + w, y, z]} points={rect(0.5, 1, 1.6, 1.2)} fill={INK.faint} stroke={INK.line} />
      </IsoBox>
      <Group float={bob(props, 0.05)} lift={0.55}>
        {Array.from({ length: 6 }, (_, i) => (
          <Prism key={i} plane="right" at={[x + i * stripe, y + d, z + 2.05]} points={AWNING} depth={stripe} tone={i % 2 ? 'raised' : 'accent'} />
        ))}
      </Group>
    </IllustrationStage>
  )
}

/** A bag's handle: a flat loop standing on its rim. */
const HANDLE = band(0, 0, 0.56, 0.7, 0, Math.PI, 14).map(([u, v]) => [u, v * 1.75] as const)

/** A shopping bag, handles up, and the day's find rising out of it in the accent. */
export function IllustrationShoppingBag(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [2.2, 3, 0.55, 3.6, 1.8, 2.5]
  const top = z + h
  const item = { x: x + 2.05, y: y + 0.4, z: top - 1.1, w: 1.3, d: 0.95, h: 1.95 }
  return (
    <IllustrationStage id="shopping-bag" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Hollow x={x + 0.08} y={y + 0.08} top={top} w={w - 0.16} d={d - 0.16} depth={h - 0.3} />
      </IsoBox>
      <Prism plane="left" at={[x + w / 2, y + 0.1, top]} points={HANDLE} depth={0.08} tone="raised" hue={1} />
      <IsoBox {...item} tone="accent" float={bob(props, 0.14)} lift={1.1}>
        <Mark plane="left" at={[item.x, item.y + item.d, item.z]} points={rect(0.3, item.h - 0.55, 0.9, 0.16)} fill={INK.onAccent} opacity={0.7} />
      </IsoBox>
      {/* The bag's front walls again, over the lower part of what's in it. */}
      <IsoBox x={x} y={y + d - 0.02} z={z} w={w} d={0.02} h={h} tone="raised" hue={1}>
        <Mark plane="left" at={[x, y + d, z]} points={rect(1.05, 0.7, 1.5, 0.9)} fill={INK.faint} />
      </IsoBox>
      <IsoBox x={x + w - 0.02} y={y} z={z} w={0.02} d={d - 0.02} h={h} tone="raised" hue={1} />
      <Prism plane="left" at={[x + w / 2, y + d - 0.12, top]} points={HANDLE} depth={0.08} tone="raised" hue={1} />
    </IllustrationStage>
  )
}

/** Parcels stacked at the end of their dashed route across the floor, taped and labeled, the newest landing on top in the accent. */
export function IllustrationDelivery(props: IllustrationProps) {
  const zt = 0.56
  const [x, y, z, w, d, h] = [3.6, 3.2, 0.55, 2.6, 2.3, 1.45]
  const top = z + h
  const parcel = { x: 3.95, y: 3.55, z: top + 0.2, w: 1.8, d: 1.5, h: 0.95 }
  return (
    <IllustrationStage id="delivery" {...props}>
      <IsoPlatform x={0.5} y={0.7} w={7} d={6.6} h={0.4} lip={0.15} inset={0.3} grid={1}>
        <Link points={[[1.5, 1.6, zt], [1.5, 4.35, zt], [3.5, 4.35, zt]]} lit dashed />
      </IsoPlatform>
      <IsoCylinder x={1.1} y={1.2} z={0.55} r={0.4} h={0.14} tone="raised">
        <Mark plane="top" at={[1.5, 1.6, 0.69]} points={rect(-0.12, -0.12, 0.24, 0.24)} fill={INK.accent} />
      </IsoCylinder>
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Mark plane="top" at={[x, y, top]} points={rect(0, d / 2 - 0.22, w, 0.44)} fill={INK.faint} />
        <Mark plane="right" at={[x + w, y, z]} points={rect(d / 2 - 0.22, h - 0.6, 0.44, 0.6)} fill={INK.faint} />
        <Mark plane="left" at={[x, y + d, z]} points={rect(0.3, 0.3, 1.2, 0.72)} fill={INK.faint} stroke={INK.line} />
        {[0.78, 0.55].map((v, i) => (
          <Mark key={v} plane="left" at={[x, y + d, z]} points={rect(0.45, v, i ? 0.55 : 0.85, 0.1)} fill={INK.text} />
        ))}
      </IsoBox>
      <IsoBox x={1.9} y={5.2} z={z} w={1.2} d={1.1} h={0.75} tone="neutral" hue={1}>
        <Mark plane="top" at={[1.9, 5.2, z + 0.75]} points={rect(0.44, 0, 0.32, 1.1)} fill={INK.faint} />
      </IsoBox>
      <IsoBox {...parcel} tone="accent" float={bob(props, 0.16)} lift={0.9}>
        <Mark plane="top" at={[parcel.x, parcel.y, parcel.z + parcel.h]} points={rect(parcel.w / 2 - 0.18, 0, 0.36, parcel.d)} fill={INK.onAccent} opacity={0.35} />
        <Mark plane="left" at={[parcel.x, parcel.y + parcel.d, parcel.z]} points={rect(parcel.w / 2 - 0.18, parcel.h - 0.4, 0.36, 0.4)} fill={INK.onAccent} opacity={0.35} />
      </IsoBox>
    </IllustrationStage>
  )
}
