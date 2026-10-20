'use client'

import type { ReactNode } from 'react'
import { boxExtent, cylinderExtent, project, type IsoBounds } from './iso'
import { IsoBox, reachOf, type IsoShapeProps } from './iso-box'
import { IsoCylinder } from './iso-cylinder'
import { IsoPiece, useIsoScene, type IsoShape } from './iso-scene'

/* A plinth for a scene to stand on: a base slab and, inset from its edge, a
 * thinner plate on top, so the edge reads as a machined lip. A square plinth
 * can carry an engraved grid on its plate (the floor's own units, so shapes
 * placed on it line up with the lines). Children draw on the plate's top
 * face: ghost tiles for bays, marks, a label. */

export interface IsoPlatformProps extends Omit<IsoShapeProps, 'children'> {
  /** Footprint along x and y, grid units. A round plinth takes the smaller as its diameter. */
  w: number
  d: number
  /** The base slab's height. Default 0.5. */
  h?: number
  shape?: 'box' | 'round'
  /** How far the plate sits in from the base's edge. Default 0.35. */
  inset?: number
  /** The plate's height; 0 leaves a single slab. Default 0.2. */
  lip?: number
  /** Engrave the plate with a grid at this spacing (grid units), square plinths only. Default none. */
  grid?: number
  /** Drawn on the plate's top face. */
  children?: ReactNode
}

function platformBounds({ x, y, z = 0, w, d, h = 0.5, lip = 0.2 }: IsoPlatformProps): IsoBounds {
  return { x, y, z, w, d, h: h + lip }
}

function platformFit(props: IsoPlatformProps, unit: number) {
  const b = platformBounds(props)
  const h = b.h + reachOf(props)
  return props.shape === 'round' ? cylinderExtent({ x: b.x, y: b.y, z: b.z, r: Math.min(b.w, b.d) / 2, h }, unit) : boxExtent({ ...b, h }, unit)
}

function IsoPlatformImpl(props: IsoPlatformProps) {
  const { x, y, z = 0, w, d, h = 0.5, shape = 'box', inset = 0.35, lip = 0.2, grid, tone = 'sunken', children, float, lift, ...rest } = props
  const { unit } = useIsoScene()
  const top = z + h + lip
  const lines: [number, number, number, number][] = []
  if (grid && shape === 'box') {
    const [px, py, pw, pd] = [x + inset, y + inset, w - inset * 2, d - inset * 2]
    for (let gx = px + grid; gx < px + pw - 1e-6; gx += grid) lines.push([gx, py, gx, py + pd])
    for (let gy = py + grid; gy < py + pd - 1e-6; gy += grid) lines.push([px, gy, px + pw, gy])
  }
  const r = Math.min(w, d) / 2
  return (
    <IsoPiece lift={lift} float={float}>
      <g data-slot="iso-platform">
        {shape === 'round' ? (
          <>
            <IsoCylinder x={x} y={y} z={z} r={r} h={h} tone={tone} {...rest} />
            {lip > 0 && <IsoCylinder x={x + inset} y={y + inset} z={z + h} r={r - inset} h={lip} tone={tone} {...rest} />}
          </>
        ) : (
          <>
            <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} tone={tone} {...rest} />
            {lip > 0 && <IsoBox x={x + inset} y={y + inset} z={z + h} w={w - inset * 2} d={d - inset * 2} h={lip} tone={tone} {...rest} />}
          </>
        )}
        {lines.map(([ax, ay, bx, by], i) => {
          const a = project(ax, ay, top, unit)
          const b = project(bx, by, top, unit)
          return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="kg-line kg-groove" />
        })}
        {children}
      </g>
    </IsoPiece>
  )
}

export const IsoPlatform = Object.assign(IsoPlatformImpl, { isoBounds: platformBounds, isoFit: platformFit }) as IsoShape<IsoPlatformProps>
