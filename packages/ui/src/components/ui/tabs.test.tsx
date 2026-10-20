import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Tabs, TabsContent, TabsList, TabsTrigger, type TabsListProps } from './tabs'

function Project({
  orientation = 'horizontal',
  list,
}: {
  orientation?: 'horizontal' | 'vertical'
  list?: Partial<TabsListProps>
}) {
  return (
    <Tabs defaultValue="overview" orientation={orientation}>
      <TabsList aria-label="Project" {...list}>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="deployments">Deployments</TabsTrigger>
        <TabsTrigger value="logs" disabled>
          Logs
        </TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="deployments">Deployments panel</TabsContent>
      <TabsContent value="logs">Logs panel</TabsContent>
      <TabsContent value="settings">Settings panel</TabsContent>
    </Tabs>
  )
}

const tab = (name: string) => screen.getByRole('tab', { name })
/** The outgoing panel stays mounted (hidden) for a frame while Base UI checks for exit animations. */
const panelShows = (text: string) => waitFor(() => expect(screen.getByRole('tabpanel')).toHaveTextContent(text))

describe('Tabs', () => {
  test('a named tablist whose selected tab labels the visible panel', () => {
    render(<Project />)
    expect(screen.getByRole('tablist', { name: 'Project' })).toBeInTheDocument()
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true')
    expect(tab('Deployments')).toHaveAttribute('aria-selected', 'false')
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveTextContent('Overview panel')
    expect(panel).toHaveAccessibleName('Overview')
  })

  test('arrow keys move focus and select (activateOnFocus), skip disabled tabs and loop', async () => {
    const user = userEvent.setup()
    render(<Project />)
    await user.tab()
    expect(tab('Overview')).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(tab('Deployments')).toHaveFocus()
    expect(tab('Deployments')).toHaveAttribute('aria-selected', 'true')
    await panelShows('Deployments panel')

    // Logs is disabled: it stays focusable (so it can be discovered) but is
    // never selected; the panel stays put.
    await user.keyboard('{ArrowRight}')
    expect(tab('Logs')).toHaveFocus()
    expect(tab('Logs')).toHaveAttribute('aria-disabled', 'true')
    expect(tab('Logs')).toHaveAttribute('aria-selected', 'false')
    await panelShows('Deployments panel')

    await user.keyboard('{ArrowRight}')
    expect(tab('Settings')).toHaveFocus()
    expect(tab('Settings')).toHaveAttribute('aria-selected', 'true')

    // Loops back to the first tab.
    await user.keyboard('{ArrowRight}')
    expect(tab('Overview')).toHaveFocus()

    await user.keyboard('{End}')
    expect(tab('Settings')).toHaveFocus()
    await user.keyboard('{Home}')
    expect(tab('Overview')).toHaveFocus()
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true')
  })

  test('with activateOnFocus off, arrows only move focus until Enter selects', async () => {
    const user = userEvent.setup()
    render(<Project list={{ activateOnFocus: false }} />)
    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(tab('Deployments')).toHaveFocus()
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Enter}')
    expect(tab('Deployments')).toHaveAttribute('aria-selected', 'true')
  })

  test('Tab leaves the list for the panel: one tab stop per list', async () => {
    const user = userEvent.setup()
    render(<Project />)
    await user.tab()
    expect(tab('Overview')).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('tabpanel')).toHaveFocus()
  })

  test('vertical lists announce their orientation and use ↑ ↓', async () => {
    const user = userEvent.setup()
    render(<Project orientation="vertical" />)
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical')
    await user.tab()
    await user.keyboard('{ArrowDown}')
    expect(tab('Deployments')).toHaveFocus()
    expect(tab('Deployments')).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowUp}')
    expect(tab('Overview')).toHaveFocus()
  })

  test('the indicator is decorative: an underline bar, or one raised pill', () => {
    const { unmount } = render(<Project />)
    const list = screen.getByRole('tablist')
    expect(list.querySelectorAll('[data-slot=tabs-indicator]')).toHaveLength(1)
    expect(list.querySelector('[data-slot=tabs-hover-indicator]')).toBeNull()
    for (const el of list.querySelectorAll('[data-yj-indicator]')) expect(el).toHaveAttribute('aria-hidden', 'true')
    // Only the four tabs are tabs.
    expect(screen.getAllByRole('tab')).toHaveLength(4)
    unmount()

    render(<Project list={{ variant: 'pill' }} />)
    const pill = screen.getByRole('tablist')
    expect(pill.querySelectorAll('[data-slot=tabs-indicator]')).toHaveLength(1)
    expect(pill.querySelector('[data-slot=tabs-hover-indicator]')).toBeNull()
  })

  test('inset marks a horizontal list for every style: underline pads to line labels up, a track moves in whole', () => {
    const { unmount } = render(<Project list={{ inset: true }} />)
    const list = screen.getByRole('tablist')
    expect(list).toHaveAttribute('data-inset')
    expect(list).not.toHaveAttribute('inset')
    expect(list.className).toMatch(/\[--tabs-inset-x:var\(--tabs-inset,var\(--card-spacing/)
    expect(list.className).toMatch(/px-\[max\(0px,var\(--tabs-inset-x\)/)
    unmount()

    const pill = render(<Project list={{ inset: true, variant: 'pill' }} />)
    expect(screen.getByRole('tablist').className).toMatch(/mx-\(--tabs-inset-x\)/)
    pill.unmount()

    // A vertical list has no row to span: inset leaves it alone.
    render(<Project orientation="vertical" list={{ inset: true }} />)
    expect(screen.getByRole('tablist')).not.toHaveAttribute('data-inset')
    expect(screen.getByRole('tablist').className).not.toMatch(/tabs-inset/)
  })

  describe('overflow', () => {
    const scrollBy = vi.fn()
    beforeEach(() => {
      scrollBy.mockClear()
      HTMLElement.prototype.scrollBy = scrollBy as unknown as HTMLElement['scrollBy']
      vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
        return this.getAttribute('role') === 'tablist' ? 900 : 0
      })
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
        return this.getAttribute('role') === 'tablist' ? 300 : 0
      })
    })
    afterEach(() => vi.restoreAllMocks())

    test('a list that overflows gets pointer-only scroll buttons and an edge fade', async () => {
      const user = userEvent.setup()
      render(<Project />)
      const list = screen.getByRole('tablist')
      const buttons = document.querySelectorAll<HTMLButtonElement>('[data-slot=tabs-scroll-button]')
      expect(buttons).toHaveLength(2)
      for (const b of buttons) {
        expect(b).toHaveAttribute('aria-hidden', 'true')
        expect(b).toHaveAttribute('tabindex', '-1')
      }
      // At the start: nothing to reveal behind, 600px ahead.
      const [start, end] = buttons
      expect(start).not.toHaveAttribute('data-visible')
      expect(end).toHaveAttribute('data-visible')
      expect(list).not.toHaveAttribute('data-overflow-start')
      expect(list).toHaveAttribute('data-overflow-end')

      await user.click(end!)
      expect(scrollBy).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' })
    })

    test('reduced motion scrolls without smoothing', async () => {
      const user = userEvent.setup()
      render(
        <YoujProvider reducedMotion="always">
          <Project />
        </YoujProvider>,
      )
      const end = document.querySelector<HTMLButtonElement>('[data-slot=tabs-scroll-button][data-side=end]')!
      await user.click(end)
      expect(scrollBy).toHaveBeenCalledWith({ left: 240, behavior: 'auto' })
      expect(screen.getByRole('tablist')).toHaveAttribute('data-reduced-motion')
      expect(screen.getByRole('tabpanel')).toHaveAttribute('data-reduced-motion')
    })

    test('a list that fits has no buttons and no fade', () => {
      vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(300)
      render(<Project />)
      expect(document.querySelector('[data-slot=tabs-scroll-button]')).toBeNull()
      expect(screen.getByRole('tablist')).not.toHaveAttribute('data-overflow-end')
    })
  })
})

describe('the panel area between tabs', () => {
  // jsdom has no layout: each panel reports the height its data-h names, or the one a morph has set.
  let restore: () => void
  beforeEach(() => {
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')!
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get(this: HTMLElement) {
        return this.style.height ? parseFloat(this.style.height) : Number(this.dataset.h ?? 0)
      },
    })
    restore = () => Object.defineProperty(HTMLElement.prototype, 'offsetHeight', original)
  })
  afterEach(() => restore())

  const Sized = () => (
    <Tabs defaultValue="short">
      <TabsList aria-label="Sizes">
        <TabsTrigger value="short">Short</TabsTrigger>
        <TabsTrigger value="tall">Tall</TabsTrigger>
      </TabsList>
      <TabsContent value="short" data-h="100">
        Short panel
      </TabsContent>
      <TabsContent value="tall" data-h="300">
        Tall panel
      </TabsContent>
    </Tabs>
  )

  test('springs from the old panel’s height to the new one while the old one fades pinned in place, then lets go', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="never" timeScale={0.25}>
        <Sized />
      </YoujProvider>,
    )
    const short = screen.getByText('Short panel')
    await user.click(tab('Tall'))
    const tall = screen.getByText('Tall panel')
    // The outgoing panel leaves the flow where it stood, at its own height, hidden from assistive tech.
    if (short.isConnected) {
      expect(short.style.position).toBe('absolute')
      expect(short.style.height).toBe('100px')
      expect(short).toHaveAttribute('aria-hidden', 'true')
    }
    // The newcomer starts at the old height (clipped), not its own.
    expect(parseFloat(tall.style.height)).toBeLessThan(300)
    expect(tall.style.overflow).toBe('clip')
    // At rest it has its natural height again.
    await waitFor(() => expect(tall.style.height).toBe(''))
    expect(tall.style.overflow).toBe('')
    expect(screen.getByRole('tabpanel')).toBe(tall)
  })

  test('reduced motion swaps the panels at once, with no pin and no morph', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <Sized />
      </YoujProvider>,
    )
    const short = screen.getByText('Short panel')
    expect(short).toHaveClass('own:reduced:data-ending-style:hidden')
    await user.click(tab('Tall'))
    expect(screen.getByText('Tall panel').style.height).toBe('')
    expect(short.style.position).toBe('')
  })
})
