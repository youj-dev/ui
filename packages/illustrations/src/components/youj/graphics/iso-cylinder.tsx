'use client'

import { useId } from 'react'
import { cylinderExtent, cylinderShape, type IsoBounds } from './iso'
import { reachOf, type IsoShapeProps } from './iso-box'
import { IsoPiece, useIsoScene, type IsoShape } from './iso-scene'
import { faceClass } from './tones'

/* A cylinder standing in a square footprint (x..x+2r, y..y+2r): a lit top
 * ellipse over a side shaded from the left face's color to the right's, so
 * it reads round in the same light as the boxes beside it. A cylinder of no
 * height is a disc on a plane. The wireframe dashes the far half of its
 * base. */

export interface IsoCylinderProps extends IsoShapeProps {
  /** Radius in grid units; the footprint is 2r on a side. */
  r: number
  /** Height in grid units; 0 draws a disc. */
  h: number
}

function cylinderBounds({ x, y, z = 0, r, h }: IsoCylinderProps): IsoBounds {
  return { x, y, z, w: r * 2, d: r * 2, h }
}

const cylinderFit = (props: IsoCylinderProps, unit: number) => cylinderExtent({ x: props.x, y: props.y, z: props.z ?? 0, r: props.r, h: props.h + reachOf(props) }, unit)

function IsoCylinderImpl(props: IsoCylinderProps) {
  const { x, y, z = 0, r, h, tone, color, hue, variant = 'solid', hidden, float, lift, children, className, style, ...rest } = props
  const { unit } = useIsoScene()
  // An id that's safe inside url(#…).
  const shade = `kg-${useId().replace(/[^\w-]/g, '')}`
  const shape = cylinderShape({ x, y, z, r, h }, unit)
  const edge = variant === 'ghost' ? 'kg-edge kg-dash' : 'kg-edge'
  const colours = faceClass(tone, variant, color, hue)
  const { top } = shape
  return (
    <IsoPiece lift={lift} float={float}>
      <g data-slot="iso-cylinder" className={className ? `${colours.className} ${className}` : colours.className} style={colours.style || style ? { ...colours.style, ...style } : undefined} {...rest}>
        {h > 0 && (
          <>
            <defs>
              <linearGradient id={shade} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" style={{ stopColor: 'var(--kg-left)' }} />
                <stop offset="0.55" style={{ stopColor: 'var(--kg-left)' }} />
                <stop offset="1" style={{ stopColor: 'var(--kg-right)' }} />
              </linearGradient>
            </defs>
            {(hidden ?? variant !== 'solid') && <path d={shape.hidden} className="kg-hidden" />}
            <path d={shape.side} className={edge} style={{ fill: `url(#${shade})` }} />
          </>
        )}
        <ellipse cx={top.cx} cy={top.cy} rx={top.rx} ry={top.ry} className={`${edge} kg-top`} />
        {variant === 'solid' && (
          // The near rim catches the light.
          <path d={`M${top.cx - top.rx},${top.cy} A${top.rx},${top.ry} 0 0 0 ${top.cx + top.rx},${top.cy}`} className="kg-lit" />
        )}
        {children}
      </g>
    </IsoPiece>
  )
}

export const IsoCylinder = Object.assign(IsoCylinderImpl, { isoBounds: cylinderBounds, isoFit: cylinderFit }) as IsoShape<IsoCylinderProps>
