import { act, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import {
  ArrowUpIcon,
  BookmarkIcon,
  ChevronsUpDownIcon,
  GripIcon,
  ListIcon,
  LogInIcon,
  LogOutIcon,
  MaximizeIcon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  PanelRightIcon,
  SidebarIcon,
  type YoujIconComponent,
} from './index'

const full = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>
const reduced = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="always">{children}</YoujProvider>
const frame = () => act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))))
const paths = (c: HTMLElement) => [...c.querySelectorAll('path')].map((p) => p.getAttribute('d') ?? '')
/** A path's command structure: its letters, with every number replaced by #. */
const structure = (d: string) => d.replace(/-?(?:\d+\.?\d*|\.\d+)/g, '#').replace(/\s+/g, ' ')

/** State icons that morph `d`, each with a fragment only their active pose contains. */
const MORPHS: [string, YoujIconComponent, string][] = [
  ['arrow-up', ArrowUpIcon, 'M6 13 L12 19 L18 13'],
  ['maximize', MaximizeIcon, 'M9 4 L9 6 C9 7.66 7.66 9 6 9 L4 9'],
  ['chevrons-up-down', ChevronsUpDownIcon, 'M7 4 L12 9 L17 4'],
  ['sidebar', SidebarIcon, 'M7 8.5 L10.5 12 L7 15.5'],
  ['panel-right', PanelRightIcon, 'M17 8.5 L13.5 12 L17 15.5'],
  ['more-horizontal', MoreHorizontalIcon, 'M6.34 6.34 C'],
  ['more-vertical', MoreVerticalIcon, 'M17.66 6.34 C'],
  ['grip', GripIcon, 'M9 7 C'],
  ['log-in', LogInIcon, 'M8 4.5 L6 4.5'],
  ['list', ListIcon, 'M3 6 L5 8 L9 4'],
]

describe('state morphs', () => {
  test.each(MORPHS)('%s keeps one command structure in both states, so the morph interpolates', async (_, Icon, fragment) => {
    const { container, rerender } = render(<Icon active={false} />, { wrapper: reduced })
    const rest = paths(container)
    expect(rest.some((d) => d.includes(fragment))).toBe(false)

    rerender(<Icon active />)
    await frame()
    const active = paths(container)
    expect(active.map(structure)).toEqual(rest.map(structure))
    // Reduced motion lands on the active geometry after one frame, with no tween.
    expect(active.some((d) => d.includes(fragment))).toBe(true)
  })

  test.each(MORPHS)('%s mounts straight into its active pose when controlled', (_, Icon, fragment) => {
    const { container } = render(<Icon active />, { wrapper: full })
    expect(paths(container).some((d) => d.includes(fragment))).toBe(true)
  })

  test.each([
    ['bookmark', BookmarkIcon],
    ['log-out', LogOutIcon],
  ] as const)('%s gives every instance its own clip path', (_, Icon) => {
    const { container } = render(
      <>
        <Icon />
        <Icon />
      </>,
      { wrapper: full },
    )
    const ids = [...container.querySelectorAll('clipPath')].map((c) => c.id)
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
    container.querySelectorAll('svg').forEach((svg, i) => {
      expect(svg.querySelector('[clip-path]')).toHaveAttribute('clip-path', `url(#${ids[i]})`)
    })
  })
})
