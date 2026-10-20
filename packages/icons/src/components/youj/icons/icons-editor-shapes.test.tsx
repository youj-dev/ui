import { act, fireEvent, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { installObservers } from '@youj/core/test-utils'
import type { YoujIconComponent } from './icon-base'
import { AlignCenterHorizontalIcon } from './align-center-horizontal'
import { AlignCenterVerticalIcon } from './align-center-vertical'
import { AlignEndHorizontalIcon } from './align-end-horizontal'
import { AlignEndVerticalIcon } from './align-end-vertical'
import { AlignJustifyIcon } from './align-justify'
import { AlignRightIcon } from './align-right'
import { AlignStartHorizontalIcon } from './align-start-horizontal'
import { AlignStartVerticalIcon } from './align-start-vertical'
import { CircleIcon } from './circle'
import { DotIcon } from './dot'
import { FrameIcon } from './frame'
import { HandIcon } from './hand'
import { RectangleHorizontalIcon } from './rectangle-horizontal'
import { SquareIcon } from './square'
import { TextCursorInputIcon } from './text-cursor-input'

beforeAll(installObservers)
afterEach(() => vi.useRealTimers())

const full = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>
const reduced = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>
const svgOf = (c: HTMLElement) => c.querySelector('svg')!

const BATCH: YoujIconComponent[] = [
  AlignRightIcon,
  AlignJustifyIcon,
  AlignStartVerticalIcon,
  AlignCenterVerticalIcon,
  AlignEndVerticalIcon,
  AlignStartHorizontalIcon,
  AlignCenterHorizontalIcon,
  AlignEndHorizontalIcon,
  FrameIcon,
  HandIcon,
  SquareIcon,
  CircleIcon,
  DotIcon,
  RectangleHorizontalIcon,
  TextCursorInputIcon,
]
const each = BATCH.map((I) => [I.meta.name, I] as const)

/** Everything that expresses a visible pose: geometry, transforms, opacity and stroke drawing. Invisible parts don't count. */
function poseOf(svg: SVGSVGElement) {
  const attrs = ['d', 'x', 'y', 'width', 'height', 'r', 'opacity', 'style', 'stroke-dasharray', 'stroke-dashoffset']
  return Array.from(svg.querySelectorAll('*'))
    .map((el) => ((el as SVGElement).style.opacity === '0' ? 'hidden' : attrs.map((a) => el.getAttribute(a) ?? '').join('|')))
    .join('\n')
}

describe('editor & shapes batch', () => {
  test('names, categories and keywords', () => {
    expect(BATCH.map((I) => I.meta.name)).toEqual([
      'align-right',
      'align-justify',
      'align-start-vertical',
      'align-center-vertical',
      'align-end-vertical',
      'align-start-horizontal',
      'align-center-horizontal',
      'align-end-horizontal',
      'frame',
      'hand',
      'square',
      'circle',
      'dot',
      'rectangle-horizontal',
      'text-cursor-input',
    ])
    for (const I of BATCH) {
      expect(I.meta.category, I.meta.name).toBe(I === DotIcon ? 'status' : 'editor')
      expect(I.meta.keywords.length, I.meta.name).toBeGreaterThan(5)
      expect(I.meta.states, I.meta.name).toBeUndefined()
      expect(I.meta.defaultTrigger).toBe('hover')
    }
  })

  test.each(each)('%s plays on hover and settles when the pointer leaves', (_, Icon) => {
    const { container } = render(<Icon />, { wrapper: full })
    const svg = svgOf(container)
    fireEvent.pointerEnter(svg)
    expect(svg).toHaveAttribute('data-state', 'active')
    fireEvent.pointerLeave(svg)
    expect(svg).toHaveAttribute('data-state', 'rest')
  })

  test.each(each)('%s choreography ends on its resting pose, so leaving or finishing never jumps', (_, Icon) => {
    const at = (active: boolean) => {
      const { container, unmount } = render(<Icon active={active} />, { wrapper: full })
      const pose = poseOf(svgOf(container))
      unmount()
      return pose
    }
    expect(at(true)).toBe(at(false))
  })

  test.each(each)('%s holds its resting pose under reduced motion, whatever the pointer does', (_, Icon) => {
    const rest = poseOf(svgOf(render(<Icon />, { wrapper: reduced }).container))
    const { container } = render(<Icon />, { wrapper: reduced })
    const svg = svgOf(container)
    fireEvent.pointerEnter(svg)
    expect(svg).toHaveAttribute('data-state', 'rest')
    expect(poseOf(svg)).toBe(rest)
  })
})

describe('shapes', () => {
  test('text alignment: right-aligned lines end on the right margin, justified lines fill the measure but the last', () => {
    const right = Array.from(svgOf(render(<AlignRightIcon />, { wrapper: full }).container).querySelectorAll('path')).map((p) => p.getAttribute('d'))
    expect(right).toEqual(['M3 6 H21', 'M9 12 H21', 'M7 18 H21'])
    const justified = Array.from(svgOf(render(<AlignJustifyIcon />, { wrapper: full }).container).querySelectorAll('path')).map((p) => p.getAttribute('d'))
    expect(justified).toEqual(['M3 6 H21', 'M3 10 H21', 'M3 14 H21', 'M3 18 H13'])
  })

  test('the square matches the circle in area and rests a quarter turn on, so a turn always completes forwards', () => {
    const square = svgOf(render(<SquareIcon />, { wrapper: full }).container).querySelector('rect')!
    expect(Number(square.getAttribute('width')) ** 2).toBeCloseTo(Math.PI * 9 * 9, -1)
    expect(square.style.transform).toContain('rotate(90deg)')
  })

  test('the circle rests fully drawn and a full turn on', () => {
    const ring = svgOf(render(<CircleIcon />, { wrapper: reduced }).container).querySelector('path')!
    expect(Number.parseFloat(ring.getAttribute('stroke-dasharray')!)).toBeGreaterThanOrEqual(1)
    expect(ring.getAttribute('stroke-dashoffset') ?? '0').toBe('0')
    expect(ring.style.transform).toContain('rotate(360deg)')
  })

  test('the dot is solid and its ripple waits hidden underneath it', () => {
    const [ripple, dot] = Array.from(svgOf(render(<DotIcon />, { wrapper: full }).container).querySelectorAll('circle'))
    expect(dot).toHaveAttribute('fill', 'currentColor')
    expect(dot).toHaveAttribute('stroke', 'none')
    expect(ripple!.style.opacity).toBe('0')
    expect(ripple!.getAttribute('r')).toBe(dot!.getAttribute('r'))
  })

  test('the typed word and the caret are both in place at rest', () => {
    const [text, caret] = Array.from(svgOf(render(<TextCursorInputIcon />, { wrapper: reduced }).container).querySelectorAll('path'))
    expect(text!.getAttribute('opacity') ?? text!.style.opacity ?? '1').not.toBe('0')
    expect(caret!.style.opacity === '' || caret!.style.opacity === '1').toBe(true)
    expect(caret!.style.transform === '' || caret!.style.transform === 'none').toBe(true)
  })
})

describe('object alignment', () => {
  test('edge guides sit clear of the objects they align', () => {
    const cases: [YoujIconComponent, 'x' | 'y', number, 'min' | 'max'][] = [
      [AlignStartVerticalIcon, 'x', 4, 'min'],
      [AlignEndVerticalIcon, 'x', 20, 'max'],
      [AlignStartHorizontalIcon, 'y', 4, 'min'],
      [AlignEndHorizontalIcon, 'y', 20, 'max'],
    ]
    for (const [Icon, axis, guide, side] of cases) {
      const rects = Array.from(svgOf(render(<Icon />, { wrapper: full }).container).querySelectorAll('rect'))
      const size = axis === 'x' ? 'width' : 'height'
      const edges = rects.map((r) => Number(r.getAttribute(axis)) + (side === 'max' ? Number(r.getAttribute(size)) : 0))
      // Both objects align on one edge, three units from the guide.
      expect(new Set(edges).size, Icon.meta.name).toBe(1)
      expect(Math.abs(edges[0]! - guide), Icon.meta.name).toBe(3)
    }
  })

  test('centred objects share the axis, and the axis runs behind them through a mask that moves with them', () => {
    for (const Icon of [AlignCenterVerticalIcon, AlignCenterHorizontalIcon]) {
      const svg = svgOf(render(<Icon />, { wrapper: full }).container)
      const mask = svg.querySelector('mask')!
      const axis = svg.querySelector('path[mask]')!
      expect(axis.getAttribute('mask')).toBe(`url(#${mask.id})`)
      const holes = Array.from(mask.querySelectorAll('rect')).slice(1)
      const objects = Array.from(svg.querySelectorAll(':scope > rect'))
      expect(holes).toHaveLength(2)
      holes.forEach((hole, i) => {
        for (const a of ['x', 'y', 'width', 'height', 'rx']) expect(hole.getAttribute(a)).toBe(objects[i]!.getAttribute(a))
        expect(hole).toHaveAttribute('fill', 'black')
      })
      const vertical = Icon === AlignCenterVerticalIcon
      for (const o of objects) {
        const start = Number(o.getAttribute(vertical ? 'x' : 'y'))
        const size = Number(o.getAttribute(vertical ? 'width' : 'height'))
        expect(start + size / 2, Icon.meta.name).toBe(12)
      }
    }
  })
})

describe('loops', () => {
  test('the dot works as a live indicator: it cycles while on screen and cleans up on unmount', () => {
    vi.useFakeTimers()
    const { container, unmount } = render(<DotIcon trigger="loop" />, { wrapper: full })
    expect(svgOf(container)).toHaveAttribute('data-state', 'active')
    act(() => vi.advanceTimersByTime(5_000))
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
