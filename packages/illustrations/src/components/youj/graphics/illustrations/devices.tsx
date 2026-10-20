'use client'

import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { arc, band, bob, circle, flat, Group, IllustrationStage, INK, Lathe, Mark, Prism, rect, rounded, type IllustrationProps } from './kit'

/* Devices: the things people carry and keep on their desks. A phone with a
 * notification landing, a laptop with a window lifting off its screen, a
 * watch over its charger, a headset and the world it shows, a printer with
 * the page it just printed, and a drone climbing off its pad. */

/** A phone standing on its plinth, its home screen on, and a notification in the accent lifting off it. Hovered, it rises clear. */
export function IllustrationPhone(props: IllustrationProps) {
  const [x, y, z, w, h, d] = [2.6, 3.6, 0.55, 2.8, 4.7, 0.3]
  const face = [0, y + d, 0] as const
  const apps = [0, 1, 2].flatMap((c) => [0, 1, 2, 3].map((r) => [x + 0.52 + c * 0.66, z + 0.95 + r * 0.72] as const))
  const card = { u: x - 0.3, v: z + 3.05, w: w + 0.6, h: 0.9 }
  const front = [0, y + d + 0.42, 0] as const
  return (
    <IllustrationStage id="phone" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <Prism plane="left" at={[0, y, 0]} points={rounded(x, z, w, h, 0.45)} depth={d} tone="raised" hue={1}>
        <Mark plane="left" at={face} points={rounded(x + 0.16, z + 0.16, w - 0.32, h - 0.32, 0.32)} fill={INK.well} />
        <Mark plane="left" at={face} points={rounded(x + w / 2 - 0.38, z + h - 0.46, 0.76, 0.18, 0.09)} fill={INK.line} />
        <Mark plane="left" at={face} points={rect(x + w / 2 - 0.5, z + 0.36, 1, 0.07)} fill={INK.line} />
        {apps.map(([u, v]) => (
          <Mark key={`${u}-${v}`} plane="left" at={face} points={rounded(u, v, 0.44, 0.44, 0.12)} fill={INK.text} />
        ))}
      </Prism>
      <Prism plane="left" at={[0, y + d + 0.3, 0]} points={rounded(card.u, card.v, card.w, card.h, 0.3)} depth={0.12} tone="accent" float={bob(props, 0.14)} lift={0.8}>
        <Mark plane="left" at={front} points={circle(card.u + 0.45, card.v + card.h / 2, 0.22, 16)} fill={INK.onAccent} opacity={0.8} />
        <Mark plane="left" at={front} points={rect(card.u + 0.85, card.v + 0.5, 1.9, 0.13)} fill={INK.onAccent} opacity={0.7} />
        <Mark plane="left" at={front} points={rect(card.u + 0.85, card.v + 0.25, 1.2, 0.13)} fill={INK.onAccent} opacity={0.45} />
      </Prism>
    </IllustrationStage>
  )
}

/** A laptop open on its plinth, facing the other way from the call's, a window of code on its screen and one in the accent lifting off it. Hovered, it comes clear. */
export function IllustrationLaptop(props: IllustrationProps) {
  const [x, y, z, w, d] = [3, 1.7, 0.55, 3, 4.6]
  const deck = z + 0.18
  const lid = { x: x - 0.2, y, z: z + 0.05, w: 0.2, d, h: 3.1 }
  const screen = [x, y, lid.z] as const
  const code = [
    [0.4, 1.6],
    [0.8, 1.2],
    [0.8, 1.7],
    [0.4, 0.9],
    [0.4, 1.4],
  ] as const
  const card = { x: x + 0.3, u: y + 2.35, v: lid.z + 1.2, w: 1.9, h: 1.45 }
  const front = [card.x + 0.12, 0, 0] as const
  return (
    <IllustrationStage id="laptop" {...props}>
      <IsoPlatform x={0.6} y={0.8} w={6.8} d={6.4} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={0.18} tone="raised" hue={1}>
        {[0, 1, 2, 3].flatMap((r) =>
          Array.from({ length: 10 }, (_, c) => (
            <Mark key={`${r}-${c}`} plane="top" at={[x, y, deck]} points={rect(0.28 + r * 0.34, 0.35 + c * 0.39, 0.26, 0.3)} fill={INK.faint} />
          )),
        )}
        <Mark plane="top" at={[x, y, deck]} points={rect(1.8, 1.55, 0.95, 1.5)} fill={INK.faint} stroke={INK.line} />
      </IsoBox>
      <IsoBox {...lid} tone="raised" hue={1}>
        <Mark plane="right" at={screen} points={rect(0.2, 0.22, d - 0.4, lid.h - 0.42)} fill={INK.well} />
        {[0, 1, 2].map((i) => (
          <Mark key={i} plane="right" at={screen} points={circle(0.45 + i * 0.22, lid.h - 0.42, 0.07, 10)} fill={INK.line} />
        ))}
        {code.map(([indent, len], i) => (
          <Mark key={i} plane="right" at={screen} points={rect(indent, lid.h - 0.85 - i * 0.36, len, 0.13)} fill={INK.text} />
        ))}
      </IsoBox>
      <Prism plane="right" at={[card.x, 0, 0]} points={rounded(card.u, card.v, card.w, card.h, 0.18)} depth={0.12} tone="accent" float={bob(props, 0.14)} lift={0.8}>
        {[0, 1, 2].map((i) => (
          <Mark key={i} plane="right" at={front} points={circle(card.u + 0.25 + i * 0.2, card.v + card.h - 0.22, 0.06, 10)} fill={INK.onAccent} opacity={0.8} />
        ))}
        <Mark plane="right" at={front} points={[[card.u, card.v + card.h - 0.42], [card.u + card.w, card.v + card.h - 0.42]]} stroke={INK.onAccent} opacity={0.4} />
        <Mark plane="right" at={front} points={rect(card.u + 0.25, card.v + 0.55, 1.3, 0.14)} fill={INK.onAccent} opacity={0.7} />
        <Mark plane="right" at={front} points={rect(card.u + 0.25, card.v + 0.28, 0.85, 0.14)} fill={INK.onAccent} opacity={0.45} />
      </Prism>
    </IllustrationStage>
  )
}

/** A watch hovering over its charger, its strap up and down, and the ring on its screen closing in the accent. Hovered, it lifts off. */
export function IllustrationSmartwatch(props: IllustrationProps) {
  const [cx, cy] = [4, 4]
  const [u, v, w, h] = [2.8, 2.3, 2.4, 2.65]
  const face = [0, cy + 0.35, 0] as const
  const [ru, rv] = [u + w / 2, v + h / 2]
  return (
    <IllustrationStage id="smartwatch" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <IsoCylinder x={cx - 0.75} y={cy - 0.75} z={0.55} r={0.75} h={0.16} tone="raised">
        <Mark plane="top" at={[cx, cy, 0.71]} points={circle(0, 0, 0.45, 28)} fill={INK.faint} stroke={INK.line} />
      </IsoCylinder>
      <Group float={bob(props, 0.14)} lift={0.8}>
        <Prism plane="left" at={[0, cy - 0.22, 0]} points={rounded(u + 0.3, v + h - 0.4, w - 0.6, 1.3, 0.3)} depth={0.44} tone="neutral" hue={2} />
        <Prism plane="left" at={[0, cy - 0.22, 0]} points={rounded(u + 0.3, v - 0.9, w - 0.6, 1.3, 0.3)} depth={0.44} tone="neutral" hue={2}>
          {[0.35, 0.7].map((dv) => (
            <Mark key={dv} plane="left" at={[0, cy + 0.22, 0]} points={circle(u + w / 2, v - 0.9 + dv, 0.07, 10)} fill={INK.line} />
          ))}
        </Prism>
        <Prism plane="left" at={[0, cy - 0.35, 0]} points={rounded(u, v, w, h, 0.62)} depth={0.7} tone="raised" hue={1}>
          <Mark plane="left" at={face} points={rounded(u + 0.18, v + 0.18, w - 0.36, h - 0.36, 0.48)} fill={INK.well} />
          <Mark plane="left" at={face} points={arc(ru, rv, 0.72, Math.PI / 2, Math.PI / 2 - Math.PI * 1.55, 36)} stroke={INK.accent} weight={3.5} />
          <Mark plane="left" at={face} points={arc(ru, rv, 0.44, Math.PI / 2, Math.PI / 2 - Math.PI * 1.1, 28)} stroke={INK.line} weight={3} />
        </Prism>
        <Lathe axis="x" cx={u + w} cy={cy} z={v + h * 0.68} profile={[[0.17, 0], [0.17, 0.22]]} tone="neutral" />
      </Group>
    </IllustrationStage>
  )
}

/** The headset's strap: a loop round the back, seen from above. */
const STRAP = band(4, 3.35, 1.52, 1.72, Math.PI, Math.PI * 2, 18)

/** A headset resting on its plinth, and over it the world it shows: a wireframe cube in the accent. Hovered, the cube rises. */
export function IllustrationVrHeadset(props: IllustrationProps) {
  const [x, y, z, w, h, d] = [2.2, 3.35, 0.55, 3.6, 1.8, 1.35]
  const face = [0, y + d, 0] as const
  return (
    <IllustrationStage id="vr-headset" {...props}>
      <IsoPlatform x={1} y={1} w={6} d={6} h={0.4} lip={0.15} inset={0.4} shape="round" />
      <Prism plane="top" at={[0, 0, z + 0.55]} points={STRAP} depth={0.5} tone="neutral" hue={2} />
      <Prism plane="left" at={[0, y - 0.25, 0]} points={rounded(x + 0.25, z + 0.15, w - 0.5, h - 0.3, 0.6)} depth={0.25} tone="neutral" />
      <Prism plane="left" at={[0, y, 0]} points={rounded(x, z, w, h, 0.72)} depth={d} tone="raised" hue={1}>
        <Mark plane="left" at={face} points={rounded(x + 0.22, z + 0.22, w - 0.44, h - 0.44, 0.55)} fill={INK.well} />
        <Mark plane="left" at={face} points={[[x + 0.7, z + h - 0.5], [x + 1.6, z + h - 0.5]]} stroke={INK.line} weight={2} />
      </Prism>
      <IsoBox x={3.4} y={3.4} z={3.8} w={1.2} d={1.2} h={1.2} tone="accent" variant="wire" float={bob(props, 0.18)} lift={0.9} />
    </IllustrationStage>
  )
}

/** A printer with its paper standing in the feed, and the page it just printed on the tray in the accent. Hovered, the page lifts off. */
export function IllustrationPrinter(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.8, 2.3, 0.55, 4.4, 2.8, 1.75]
  const top = z + h
  const front = [x, y + d, z] as const
  const page = { x: x + 0.8, y: y + d, z: z + 0.52, w: w - 1.6, d: 1.5, h: 0.04 }
  return (
    <IllustrationStage id="printer" {...props}>
      <IsoPlatform x={0.6} y={0.9} w={6.8} d={6.2} h={0.4} lip={0.15} inset={0.3} grid={1} />
      {[0, 0.16].map((dy, i) => (
        <IsoBox key={dy} x={x + 0.7 + i * 0.1} y={y + 0.25 + dy} z={top} w={w - 1.4 - i * 0.2} d={0.06} h={1.3 - i * 0.15} tone={i ? 'raised' : 'neutral'} />
      ))}
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone="raised" hue={1}>
        <Mark plane="top" at={[x, y, top]} points={rect(0.6, 0.12, w - 1.2, 0.14)} fill={INK.well} />
        <Mark plane="top" at={[x, y, top]} points={rect(w - 1.3, d - 1.05, 0.9, 0.55)} fill={INK.well} stroke={INK.line} />
        {[0, 1].map((i) => (
          <Mark key={i} plane="top" at={[x, y, top]} points={circle(w - 1.9 - i * 0.42, d - 0.78, 0.13, 12)} fill={INK.faint} stroke={INK.line} />
        ))}
        <Mark plane="left" at={front} points={rect(0.6, 0.42, w - 1.2, 0.16)} fill={INK.well} />
        <Mark plane="left" at={front} points={[[0.25, h - 0.45], [w - 0.25, h - 0.45]]} stroke={INK.line} />
        <Mark plane="left" at={front} points={circle(w - 0.45, h - 0.85, 0.09, 10)} fill={INK.success} />
      </IsoBox>
      <IsoBox x={x + 0.55} y={y + d} z={z + 0.4} w={w - 1.1} d={1.35} h={0.06} tone="neutral" />
      <IsoBox {...page} tone="accent" float={bob(props, 0.1)} lift={0.9}>
        {[0.3, 0.55, 0.8].map((v, i) => (
          <Mark key={v} plane="top" at={[page.x, page.y, page.z + page.h]} points={rect(0.3, v, i === 2 ? 1.3 : 2.1, 0.12)} fill={INK.onAccent} opacity={0.6} />
        ))}
      </IsoBox>
    </IllustrationStage>
  )
}

/** Where the drone's four rotors sit, round its body. */
const ROTORS = [
  [1.95, 4],
  [4, 1.95],
  [6.05, 4],
  [4, 6.05],
] as const

/** A drone in the accent hovering over its landing pad, its rotors a blur. Hovered, it climbs. */
export function IllustrationDrone(props: IllustrationProps) {
  const [cx, cy, z] = [4, 4, 2.3]
  return (
    <IllustrationStage id="drone" {...props}>
      <IsoPlatform x={0.9} y={0.9} w={6.2} d={6.2} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[cx, cy, 0.55]} points={circle(0, 0, 1.55, 40)} stroke={INK.line} dashed closed />
        {[
          [flat(-0.55, -0.55), flat(-0.3, -0.55), flat(-0.3, 0.55), flat(-0.55, 0.55)],
          [flat(0.3, -0.55), flat(0.55, -0.55), flat(0.55, 0.55), flat(0.3, 0.55)],
          [flat(-0.3, -0.1), flat(0.3, -0.1), flat(0.3, 0.1), flat(-0.3, 0.1)],
        ].map((points, i) => (
          <Mark key={i} plane="top" at={[cx, cy, 0.55]} points={points} fill={INK.text} />
        ))}
      </IsoPlatform>
      <Group float={bob(props, 0.2)} lift={1}>
        {[
          [cx - 2.05, cy - 0.08, 2.05, 0.16],
          [cx - 0.08, cy - 2.05, 0.16, 2.05],
          [cx, cy - 0.08, 2.05, 0.16],
          [cx - 0.08, cy, 0.16, 2.05],
        ].map(([ax, ay, aw, ad]) => (
          <IsoBox key={`${ax}-${ay}`} x={ax!} y={ay!} z={z + 0.1} w={aw!} d={ad!} h={0.14} tone="raised" hue={1} />
        ))}
        {ROTORS.map(([rx, ry]) => (
          <IsoCylinder key={`m-${rx}-${ry}`} x={rx - 0.2} y={ry - 0.2} z={z} r={0.2} h={0.36} tone="raised" />
        ))}
        {ROTORS.map(([rx, ry]) => (
          <IsoCylinder key={`r-${rx}-${ry}`} x={rx - 0.88} y={ry - 0.88} z={z + 0.4} r={0.88} h={0} variant="wire" />
        ))}
        {[-0.45, 0.45].map((o) => (
          <IsoBox key={o} x={cx + o - 0.05} y={cy - 0.7} z={z - 0.55} w={0.1} d={1.4} h={0.08} tone="neutral" />
        ))}
        <Lathe cx={cx} cy={cy} z={z - 0.2} profile={[[0.62, 0], [0.8, 0.15], [0.82, 0.35], [0.66, 0.55], [0.36, 0.7], [0.02, 0.74]]} convex tone="accent" />
      </Group>
    </IllustrationStage>
  )
}
