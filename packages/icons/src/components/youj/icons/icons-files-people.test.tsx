import { readFileSync } from 'node:fs'
import { act, fireEvent, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { installObservers } from '@youj/core/test-utils'
import {
  icons,
  CalendarCheckIcon,
  FolderIcon,
  HourglassIcon,
  MailOpenIcon,
  PhoneCallIcon,
  SaveIcon,
} from './index'

beforeAll(installObservers)
afterEach(() => vi.useRealTimers())

const full = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>
const reduced = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>
const nextFrame = () => act(() => new Promise<void>((r) => requestAnimationFrame(() => r())))

const BATCH = [
  'file', 'file-text', 'file-plus', 'folder', 'archive', 'clipboard', 'save', 'printer', 'cloud-upload', 'cloud-download',
  'user', 'users', 'user-plus', 'user-check', 'user-minus', 'id-card', 'smile', 'thumbs-up',
  'bell-off', 'video', 'phone-call', 'reply', 'forward', 'mail-open', 'messages',
  'clock', 'alarm-clock', 'calendar', 'calendar-check', 'hourglass', 'timer', 'history',
]
const byName = new Map(icons.map((I) => [I.meta.name, I]))
const batch = BATCH.map((name) => [name, byName.get(name)!] as const)
const stateIcons = batch.filter(([, I]) => I?.meta.states)

/** Everything that expresses a pose: geometry, transforms, opacity and stroke drawing. */
function poseOf(svg: SVGSVGElement) {
  const attrs = ['d', 'opacity', 'style', 'stroke-dasharray', 'stroke-dashoffset']
  return Array.from(svg.querySelectorAll('*'))
    .map((el) => attrs.map((a) => el.getAttribute(a) ?? '').join('|'))
    .join('\n')
}

describe('files, people & time batch', () => {
  test('every icon exists, is categorised and has a generated registry description', () => {
    const registry = JSON.parse(readFileSync(`${process.cwd()}/registry/icons.json`, 'utf8')) as { name: string; description: string }[]
    const described = new Map(registry.map((item) => [item.name, item.description]))
    for (const [name, Icon] of batch) {
      expect(Icon, name).toBeDefined()
      expect(['files', 'people', 'communication', 'time']).toContain(Icon.meta.category)
      expect(Icon.meta.keywords.length, name).toBeGreaterThan(3)
      expect(described.get(`icon-${name}`)?.length ?? 0, name).toBeGreaterThan(20)
    }
  })

  test('at least 40% of the batch are state icons with two distinct state labels', () => {
    expect(stateIcons.length / batch.length).toBeGreaterThanOrEqual(0.4)
    for (const [, Icon] of stateIcons) {
      const [from, to] = Icon.meta.states!
      expect(from).not.toBe(to)
    }
  })
})

describe('state icons', () => {
  test.each(stateIcons)('%s mounts straight into either state, and the two states differ', (_, Icon) => {
    const at = (active: boolean) => {
      const { container, unmount } = render(<Icon active={active} />, { wrapper: full })
      const svg = container.querySelector('svg')!
      expect(svg).toHaveAttribute('data-state', active ? 'active' : 'rest')
      const pose = poseOf(svg)
      unmount()
      return pose
    }
    const rest = at(false)
    const active = at(true)
    expect(active).not.toBe(rest)
    // Deterministic: mounting the same state again gives the same pose.
    expect(at(true)).toBe(active)
  })

  test('shared-structure morphs mount on their end geometry', () => {
    const folder = render(<FolderIcon active />, { wrapper: full })
    expect(folder.container.querySelectorAll('path')[1]).toHaveAttribute('d', 'M6 11 L19.33 11 A2 2 0 0 1 21.25 13.56 L19.92 18.06 A2 2 0 0 1 18 19.5 L5 19.5 A2 2 0 0 1 3 17.5 Z')
    // Save morphs through wildcard keyframes; mounting controlled must still land on the check.
    const save = render(<SaveIcon active />, { wrapper: full })
    expect(save.container.querySelectorAll('path')[2]).toHaveAttribute('d', 'M8.5 14 L11 16.5 L11 16.5 L15.5 12')
    const envelope = render(<MailOpenIcon active />, { wrapper: full })
    const flap = envelope.container.querySelectorAll('g > path')
    expect(flap[flap.length - 1]).toHaveAttribute('d', 'M3 9 L12 15 L21 9')
  })

  test('the hang-up pose turns, tucks in and recentres the handset', () => {
    const { container } = render(<PhoneCallIcon active />, { wrapper: full })
    const handset = container.querySelector('path')!
    expect(handset.style.transform).toContain('rotate(135deg)')
    expect(handset.style.transform).toContain('scale(0.8)')
    expect(handset.style.transform).toContain('translateY(1.5px)')
  })
})

describe('reduced motion', () => {
  test('state icons switch straight to their end pose, including wildcard morphs', async () => {
    const { container, rerender } = render(
      <>
        <SaveIcon active={false} />
        <CalendarCheckIcon active={false} />
      </>,
      { wrapper: reduced },
    )
    rerender(
      <>
        <SaveIcon active />
        <CalendarCheckIcon active />
      </>,
    )
    await nextFrame()
    const [save, calendar] = container.querySelectorAll('svg')
    expect(save!.querySelectorAll('path')[2]).toHaveAttribute('d', 'M8.5 14 L11 16.5 L11 16.5 L15.5 12')
    // The day dots have handed over to a fully drawn check.
    const paths = calendar!.querySelectorAll('path')
    const check = paths[paths.length - 1]!
    expect(check.getAttribute('opacity') ?? '1').toBe('1')
    expect(check.getAttribute('stroke-dashoffset') ?? '0').toBe('0')
    for (const dot of Array.from(paths).filter((p) => p.getAttribute('d')?.endsWith('h.01'))) {
      expect(dot.getAttribute('opacity') ?? dot.style.opacity).toBe('0')
    }
  })

  test('uncontrolled icons ignore hover and the hourglass holds a full top bulb', () => {
    vi.useFakeTimers()
    const { container } = render(
      <>
        <FolderIcon />
        <HourglassIcon />
      </>,
      { wrapper: reduced },
    )
    const [folder, hourglass] = container.querySelectorAll('svg')
    fireEvent.pointerEnter(folder!)
    act(() => vi.advanceTimersByTime(5000))
    expect(folder).toHaveAttribute('data-state', 'rest')
    expect(hourglass).toHaveAttribute('data-state', 'rest')
    expect(vi.getTimerCount()).toBe(0)
    // Full top bulb: the sand level sits untransformed, the pile is parked on the bottom cap.
    const [top, pile] = Array.from(hourglass!.querySelectorAll('path')).slice(-2)
    expect(top!.style.transform).not.toContain('scaleX(0)')
    expect(pile!.style.transform).toContain('translateY(4.5px)')
  })
})

describe('hourglass', () => {
  test('loops continuously by default and stops cleanly on unmount', () => {
    vi.useFakeTimers()
    const { container, unmount } = render(<HourglassIcon />, { wrapper: full })
    expect(HourglassIcon.meta.defaultTrigger).toBe('loop')
    act(() => vi.advanceTimersByTime(10_000))
    expect(container.querySelector('svg')).toHaveAttribute('data-state', 'active')
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

