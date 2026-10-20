import { readFileSync } from 'node:fs'
import { act, fireEvent, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { installObservers } from '@youj/core/test-utils'
import type { YoujIconComponent } from './icon-base'
import { AwardIcon } from './award'
import { BookOpenIcon } from './book-open'
import { BriefcaseIcon } from './briefcase'
import { BuildingIcon } from './building'
import { CalculatorIcon } from './calculator'
import { DollarSignIcon } from './dollar-sign'
import { EyeIcon } from './eye'
import { EyeOffIcon } from './eye-off'
import { FileCodeIcon } from './file-code'
import { FileImageIcon } from './file-image'
import { FileJsonIcon } from './file-json'
import { FileTerminalIcon } from './file-terminal'
import { FolderIcon } from './folder'
import { FolderInputIcon } from './folder-input'
import { FolderOpenIcon } from './folder-open'
import { LockIcon } from './lock'
import { LockOpenIcon } from './lock-open'
import { QrCodeIcon } from './qr-code'

beforeAll(installObservers)
afterEach(() => vi.useRealTimers())

const full = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>
const reduced = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>
const svgOf = (c: HTMLElement) => c.querySelector('svg')!
const hidden = (el: Element) => {
  const s = (el as SVGElement).style
  return s.opacity === '0' || /scale\(0\)/.test(s.transform) || el.getAttribute('opacity') === '0'
}

const BATCH: [YoujIconComponent, string][] = [
  [LockOpenIcon, 'security'],
  [EyeOffIcon, 'system'],
  [FolderOpenIcon, 'files'],
  [FolderInputIcon, 'files'],
  [FileCodeIcon, 'files'],
  [FileJsonIcon, 'files'],
  [FileTerminalIcon, 'files'],
  [FileImageIcon, 'files'],
  [BookOpenIcon, 'files'],
  [BriefcaseIcon, 'commerce'],
  [BuildingIcon, 'commerce'],
  [CalculatorIcon, 'commerce'],
  [DollarSignIcon, 'commerce'],
  [QrCodeIcon, 'commerce'],
  [AwardIcon, 'status'],
]

describe('files, security & business batch', () => {
  test('every icon is named after its file, categorised, searchable and described in the registry', () => {
    const registry = JSON.parse(readFileSync(`${process.cwd()}/registry/icons.json`, 'utf8')) as { name: string; description: string }[]
    const described = new Map(registry.map((item) => [item.name, item.description]))
    for (const [Icon, category] of BATCH) {
      const { name } = Icon.meta
      expect(Icon.meta.category, name).toBe(category)
      expect(Icon.meta.keywords.length, name).toBeGreaterThan(5)
      expect(Icon.meta.states, name).toBeUndefined()
      expect(Icon.meta.defaultTrigger, name).toBe('hover')
      expect(described.get(`icon-${name}`)?.length ?? 0, name).toBeGreaterThan(20)
    }
  })

  test.each(BATCH.map(([Icon]) => [Icon.meta.name, Icon] as const))('%s plays on hover and settles on leave', (_, Icon) => {
    const { container } = render(<Icon />, { wrapper: full })
    const svg = svgOf(container)
    expect(svg).toHaveAttribute('data-state', 'rest')
    fireEvent.pointerEnter(svg)
    expect(svg).toHaveAttribute('data-state', 'active')
    fireEvent.pointerLeave(svg)
    expect(svg).toHaveAttribute('data-state', 'rest')
  })
})

describe('static siblings of state icons', () => {
  test("lock-open rests in lock's unlocked pose: the same body and keyhole, and the shackle raised 2 and swung 14° on its left leg", () => {
    const open = svgOf(render(<LockOpenIcon />, { wrapper: full }).container)
    const lock = svgOf(render(<LockIcon active />, { wrapper: full }).container)
    const rect = (svg: SVGSVGElement) => ['x', 'y', 'width', 'height', 'rx'].map((a) => svg.querySelector('rect')!.getAttribute(a))
    expect(rect(open)).toEqual(rect(lock))
    // lock gets there with a transform on its closed shackle; lock-open bakes the same pose into its path.
    const shackle = lock.querySelector('path')!
    expect(shackle.style.transform).toContain('translateY(-2px)')
    expect(shackle.style.transform).toContain('rotate(-14deg)')
    expect(open.querySelector('path')).toHaveAttribute('d', 'M8 9 L7.153 5.604 A4 4 0 0 1 14.916 3.669 L15.762 7.065')
    expect(open.querySelectorAll('path')[1]).toHaveAttribute('d', 'M12 15 V17')
  })

  test("eye-off rests in eye's hidden pose: the same outline and slash, a three-quarter pupil and a gap cut behind the slash", () => {
    const off = svgOf(render(<EyeOffIcon />, { wrapper: full }).container)
    const eye = svgOf(render(<EyeIcon />, { wrapper: full }).container)
    const outline = (svg: SVGSVGElement) => svg.querySelector('g[mask] path')!.getAttribute('d')
    expect(outline(off)).toBe(outline(eye))
    expect(off.querySelector('g[mask] circle')).toHaveAttribute('r', '2.25')
    expect(off.querySelector('mask path')).toHaveAttribute('stroke', 'black')
    const slash = off.querySelector(':scope > path')!
    expect(slash).toHaveAttribute('d', 'M3.5 3.5 L20.5 20.5')
    expect(hidden(slash)).toBe(false)
  })

  test("folder-open rests on folder's open front panel and the same back", () => {
    const open = svgOf(render(<FolderOpenIcon />, { wrapper: full }).container)
    const folder = svgOf(render(<FolderIcon active />, { wrapper: full }).container)
    const d = (svg: SVGSVGElement) => Array.from(svg.querySelectorAll('path')).map((p) => p.getAttribute('d'))
    expect(d(open)).toEqual(d(folder))
  })
})

describe('hover parts', () => {
  test('parts that only appear mid-choreography are fully hidden at rest', () => {
    const scan = svgOf(render(<QrCodeIcon />, { wrapper: full }).container).querySelector('path[d="M2.5 12 H21.5"]')!
    expect(hidden(scan)).toBe(true)
    const leaf = Array.from(svgOf(render(<BookOpenIcon />, { wrapper: full }).container).querySelectorAll('path')).at(-1)!
    expect(hidden(leaf)).toBe(true)
    const value = svgOf(render(<FileJsonIcon />, { wrapper: full }).container).querySelector('circle')!
    expect(hidden(value)).toBe(true)
  })

  test('drawn strokes rest fully drawn, never at zero length', () => {
    const drawnAt = (el: Element) => Number.parseFloat(el.getAttribute('stroke-dasharray') ?? '1')
    const s = svgOf(render(<DollarSignIcon />, { wrapper: full }).container).querySelectorAll('path')[1]!
    expect(drawnAt(s)).toBeGreaterThanOrEqual(1)
    const display = svgOf(render(<CalculatorIcon />, { wrapper: full }).container).querySelector('path')!
    expect(display).toHaveAttribute('d', 'M15.5 7.25 H8.5')
    expect(drawnAt(display)).toBeGreaterThanOrEqual(1)
  })

  test("the sun sets behind the ridge: it sits inside a sky clip that belongs to its own icon", () => {
    const { container } = render(
      <>
        <FileImageIcon />
        <FileImageIcon />
        <EyeOffIcon />
      </>,
      { wrapper: full },
    )
    const ids = Array.from(container.querySelectorAll('mask, clipPath')).map((el) => el.id)
    expect(ids).toHaveLength(3)
    expect(new Set(ids).size).toBe(3)
    for (const el of container.querySelectorAll('[mask], [clip-path]')) {
      const ref = (el.getAttribute('mask') ?? el.getAttribute('clip-path'))!.match(/url\(#(.+)\)/)![1]!
      expect(el.closest('svg')!.querySelector(`#${CSS.escape(ref)}`)).not.toBeNull()
    }
    const sun = container.querySelector('g[clip-path] > circle')!
    expect(sun).toHaveAttribute('cx', '8.75')
    expect(hidden(sun)).toBe(false)
  })

  test('the calculator types three keys down the diagonal; the other six hold still', () => {
    const svg = svgOf(render(<CalculatorIcon />, { wrapper: full }).container)
    const keys = Array.from(svg.querySelectorAll('circle'))
    expect(keys).toHaveLength(9)
    // Only the typed keys carry a transform origin for their press.
    const pressed = keys.filter((c) => (c as SVGElement).style.transformOrigin || (c as SVGElement).style.transformBox)
    expect(pressed.map((c) => [c.getAttribute('cx'), c.getAttribute('cy')])).toEqual([
      ['8.5', '11.75'],
      ['12', '14.75'],
      ['15.5', '17.75'],
    ])
  })
})

describe('reduced motion', () => {
  test('hover does nothing, no timers run, and every icon holds its complete resting drawing', () => {
    vi.useFakeTimers()
    const { container } = render(
      <>
        {BATCH.map(([Icon]) => (
          <Icon key={Icon.meta.name} />
        ))}
      </>,
      { wrapper: reduced },
    )
    const svgs = Array.from(container.querySelectorAll('svg'))
    for (const svg of svgs) fireEvent.pointerEnter(svg)
    act(() => vi.advanceTimersByTime(5000))
    for (const svg of svgs) expect(svg).toHaveAttribute('data-state', 'rest')
    expect(vi.getTimerCount()).toBe(0)
    // The S and the display are whole; the scan line and the turning leaf stay out of sight.
    const byName = new Map(svgs.map((svg) => [svg.getAttribute('data-icon'), svg]))
    expect(byName.get('dollar-sign')!.querySelectorAll('path')[1]!.getAttribute('stroke-dashoffset') ?? '0').toBe('0')
    expect(hidden(byName.get('qr-code')!.querySelector('path[d="M2.5 12 H21.5"]')!)).toBe(true)
    expect(hidden(Array.from(byName.get('book-open')!.querySelectorAll('path')).at(-1)!)).toBe(true)
  })
})
