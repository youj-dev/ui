import { act, fireEvent, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { installObservers } from '@youj/core/test-utils'
import type { YoujIconComponent } from './icon-base'
import { AnchorIcon } from './anchor'
import { ArrowDownRightIcon } from './arrow-down-right'
import { ArrowUpLeftIcon } from './arrow-up-left'
import { CapsLockIcon } from './caps-lock'
import { ChevronLeftIcon } from './chevron-left'
import { ChevronUpIcon } from './chevron-up'
import { ChevronsLeftIcon } from './chevrons-left'
import { ChevronsLeftRightIcon } from './chevrons-left-right'
import { ChevronsRightIcon } from './chevrons-right'
import { EllipsisIcon } from './ellipsis'
import { EllipsisVerticalIcon } from './ellipsis-vertical'
import { LayoutDashboardIcon } from './layout-dashboard'
import { MountainIcon } from './mountain'
import { describeStateLabels } from '../../../test/icon-contract'

beforeAll(installObservers)

const full = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>
const reduced = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>
const svgOf = (c: HTMLElement) => c.querySelector('svg')!
const pathsOf = (c: HTMLElement) => [...svgOf(c).querySelectorAll('path')].filter((p) => !p.closest('mask, clipPath')).map((p) => p.getAttribute('d'))
const nextFrame = () => act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))))

const STATES: [YoujIconComponent, [string, string]][] = [
  [ChevronUpIcon, ['collapsed', 'expanded']],
  [ChevronLeftIcon, ['collapsed', 'expanded']],
  [ChevronsLeftRightIcon, ['collapsed', 'expanded']],
  [CapsLockIcon, ['off', 'on']],
]

const HOVER: YoujIconComponent[] = [
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ArrowDownRightIcon,
  ArrowUpLeftIcon,
  EllipsisIcon,
  EllipsisVerticalIcon,
  LayoutDashboardIcon,
  AnchorIcon,
  MountainIcon,
]

describe('directions, places & keys: state icons', () => {
  describeStateLabels(STATES)

  test('chevron-up turns over and chevron-left turns a quarter counter-clockwise, both to point down', () => {
    const turn = (Icon: YoujIconComponent) => (svgOf(render(<Icon active />, { wrapper: full }).container).querySelector('path') as SVGElement).style.transform
    expect(turn(ChevronUpIcon)).toContain('rotate(180deg)')
    expect(turn(ChevronLeftIcon)).toContain('rotate(-90deg)')
  })

  test('chevrons-left-right folds both chevrons inside out, and switches instantly under reduced motion', async () => {
    const outward = ['M9 17 L4 12 L9 7', 'M15 17 L20 12 L15 7']
    const inward = ['M4 17 L9 12 L4 7', 'M20 17 L15 12 L20 7']
    expect(pathsOf(render(<ChevronsLeftRightIcon active />, { wrapper: full }).container)).toEqual(inward)

    const { container, rerender } = render(<ChevronsLeftRightIcon active={false} />, { wrapper: reduced })
    expect(pathsOf(container)).toEqual(outward)
    rerender(<ChevronsLeftRightIcon active />)
    await nextFrame()
    expect(pathsOf(container)).toEqual(inward)
  })

  test('caps lock is hollow when off and filled when on: the fill is clipped away entirely at rest', async () => {
    const clip = (c: HTMLElement) => (svgOf(c).querySelector('clipPath > rect') as SVGElement).style.transform
    expect(clip(render(<CapsLockIcon active={false} />, { wrapper: full }).container)).toBe('scaleY(0)')
    expect(clip(render(<CapsLockIcon active />, { wrapper: full }).container)).toBe('none')

    const { container, rerender } = render(<CapsLockIcon active={false} />, { wrapper: reduced })
    rerender(<CapsLockIcon active />)
    await nextFrame()
    expect(clip(container)).toBe('none')
  })
})

describe('directions, places & keys: hover icons', () => {
  test.each(HOVER.map((I) => [I.meta.name, I] as const))('%s has no states, plays on hover and settles on leave', (_, Icon) => {
    expect(Icon.meta.states).toBeUndefined()
    const { container } = render(<Icon />, { wrapper: full })
    const svg = svgOf(container)
    fireEvent.pointerEnter(svg)
    expect(svg).toHaveAttribute('data-state', 'active')
    fireEvent.pointerLeave(svg)
    expect(svg).toHaveAttribute('data-state', 'rest')
  })

  test.each(HOVER.map((I) => [I.meta.name, I] as const))('%s holds its resting pose under reduced motion', (_, Icon) => {
    const { container } = render(<Icon />, { wrapper: reduced })
    const svg = svgOf(container)
    fireEvent.pointerEnter(svg)
    expect(svg).toHaveAttribute('data-state', 'rest')
  })

  test('ellipsis and ellipsis-vertical keep their dots: three solid dots, no morph to a close', () => {
    for (const Icon of [EllipsisIcon, EllipsisVerticalIcon]) {
      const { container } = render(<Icon active />, { wrapper: full })
      const dots = svgOf(container).querySelectorAll('circle')
      expect(dots).toHaveLength(3)
      expect(dots[0]!.closest('g')).toHaveAttribute('fill', 'currentColor')
    }
  })

  test('the mountain hides its sun at rest and shows it risen once active', () => {
    const sun = (c: HTMLElement) => svgOf(c).querySelector('g[mask] > circle') as SVGElement
    const rest = sun(render(<MountainIcon active={false} />, { wrapper: full }).container)
    expect(rest.style.opacity).toBe('0')
    const risen = sun(render(<MountainIcon active />, { wrapper: full }).container)
    expect(risen.style.opacity).toBe('1')
    expect(risen.style.transform).toBe('none')
  })

  test('the dashboard rests with its gutters open: stat cards 5 tall over panels 10 tall, and a hover ends where it began', () => {
    const rest = pathsOf(render(<LayoutDashboardIcon />, { wrapper: full }).container)
    // Top-left card y 3..8, the chart below it y 11..21: a three-unit gutter between the rows.
    expect(rest[0]).toBe('M4.5 3 H9 A1.5 1.5 0 0 1 10.5 4.5 V6.5 A1.5 1.5 0 0 1 9 8 H4.5 A1.5 1.5 0 0 1 3 6.5 V4.5 A1.5 1.5 0 0 1 4.5 3 Z')
    expect(rest[2]).toBe('M4.5 11 H11.5 A1.5 1.5 0 0 1 13 12.5 V19.5 A1.5 1.5 0 0 1 11.5 21 H4.5 A1.5 1.5 0 0 1 3 19.5 V12.5 A1.5 1.5 0 0 1 4.5 11 Z')
    expect(pathsOf(render(<LayoutDashboardIcon active />, { wrapper: reduced }).container)).toEqual(rest)
  })
})
