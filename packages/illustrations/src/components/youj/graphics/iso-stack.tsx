"use client";

import type { ReactNode } from "react";
import { m, useTransform, type MotionValue } from "motion/react";
import {
  axisStep,
  boxExtent,
  cylinderExtent,
  isoEllipse,
  project,
  type IsoBounds,
} from "./iso";
import { IsoBox } from "./iso-box";
import { CalloutMark } from "./iso-callout";
import { IsoCylinder } from "./iso-cylinder";
import { IsoPiece, useIsoScene, type IsoShape } from "./iso-scene";
import type { IsoHue, IsoTone, IsoVariant } from "./tones";

/* A stack of slabs or disks: a device, a layered system, a pile of tiers,
 * assembled at rest and taken apart by the scene's separation (`explode`),
 * each layer traveling in proportion to its height in the stack, so the top
 * goes furthest. Along z, each named layer gets a callout: a leader to the
 * scene's rail, beside the drawing, fading in as the layers part (when
 * they're together, the thing is one object and its parts aren't named).
 * Assembling, layers land bottom first. A `lit` layer takes the accent, its
 * leader solid; the rest can dim around it. */

export interface IsoStackLayer {
  id: string;
  /** Height in grid units. */
  h: number;
  /** Brings the footprint in on every side (a board inside its case), grid units. Default 0. */
  inset?: number;
  tone?: IsoTone;
  color?: string;
  /** One of the scene's colours (see IsoBox's `hue`). */
  hue?: IsoHue;
  variant?: IsoVariant;
  /** The callout's label, a mono capital eyebrow, and a quieter line under it. */
  label?: string;
  detail?: string;
  /** Emphasize this layer: the accent, a solid leader. */
  lit?: boolean;
  /** Drawn on the layer's top face, moving with it: chips, vents, a port. Gets the layer's top footprint in grid units. */
  content?: (top: {
    x: number;
    y: number;
    z: number;
    w: number;
    d: number;
  }) => ReactNode;
}

export interface IsoStackProps {
  x: number;
  y: number;
  z?: number;
  /** Footprint along x and y, grid units. Disks take the smaller as their diameter. */
  w: number;
  d: number;
  /** Bottom to top. */
  layers: readonly IsoStackLayer[];
  shape?: "box" | "disk";
  /** The distance each layer adds at full separation, grid units. Default 1.4. */
  gap?: number;
  /** The direction the layers part in. Callouts are drawn for z. Default 'z'. */
  axis?: "x" | "y" | "z";
  /** The layers' variant when they don't set one. Default 'solid'. */
  variant?: IsoVariant;
  /** Dim the other layers while one is lit. Default false. */
  dim?: boolean;
  className?: string;
}

function stackBounds({ x, y, z = 0, w, d, layers }: IsoStackProps): IsoBounds {
  return { x, y, z, w, d, h: layers.reduce((sum, l) => sum + l.h, 0) };
}

/** Its extent fully apart: the top layer has traveled (layers - 1) gaps along the axis. */
function stackFit(props: IsoStackProps, unit: number) {
  const b = stackBounds(props);
  const travel = Math.max(0, props.layers.length - 1) * (props.gap ?? 1.4);
  const axis = props.axis ?? "z";
  const apart = {
    ...b,
    w: b.w + (axis === "x" ? travel : 0),
    d: b.d + (axis === "y" ? travel : 0),
    h: b.h + (axis === "z" ? travel : 0),
  };
  return props.shape === "disk" && axis === "z"
    ? cylinderExtent(
        { x: b.x, y: b.y, z: b.z, r: Math.min(b.w, b.d) / 2, h: apart.h },
        unit,
      )
    : boxExtent(apart, unit);
}

const stackRail = (props: IsoStackProps) =>
  (props.axis ?? "z") === "z" && props.layers.some((l) => l.label);

function Layer({
  index,
  layer,
  base,
  props,
}: {
  index: number;
  layer: IsoStackLayer;
  base: number;
  props: IsoStackProps;
}) {
  const { unit, rtl, railX, parting } = useIsoScene();
  const {
    x,
    y,
    w,
    d,
    shape = "box",
    gap = 1.4,
    axis = "z",
    variant = "solid",
    dim,
  } = props;
  const inset = layer.inset ?? 0;
  const [lx, ly, lw, ld] = [x + inset, y + inset, w - inset * 2, d - inset * 2];
  const anyLit = props.layers.some((l) => l.lit);
  const faded = dim && anyLit && !layer.lit;
  const tone = layer.tone ?? (layer.lit ? "accent" : undefined);
  const layerVariant = layer.variant ?? variant;
  const top = { x: lx, y: ly, z: base + layer.h, w: lw, d: ld };

  // The leader leaves the layer's outermost point at half its height, on the side the labels read toward.
  let from: readonly [number, number];
  if (shape === "disk") {
    const r = Math.min(lw, ld) / 2;
    const e = isoEllipse(lx + r, ly + r, base + layer.h / 2, r, unit);
    from = [rtl ? e.cx - e.rx : e.cx + e.rx, e.cy];
  } else {
    from = rtl
      ? project(lx, ly + ld, base + layer.h / 2, unit)
      : project(lx + lw, ly, base + layer.h / 2, unit);
  }

  const shared = { z: base, tone, color: layer.color, hue: layer.hue, variant: layerVariant };
  const content = (named: MotionValue<number> | number) => (
    <>
      {/* Dimming quiets the shape only: its label keeps full contrast. */}
      <g style={{ opacity: faded ? 0.38 : 1 }}>
        {shape === "disk" ? (
          <IsoCylinder
            x={lx}
            y={ly}
            r={Math.min(lw, ld) / 2}
            h={layer.h}
            {...shared}
          >
            {layer.content?.(top)}
          </IsoCylinder>
        ) : (
          <IsoBox x={lx} y={ly} w={lw} d={ld} h={layer.h} {...shared}>
            {layer.content?.(top)}
          </IsoBox>
        )}
      </g>
      {axis === "z" && layer.label && (
        <CalloutMark
          from={from}
          toX={railX}
          label={layer.label}
          detail={layer.detail}
          lit={layer.lit}
          opacity={named}
        />
      )}
    </>
  );
  // Together (the scene has never parted): drawn in place, its label hidden, with no motion mounted.
  return (
    <IsoPiece delay={index}>
      {parting ? (
        <Apart travel={index * gap} axis={axis} id={layer.id} lit={layer.lit}>
          {content}
        </Apart>
      ) : (
        <g data-layer={layer.id} data-lit={layer.lit || undefined}>
          {content(0)}
        </g>
      )}
    </IsoPiece>
  );
}

/** A layer following the scene's separation: `travel` grid units along its axis when fully apart, its label fading in on the way. */
function Apart({
  travel,
  axis,
  id,
  lit,
  children,
}: {
  travel: number;
  axis: NonNullable<IsoStackProps["axis"]>;
  id: string;
  lit?: boolean;
  children: (named: MotionValue<number>) => ReactNode;
}) {
  const { unit, explode } = useIsoScene();
  const [sx, sy] = axisStep(axis, unit);
  const tx = useTransform(explode, (e) => e * travel * sx);
  const ty = useTransform(explode, (e) => e * travel * sy);
  // Named once they're apart, and only once there's room for two-line labels between them.
  const named = useTransform(explode, [0.55, 0.95], [0, 1]);
  return (
    <m.g style={{ x: tx, y: ty }} data-layer={id} data-lit={lit || undefined}>
      {children(named)}
    </m.g>
  );
}

function IsoStackImpl(props: IsoStackProps) {
  const { z = 0, layers, className } = props;
  let base = z;
  return (
    <g data-slot="iso-stack" className={className}>
      {layers.map((layer, i) => {
        const at = base;
        base += layer.h;
        return (
          <Layer
            key={layer.id}
            index={i}
            layer={layer}
            base={at}
            props={props}
          />
        );
      })}
    </g>
  );
}

export const IsoStack = Object.assign(IsoStackImpl, {
  isoBounds: stackBounds,
  isoFit: stackFit,
  isoRail: stackRail,
}) as IsoShape<IsoStackProps>;
