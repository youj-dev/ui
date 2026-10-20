import { axisStep, boxExtent, boxFaces, cylinderExtent, hiddenEdges, isoEllipse, isoSort, project, sceneViewBox, unionExtent, viewBoxOf } from './iso'

const COS = Math.cos(Math.PI / 6)

describe('isometric projection', () => {
  test('the origin lands on (0, 0); x runs down-right, y down-left, z straight up', () => {
    expect(project(0, 0, 0)).toEqual([0, 0])
    const [xr, yr] = project(1, 0, 0)
    expect(xr).toBeCloseTo(COS, 2)
    expect(yr).toBeCloseTo(0.5, 2)
    const [xl, yl] = project(0, 1, 0)
    expect(xl).toBeCloseTo(-COS, 2)
    expect(yl).toBeCloseTo(0.5, 2)
    expect(project(0, 0, 1)).toEqual([0, -1])
  })

  test('one grid unit is `unit` user units along every axis (an isometric drawing)', () => {
    for (const p of [project(1, 0, 0, 24), project(0, 1, 0, 24), project(0, 0, 1, 24)]) {
      expect(Math.hypot(p[0], p[1])).toBeCloseTo(24, 1)
    }
    for (const axis of ['x', 'y', 'z'] as const) {
      const [x, y] = axisStep(axis, 10)
      expect(Math.hypot(x, y)).toBeCloseTo(10, 1)
    }
  })

  test('a box shows its top, its +y face on the left and its +x face on the right', () => {
    const faces = boxFaces({ x: 0, y: 0, z: 0, w: 2, d: 2, h: 1 }, 10)
    const cx = (pts: readonly (readonly [number, number])[]) => pts.reduce((s, p) => s + p[0], 0) / pts.length
    expect(cx(faces.left)).toBeLessThan(0)
    expect(cx(faces.right)).toBeGreaterThan(0)
    expect(Math.min(...faces.top.map((p) => p[1]))).toBeLessThan(Math.min(...faces.left.map((p) => p[1])))
    // The hidden edges all meet at the far bottom corner.
    for (const [a] of hiddenEdges({ x: 0, y: 0, z: 0, w: 2, d: 2, h: 1 }, 10)) expect(a).toEqual([0, 0])
  })

  test('a level circle projects to an axis-aligned ellipse of ratio tan 30°', () => {
    const e = isoEllipse(0, 0, 0, 1, 10)
    expect(e.ry / e.rx).toBeCloseTo(Math.tan(Math.PI / 6), 2)
    // Its horizontal reach is where the circle's diagonal points land.
    expect(e.rx).toBeCloseTo(project(Math.SQRT1_2, -Math.SQRT1_2, 0, 10)[0], 1)
  })
})

describe('framing', () => {
  test('a volume’s viewBox holds all eight projected corners, plus padding', () => {
    const box = sceneViewBox([4, 2, 3], 10, 5)
    const ext = boxExtent({ x: 0, y: 0, z: 0, w: 4, d: 2, h: 3 }, 10)
    expect(box.x).toBeCloseTo(ext.minX - 5)
    expect(box.y).toBeCloseTo(ext.minY - 5)
    expect(box.width).toBeCloseTo(ext.maxX - ext.minX + 10)
    expect(box.height).toBeCloseTo(ext.maxY - ext.minY + 10)
    expect(ext.minY).toBeCloseTo(-30)
  })

  test('padding can differ per side: [top, right, bottom, left]', () => {
    const vb = viewBoxOf({ minX: 0, minY: 0, maxX: 10, maxY: 10 }, [1, 2, 3, 4])
    expect(vb).toEqual({ x: -4, y: -1, width: 16, height: 14 })
  })

  test('a cylinder’s extent is its ellipses’, tighter than its square footprint’s', () => {
    const cyl = cylinderExtent({ x: 0, y: 0, z: 0, r: 1, h: 1 }, 10)
    const square = boxExtent({ x: 0, y: 0, z: 0, w: 2, d: 2, h: 1 }, 10)
    expect(cyl.maxX - cyl.minX).toBeLessThan(square.maxX - square.minX)
    expect(unionExtent([cyl, square])).toEqual(square)
    expect(unionExtent([])).toBeUndefined()
  })
})

describe('isoSort', () => {
  const at = (x: number, y: number, z = 0, w = 1, d = 1, h = 1) => ({ x, y, z, w, d, h })

  test('draws far boxes before near ones, whatever the input order', () => {
    const near = { id: 'near', b: at(3, 3) }
    const far = { id: 'far', b: at(0, 0) }
    const middle = { id: 'middle', b: at(1.5, 1.5) }
    expect(isoSort([near, far, middle], (i) => i.b).map((i) => i.id)).toEqual(['far', 'middle', 'near'])
  })

  test('a box on top of another comes after it; one beside it along x or y follows the axis', () => {
    const base = { id: 'base', b: at(0, 0, 0, 2, 2, 1) }
    const top = { id: 'top', b: at(0.5, 0.5, 1, 1, 1, 1) }
    expect(isoSort([top, base], (i) => i.b).map((i) => i.id)).toEqual(['base', 'top'])
    const left = { id: 'x0', b: at(0, 0) }
    const right = { id: 'x1', b: at(1, 0) }
    expect(isoSort([right, left], (i) => i.b).map((i) => i.id)).toEqual(['x0', 'x1'])
  })

  test('a tall tower behind a slab is still drawn first', () => {
    const tower = { id: 'tower', b: at(0, 0, 0, 1, 1, 6) }
    const slab = { id: 'slab', b: at(0, 2, 0, 4, 1, 0.5) }
    expect(isoSort([slab, tower], (i) => i.b).map((i) => i.id)).toEqual(['tower', 'slab'])
  })

  test('keeps the input order for boxes that don’t overlap on screen, and never drops one', () => {
    const a = { id: 'a', b: at(0, 5) }
    const b = { id: 'b', b: at(5, 0) }
    expect(isoSort([a, b], (i) => i.b).map((i) => i.id)).toEqual(['a', 'b'])
    expect(isoSort([b, a], (i) => i.b).map((i) => i.id)).toEqual(['b', 'a'])
    // Interpenetrating boxes fall back to depth rather than hanging.
    const c = { id: 'c', b: at(0, 0, 0, 2, 2, 2) }
    const d = { id: 'd', b: at(1, 1, 1, 2, 2, 2) }
    expect(isoSort([d, c], (i) => i.b).map((i) => i.id).sort()).toEqual(['c', 'd'])
  })
})
