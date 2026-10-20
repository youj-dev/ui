'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, span, Depth, point, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'measure',
  title: 'Measure',
  category: 'interface',
  technique: 'lines',
  tags: ['dimension', 'crop marks', 'resize', 'frame', 'blueprint', 'artboard', 'layout'],
  description: 'An artboard on a drafting table, with crop marks at its corners and dimension lines along two sides, is resized from its accent handle; the measurements follow it as it goes.',
  order: 5,
  colors: [{ part: 'Dimensions', mono: 'ink' }],
} satisfies LoaderMeta

/* The board lies in perspective on a drafting table's dot grid, seen from
 * above: a sheet with a small layout on it (a header, an image block, lines
 * of text, a button) and print crop marks off each corner. A dimension line
 * runs along its top and down its right side, each with extension lines and
 * slanted ticks, as an architect draws them, and its figure written in
 * segment digits. The resize cursor grips the accent handle at the
 * bottom-right corner and drags the board out, in, and home again
 * (`emphasized`), every landing on the grid, where a snap guide flashes
 * through the edge that landed; the layout reflows and the figures count as
 * it goes. Then the cursor lets go and backs off. The same size at both ends
 * of the loop.
 *
 * Color: the dimensions, their lines, ticks and figures, are `c1`, as a redline is; the frame, its content and the cursor keep the ink, the dragged handle and the snap guides the accent. */

const LEFT = -34
const TOP = -26
/** The drafting grid's pitch: every size the board lands on is on it. */
const GRID = 6
/** The sizes it's dragged to, in turn: out, narrower, and home. */
const SIZES = [
  [42, 30],
  [60, 42],
  [48, 42],
] as const
/** The drags: [start, end] of each, from SIZES[i] to SIZES[i + 1] (round to the first). */
const DRAGS = [
  [0.09, 0.31],
  [0.37, 0.55],
  [0.62, 0.84],
] as const
/** Which edges each drag moves: [width, depth]. */
const MOVES = [
  [true, true],
  [true, false],
  [true, true],
] as const

/** Segment digits: a, b, c, d, e, f, g, as on a meter. */
const SEGMENTS = [
  [0, 0, 1, 0],
  [1, 0, 1, 0.5],
  [1, 0.5, 1, 1],
  [0, 1, 1, 1],
  [0, 0.5, 0, 1],
  [0, 0, 0, 0.5],
  [0, 0.5, 1, 0.5],
] as const
const DIGITS = ['abcdef', 'bc', 'abged', 'abgcd', 'fgbc', 'afgcd', 'afgedc', 'abc', 'abcdefg', 'abcdfg'].map((s) => [...s].map((c) => c.charCodeAt(0) - 97))

/** The resize cursor, a double arrow, centred, in screen units at 100px: its ink and the paper round it. */
const ARROW = [7, 0, 3.4, 3.2, 3.4, 1, -3.4, 1, -3.4, 3.2, -7, 0, -3.4, -3.2, -3.4, -1, 3.4, -1, 3.4, -3.2]
const HALO = [9, 0, 3, 4.8, 3, 2.2, -3, 2.2, -3, 4.8, -9, 0, -3, -4.8, -3, -2.2, 3, -2.2, 3, -4.8]

const depth = new Depth()
const p = point()
const q = point()
const dot = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 4.5,
  still: 0.3,
  draw(pen, t, view) {
    const lod = view.size < 32 ? 0 : view.size < 80 ? 1 : 2
    const project = camera({ yaw: -0.44, pitch: -0.78, distance: 260, cx: view.w / 2 + 1, cy: view.h / 2 + 4 })
    const hair = 1 / view.px
    const stroke = clamp(view.size * 0.018, 1, 1.5) / view.px

    // The size: drag by drag, each landing on the grid.
    let w: number = SIZES[0][0]
    let d: number = SIZES[0][1]
    DRAGS.forEach(([a, b], i) => {
      const k = view.ease.emphasized(span(t, a, b))
      const [nw, nd] = SIZES[(i + 1) % SIZES.length]!
      w = mix(w, nw, k)
      d = mix(d, nd, k)
    })
    const [x0, z0, x1, z1] = [LEFT, TOP, LEFT + w, TOP + d]
    // The grip: the cursor comes to the handle and presses, holds through the drags, lets go and backs off.
    const grip = view.ease.emphasized(span(t, 0, 0.085)) * (1 - view.ease.emphasized(span(t, 0.86, 0.99)))
    const press = view.ease.standard(span(t, 0.06, 0.1)) * (1 - view.ease.standard(span(t, 0.84, 0.88)))

    const seg = (ax: number, az: number, bx: number, bz: number, width: number, alpha: number, tone: Tone = 'ink') => {
      project(ax, 0, az, p)
      project(bx, 0, bz, q)
      depth.line(p, q, width, alpha, tone)
    }
    /** A rectangle on the board, projected, at a fixed depth so the layers stack in order. */
    const rect = (x: number, z: number, rw: number, rd: number) => {
      xy.length = 0
      for (const [cx, cz] of [
        [x, z],
        [x + rw, z],
        [x + rw, z + rd],
        [x, z + rd],
      ] as const) {
        project(cx, 0, cz, p)
        xy.push(p.x, p.y)
      }
      return xy
    }

    // The drafting table's dot grid, fading toward the edges, beneath the sheet.
    if (lod === 2) {
      for (let i = -1; i <= 12; i++) {
        for (let j = -2; j <= 9; j++) {
          const gx = LEFT + i * GRID
          const gz = TOP + j * GRID
          const r = Math.hypot((gx - LEFT - 30) / 46, (gz - TOP - 21) / 36)
          const a = 0.3 * (1 - r * r)
          if (a < 0.02) continue
          project(gx, 0, gz, p)
          dot.x = p.x
          dot.y = p.y
          dot.z = -200
          depth.square(dot, 1.3 * hair, a)
        }
      }
    }

    // The sheet: it covers the grid, a faint tone of its own.
    depth.poly(rect(x0, z0, w, d), -100, 0.05, 'ink', true)

    // Its layout, reflowing with the size: a header, an image block, lines of text beside it, a button.
    if (lod > 0) {
      const pad = 3.5
      const inner = w - 2 * pad
      depth.poly(rect(x0 + pad, z0 + pad, inner, 3.2), -90, 0.12)
      depth.poly(rect(x0 + pad, z0 + pad, 3.2, 3.2), -89, 0.4)
      if (lod === 2) for (const [o, l] of [[11, 5], [5, 4]] as const) depth.path(rect(x1 - pad - o, z0 + pad + 1.3, l, 0.6), -89, { width: hair, alpha: 0.4, closed: true })
      const iw = inner * 0.46
      const top = z0 + pad + 5.4
      const foot = z1 - pad - 4.6
      depth.path(rect(x0 + pad, top, iw, foot - top), -88, { width: hair, alpha: 0.5, closed: true })
      seg(x0 + pad, top, x0 + pad + iw, foot, hair, 0.24)
      seg(x0 + pad + iw, top, x0 + pad, foot, hair, 0.24)
      const tx = x0 + pad + iw + 3
      const tw = x1 - pad - tx
      const lines = lod === 2 ? [1, 0.9, 1, 0.62, 0.84] : [1, 0.7]
      lines.forEach((share, i) => {
        const z = top + 1 + i * (lod === 2 ? 3.4 : 5)
        // A line shows only while there's room for it above the footer, and fades as the room goes.
        const room = clamp((foot - 1 - z) / 2.5)
        if (room > 0.01) seg(tx, z, tx + tw * share, z, i ? hair * 1.4 : stroke * 1.3, (i ? 0.3 : 0.55) * room)
      })
      depth.poly(rect(x1 - pad - 10, z1 - pad - 2.8, 10, 2.8), -88, 0.34)
      if (lod === 2) depth.path(rect(x1 - pad - 22, z1 - pad - 2.8, 10, 2.8), -88, { width: hair, alpha: 0.42, closed: true })
    }

    // The frame.
    const corners = [
      [x0, z0],
      [x1, z0],
      [x1, z1],
      [x0, z1],
    ] as const
    corners.forEach(([ax, az], i) => {
      const [bx, bz] = corners[(i + 1) % 4]!
      seg(ax, az, bx, bz, stroke, 0.9)
    })

    // Crop marks off each corner: two short lines in line with the edges, clear of the frame and its handles.
    const gap = 2.6
    const len = 5
    for (const [cx, cz] of corners) {
      const sx = cx === x0 ? -1 : 1
      const sz = cz === z0 ? -1 : 1
      seg(cx + sx * gap, cz, cx + sx * (gap + len), cz, hair, 0.6)
      seg(cx, cz + sz * gap, cx, cz + sz * (gap + len), hair, 0.6)
    }

    // Snap guides: as an edge lands on the grid, a dashed guide flashes through it across the table.
    if (lod > 0) {
      const dash = [2.5 * hair, 2 * hair]
      const guide = (ax: number, az: number, bx: number, bz: number, alpha: number) => {
        project(ax, 0, az, p)
        project(bx, 0, bz, q)
        depth.path([p.x, p.y, q.x, q.y], 5, { width: hair, alpha, dash, tone: 'accent' })
      }
      DRAGS.forEach(([, b], i) => {
        const g = view.ease.standard(span(t, b - 0.05, b)) * (1 - view.ease.standard(span(t, b + 0.04, b + 0.11)))
        if (g < 0.01) return
        const [mw, md] = MOVES[i]!
        if (mw) guide(x1, TOP - 14, x1, TOP + 52, 0.6 * g)
        if (md) guide(LEFT - 8, z1, LEFT + 70, z1, 0.6 * g)
      })
    }

    // Dimension lines: across the top and down the right, with extension lines and slanted ticks.
    const off = 9
    const tick = 1.6
    seg(x0, z0 - 2, x0, z0 - off - 2, hair, 0.4)
    seg(x1, z0 - 2, x1, z0 - off - 2, hair, 0.4)
    seg(x0, z0 - off, x1, z0 - off, hair, 0.75, 'c1')
    seg(x0 - tick, z0 - off + tick, x0 + tick, z0 - off - tick, hair, 0.9, 'c1')
    seg(x1 - tick, z0 - off + tick, x1 + tick, z0 - off - tick, hair, 0.9, 'c1')
    seg(x1 + 2, z0, x1 + off + 2, z0, hair, 0.4)
    seg(x1 + 2, z1, x1 + off + 2, z1, hair, 0.4)
    seg(x1 + off, z0, x1 + off, z1, hair, 0.75, 'c1')
    seg(x1 + off - tick, z0 + tick, x1 + off + tick, z0 - tick, hair, 0.9, 'c1')
    seg(x1 + off - tick, z1 + tick, x1 + off + tick, z1 - tick, hair, 0.9, 'c1')

    if (lod === 2) {
      // The figures, in segment digits on the sheet's own plane, counting as it goes.
      const cw = 2.1
      const ch = 3.6
      const pitch = cw + 1.3
      const figure = (value: number, x: number, z: number) => {
        const text = String(Math.round(value) * 10)
        text.split('').forEach((c, n) => {
          const u = x + n * pitch
          for (const s of DIGITS[+c]!) {
            const [a, b, e, f] = SEGMENTS[s]!
            // Each segment stops short of its neighbours, as on a meter.
            const ia = a === e ? 0 : 0.18
            const ib = b === f ? 0 : 0.1
            seg(u + (a + ia) * cw, z + (b + ib) * ch, u + (e - ia) * cw, z + (f - ib) * ch, hair * 1.1, 0.8, 'c1')
          }
        })
        return text.length * pitch - 1.3
      }
      const across = String(Math.round(w) * 10).length * pitch - 1.3
      figure(w, (x0 + x1) / 2 - across / 2, z0 - off - 1.6 - ch)
      figure(d, x1 + off + 2.4, (z0 + z1) / 2 - ch / 2)
    } else if (lod === 1) {
      // Smaller, a bar at each dimension's middle that widens with it.
      seg((x0 + x1) / 2 - w * 0.08, z0 - off - 3, (x0 + x1) / 2 + w * 0.08, z0 - off - 3, stroke * 1.4, 0.5, 'c1')
      seg(x1 + off + 3, (z0 + z1) / 2 - d * 0.1, x1 + off + 3, (z0 + z1) / 2 + d * 0.1, stroke * 1.4, 0.5, 'c1')
    }

    // The handles: hollow at three corners, the one being dragged in the accent, swelling while it's held.
    const handle = (cx: number, cz: number, h: number, tone: 'ink' | 'accent', z: number) => {
      const r = rect(cx - h, cz - h, 2 * h, 2 * h)
      if (tone === 'accent') depth.poly(r, z, 1, 'accent', true)
      else {
        depth.poly(r, z, 0, 'ink', true)
        depth.path(r, z + 0.1, { width: hair, alpha: 0.85, closed: true })
      }
    }
    if (lod > 0) for (const [cx, cz] of corners.slice(0, 2).concat([corners[3]])) handle(cx, cz, 1.2, 'ink', 500)
    handle(x1, z1, 1.8 * (1 + 0.28 * press), 'accent', 1000.5)

    // The resize cursor: it comes to the handle, its tip at the corner, and backs off when it lets go.
    if (lod > 0) {
      project(x1, 0, z1, p)
      const k = (view.size < 80 ? 1.05 : 0.85) * (1 - 0.08 * press)
      const away = 1 - grip
      const ox = p.x + (6.6 + 6 * away) * k
      const oy = p.y + (6.6 + 5 * away) * k
      const c = Math.SQRT1_2
      for (const [shape, alpha, z] of [
        [HALO, 0, 1000],
        [ARROW, 1, 1001],
      ] as const) {
        xy.length = 0
        for (let i = 0; i < shape.length; i += 2) {
          const u = shape[i]! * k
          const v = shape[i + 1]! * k
          xy.push(ox + (u - v) * c, oy + (u + v) * c)
        }
        depth.poly(xy, z, alpha, 'ink', true)
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** An artboard with crop marks and dimension lines is resized from its accent handle. */
export function LoaderMeasure(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
