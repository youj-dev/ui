'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, lambert, mix, orient, span, Depth, point, projectPath, type Project, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'build',
  title: 'Build',
  category: 'interface',
  technique: 'planes',
  tags: ['pipeline', 'ci', 'deploy', 'stages', 'isometric', 'progress', 'steps'],
  description: 'A build pipeline in isometric: a packet runs the pipe from stage to stage, each stage raises its block as it arrives, the last one lights up when it’s done, and they sink for the next run.',
  order: 3,
  colors: [{ part: 'Taps', mono: 'ink' }],
} satisfies LoaderMeta

/* Four stages sit on the floor in the illustrations' isometric view, each
 * tapped off a pipe in dashed hairline along their front, the flow marching
 * down it. The packet, a small accent cube, runs the pipe on the `emphasized`
 * curve; as it reaches a stage, that stage's block rises out of its plate
 * (`emphasized`), growing from the plate's middle to its own height, its
 * faces lit by their angle, and its tap brightens. When the last block is up
 * its top warms to the accent; then the blocks sink in turn, shrinking back
 * into their plates, and the next packet grows at the start, as at the
 * beginning of the loop.
 *
 * Color: each stage’s tap on the pipe warms toward `c1` as its block rises, and cools as it sinks; the last top lights in the accent. */

const STAGES = [-33, -11, 11, 33]
const HEIGHTS = [10, 17, 13, 22]
const PLATE = 7
const BLOCK = 4.6
const ARRIVE = [0.04, 0.2, 0.36, 0.52]
/** The pipe runs in front of the plates, so the packet passes each block rather than through it. */
const RAIL = PLATE + 3
/** Dash periods the flow marches down the pipe a loop: whole ones, so the loop has no seam. */
const FLOW = 6

const depth = new Depth()
const xy: number[] = []
const p = point()
const q = point()

/** A box's visible faces, lit, from its footprint center (x, z), half-size and height; `glow` (0–1) warms its top to the accent. */
function box(project: Project, light: (nx: number, ny: number, nz: number) => [number, number, number], x: number, z: number, s: number, h: number, glow = 0) {
  const faces: [number[][], [number, number, number]][] = [
    [[[x - s, h, z - s], [x + s, h, z - s], [x + s, h, z + s], [x - s, h, z + s]], [0, 1, 0]],
    [[[x - s, 0, z + s], [x + s, 0, z + s], [x + s, h, z + s], [x - s, h, z + s]], [0, 0, 1]],
    [[[x + s, 0, z - s], [x + s, 0, z + s], [x + s, h, z + s], [x + s, h, z - s]], [1, 0, 0]],
    [[[x - s, 0, z - s], [x - s, 0, z + s], [x - s, h, z + s], [x - s, h, z - s]], [-1, 0, 0]],
    [[[x - s, 0, z - s], [x + s, 0, z - s], [x + s, h, z - s], [x - s, h, z - s]], [0, 0, -1]],
  ]
  faces.forEach(([corners, normal], i) => {
    const v = light(...normal)
    if (v[2] <= 0.02) return
    const f = projectPath(corners as [number, number, number][], project, xy)
    depth.face(f.xy, f.z, lambert(...v))
    // The accent warms the lit top over the ink, so it comes and goes without a switch.
    if (i === 0 && glow > 0.004) depth.poly(f.xy, f.z + 0.001, 0.9 * glow, 'accent')
  })
}

export const scene: Scene = {
  beats: 6,
  still: 0.46,
  draw(pen, t, view) {
    const pose = { yaw: -0.62, pitch: -0.56 }
    const project = camera({ ...pose, distance: 300, cx: view.w / 2, cy: view.h / 2 + 8 })
    const light = orient(pose)
    const hair = 1 / view.px
    const small = view.size < 32

    // The pipe, dashed, along the floor in front of the plates, its flow marching toward the last stage.
    const pipe = projectPath(
      [
        [STAGES[0]!, 0, RAIL],
        [STAGES[3]!, 0, RAIL],
      ],
      project,
      xy,
    )
    const dash = [2.5 * hair, 2 * hair]
    depth.path(pipe.xy, -500, { width: hair, alpha: 0.38, dash, offset: -t * FLOW * (dash[0]! + dash[1]!) })

    const sink = (i: number) => view.ease.exit(span(t, 0.8 + i * 0.03, 0.9 + i * 0.03))
    // The last top warms to the accent once its block is up, and cools before the blocks sink.
    const done = view.ease.standard(span(t, 0.67, 0.73)) * (1 - view.ease.standard(span(t, 0.81, 0.87)))
    STAGES.forEach((x, i) => {
      const plate = projectPath(
        [
          [x - PLATE, 0, -PLATE],
          [x + PLATE, 0, -PLATE],
          [x + PLATE, 0, PLATE],
          [x - PLATE, 0, PLATE],
        ],
        project,
        xy,
      )
      depth.poly(plate.xy, -400, 0.06)
      depth.path(plate.xy, -399, { width: hair, alpha: 0.42, closed: true })
      const rise = view.ease.emphasized(span(t, ARRIVE[i]! + 0.04, ARRIVE[i]! + 0.18)) * (1 - sink(i))
      // Each stage taps the pipe: a stub to its plate's front edge from a joint on the pipe, brighter once its block is up.
      if (!small) {
        project(x, 0, RAIL, p)
        project(x, 0, PLATE, q)
        // A stage's tap warms toward its color once its block is up.
        const tapped = blend('ink', 'c1', rise)
        depth.line(p, q, hair, 0.3 + 0.4 * rise, tapped)
        depth.square(p, 3 * hair, 0.55 + 0.35 * rise, tapped)
      }
      // The block grows out of the plate's middle as it rises, and shrinks back into it as it sinks: never a face from nowhere.
      if (rise > 0.002) box(project, light, x, 0, BLOCK * view.ease.standard(Math.min(1, rise / 0.5)), HEIGHTS[i]! * rise, i === 3 ? done : 0)
    })

    // The packet: along the pipe from stage to stage, shrinking away at the end, growing back at the start.
    let at: number = STAGES[0]!
    if (t < 0.9) for (let i = 1; i < 4; i++) at = mix(at, STAGES[i]!, view.ease.emphasized(span(t, ARRIVE[i]! - 0.12, ARRIVE[i]!)))
    const shown = t < 0.9 ? 1 - view.ease.exit(span(t, 0.6, 0.66)) : view.ease.standard(span(t, 0.92, 1))
    if (shown > 0.002) box(project, light, at, RAIL, 2.2 * shown, 4.4 * shown, 1)
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A packet runs an isometric build pipeline, raising each stage's block; the last lights up when done. */
export function LoaderBuild(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
