import { act, fireEvent, render, screen } from '@testing-library/react'
import { YoujProvider, ThemeScope } from '@youj/core/lib/youj/provider'
import { FlowGraph, layoutFlowGraph, type FlowEdge, type FlowNode } from './flow-graph'

const NODES: FlowNode[] = [
  { id: 'a', label: 'fetch', kind: 'tool', status: 'ok', meta: '1.2 s' },
  { id: 'b', label: 'parse', kind: 'tool', status: 'retried', meta: '0.8 s', attempts: 2 },
  { id: 'c', label: 'enrich', kind: 'llm', status: 'running', meta: '3.1 s' },
  { id: 'd', label: 'lookup', kind: 'tool', status: 'error', meta: '404' },
  { id: 'e', label: 'store', kind: 'tool', status: 'queued' },
  { id: 'f', label: 'notify', kind: 'tool', status: 'skipped' },
]
const EDGES: FlowEdge[] = [
  { from: 'a', to: 'b' },
  { from: 'a', to: 'd' },
  { from: 'b', to: 'c' },
  { from: 'c', to: 'e' },
  { from: 'd', to: 'f' },
  { from: 'a', to: 'e' },
]

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const step = (name: RegExp | string) => screen.getByRole('button', { name })

describe('layoutFlowGraph', () => {
  test('puts each step one layer past the furthest step it waits on', () => {
    const layout = layoutFlowGraph(NODES, EDGES)
    expect(layout.layers.map((l) => [...l].sort())).toEqual([['a'], ['b', 'd'], ['c', 'f'], ['e']])
    // Layers run left to right; within one, steps never overlap.
    const [b, d] = [layout.nodes.get('b')!, layout.nodes.get('d')!]
    expect(b.x).toBe(d.x)
    expect(Math.abs(b.y - d.y)).toBeGreaterThanOrEqual(b.height)
    expect(layout.nodes.get('c')!.x).toBeGreaterThan(b.x + b.width)
  })

  test('routes an edge that crosses layers through a lane in each, clear of the steps there', () => {
    const layout = layoutFlowGraph(NODES, EDGES)
    const lanes = layout.routes.get('a>e')!
    expect(lanes).toHaveLength(2)
    for (const lane of lanes) {
      for (const id of layout.layers[lane.layer]!) {
        const n = layout.nodes.get(id)!
        expect(lane.y + lane.height <= n.y || lane.y >= n.y + n.height).toBe(true)
      }
    }
  })

  test('moves a source up to sit just before the step it feeds, and survives a cycle', () => {
    const layout = layoutFlowGraph(
      [{ id: 'x' }, { id: 'y' }, { id: 'z' }, { id: 'late' }],
      [
        { from: 'x', to: 'y' },
        { from: 'y', to: 'z' },
        { from: 'z', to: 'x' },
        { from: 'late', to: 'z' },
      ],
    )
    expect(layout.nodes.get('late')!.layer).toBe(layout.nodes.get('z')!.layer - 1)
    expect(layout.layers.flat().sort()).toEqual(['late', 'x', 'y', 'z'])
  })

  test('sizes a card to its name, and lays a vertical graph out top to bottom', () => {
    const layout = layoutFlowGraph([{ id: 'long', label: 'screenshots.fetch_all_previews' }, { id: 'short', label: 'x' }], [{ from: 'long', to: 'short' }], 'vertical')
    expect(layout.nodes.get('long')!.width).toBeGreaterThan(layout.nodes.get('short')!.width)
    expect(layout.nodes.get('short')!.y).toBeGreaterThan(layout.nodes.get('long')!.y)
  })
})

describe('FlowGraph', () => {
  test('names each step by its name, state and figure, and says what it follows and leads to', () => {
    reduced(<FlowGraph nodes={NODES} edges={EDGES} label="Ingest" />)
    expect(screen.getByRole('group', { name: 'Ingest' })).toHaveAccessibleDescription(/Arrow keys follow the edges/)
    expect(step('fetch, Succeeded, 1.2 s')).toHaveAccessibleDescription('Then parse, lookup, and store')
    expect(step('parse, Retried, 0.8 s')).toHaveAccessibleDescription('2 attempts. After fetch. Then enrich')
    expect(step('lookup, Failed, 404')).toHaveAttribute('data-status', 'error')
    expect(step('notify, Skipped')).toHaveAttribute('data-status', 'skipped')
    expect(document.querySelectorAll('[data-slot=flow-graph-edge][data-state=skipped]')).toHaveLength(1)
    expect(document.querySelectorAll('[data-slot=flow-graph-edge][data-state=running]')).toHaveLength(1)
  })

  test('is one tab stop, on the running step until another is focused', () => {
    reduced(<FlowGraph nodes={NODES} edges={EDGES} />)
    const tabbable = screen.getAllByRole('button').filter((b) => b.getAttribute('data-slot') === 'flow-graph-node' && b.tabIndex === 0)
    expect(tabbable).toEqual([step(/^enrich/)])
  })

  test('arrows follow the edges, back the way they came, and move within a layer', () => {
    reduced(<FlowGraph nodes={NODES} edges={EDGES} />)
    step(/^fetch/).focus()
    fireEvent.keyDown(step(/^fetch/), { key: 'ArrowRight' })
    const next = document.activeElement!
    expect(['parse', 'lookup', 'store'].some((n) => next.getAttribute('aria-label')!.startsWith(n))).toBe(true)
    fireEvent.keyDown(step(/^lookup/), { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(step(/^fetch/))
    step(/^parse/).focus()
    fireEvent.keyDown(step(/^parse/), { key: 'ArrowRight' })
    expect(document.activeElement).toBe(step(/^enrich/))
    fireEvent.keyDown(step(/^enrich/), { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(step(/^parse/))
    fireEvent.keyDown(step(/^parse/), { key: 'End' })
    expect(document.activeElement).toBe(step(/^store/))
    fireEvent.keyDown(step(/^store/), { key: 'Home' })
    expect(document.activeElement).toBe(step(/^fetch/))
  })

  test('under RTL the flow runs right to left, and so do the arrows', () => {
    reduced(
      <ThemeScope dir="rtl">
        <FlowGraph nodes={NODES} edges={EDGES} />
      </ThemeScope>,
    )
    step(/^parse/).focus()
    fireEvent.keyDown(step(/^parse/), { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(step(/^enrich/))
    const [fetch, enrich] = [step(/^fetch/).closest('li')!, step(/^enrich/).closest('li')!]
    expect(parseFloat(fetch.style.left)).toBeGreaterThan(parseFloat(enrich.style.left))
  })

  test('Enter opens a step for its detail region, and Escape closes it', () => {
    const seen: (string | null)[] = []
    reduced(<FlowGraph nodes={NODES} edges={EDGES} controls="detail" onValueChange={(id) => seen.push(id)} />)
    const enrich = step(/^enrich/)
    expect(enrich).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(enrich)
    expect(enrich).toHaveAttribute('aria-expanded', 'true')
    expect(enrich).toHaveAttribute('aria-controls', 'detail')
    fireEvent.keyDown(enrich, { key: 'Escape' })
    expect(enrich).toHaveAttribute('aria-expanded', 'false')
    expect(enrich).not.toHaveAttribute('aria-controls')
    expect(seen).toEqual(['c', null])
  })

  test('zooms from its corner buttons and the keys, and fits again with 0', () => {
    const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return this.getAttribute('data-slot') === 'flow-graph-viewport' ? ({ width: 900, height: 360, left: 0, top: 0, right: 900, bottom: 360, x: 0, y: 0 } as DOMRect) : ({ width: 0, height: 0 } as DOMRect)
    })
    try {
      reduced(<FlowGraph nodes={NODES} edges={EDGES} />)
      const zoom = () => document.querySelector('[data-slot=flow-graph-zoom]')!.textContent
      const fitted = zoom()
      fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
      expect(zoom()).not.toBe(fitted)
      fireEvent.keyDown(step(/^fetch/), { key: '-' })
      fireEvent.keyDown(step(/^fetch/), { key: '-' })
      fireEvent.keyDown(step(/^fetch/), { key: '0' })
      expect(zoom()).toBe(fitted)
      fireEvent.click(screen.getByRole('button', { name: 'Fit to view' }))
      expect(zoom()).toBe(fitted)
    } finally {
      rect.mockRestore()
    }
  })

  test('pulses a running step and flows its edges only with motion, and stops them on unmount', () => {
    const cancel = vi.fn()
    const animate = vi.fn(() => ({ cancel }) as unknown as Animation)
    const had = Element.prototype.animate
    Element.prototype.animate = animate
    const io = globalThis.IntersectionObserver
    globalThis.IntersectionObserver = class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe(el: Element) {
        this.cb([{ isIntersecting: true, target: el, intersectionRatio: 1 } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
      }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver
    try {
      const still = render(
        <YoujProvider reducedMotion="always">
          <FlowGraph nodes={NODES} edges={EDGES} />
        </YoujProvider>,
      )
      expect(animate).not.toHaveBeenCalled()
      still.unmount()
      const moving = render(
        <YoujProvider reducedMotion="never">
          <FlowGraph nodes={NODES} edges={EDGES} />
        </YoujProvider>,
      )
      expect(animate).toHaveBeenCalled()
      act(() => moving.unmount())
      expect(cancel).toHaveBeenCalledTimes(animate.mock.calls.length)
    } finally {
      Element.prototype.animate = had
      globalThis.IntersectionObserver = io
    }
  })
})
