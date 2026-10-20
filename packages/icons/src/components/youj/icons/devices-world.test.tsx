import { act, fireEvent, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { installObservers } from '@youj/core/test-utils'
import {
  BluetoothIcon,
  CastIcon,
  CloudRainIcon,
  CloudSunIcon,
  CrosshairIcon,
  FlagIcon,
  LightbulbIcon,
  MapPinIcon,
  NavigationIcon,
  PinIcon,
  ResponsiveIcon,
  RocketIcon,
  SmartphoneIcon,
  TabletIcon,
  ThermometerIcon,
  TrophyIcon,
} from './index'

beforeAll(installObservers)

const full = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>
const reduced = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>
const svgOf = (c: HTMLElement) => c.querySelector('svg')!
const nextFrame = () => act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))))
/** Paths drawn directly on the icon, outside masks, clips and groups. */
const topPaths = (c: HTMLElement) => Array.from(svgOf(c).querySelectorAll<SVGPathElement>(':scope > path'))

const STATE_ICONS = [
  SmartphoneIcon,
  TabletIcon,
  ResponsiveIcon,
  BluetoothIcon,
  CastIcon,
  MapPinIcon,
  NavigationIcon,
  CrosshairIcon,
  CloudSunIcon,
  ThermometerIcon,
  RocketIcon,
  FlagIcon,
  PinIcon,
  TrophyIcon,
  LightbulbIcon,
]
const MOBILE = 'M9 2.5 H15 A2 2 0 0 1 17 4.5 V19.5 A2 2 0 0 1 15 21.5 H9 A2 2 0 0 1 7 19.5 V4.5 A2 2 0 0 1 9 2.5 Z'
const DESKTOP = 'M5 3.5 H19 A2 2 0 0 1 21 5.5 V13.5 A2 2 0 0 1 19 15.5 H5 A2 2 0 0 1 3 13.5 V5.5 A2 2 0 0 1 5 3.5 Z'

describe('state icons', () => {
  test.each(STATE_ICONS.map((I) => [I.meta.name, I] as const))('%s names both states and follows a controlled active over hover', (_, Icon) => {
    expect(Icon.meta.states).toHaveLength(2)
    const { container, rerender } = render(<Icon active={false} />, { wrapper: full })
    const svg = svgOf(container)
    fireEvent.pointerEnter(svg)
    expect(svg).toHaveAttribute('data-state', 'rest')
    rerender(<Icon active />)
    expect(svg).toHaveAttribute('data-state', 'active')
  })

  test('a controlled icon mounts straight into its end pose', () => {
    const responsive = render(<ResponsiveIcon active />, { wrapper: full })
    expect(topPaths(responsive.container)[0]).toHaveAttribute('d', MOBILE)

    const tablet = render(<TabletIcon active />, { wrapper: full })
    expect(svgOf(tablet.container).querySelector<SVGGElement>('g')!.style.transform).toContain('rotate(-90deg)')

    const navigation = render(<NavigationIcon active />, { wrapper: full })
    expect(topPaths(navigation.container)[0]!.style.transform).toContain('rotate(135deg)')
  })

  test('fills open fully in the active state and are clipped away at rest', () => {
    const cases = [
      [TrophyIcon, 'inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'],
      [FlagIcon, 'inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)'],
      [CastIcon, 'circle(0% at 0% 100%)', 'circle(142% at 0% 100%)'],
    ] as const
    for (const [Icon, closed, open] of cases) {
      const fillOf = (c: HTMLElement) => svgOf(c).querySelector('[fill="currentColor"]')!
      const off = render(<Icon active={false} />, { wrapper: full })
      expect(fillOf(off.container), Icon.meta.name).toHaveAttribute('clip-path', closed)
      const on = render(<Icon active />, { wrapper: full })
      expect(fillOf(on.container), Icon.meta.name).toHaveAttribute('clip-path', open)
    }
  })

  test('parts that only exist in the active state are fully hidden at rest, so no stray round caps show', () => {
    const hidden = (el: Element) => (el as SVGElement).style.opacity === '0' || (el as SVGElement).style.transform.includes('scale(0)')
    const bluetooth = render(<BluetoothIcon active={false} />, { wrapper: full })
    expect(topPaths(bluetooth.container).slice(1).every(hidden)).toBe(true)

    const lightbulb = render(<LightbulbIcon active={false} />, { wrapper: full })
    expect(topPaths(lightbulb.container).slice(2).every(hidden)).toBe(true)

    const smartphone = render(<SmartphoneIcon active={false} />, { wrapper: full })
    expect(topPaths(smartphone.container).every(hidden)).toBe(true)

    const crosshair = render(<CrosshairIcon active={false} />, { wrapper: full })
    expect(hidden(svgOf(crosshair.container).querySelector('circle[fill="currentColor"]')!)).toBe(true)

    const cloudSun = render(<CloudSunIcon active={false} />, { wrapper: full })
    expect(Array.from(svgOf(cloudSun.container).querySelectorAll('[clip-path] > path')).every(hidden)).toBe(true)
  })

  test("cloud-sun's rain state is exactly cloud-rain", () => {
    const sun = render(<CloudSunIcon active />, { wrapper: full })
    const rain = render(<CloudRainIcon />, { wrapper: full })
    expect(topPaths(sun.container)[0]!.getAttribute('d')).toBe(topPaths(rain.container)[0]!.getAttribute('d'))
    const drops = (c: HTMLElement) => Array.from(svgOf(c).querySelectorAll('[clip-path] > path')).map((p) => p.getAttribute('d'))
    expect(drops(sun.container)).toEqual(drops(rain.container))
  })
})

describe('reduced motion', () => {
  test('state icons switch instantly to the same end pose', async () => {
    const responsive = render(<ResponsiveIcon active={false} />, { wrapper: reduced })
    expect(topPaths(responsive.container)[0]).toHaveAttribute('d', DESKTOP)
    responsive.rerender(<ResponsiveIcon active />)
    const trophy = render(<TrophyIcon active={false} />, { wrapper: reduced })
    trophy.rerender(<TrophyIcon active />)
    await nextFrame()
    expect(topPaths(responsive.container)[0]).toHaveAttribute('d', MOBILE)
    expect(svgOf(trophy.container).querySelector('[fill="currentColor"]')).toHaveAttribute('clip-path', 'inset(0% 0% 0% 0%)')
  })

  test('hover never plays an uncontrolled state icon', () => {
    const { container } = render(<MapPinIcon />, { wrapper: reduced })
    fireEvent.pointerEnter(svgOf(container))
    expect(svgOf(container)).toHaveAttribute('data-state', 'rest')
  })
})
