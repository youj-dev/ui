'use client'

import type { ReactNode } from 'react'
import { project, toPoints } from '../iso'
import { IsoBox } from '../iso-box'
import { IsoCylinder } from '../iso-cylinder'
import { IsoPlatform } from '../iso-platform'
import { IsoPiece, useIsoScene, type IsoShape } from '../iso-scene'
import { faceClass, type IsoHue, type IsoTone } from '../tones'
import { bob, circle, Group, IllustrationStage, INK, Lathe, Mark, rect, type IllustrationProps } from './kit'

/* The app: the screens people spend their day in. A letter rising out of its
 * envelope, a month with today lit, pages fanned on edge, a chart whose last
 * bar leads, a lens over the one match, and a bell with its badge. */

/** Lines of text on a top face, from its corner: the first one longest. */
function Lines({ at, count, width, gap = 0.42, from = 0.4 }: { at: readonly [number, number, number]; count: number; width: number; gap?: number; from?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Mark key={i} plane="top" at={at} points={rect(0.35, from + i * gap, width * (i === count - 1 ? 0.6 : 1), 0.14)} fill={INK.text} />
      ))}
    </>
  )
}

/** An envelope standing open, and the letter in the accent rising out of it. Hovered, it lifts clear. */
export function IllustrationMail(props: IllustrationProps) {
  const [x, y, z, w, h] = [1.8, 3.4, 0.55, 4.4, 2.6]
  const front = [x, y + 0.36, z] as const
  const letter = { x: x + 0.45, y: y + 0.14, z: z + 0.8, w: w - 0.9, h: 2.5 }
  return (
    <IllustrationStage id="mail" {...props}>
      <IsoPlatform x={0.9} y={1.1} w={6.2} d={5.8} h={0.4} lip={0.15} inset={0.3} grid={1} />
      <IsoBox x={x} y={y} z={z} w={w} d={0.12} h={h} hue={1} />
      <IsoBox {...letter} d={0.06} tone="accent" float={bob(props, 0.16)} lift={1}>
        {[0.45, 0.85].map((v, i) => (
          <Mark key={v} plane="left" at={[letter.x, letter.y + 0.06, letter.z]} points={rect(0.35, letter.h - v, i ? 1.6 : 2.4, 0.16)} fill={INK.onAccent} opacity={0.7} />
        ))}
      </IsoBox>
      <IsoBox x={x} y={y + 0.24} z={z} w={w} d={0.12} h={h} hue={1}>
        <Mark plane="left" at={front} points={[[0, h], [w / 2, h * 0.42], [w, h]]} fill={INK.faint} stroke={INK.line} />
        <Mark plane="left" at={front} points={[[0, 0], [w * 0.38, h * 0.36]]} stroke={INK.line} />
        <Mark plane="left" at={front} points={[[w, 0], [w * 0.62, h * 0.36]]} stroke={INK.line} />
      </IsoBox>
    </IllustrationStage>
  )
}

/** A month on an easel with today in the accent, and the day's one event lifting off it. */
export function IllustrationCalendar(props: IllustrationProps) {
  const [x, y, z, w, d, h] = [1.5, 3.2, 0.55, 4.9, 0.36, 3.3]
  const face = [x, y + d, z] as const
  const days = Array.from({ length: 15 }, (_, i) => [i % 5, Math.floor(i / 5)] as const)
  return (
    <IllustrationStage id="calendar" {...props}>
      <IsoPlatform x={0.8} y={1.2} w={6.4} d={5.6} h={0.4} lip={0.15} inset={0.3} />
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} hue={1}>
        <Mark plane="left" at={face} points={rect(0.25, h - 0.75, w - 0.5, 0.5)} fill={INK.text} />
        {days.map(([c, r]) => (
          <Mark key={`${c}-${r}`} plane="left" at={face} points={rect(0.3 + c * 0.88, 0.3 + r * 0.72, 0.66, 0.52)} fill={c === 3 && r === 1 ? INK.accent : INK.faint} />
        ))}
        {[1.2, 3.7].map((u) => (
          <IsoCylinder key={u} x={x + u} y={y + 0.04} z={z + h} r={0.14} h={0.34} tone="raised" />
        ))}
      </IsoBox>
      <IsoBox x={4.3} y={4.4} z={1.7} w={1.9} d={1.1} h={0.12} tone="accent" float={bob(props, 0.14)} lift={0.8}>
        <Mark plane="top" at={[4.3, 4.4, 1.82]} points={rect(0.25, 0.3, 1.2, 0.14)} fill={INK.onAccent} opacity={0.7} />
        <Mark plane="top" at={[4.3, 4.4, 1.82]} points={rect(0.25, 0.62, 0.8, 0.14)} fill={INK.onAccent} opacity={0.45} />
      </IsoBox>
    </IllustrationStage>
  )
}

interface SheetProps {
  x: number
  y: number
  z: number
  w: number
  h: number
  /** The folded corner's size, grid units. */
  fold?: number
  tone?: IsoTone
  hue?: IsoHue
  float?: boolean | number
  lift?: number
  children?: ReactNode
}

/** A sheet of paper standing on edge, facing +y, its top corner folded over. */
function SheetImpl({ x, y, z, w, h, fold = 0.75, tone = 'raised', hue, float, lift, children }: SheetProps) {
  const { unit } = useIsoScene()
  const p = (u: number, v: number) => project(x + u, y, z + v, unit)
  return (
    <IsoPiece float={float} lift={lift}>
      <g {...faceClass(tone, 'solid', undefined, hue)}>
        <polygon points={toPoints([p(0, 0), p(w, 0), p(w, h - fold), p(w - fold, h), p(0, h)])} className="kg-edge" style={{ fill: 'var(--kg-left)' }} />
        <polygon points={toPoints([p(w - fold, h), p(w - fold, h - fold), p(w, h - fold)])} className="kg-edge" style={{ fill: 'var(--kg-right)' }} />
        {children}
      </g>
    </IsoPiece>
  )
}

const Sheet = Object.assign(SheetImpl, { isoBounds: ({ x, y, z, w, h }: SheetProps) => ({ x, y, z, w, d: 0.02, h }) }) as IsoShape<SheetProps>

/** Three pages fanned out on edge, the front one lifting, its corner folded and its title in the accent. */
export function IllustrationDocuments(props: IllustrationProps) {
  const [w, h] = [2.9, 3.4]
  return (
    <IllustrationStage id="documents" {...props}>
      <IsoPlatform x={0.6} y={0.9} w={6.8} d={6.2} h={0.4} lip={0.15} inset={0.3} grid={1} />
      {[0, 1, 2].map((i) => {
        const [x, y, z] = [0.9 + i * 1.25, 2.9 + i * 0.6, 0.55]
        const front = i === 2
        return (
          <Sheet key={i} x={x} y={y} z={z} w={w} h={h} tone={front ? 'raised' : 'neutral'} hue={front ? undefined : 1} float={front ? bob(props, 0.14) : false} lift={i * 0.45}>
            {front && (
              <>
                <Mark plane="left" at={[x, y, z]} points={rect(0.35, h - 0.8, 1.3, 0.26)} fill={INK.accent} />
                {[0, 1, 2, 3, 4].map((r) => (
                  <Mark key={r} plane="left" at={[x, y, z]} points={rect(0.35, h - 1.3 - r * 0.42, r === 4 ? 1.3 : 2.2, 0.14)} fill={INK.text} />
                ))}
              </>
            )}
          </Sheet>
        )
      })}
    </IllustrationStage>
  )
}

const BARS = [0.8, 1.3, 1.05, 1.75, 2.45] as const

/** Bars in front of a gridded back wall, rising to the last in the accent, with its reading hovering over it. */
export function IllustrationAnalytics(props: IllustrationProps) {
  const z = 0.55
  return (
    <IllustrationStage id="analytics" {...props}>
      <IsoPlatform x={0.5} y={1.2} w={7} d={5.8} h={0.4} lip={0.15} inset={0.3} />
      <IsoBox x={0.9} y={2.1} z={z} w={6.2} d={0.2} h={2.9} tone="sunken">
        {[0.7, 1.4, 2.1].map((v) => (
          <Mark key={v} plane="left" at={[0.9, 2.3, z]} points={[[0.2, v], [6, v]]} stroke={INK.line} dashed />
        ))}
      </IsoBox>
      {BARS.map((h, i) => (
        <IsoBox key={i} x={1.2 + i * 1.2} y={3.6} z={z} w={0.8} d={0.8} h={h} tone={i === BARS.length - 1 ? 'accent' : 'raised'} hue={1} lift={i === BARS.length - 1 ? 0.5 : 0} />
      ))}
      <IsoBox x={5.6} y={3.5} z={z + 3.15} w={1.4} d={0.9} h={0.12} tone="raised" float={bob(props, 0.12)} lift={0.9}>
        <Mark plane="top" at={[5.6, 3.5, z + 3.27]} points={rect(0.22, 0.25, 0.95, 0.14)} fill={INK.accent} />
        <Mark plane="top" at={[5.6, 3.5, z + 3.27]} points={rect(0.22, 0.52, 0.6, 0.12)} fill={INK.text} />
      </IsoBox>
    </IllustrationStage>
  )
}

const CARDS = [
  [1, 1.2],
  [3.1, 1.2],
  [5.2, 1.2],
  [1, 4.3],
  [5.2, 4.3],
] as const

/** Results laid out on the desk and a lens hovering over the one that matches, lit in the accent. */
export function IllustrationSearch(props: IllustrationProps) {
  const z = 0.55
  return (
    <IllustrationStage id="search" {...props}>
      <IsoPlatform x={0.4} y={0.5} w={7.2} d={7} h={0.4} lip={0.15} inset={0.3} />
      {CARDS.map(([x, y]) => (
        <IsoBox key={`${x}-${y}`} x={x} y={y} z={z} w={1.8} d={2.6} h={0.1} tone="raised" hue={1}>
          <Lines at={[x, y, z + 0.1]} count={3} width={1.1} />
        </IsoBox>
      ))}
      <IsoBox x={3.1} y={4.3} z={z} w={1.8} d={2.6} h={0.1} tone="accent">
        <Mark plane="top" at={[3.1, 4.3, z + 0.1]} points={rect(0.35, 0.4, 1.1, 0.14)} fill={INK.onAccent} opacity={0.75} />
        <Mark plane="top" at={[3.1, 4.3, z + 0.1]} points={rect(0.35, 0.82, 0.7, 0.14)} fill={INK.onAccent} opacity={0.5} />
      </IsoBox>
      <Group float={bob(props, 0.18)} lift={0.9}>
        <IsoCylinder x={2.85} y={4.45} z={2.2} r={1.15} h={0.22} tone="accent" variant="wire" hidden={false} />
        <IsoBox x={5.15} y={5.42} z={2.2} w={1.5} d={0.36} h={0.22} tone="accent" />
      </Group>
    </IllustrationStage>
  )
}

/** A bell's outline, bottom up: its radius at each height, grid units. */
const BELL = [
  [1.6, 0],
  [1.52, 0.1],
  [1.3, 0.24],
  [1.18, 0.5],
  [1.1, 0.95],
  [1.02, 1.35],
  [0.9, 1.62],
  [0.72, 1.84],
  [0.5, 1.98],
  [0.3, 2.04],
] as const

/** A bell hovering over its plinth, the ring of its ping on the floor, and its badge in the accent. */
export function IllustrationNotifications(props: IllustrationProps) {
  const base = 1.15
  return (
    <IllustrationStage id="notifications" {...props}>
      <IsoPlatform x={0.7} y={0.7} w={6.6} d={6.6} h={0.4} lip={0.15} inset={0.4} shape="round">
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(4, 4, 2.55, 48)} stroke={INK.line} dashed closed />
        <Mark plane="top" at={[0, 0, 0.55]} points={circle(4, 4, 1.6, 40)} fill={INK.faint} />
      </IsoPlatform>
      <Group float={bob(props, 0.18)} lift={0.8}>
        <IsoCylinder x={3.64} y={3.64} z={base - 0.36} r={0.36} h={0.36} tone="raised" />
        <Lathe cx={4} cy={4} z={base} profile={BELL} tone="raised" hue={1} />
        <IsoCylinder x={3.82} y={3.82} z={base + 2.04} r={0.18} h={0.24} tone="raised" />
      </Group>
      <IsoCylinder x={4.45} y={2.65} z={3.05} r={0.5} h={0.24} tone="accent" float={bob(props, 0.12)} lift={1.3} />
    </IllustrationStage>
  )
}
