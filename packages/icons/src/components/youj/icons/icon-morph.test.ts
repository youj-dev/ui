import { createElement, type ComponentType } from 'react'
import { render } from '@testing-library/react'
import { Bell, BellOff, Bookmark, BookmarkCheck, Copy, Check, Plus, X, Sun, Moon, Wifi, WifiOff, Heart, HeartCrack, Play, Pause } from 'lucide-react'
import { elementContours, pathContours, planMorph, readContours, toPathData, trackAt, type Contour, type Point } from './icon-morph'

const contoursOf = (Icon: ComponentType) => {
  const { container, unmount } = render(createElement(Icon))
  const out = readContours(container.querySelector('svg')!)
  unmount()
  return out
}

const near = (a: Point, b: Point, eps = 0.02) => Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps
const svgEl = (markup: string) => {
  const host = document.createElement('div')
  host.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${markup}</svg>`
  return host.firstElementChild!.firstElementChild!
}

describe('parsing', () => {
  test('lines, relative commands and implicit repeats flatten exactly', () => {
    const [c] = pathContours('M20 6 9 17l-5-5')
    expect(c!.closed).toBe(false)
    expect(c!.points).toEqual([
      [20, 6],
      [9, 17],
      [4, 12],
    ])
  })

  test('arcs land on their end point and stay on the circle', () => {
    const [c] = pathContours('M2 12a10 10 0 0 1 20 0')
    const pts = c!.points
    expect(near(pts[pts.length - 1]!, [22, 12])).toBe(true)
    for (const [x, y] of pts) expect(Math.hypot(x - 12, y - 12)).toBeCloseTo(10, 1)
    // Sweep flag 1 runs through the top (smaller y) in screen space.
    expect(Math.min(...pts.map((p) => p[1]))).toBeCloseTo(2, 1)
  })

  test('compact numbers and arc flags parse like the browser does', () => {
    const [c] = pathContours('M1 1a.5.5 0 0 1 1 0h.01')
    expect(near(c!.points[c!.points.length - 1]!, [2.01, 1])).toBe(true)
  })

  test('Z closes a subpath; a following command starts a new one at the same point', () => {
    const cs = pathContours('M4 4h4v4zl-2 2')
    expect(cs).toHaveLength(2)
    expect(cs[0]!.closed).toBe(true)
    expect(cs[1]!.points[0]).toEqual([4, 4])
  })

  test('a path that ends where it began is closed even without Z', () => {
    const [c] = pathContours('M4 4h4v4h-4v-4')
    expect(c!.closed).toBe(true)
    expect(c!.points).toHaveLength(4)
  })

  test('zero-length strokes become dots; a lone moveto draws nothing', () => {
    expect(pathContours('M12 17h.01')).toHaveLength(1)
    expect(pathContours('M12 17')).toHaveLength(0)
  })

  test('malformed data keeps what parsed cleanly', () => {
    const cs = pathContours('M2 2h4 L oops')
    expect(cs).toHaveLength(1)
    expect(cs[0]!.points).toEqual([
      [2, 2],
      [6, 2],
    ])
  })

  test('primitives: rounded rects, circles, lines and polygons', () => {
    const [rect] = elementContours(svgEl('<rect x="5" y="3" width="5" height="18" rx="1" />'))
    expect(rect!.closed).toBe(true)
    const xs = rect!.points.map((p) => p[0])
    expect(Math.min(...xs)).toBeCloseTo(5, 5)
    expect(Math.max(...xs)).toBeCloseTo(10, 5)

    const [circle] = elementContours(svgEl('<circle cx="12" cy="12" r="4" />'))
    expect(circle!.closed).toBe(true)
    expect(circle!.points[0]).toEqual([16, 12])

    const [line] = elementContours(svgEl('<line x1="16" x2="22" y1="9" y2="15" />'))
    expect(line!.points).toEqual([
      [16, 9],
      [22, 15],
    ])

    const [poly] = elementContours(svgEl('<polygon points="12 2 22 20 2 20" />'))
    expect(poly!.closed).toBe(true)
  })
})

describe('reading rendered icons', () => {
  test('reads every visible stroke of a lucide icon', () => {
    expect(contoursOf(Sun)).toHaveLength(9)
    expect(contoursOf(Copy)).toHaveLength(2)
  })

  test('skips masks, clip paths and invisible parts, and normalises the view box', () => {
    const host = document.createElement('div')
    host.innerHTML = `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor">
      <mask id="m"><path d="M0 0h48" stroke="white" /></mask>
      <path d="M4 24h40" />
      <path d="M24 4v40" opacity="0" />
      <path d="M8 8h8" stroke="none" />
    </svg>`
    const cs = readContours(host.firstElementChild!)
    expect(cs).toHaveLength(1)
    expect(cs[0]!.points).toEqual([
      [2, 12],
      [22, 12],
    ])
  })
})

describe('planning', () => {
  const kinds = (from: Contour[], to: Contour[]) => {
    const plan = planMorph(from, to)
    return {
      plan,
      morph: plan.tracks.filter((t) => t.kind === 'morph'),
      enter: plan.tracks.filter((t) => t.kind === 'enter'),
      exit: plan.tracks.filter((t) => t.kind === 'exit'),
    }
  }

  test('a shared outline stays still while the extra stroke draws in', () => {
    const { morph, enter, exit } = kinds(contoursOf(Bookmark), contoursOf(BookmarkCheck))
    expect(morph).toHaveLength(1)
    expect(morph[0]!.still).toBe(true)
    expect(enter).toHaveLength(1)
    expect(exit).toHaveLength(0)
    // The check grows from its left end, nearest the bookmark's body.
    expect(enter[0]!.anchor).toBe('start')
  })

  test('a slash variant carves the original strokes instead of redrawing them', () => {
    const { morph, enter, exit } = kinds(contoursOf(Wifi), contoursOf(WifiOff))
    // dot, inner arc: unchanged. Middle and outer arcs: two pieces each.
    expect(morph.filter((m) => m.still).length).toBeGreaterThanOrEqual(2)
    expect(morph).toHaveLength(6)
    // The slash draws in; the cut-out gaps retract to their centers.
    expect(enter).toHaveLength(1)
    expect(exit.length).toBeGreaterThanOrEqual(2)
    for (const e of exit) expect(e.anchor).toBe('center')
  })

  test('bell → bell-off splits the body where the slash crosses', () => {
    const { morph, enter } = kinds(contoursOf(Bell), contoursOf(BellOff))
    expect(morph).toHaveLength(3)
    expect(enter).toHaveLength(1)
  })

  test('the reverse direction merges the pieces back', () => {
    const { morph, enter, exit } = kinds(contoursOf(WifiOff), contoursOf(Wifi))
    expect(morph).toHaveLength(6)
    expect(exit).toHaveLength(1)
    expect(enter.length).toBeGreaterThanOrEqual(2)
  })

  test('the same outline drawn from a different start point is still recognised', () => {
    const { morph, enter } = kinds(contoursOf(Heart), contoursOf(HeartCrack))
    expect(morph).toHaveLength(1)
    expect(enter).toHaveLength(1)
  })

  test('unrelated strokes pair by position; leftovers retract toward the rest of the icon', () => {
    const { morph, exit } = kinds(contoursOf(Sun), contoursOf(Moon))
    expect(morph).toHaveLength(1)
    expect(exit).toHaveLength(8)
    // Rays retract into the core, so each anchors on its inner end.
    for (const ray of exit) {
      const end = ray.anchor === 'start' ? ray.from[0]! : ray.from[ray.from.length - 1]!
      expect(Math.hypot(end[0] - 12, end[1] - 12)).toBeLessThan(8.5)
    }
  })

  test('a leftover loop grows out of the point nearest the rest of the icon', () => {
    const { enter } = kinds(contoursOf(Play), contoursOf(Pause))
    expect(enter).toHaveLength(1)
    const bar = enter[0]!
    expect(bar.anchor).toBe('center')
    // The right bar's collapse point (its midpoint) sits on its left edge, facing the triangle.
    const mid = bar.from[Math.floor(bar.from.length / 2)]!
    expect(mid[0]).toBeCloseTo(14, 0)
  })

  test('exits lead, entries land last, and every window stays inside 0–1', () => {
    const { plan } = kinds(contoursOf(Copy), contoursOf(Check))
    for (const t of plan.tracks) {
      expect(t.window[0]).toBeGreaterThanOrEqual(0)
      expect(t.window[1]).toBeLessThanOrEqual(1)
      expect(t.window[1]).toBeGreaterThan(t.window[0])
    }
    const exit = plan.tracks.find((t) => t.kind === 'exit')
    if (exit) expect(exit.window[0]).toBe(0)
  })
})

describe('interpolation', () => {
  test('tracks start on the source outline and end exactly on the target', () => {
    const { tracks } = planMorph(contoursOf(Plus), contoursOf(X))
    expect(tracks.every((t) => t.kind === 'morph')).toBe(true)
    for (const t of tracks) {
      trackAt(t, 0).forEach((p, i) => expect(near(p, t.from[i]!, 1e-9)).toBe(true))
      trackAt(t, 1).forEach((p, i) => expect(near(p, t.to[i]!, 1e-9)).toBe(true))
    }
  })

  test('a turning stroke keeps its length mid-morph instead of collapsing', () => {
    const { tracks } = planMorph(contoursOf(Plus), contoursOf(X))
    for (const t of tracks) {
      const mid = trackAt(t, 0.5)
      const len = (pts: Point[]) => Math.hypot(pts[pts.length - 1]![0] - pts[0]![0], pts[pts.length - 1]![1] - pts[0]![1])
      expect(len(mid)).toBeGreaterThan(Math.min(len(t.from), len(t.to)) * 0.97)
    }
  })

  test('path data is compact and closes only closed tracks', () => {
    expect(
      toPathData(
        [
          [1, 2],
          [3.14159, 4],
        ],
        false,
      ),
    ).toBe('M1 2L3.14 4')
    expect(
      toPathData(
        [
          [0, 0],
          [1, 0],
          [1, 1],
        ],
        true,
      ),
    ).toBe('M0 0L1 0L1 1Z')
  })
})
