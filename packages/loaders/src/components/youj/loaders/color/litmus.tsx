'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, blend, camera, clamp, mix, span, Depth, point, projectPath, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'litmus',
  title: 'Litmus',
  category: 'color',
  technique: 'planes',
  tags: ['test strip', 'reaction', 'indicator', 'chemistry', 'wick', 'dip', 'result'],
  description: 'A test strip dips into a glass of reagent; color wicks up the paper and turns as the reaction completes, the strip lifts, an accent marker reads the result, and the color fades for the next test.',
  order: 7,
  colors: [
    { part: 'Reagent', mono: 'ink' },
    { part: 'Reaction', mono: 'ink' },
  ],
} satisfies LoaderMeta

/* A strip of test paper over a glass of reagent, in a gentle perspective. It
 * lowers into the liquid (`standard`), the surface rings out from it, and the
 * color climbs the paper from the wet end, soft at its front. As the front
 * reaches its height the color turns, from the bottom up, into the
 * reaction's. The strip lifts clear (`emphasized`), and an accent marker
 * slides in beside it at the front's height: the reading. The color holds a
 * moment, then fades from the paper, and the dry strip is back where it
 * started for the next test.
 *
 * Color: the reagent, and the color as it first wicks up, is `c1`
 *; it turns to `c2` as the reaction completes. Under
 * no `colors` both are the ink, and the wicking front still reads as a
 * gradient. The reading marker is the accent. */

const STRIP_W = 9
const STRIP_H = 50
const GLASS_R = 15
const GLASS_TOP = -12
const GLASS_FLOOR = -42
const LEVEL = -26
const UP = -10
const DOWN = -36

const DETAIL = [
  { below: 32, bands: 8, ring: 18 },
  { below: 80, bands: 16, ring: 28 },
  { below: Infinity, bands: 26, ring: 40 },
]

const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []
const pts: [number, number, number][] = Array.from({ length: 4 }, () => [0, 0, 0])

export const scene: Scene = {
  beats: 6,
  still: 0.52,
  draw(pen, t, view) {
    const { bands, ring } = DETAIL.find((d) => view.size < d.below)!
    const small = view.size < 32
    const project = camera({ yaw: -0.35 + 0.05 * Math.sin(TAU * t), pitch: -0.22, distance: 240, cx: view.w / 2, cy: view.h / 2 - 2 })
    const hair = 1 / view.px
    const stroke = clamp(view.size * 0.016, 1, 1.6) / view.px

    // Down, wick, turn, lift, read, fade.
    const dip = view.ease.standard(span(t, 0.04, 0.16))
    const lift = view.ease.emphasized(span(t, 0.56, 0.7))
    const bottom = mix(UP, DOWN, dip * (1 - lift))
    const front = view.ease.standard(span(t, 0.14, 0.5)) * 0.72
    const turn = span(t, 0.36, 0.62)
    const fade = 1 - view.ease.exit(span(t, 0.84, 0.97))
    const read = view.ease.emphasized(span(t, 0.66, 0.76)) * fade

    const circle = (y: number, r: number, key: number, alpha: number, solid?: boolean) => {
      xy.length = 0
      for (let i = 0; i < ring; i++) {
        const a = (TAU * i) / ring
        project(Math.cos(a) * r, y, Math.sin(a) * r, p)
        xy.push(p.x, p.y)
      }
      if (solid) depth.poly(xy, key, alpha, 'c1')
      else depth.path(xy, key, { width: hair, alpha, closed: true })
    }

    // The glass: its rim and floor, and its sides at the silhouette.
    circle(GLASS_TOP, GLASS_R, -20, 0.45)
    circle(GLASS_FLOOR, GLASS_R, -40, 0.3)
    for (const s of [-1, 1]) {
      project(s * GLASS_R, GLASS_TOP, 0, p)
      project(s * GLASS_R, GLASS_FLOOR, 0, q)
      depth.line(p, q, hair, 0.4)
    }
    // The reagent: a tint under its surface, the surface ringing out when the strip goes in.
    circle(LEVEL, GLASS_R - 0.4, -30, 0.12, true)
    circle(LEVEL, GLASS_R - 0.4, -29, 0.5)
    const ripple = span(t, 0.12, 0.4)
    if (!small && ripple > 0 && ripple < 1) circle(LEVEL, mix(STRIP_W * 0.7, GLASS_R - 1, ripple), -28, 0.4 * (1 - ripple))

    // The strip: a paper sheet with its edge, the color climbing it in bands from the wet end.
    const sheet = (y0: number, y1: number) => {
      const corners = [
        [-STRIP_W / 2, y0],
        [STRIP_W / 2, y0],
        [STRIP_W / 2, y1],
        [-STRIP_W / 2, y1],
      ] as const
      corners.forEach(([x, y], k) => {
        const pt = pts[k]!
        pt[0] = x
        pt[1] = y
        pt[2] = 0
      })
      return projectPath(pts, project, xy)
    }
    const paper = sheet(bottom, bottom + STRIP_H)
    depth.poly(paper.xy, 0, 0.03, 'ink', true)
    depth.path(paper.xy, 2, { width: stroke, alpha: 0.75, closed: true, join: 'miter' })
    const wet = front * STRIP_H
    if (fade > 0.01 && wet > 0.2) {
      for (let b = 0; b < bands; b++) {
        const y0 = (b / bands) * STRIP_H
        if (y0 >= wet) break
        const y1 = Math.min(((b + 1) / bands) * STRIP_H, wet)
        const mid = (y0 + y1) / 2
        // Soft at the front; turned from the bottom up as the reaction completes.
        const strength = 0.6 * (0.35 + 0.65 * clamp((wet - mid) / 10)) * fade
        const turned = clamp(turn * 1.6 - (mid / STRIP_H) * 0.9)
        const band = sheet(bottom + y0, bottom + y1)
        depth.poly(band.xy, 1, strength, blend('c1', 'c2', turned))
      }
    }
    // The strip's hold at its top: two short ticks.
    if (!small) {
      for (const s of [-1, 1]) {
        project((s * STRIP_W) / 2, bottom + STRIP_H - 4, 0, p)
        project(s * (STRIP_W / 2 + 2), bottom + STRIP_H - 4, 0, q)
        depth.line(p, q, hair, 0.5)
      }
    }

    // The reading: an accent marker slides in beside the strip at the front's height.
    if (read > 0.01) {
      const y = bottom + wet
      const x = STRIP_W / 2 + mix(10, 3.5, read)
      project(x, y, 0, p)
      p.z = 50
      const side = clamp(view.size * 0.04, 2.4, 5) / view.px
      depth.square(p, side, read, 'accent')
      if (!small) {
        project(STRIP_W / 2 + 0.6, y, 0, q)
        q.z = 49
        depth.line(q, p, hair, 0.6 * read, 'accent')
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A test strip dips into reagent, color wicks up and turns, and an accent marker reads the result. */
export function LoaderLitmus(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
