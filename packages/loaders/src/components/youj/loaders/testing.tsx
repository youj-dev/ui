import type { ComponentType } from 'react'
import { render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { easings } from '@youj/core/lib/youj/tokens'
import { bezier, recordingPen, type Mark, type Scene, type View } from './field'
import type { LoaderMeta } from './categories'
import type { LoaderProps } from './kit'

/* The tests every loader passes, so a loader's own test file is three
 * lines (see LOADERS.md). Not a registry item. */

/** The view a scene draws in at `size` px, with the precise personality's curves. */
export function testView(size = 64, aspect = 1): View {
  return {
    w: 100 * aspect,
    h: 100,
    px: size / 100,
    size,
    ease: { standard: bezier(easings.standard), enter: bezier(easings.enter), exit: bezier(easings.exit), emphasized: bezier(easings.emphasized) },
  }
}

/** The marks a scene draws at loop progress `t`. */
export function marksAt(scene: Scene, t: number, view = testView()): Mark[] {
  const marks: Mark[] = []
  scene.draw(recordingPen(marks), t, view)
  return marks
}

/** Every number a mark is drawn with, in order: positions, sizes and alphas. */
const numbers = (marks: Mark[]) =>
  marks.flatMap((m) => {
    if (m.kind === 'path' || m.kind === 'poly' || m.kind === 'face')
      return [...(m.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number), m.kind === 'path' ? m.stroke.alpha : m.kind === 'face' ? m.light : m.alpha]
    return [...m.v, m.alpha]
  })

type IOCallback = (entries: { isIntersecting: boolean }[]) => void

export function describeLoader(Loader: ComponentType<LoaderProps>, meta: LoaderMeta, scene: Scene, aspect = 1) {
  describe(`${meta.title} loader`, () => {
    let observers: { cb: IOCallback; disconnected: boolean }[] = []
    beforeEach(() => {
      observers = []
      // jsdom draws no canvas: the live frame is skipped, everything around it runs.
      HTMLCanvasElement.prototype.getContext = (() => null) as never
      globalThis.IntersectionObserver = class {
        entry: { cb: IOCallback; disconnected: boolean }
        constructor(cb: IOCallback) {
          this.entry = { cb, disconnected: false }
          observers.push(this.entry)
        }
        observe() {}
        unobserve() {}
        disconnect() {
          this.entry.disconnected = true
        }
        takeRecords() {
          return []
        }
      } as never
    })

    it('is a polite status named "Loading", its drawing hidden from assistive technology', () => {
      const { container } = render(<Loader />)
      const status = screen.getByRole('status', { name: 'Loading' })
      expect(status).toHaveAttribute('aria-live', 'polite')
      expect(status).toHaveAttribute('data-yj-loader', meta.id)
      expect(container.querySelector('.yj-anim__art')).toHaveAttribute('aria-hidden', 'true')
    })

    it('takes a label, shows it on request, and is decorative with label={null}', () => {
      const { rerender, container } = render(<Loader label="Syncing files" />)
      expect(screen.getByRole('status', { name: 'Syncing files' })).toBeInTheDocument()
      expect(screen.getByText('Syncing files')).toHaveClass('yj-anim__sr')
      expect(container.querySelector('.yj-anim__label')).toBeNull()
      rerender(<Loader label="Syncing files" showLabel />)
      // Shown under the drawing, as a picture of the words: the status still says the plain label.
      expect(screen.getByRole('status', { name: 'Syncing files' })).toHaveAttribute('data-label-position', 'bottom')
      expect(container.querySelector('.yj-anim__label')).toHaveAttribute('aria-hidden', 'true')
      expect(container.querySelector('.yj-anim__label')).toHaveTextContent('Syncing files')
      rerender(<Loader label={null} />)
      expect(screen.queryByRole('status')).toBeNull()
      expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    })

    it('sizes by name or px, inks in a color, and holds its frame when paused', () => {
      const { rerender, container } = render(<Loader />)
      const root = () => container.firstElementChild as HTMLElement
      expect(root().style.getPropertyValue('--yj-anim-size')).toMatch(/^\d+px$/)
      rerender(<Loader size={52} color="var(--color-success)" paused className="mine" />)
      expect(root().style.getPropertyValue('--yj-anim-size')).toBe('52px')
      expect(root().style.getPropertyValue('--yj-anim-ink')).toBe('var(--color-success)')
      expect(root()).toHaveAttribute('data-paused')
      expect(root()).toHaveClass('mine')
    })

    it('draws live on a canvas, and stops observing on unmount', () => {
      const { container, unmount } = render(
        <YoujProvider reducedMotion="never">
          <Loader />
        </YoujProvider>,
      )
      expect(container.querySelector('canvas')).toBeInTheDocument()
      expect(observers.length).toBeGreaterThan(0)
      unmount()
      expect(observers.every((o) => o.disconnected)).toBe(true)
    })

    it('holds a still frame, drawn as SVG, under reduced motion', () => {
      const { container } = render(
        <YoujProvider reducedMotion="always">
          <Loader />
        </YoujProvider>,
      )
      expect(container.querySelector('canvas')).toBeNull()
      expect(container.querySelector('.yj-anim__art svg')?.childElementCount).toBeGreaterThan(3)
      expect(screen.getByRole('status', { name: 'Loading' })).toHaveAttribute('data-reduced')
    })

    it('loops without a seam: the frame at the end is the frame at the start', () => {
      // As pictures: every mark at the end matches one at the start (a symmetric turn may reorder them).
      // Outlines and planes by where they are and how big, not by which corner they start from.
      const shape = (m: Mark): number[] => {
        if (m.kind !== 'path' && m.kind !== 'poly' && m.kind !== 'face') return numbers([m])
        const v = (m.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
        const n = v.length / 2
        let cx = 0
        let cy = 0
        let length = 0
        for (let i = 0; i < n; i++) {
          cx += v[2 * i]! / n
          cy += v[2 * i + 1]! / n
          const j = (i + 1) % n
          if (j || m.d.endsWith('Z')) length += Math.hypot(v[2 * j]! - v[2 * i]!, v[2 * j + 1]! - v[2 * i + 1]!)
        }
        return [cx, cy, length, m.kind === 'path' ? m.stroke.alpha : m.kind === 'face' ? m.light : m.alpha]
      }
      const tuples = (marks: Mark[]) => marks.map((m) => [m.kind, ...shape(m)] as const)
      for (const size of [24, 64]) {
        const view = testView(size, aspect)
        const start = tuples(marksAt(scene, 0, view))
        const end = tuples(marksAt(scene, 1, view))
        expect(end).toHaveLength(start.length)
        const used = new Set<number>()
        for (const [kind, ...values] of end) {
          const match = start.findIndex(
            ([k, ...v], i) => !used.has(i) && k === kind && v.length === values.length && v.every((x, j) => Math.abs(x - values[j]!) < 0.06),
          )
          expect(match, `a ${kind} at the end has no twin at the start`).toBeGreaterThanOrEqual(0)
          used.add(match)
        }
      }
    })

    it('draws at every size and moment, inside its frame', () => {
      // Every 24th of the loop, so a flap that stands up between two samples can't slip out unseen.
      const moments = [...Array.from({ length: 24 }, (_, i) => i / 24), scene.still]
      for (const size of [16, 24, 40, 64, 160]) {
        const view = testView(size, aspect)
        for (const t of moments) {
          const marks = marksAt(scene, t, view)
          // Checked in plain loops, the problems gathered and asserted once a draw: an expect() per coordinate
          // (thousands a test) made this crawl, and time out, under a busy parallel run.
          const problems: string[] = []
          if (!marks.length) problems.push('nothing drawn')
          for (const m of marks) {
            const xy =
              m.kind === 'path' || m.kind === 'poly' || m.kind === 'face'
                ? (m.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
                : m.kind === 'line'
                  ? m.v.slice(0, 4)
                  : m.kind === 'square'
                    ? [m.v[0], m.v[1], m.v[0] + m.v[2], m.v[1] + m.v[2]]
                    : [m.v[0] - m.v[2], m.v[1] - m.v[2], m.v[0] + m.v[2], m.v[1] + m.v[2]]
            let finite = true
            let x0 = Infinity
            let x1 = -Infinity
            let y0 = Infinity
            let y1 = -Infinity
            for (let i = 0; i < xy.length; i++) {
              const v = xy[i]!
              if (!Number.isFinite(v)) finite = false
              else if (i % 2 === 0) {
                if (v < x0) x0 = v
                if (v > x1) x1 = v
              } else {
                if (v < y0) y0 = v
                if (v > y1) y1 = v
              }
            }
            if (!finite) {
              problems.push(`a ${m.kind} has a coordinate that isn't finite`)
              continue
            }
            // What can be seen stays in the frame, a hairline's half-width aside: the canvas would cut it off.
            if ((m.kind === 'path' ? m.stroke.alpha : m.kind === 'face' ? 1 : m.alpha) <= 0.02) continue
            if (!(x0 > -view.w * 0.01 && x1 < view.w * 1.01 && y0 > -view.h * 0.01 && y1 < view.h * 1.01))
              problems.push(`a ${m.kind} spans x ${x0.toFixed(2)} to ${x1.toFixed(2)}, y ${y0.toFixed(2)} to ${y1.toFixed(2)}, outside ${view.w} by ${view.h}`)
          }
          expect(problems, `at ${size}px, t = ${t.toFixed(3)}`).toEqual([])
        }
      }
    }, 15_000)
  })
}
