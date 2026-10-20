import { alignShapes, distributeShapes, fitView, snapBox, zoomAt } from './whiteboard-arrange'
import { boundsOf, connectorRoute, moveShape, removeShapes, sceneToSVG, stickyLayout, type WhiteboardScene, type WhiteboardShape } from './whiteboard-model'

const rect = (id: string, x: number, y: number, w = 100, h = 60): WhiteboardShape => ({ id, type: 'rectangle', color: 'ink', width: 'medium', x, y, w, h })

describe('zoom math', () => {
  test('zooming at a point keeps that point over the same spot of the world', () => {
    const view = { x: 40, y: -20, k: 1 }
    const next = zoomAt(view, 2, 300, 200)
    const before = [(300 - view.x) / view.k, (200 - view.y) / view.k]
    const after = [(300 - next.x) / next.k, (200 - next.y) / next.k]
    expect(after[0]).toBeCloseTo(before[0]!)
    expect(after[1]).toBeCloseTo(before[1]!)
    expect(next.k).toBe(2)
  })

  test('zoom is clamped between 10% and 400%', () => {
    expect(zoomAt({ x: 0, y: 0, k: 1 }, 50, 0, 0).k).toBe(4)
    expect(zoomAt({ x: 0, y: 0, k: 1 }, 0.001, 0, 0).k).toBe(0.1)
  })

  test('fit centers the box in the viewport with padding, never past 150%', () => {
    const v = fitView({ x: 100, y: 100, w: 400, h: 200 }, 800, 500)
    expect(v.k).toBeCloseTo(Math.min(1.5, (800 - 96) / 400, (500 - 96) / 200))
    // The box's center lands on the viewport's center.
    expect(300 * v.k + v.x).toBeCloseTo(400)
    expect(200 * v.k + v.y).toBeCloseTo(250)
    expect(fitView({ x: 0, y: 0, w: 10, h: 10 }, 800, 500).k).toBe(1.5)
  })
})

describe('snapping', () => {
  const others = [
    { x: 0, y: 0, w: 100, h: 60 },
    { x: 200, y: 0, w: 100, h: 60 },
  ]

  test('an edge within the threshold snaps to a neighbour’s edge, with a guide through it', () => {
    const s = snapBox({ x: 203, y: 120, w: 100, h: 60 }, others, 6)
    expect(s.dx).toBe(-3)
    expect(s.guides).toContainEqual(expect.objectContaining({ axis: 'x', at: 200 }))
  })

  test('centers line up too', () => {
    const s = snapBox({ x: 20, y: 100, w: 60, h: 40 }, others, 6)
    // Its center (50) is the first box's center.
    expect(s.dx).toBe(0)
    expect(s.guides.some((g) => g.axis === 'x' && g.at === 50)).toBe(true)
  })

  test('nothing within reach: no snap, unless the grid is on', () => {
    expect(snapBox({ x: 500, y: 300, w: 50, h: 50 }, others, 6)).toMatchObject({ dx: 0, dy: 0, guides: [] })
    expect(snapBox({ x: 505, y: 310, w: 50, h: 50 }, others, 6, 24)).toMatchObject({ dx: -1, dy: 2 })
  })

  test('the same spacing as the pair beside it snaps, with gap hints showing both gaps', () => {
    // Gap between the two is 100; a third box dropped near 400 snaps to keep 100.
    const s = snapBox({ x: 404, y: 0, w: 100, h: 60 }, others, 6)
    expect(s.dx).toBe(-4)
    expect(s.gaps).toEqual([expect.objectContaining({ axis: 'x', size: 100 }), expect.objectContaining({ axis: 'x', size: 100 })])
  })

  test('centered between two neighbours', () => {
    const s = snapBox({ x: 128, y: 0, w: 40, h: 60 }, others, 6)
    // The gap is 100 wide and the box 40: centered, it sits at 130 with 30 on each side.
    expect(130 - 128).toBe(s.dx)
    expect(s.gaps.map((g) => g.size)).toEqual([30, 30])
  })
})

describe('align and distribute', () => {
  const shapes = [rect('a', 0, 0), rect('b', 150, 40, 80, 30), rect('c', 400, 10, 50, 50)]

  test('align left moves every shape to the leftmost edge', () => {
    const moved = alignShapes(shapes, 'left')
    expect([...moved.keys()]).toEqual(['b', 'c'])
    expect(moved.get('b')).toMatchObject({ x: 0, y: 40 })
    expect(moved.get('c')).toMatchObject({ x: 0, y: 10 })
  })

  test('align middle centers every shape on the selection’s middle', () => {
    const moved = alignShapes(shapes, 'middle')
    for (const s of moved.values()) {
      const b = boundsOf(s)
      expect(b.y + b.h / 2).toBeCloseTo(35)
    }
  })

  test('distribute horizontally makes the gaps equal and keeps the ends', () => {
    const moved = distributeShapes(shapes, 'horizontal')
    const all = shapes.map((s) => moved.get(s.id) ?? s).map((s) => boundsOf(s))
    expect(all[0]!.x).toBe(0)
    expect(all[2]!.x).toBe(400)
    expect(all[1]!.x - (all[0]!.x + all[0]!.w)).toBeCloseTo(all[2]!.x - (all[1]!.x + all[1]!.w))
  })

  test('connectors are left to follow; fewer than three shapes don’t distribute', () => {
    const connector: WhiteboardShape = { id: 'k', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'a' }, to: { shape: 'b' } }
    expect(alignShapes([...shapes, connector], 'top').has('k')).toBe(false)
    expect(distributeShapes(shapes.slice(0, 2), 'vertical').size).toBe(0)
  })
})

describe('connectors', () => {
  const scene: WhiteboardScene = {
    shapes: [rect('a', 0, 0), rect('b', 300, 0), { id: 'k', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'a' }, to: { shape: 'b' } }],
  }
  const lookupIn = (shapes: WhiteboardShape[]) => (id: string) => shapes.find((s) => s.id === id)

  test('a straight connector runs between the facing edges', () => {
    const route = connectorRoute(scene.shapes[2] as Extract<WhiteboardShape, { type: 'connector' }>, lookupIn(scene.shapes))!
    expect(route.points[0]![0]).toBeCloseTo(103)
    expect(route.points[1]![0]).toBeCloseTo(297)
    expect(route.points[0]![1]).toBeCloseTo(30)
  })

  test('it re-routes when an end moves', () => {
    const shapes = scene.shapes.map((s) => (s.id === 'b' ? moveShape(s, 0, 200) : s))
    const route = connectorRoute({ ...(scene.shapes[2] as Extract<WhiteboardShape, { type: 'connector' }>), route: 'elbow' }, lookupIn(shapes))!
    // Apart on both axes: out of A's side, then down into B's top.
    expect(route.points).toEqual([
      [103, 30],
      [350, 30],
      [350, 197],
    ])
  })

  test('elbow between shapes side by side turns halfway across the gap', () => {
    const shapes = scene.shapes.map((s) => (s.id === 'b' ? moveShape(s, 0, 40) : s))
    const route = connectorRoute({ ...(scene.shapes[2] as Extract<WhiteboardShape, { type: 'connector' }>), route: 'elbow' }, lookupIn(shapes))!
    expect(route.points).toEqual([
      [103, 30],
      [200, 30],
      [200, 70],
      [297, 70],
    ])
  })

  test('deleting a shape takes its connectors and lets go of its pins where they were', () => {
    const next = removeShapes({ ...scene, pins: [{ id: 'p', shape: 'b', x: 10, y: 5 }] }, ['b'])
    expect(next.shapes.map((s) => s.id)).toEqual(['a'])
    expect(next.pins).toEqual([{ id: 'p', shape: undefined, x: 310, y: 5 }])
  })
})

describe('the scene format', () => {
  test('a note grows to fit its text', () => {
    const short = stickyLayout({ id: 's', type: 'sticky', color: 'amber', width: 'medium', x: 0, y: 0, w: 200, h: 100, text: 'Hi' })
    const long = stickyLayout({ id: 's', type: 'sticky', color: 'amber', width: 'medium', x: 0, y: 0, w: 200, h: 100, text: 'word '.repeat(60) })
    expect(short.box.h).toBe(100)
    expect(long.box.h).toBeGreaterThan(100)
    expect(long.lines.length).toBeGreaterThan(5)
  })

  test('the export draws notes, connectors with their labels, and embeds as titled placeholders', () => {
    const svg = sceneToSVG(
      {
        shapes: [
          rect('a', 0, 0),
          { id: 'n', type: 'sticky', color: 'amber', width: 'medium', x: 0, y: 100, w: 160, h: 80, text: 'Ship <it>' },
          { id: 'k', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'a' }, to: { shape: 'n' }, label: 'next' },
          { id: 'e', type: 'embed', x: 300, y: 0, w: 200, h: 120, title: 'Revenue' },
        ],
      },
      () => 'black',
    )
    expect(svg).toContain('Ship &#60;it&#62;')
    expect(svg).toContain('>next</text>')
    expect(svg).toContain('data-yj-embed="e"')
    expect(svg).toContain('>Revenue</text>')
  })
})
