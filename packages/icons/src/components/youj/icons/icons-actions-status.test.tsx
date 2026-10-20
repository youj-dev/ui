import { fireEvent, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { installObservers } from '@youj/core/test-utils'
import type { YoujIconComponent } from './icon-base'
import { CircleDotIcon } from './circle-dot'
import { CircleMinusIcon } from './circle-minus'
import { CirclePlusIcon } from './circle-plus'
import { CircleUserIcon } from './circle-user'
import { CopyPlusIcon } from './copy-plus'
import { LanguagesIcon } from './languages'
import { LifeBuoyIcon } from './life-buoy'
import { OctagonAlertIcon } from './octagon-alert'
import { PinOffIcon } from './pin-off'
import { RotateCcwIcon } from './rotate-ccw'
import { RotateCwIcon } from './rotate-cw'
import { SearchXIcon } from './search-x'
import { UserXIcon } from './user-x'
import { ZoomOutIcon } from './zoom-out'

beforeAll(installObservers)

const full = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>
const reduced = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>
const svgOf = (c: HTMLElement) => c.querySelector('svg')!
const transformOf = (el: Element | null) => (el as SVGElement | null)?.style.transform ?? ''

/* [icon, category, a keyword a Lucide user would search for] */
const BATCH: [YoujIconComponent, string, string][] = [
  [CirclePlusIcon, 'actions', 'plus-circle'],
  [CircleMinusIcon, 'actions', 'minus-circle'],
  [CircleDotIcon, 'status', 'radio'],
  [CircleUserIcon, 'people', 'user-circle'],
  [UserXIcon, 'people', 'remove user'],
  [OctagonAlertIcon, 'status', 'alert-octagon'],
  [SearchXIcon, 'navigation', 'no results'],
  [CopyPlusIcon, 'actions', 'duplicate'],
  [RotateCwIcon, 'actions', 'rotate-cw'],
  [RotateCcwIcon, 'actions', 'rotate-ccw'],
  [ZoomOutIcon, 'actions', 'zoom out'],
  [PinOffIcon, 'system', 'unpin'],
  [LifeBuoyIcon, 'communication', 'support'],
  [LanguagesIcon, 'communication', 'translate'],
]

describe('actions, status & people icons', () => {
  test.each(BATCH.map(([I, category, keyword]) => [I.meta.name, I, category, keyword] as const))(
    '%s is a hover icon in its category, findable by what Lucide calls it',
    (_, Icon, category, keyword) => {
      expect(Icon.meta.category).toBe(category)
      expect(Icon.meta.states).toBeUndefined()
      expect(Icon.meta.defaultTrigger).toBe('hover')
      expect(Icon.meta.keywords).toContain(keyword)
    },
  )

  test.each(BATCH.map(([I]) => [I.meta.name, I] as const))('%s plays from a hovered parent button and settles when it leaves', (_, Icon) => {
    const { container, getByRole } = render(
      <button type="button">
        <Icon />
        Action
      </button>,
      { wrapper: full },
    )
    fireEvent.pointerEnter(getByRole('button'))
    expect(svgOf(container)).toHaveAttribute('data-state', 'active')
    fireEvent.pointerLeave(getByRole('button'))
    expect(svgOf(container)).toHaveAttribute('data-state', 'rest')
  })

  test.each(BATCH.map(([I]) => [I.meta.name, I] as const))('%s holds its resting drawing under reduced motion', (_, Icon) => {
    const { container } = render(<Icon />, { wrapper: reduced })
    fireEvent.pointerEnter(svgOf(container))
    expect(svgOf(container)).toHaveAttribute('data-state', 'rest')
  })
})

describe('turns that always finish forwards', () => {
  test('rotate-cw and rotate-ccw rest a full turn round, and life-buoy one stripe on, so leaving mid-turn completes the turn', () => {
    const turnOf = (Icon: YoujIconComponent) => transformOf(svgOf(render(<Icon />, { wrapper: full }).container).querySelector('g'))
    expect(turnOf(RotateCwIcon)).toContain('rotate(360deg)')
    expect(turnOf(RotateCcwIcon)).toContain('rotate(-360deg)')
    expect(turnOf(LifeBuoyIcon)).toContain('rotate(90deg)')
  })

  test('the plus and the × land on their own silhouettes a quarter turn round', () => {
    const cross = (Icon: YoujIconComponent) => transformOf(svgOf(render(<Icon active />, { wrapper: full }).container).querySelector('g'))
    expect(cross(CirclePlusIcon)).toContain('rotate(90deg)')
    const userX = render(<UserXIcon active />, { wrapper: full })
    expect(transformOf(svgOf(userX.container).querySelectorAll(':scope > g')[1]!)).toContain('rotate(90deg)')
  })
})

describe('shapes', () => {
  test('the minus bars pinch by moving their ends, so their round caps never squash', () => {
    expect(svgOf(render(<CircleMinusIcon />, { wrapper: full }).container).querySelector('path')).toHaveAttribute('d', 'M8.25 12 L15.75 12')
    expect(svgOf(render(<ZoomOutIcon />, { wrapper: full }).container).querySelector('g path')).toHaveAttribute('d', 'M7.5 10.5 L13.5 10.5')
  })

  test('the radio dot and the buoy stripes are solid, everything else is stroked', () => {
    const dot = svgOf(render(<CircleDotIcon />, { wrapper: full }).container).querySelector('circle[fill="currentColor"]')
    expect(dot).toHaveAttribute('stroke', 'none')
    const stripes = svgOf(render(<LifeBuoyIcon />, { wrapper: full }).container).querySelectorAll('g[fill="currentColor"] > path')
    expect(stripes).toHaveLength(4)
  })

  test('the octagon is one closed outline with eight rounded corners', () => {
    const d = svgOf(render(<OctagonAlertIcon />, { wrapper: full }).container).querySelector('path')!.getAttribute('d')!
    expect(d.match(/A1\.75 1\.75/g)).toHaveLength(8)
    expect(d.trim().endsWith('Z')).toBe(true)
  })

  test('the avatar shoulders are clipped to the ring, so they meet it wherever the nod moves them', () => {
    const svg = svgOf(render(<CircleUserIcon />, { wrapper: full }).container)
    const clip = svg.querySelector('clipPath')!
    expect(clip.querySelector('circle')).toHaveAttribute('r', '9')
    expect(svg.querySelector('g[clip-path] > path')).toBeInTheDocument()
    expect(svg.querySelector('g[clip-path]')).toHaveAttribute('clip-path', `url(#${clip.id})`)
  })
})

describe('held poses', () => {
  test('copy-plus holds its sheets apart while active', () => {
    const svg = svgOf(render(<CopyPlusIcon active />, { wrapper: full }).container)
    expect(transformOf(svg.querySelector(':scope > path'))).toContain('translateX(-1px)')
    expect(transformOf(svg.querySelector(':scope > g'))).toContain('translateX(1px)')
    const rest = svgOf(render(<CopyPlusIcon active={false} />, { wrapper: full }).container)
    expect(transformOf(rest.querySelector(':scope > path'))).not.toContain('translateX(-1px)')
  })

  test('languages trades the scripts by half a turn while each glyph turns back as far, so neither tilts', () => {
    const svg = svgOf(render(<LanguagesIcon active />, { wrapper: full }).container)
    const pair = svg.querySelector(':scope > g')!
    expect(transformOf(pair)).toContain('rotate(180deg)')
    const glyphs = pair.querySelectorAll(':scope > g')
    expect(glyphs).toHaveLength(2)
    for (const glyph of glyphs) expect(transformOf(glyph)).toContain('rotate(-180deg)')
  })

  test('pin-off rests upright and struck through, and tips over once hovered', () => {
    const rest = svgOf(render(<PinOffIcon />, { wrapper: full }).container)
    const slash = rest.querySelector(':scope > path')!
    expect(slash).toHaveAttribute('d', 'M3.5 3.5 L20.5 20.5')
    expect((slash as SVGElement).style.opacity ?? '1').not.toBe('0')
    expect(transformOf(rest.querySelector('g[mask] > g'))).not.toContain('rotate(30deg)')
    const loose = svgOf(render(<PinOffIcon active />, { wrapper: full }).container)
    expect(transformOf(loose.querySelector('g[mask] > g'))).toContain('rotate(30deg)')
  })
})
