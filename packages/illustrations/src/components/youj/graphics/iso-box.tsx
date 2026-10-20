'use client'

import type { CSSProperties, ReactNode, SVGProps } from 'react'
import { boxExtent, boxFaces, hiddenEdges, litEdges, toPoints, type IsoBounds } from './iso'
import { IsoPiece, useIsoScene, type IsoShape } from './iso-scene'
import { faceClass, type IsoHue, type IsoTone, type IsoVariant } from './tones'

/* A box: three shaded faces and hairline edges, the near top edges lit. The
 * wireframe draws faces as a breath of color and its three hidden edges
 * dashed; the ghost is only a dashed outline, a place something will go. A
 * box of no height is a tile on a plane (a chip on a board, a pad on a
 * floor). */

export interface IsoShapeProps extends Omit<SVGProps<SVGGElement>, 'x' | 'y' | 'z' | 'd' | 'r' | 'children' | 'ref'> {
  /** The near-origin corner, in grid units. */
  x: number
  y: number
  /** Height of its base above the floor. Default 0. */
  z?: number
  tone?: IsoTone
  /** Any CSS color for the faces (token references such as `var(--color-chart-2)` stay in step with the theme); it wins over `tone`. */
  color?: string
  /** One of the scene's colours: the faces take it when the scene has `colors`, and show `tone` otherwise. */
  hue?: IsoHue
  variant?: IsoVariant
  /** Draw the hidden edges, dashed. Default: true for a wireframe or a ghost. */
  hidden?: boolean
  /** Bob gently: true, or the bob's height in grid units. */
  float?: boolean | number
  /** Rise this far (grid units) at the scene's full separation. */
  lift?: number
  /** Drawn on the top face, moving with the shape: tiles, cylinders, marks. */
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

export interface IsoBoxProps extends IsoShapeProps {
  /** Size along x, y and z, in grid units. `h` 0 draws only the top: a tile. */
  w: number
  d: number
  h: number
}

function boxBounds({ x, y, z = 0, w, d, h }: IsoBoxProps): IsoBounds {
  return { x, y, z, w, d, h }
}

/** How far above its box a shape can reach: its lift at full separation and the top of its bob. */
export const reachOf = ({ lift = 0, float }: Pick<IsoShapeProps, 'lift' | 'float'>) => lift + (float === true ? 0.22 : float || 0)

function boxFit(props: IsoBoxProps, unit: number) {
  const b = boxBounds(props)
  return boxExtent({ ...b, h: b.h + reachOf(props) }, unit)
}

function IsoBoxImpl(props: IsoBoxProps) {
  const { x, y, z = 0, w, d, h, tone, color, hue, variant = 'solid', hidden, float, lift, children, className, style, ...rest } = props
  const { unit } = useIsoScene()
  const b = { x, y, z, w, d, h }
  const faces = boxFaces(b, unit)
  const dashedBack = hidden ?? variant !== 'solid'
  const edge = variant === 'ghost' ? 'kg-edge kg-dash' : 'kg-edge'
  const colours = faceClass(tone, variant, color, hue)
  return (
    <IsoPiece lift={lift} float={float}>
      <g data-slot="iso-box" className={className ? `${colours.className} ${className}` : colours.className} style={colours.style || style ? { ...colours.style, ...style } : undefined} {...rest}>
        {dashedBack && hiddenEdges(b, unit).map(([a, c], i) => <line key={i} x1={a[0]} y1={a[1]} x2={c[0]} y2={c[1]} className="kg-hidden" />)}
        {h > 0 && (
          <>
            <polygon points={toPoints(faces.left)} className={`${edge} kg-left`} />
            <polygon points={toPoints(faces.right)} className={`${edge} kg-right`} />
          </>
        )}
        <polygon points={toPoints(faces.top)} className={`${edge} kg-top`} />
        {variant === 'solid' && litEdges(b, unit).map(([a, c], i) => <line key={i} x1={a[0]} y1={a[1]} x2={c[0]} y2={c[1]} className="kg-lit" />)}
        {children}
      </g>
    </IsoPiece>
  )
}

export const IsoBox = Object.assign(IsoBoxImpl, { isoBounds: boxBounds, isoFit: boxFit }) as IsoShape<IsoBoxProps>
