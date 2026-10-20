import { elbowPath, layoutHierarchy, type HierarchyItem, type HierarchyLayout } from './hierarchy-chart-layout'

const W = 100
const H = 40
const opts = { nodeWidth: W, nodeHeight: H, siblingGap: 10, subtreeGap: 20, levelGap: 30 }

const tree: HierarchyItem = {
  id: 'ceo',
  children: [
    { id: 'cto', children: [{ id: 'eng1' }, { id: 'eng2' }, { id: 'eng3' }] },
    { id: 'cfo' },
    { id: 'coo', children: [{ id: 'ops1', children: [{ id: 'ops1a' }, { id: 'ops1b' }] }] },
  ],
}

const centerX = (l: HierarchyLayout, id: string) => l.nodes.get(id)!.x + W / 2

/** Every pair of nodes on one level keeps at least the sibling gap between them. */
function expectNoOverlap(l: HierarchyLayout, gap: number) {
  const byDepth = new Map<number, number[]>()
  for (const n of l.nodes.values()) byDepth.set(n.depth, [...(byDepth.get(n.depth) ?? []), n.x])
  for (const xs of byDepth.values()) {
    xs.sort((a, b) => a - b)
    for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!).toBeGreaterThanOrEqual(W + gap - 1e-6)
  }
}

function randomTree(count: number, seed = 7): HierarchyItem {
  let s = seed
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const all: { id: string; children: HierarchyItem[] }[] = [{ id: 'n0', children: [] }]
  for (let i = 1; i < count; i++) {
    const node = { id: `n${i}`, children: [] }
    all[Math.floor(rand() * all.length)]!.children.push(node)
    all.push(node)
  }
  return all[0]!
}

describe('layoutHierarchy', () => {
  it('centers each parent over its first and last child', () => {
    const l = layoutHierarchy(tree, opts)
    for (const n of l.nodes.values()) {
      const kids = [...l.nodes.values()].filter((c) => c.parent === n.id)
      if (!kids.length) continue
      expect(centerX(l, n.id)).toBeCloseTo((centerX(l, kids[0]!.id) + centerX(l, kids.at(-1)!.id)) / 2)
    }
  })

  it('puts each level one step down and keeps siblings in order', () => {
    const l = layoutHierarchy(tree, opts)
    expect(l.nodes.get('ceo')!.y).toBe(0)
    expect(l.nodes.get('cto')!.y).toBe(H + 30)
    expect(l.nodes.get('ops1a')!.y).toBe(3 * (H + 30))
    expect(l.nodes.get('cto')!.x).toBeLessThan(l.nodes.get('cfo')!.x)
    expect(l.nodes.get('cfo')!.x).toBeLessThan(l.nodes.get('coo')!.x)
  })

  it('spaces siblings by the sibling gap and cousins by the subtree gap', () => {
    const l = layoutHierarchy(tree, opts)
    expect(l.nodes.get('eng2')!.x - l.nodes.get('eng1')!.x).toBe(W + 10)
    expectNoOverlap(l, 10)
  })

  it('starts at 0 and reports the extent', () => {
    const l = layoutHierarchy(tree, opts)
    const xs = [...l.nodes.values()].map((n) => n.x)
    expect(Math.min(...xs)).toBe(0)
    expect(l.width).toBeCloseTo(Math.max(...xs) + W)
    expect(l.height).toBe(3 * (H + 30) + H)
  })

  it('lists nodes depth first with their place among siblings', () => {
    const l = layoutHierarchy(tree, opts)
    expect(l.order).toEqual(['ceo', 'cto', 'eng1', 'eng2', 'eng3', 'cfo', 'coo', 'ops1', 'ops1a', 'ops1b'])
    expect(l.nodes.get('cfo')).toMatchObject({ pos: 2, size: 3, depth: 1, parent: 'ceo' })
    expect(l.nodes.get('ceo')).toMatchObject({ descendants: 9, childCount: 3, open: true })
  })

  it('lays out a closed branch as a leaf, still counting what it hides', () => {
    const l = layoutHierarchy(tree, { ...opts, isOpen: (id) => id !== 'cto' })
    expect(l.nodes.has('eng1')).toBe(false)
    expect(l.nodes.get('cto')).toMatchObject({ open: false, descendants: 3, childCount: 3 })
    expect(l.order).not.toContain('eng2')
  })

  it('draws identical subtrees identically', () => {
    const twin = (id: string): HierarchyItem => ({ id, children: [{ id: `${id}a` }, { id: `${id}b`, children: [{ id: `${id}c` }] }] })
    const l = layoutHierarchy({ id: 'r', children: [twin('x'), { id: 'm' }, twin('y')] }, opts)
    const shape = (p: string) => ['a', 'b', 'c'].map((s) => l.nodes.get(`${p}${s}`)!.x - l.nodes.get(p)!.x)
    expect(shape('x')).toEqual(shape('y'))
  })

  it('swaps the axes when horizontal', () => {
    const l = layoutHierarchy(tree, { ...opts, orientation: 'horizontal' })
    expect(l.nodes.get('cto')!.x).toBe(W + 30)
    expect(l.nodes.get('eng2')!.y - l.nodes.get('eng1')!.y).toBe(H + 10)
    expect(l.width).toBe(3 * (W + 30) + W)
  })

  it('spaces several roots like subtrees', () => {
    const l = layoutHierarchy([{ id: 'a' }, { id: 'b' }], opts)
    expect(l.nodes.get('b')!.x - l.nodes.get('a')!.x).toBe(W + 20)
    expect(l.nodes.get('a')).toMatchObject({ parent: null, depth: 0, pos: 1, size: 2 })
  })

  it('lays out 500 nodes without overlap, quickly', () => {
    const big = randomTree(500)
    const start = performance.now()
    const l = layoutHierarchy(big, opts)
    expect(performance.now() - start).toBeLessThan(50)
    expect(l.nodes.size).toBe(500)
    expectNoOverlap(l, 10)
  })
})

describe('elbowPath', () => {
  const a = { id: 'a', parent: null, depth: 0, x: 0, y: 0, width: 100, height: 40, pos: 1, size: 1, childCount: 1, descendants: 1, open: true }
  const b = { ...a, id: 'b', depth: 1, x: 200, y: 80 }
  const commands = (d: string) => d.replace(/[^MLQ]/g, '')

  it('runs from the parent’s foot to the child’s head with the same commands, straight or bent', () => {
    const bent = elbowPath(a, b, 'vertical', 8)
    expect(bent.startsWith('M50 40')).toBe(true)
    expect(bent.endsWith('L250 80')).toBe(true)
    expect(commands(bent)).toBe('MLQLQL')
    expect(commands(elbowPath(a, { ...b, x: 0 }, 'vertical', 8))).toBe('MLQLQL')
    expect(commands(elbowPath(a, b, 'horizontal', 8))).toBe('MLQLQL')
  })

  it('mirrors for RTL', () => {
    const d = elbowPath(a, b, 'horizontal', 8, (x) => 400 - x)
    expect(d.startsWith('M300 20')).toBe(true)
    expect(d.endsWith('L200 100')).toBe(true)
  })
})
