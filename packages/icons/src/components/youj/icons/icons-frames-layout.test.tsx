import { act, fireEvent, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { installObservers } from '@youj/core/test-utils'
import { GripIcon } from './grip'
import { GripHorizontalIcon } from './grip-horizontal'
import { Rows2Icon } from './rows-2'
import { RowsIcon } from './rows'
import { TableIcon } from './table'

beforeAll(installObservers)

const full = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>
const reduced = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>
const svgOf = (c: HTMLElement) => c.querySelector('svg')!
const paths = (c: HTMLElement) => [...c.querySelectorAll('path')].map((p) => p.getAttribute('d') ?? '')
const nextFrame = () => act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))))
/** A path's command structure: its letters, with every number replaced by #. */
const structure = (d: string) => d.replace(/-?(?:\d+\.?\d*|\.\d+)/g, '#').replace(/\s+/g, ' ')
/** Center of a dot path (M, four cubics, Z): the mean of the four cubics' end points. */
const centre = (d: string) => {
  const n = d.match(/-?(?:\d+\.?\d*|\.\d+)/g)!.map(Number)
  const ends = [0, 1, 2, 3].map((i) => [n[2 + i * 6 + 4]!, n[2 + i * 6 + 5]!] as const)
  return [ends.reduce((t, p) => t + p[0], 0) / 4, ends.reduce((t, p) => t + p[1], 0) / 4].map((v) => Math.round(v * 10) / 10)
}

describe('grip-horizontal', () => {
  test('names its states and follows a controlled active over hover', () => {
    expect(GripHorizontalIcon.meta.states).toEqual(['idle', 'grabbed'])
    const { container, rerender } = render(<GripHorizontalIcon active={false} />, { wrapper: full })
    fireEvent.pointerEnter(svgOf(container))
    expect(svgOf(container)).toHaveAttribute('data-state', 'rest')
    rerender(<GripHorizontalIcon active />)
    expect(svgOf(container)).toHaveAttribute('data-state', 'active')
  })

  test('keeps one command structure in both states, and lands on upright bars under reduced motion', async () => {
    const { container, rerender } = render(<GripHorizontalIcon active={false} />, { wrapper: reduced })
    const idle = paths(container)
    expect(idle.some((d) => d.startsWith('M7 9 C'))).toBe(false)
    rerender(<GripHorizontalIcon active />)
    await nextFrame()
    const grabbed = paths(container)
    expect(grabbed.map(structure)).toEqual(idle.map(structure))
    // The outer columns draw in by one, and each column's halves meet at y 12.
    expect(grabbed.filter((d) => d.startsWith('M7 9 C') || d.startsWith('M7 15 C'))).toHaveLength(2)
    expect(grabbed.every((d) => / 12 C/.test(d))).toBe(true)
  })

  test('sits on the same 6-unit lattice as grip, turned a quarter', () => {
    const lattice = (Icon: typeof GripIcon) => paths(render(<Icon active={false} />, { wrapper: full }).container).map(centre)
    const vertical = lattice(GripIcon)
    const horizontal = lattice(GripHorizontalIcon)
    expect(vertical).toHaveLength(6)
    expect(horizontal).toHaveLength(6)
    expect(horizontal.map(([x, y]) => [y, x]).sort()).toEqual([...vertical].sort())
  })
})

describe('rows-2', () => {
  test('is a hover icon whose two dividers lie on one line at rest', () => {
    expect(Rows2Icon.meta.states).toBeUndefined()
    const { container } = render(<Rows2Icon />, { wrapper: full })
    const [a, b] = [...svgOf(container).querySelectorAll('path')] as SVGPathElement[]
    expect(a!.getAttribute('d')).toBe(b!.getAttribute('d'))
    expect(a!.style.transform).toBe(b!.style.transform)
    fireEvent.pointerEnter(svgOf(container))
    expect(svgOf(container)).toHaveAttribute('data-state', 'active')
  })

  test('holds its single divider under reduced motion', () => {
    const { container } = render(<Rows2Icon />, { wrapper: reduced })
    fireEvent.pointerEnter(svgOf(container))
    expect(svgOf(container)).toHaveAttribute('data-state', 'rest')
    for (const p of svgOf(container).querySelectorAll('path')) expect(['', 'none']).toContain((p as SVGPathElement).style.transform)
  })

  test('shares its sheet with rows and table, so the density toggle reads as one family', () => {
    const frame = (Icon: typeof TableIcon) => {
      const rect = svgOf(render(<Icon />, { wrapper: full }).container).querySelector('rect')!
      return ['x', 'y', 'width', 'height', 'rx'].map((a) => rect.getAttribute(a))
    }
    expect(frame(Rows2Icon)).toEqual(['3', '4', '18', '16', '2.5'])
    expect(frame(RowsIcon)).toEqual(frame(Rows2Icon))
    expect(frame(TableIcon)).toEqual(frame(Rows2Icon))
  })
})
