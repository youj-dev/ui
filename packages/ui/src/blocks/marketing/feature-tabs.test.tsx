import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { graphite } from '@youj/core'
import { BellIcon, ReceiptIcon } from '@youj/icons'
import { FeatureTabs } from './feature-tabs'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const moving = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="never">{ui}</YoujProvider>)

/** jsdom has no Web Animations: a stand-in whose `finished` the test resolves. */
function fakeAnimations() {
  const running: { finish: () => void; paused: boolean }[] = []
  const animate = vi.fn(function (this: Element) {
    let finish!: () => void
    const finished = new Promise<void>((resolve) => (finish = resolve))
    const a = { finished, paused: false, finish, cancel: vi.fn(), pause: () => (a.paused = true), play: () => (a.paused = false) }
    // Only the tour's progress lines count; other parts of the kit animate too.
    if (this.hasAttribute('data-progress')) running.push(a)
    return a as unknown as Animation
  })
  Element.prototype.animate = animate
  return { running, restore: () => delete (Element.prototype as { animate?: unknown }).animate }
}

describe('feature tabs', () => {
  test('four features as tabs, the first open, its panel titled', () => {
    reduced(<FeatureTabs />)
    expect(screen.getByRole('region', { name: 'See what production is doing, as it happens' })).toBeInTheDocument()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual(['Logs', 'Traces', 'Web Vitals', 'Alerts'])
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Every request, streamed live')
  })

  test('arrow keys move between features and open them', async () => {
    const user = userEvent.setup()
    reduced(<FeatureTabs />)
    await user.click(screen.getByRole('tab', { name: 'Logs' }))
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Traces' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Traces' })).toHaveTextContent('Find the slow span')
    await user.keyboard('{End}')
    expect(screen.getByRole('tabpanel', { name: 'Alerts' })).toHaveTextContent('Paged before users notice')
  })

  test('it tours itself, and stops for good once someone picks a tab', async () => {
    const { running, restore } = fakeAnimations()
    try {
      moving(<FeatureTabs />)
      expect(running.length).toBeGreaterThan(0)
      await act(async () => running.at(-1)!.finish())
      expect(screen.getByRole('tab', { name: 'Traces' })).toHaveAttribute('aria-selected', 'true')
      // The pointer resting on it holds the tour where it is.
      await userEvent.setup().hover(screen.getByRole('tablist'))
      expect(running.at(-1)!.paused).toBe(true)
      const before = running.length
      await userEvent.setup().click(screen.getByRole('tab', { name: 'Alerts' }))
      expect(screen.getByRole('tab', { name: 'Alerts' })).toHaveAttribute('aria-selected', 'true')
      expect(running.length).toBe(before)
    } finally {
      restore()
    }
  })

  test('under reduced motion it never tours', () => {
    const { running, restore } = fakeAnimations()
    try {
      reduced(<FeatureTabs />)
      expect(running).toHaveLength(0)
    } finally {
      restore()
    }
  })

  test('embedded: laid out by the host; theme: rendered in a ThemeScope', () => {
    const { container, unmount } = reduced(<FeatureTabs embedded />)
    expect(screen.getByRole('region').className).not.toMatch(/\bpy-|bg-background/)
    expect(container.querySelector('[data-yj-theme]')).toBeNull()
    unmount()
    const themed = reduced(<FeatureTabs theme={graphite} />)
    expect(themed.container.querySelector('[data-yj-theme]')).toContainElement(screen.getByRole('region'))
  })

  test('features and copy replace the demo; picking a tab reports its id', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(
      <FeatureTabs
        copy={{ title: 'Your books, live', listLabel: 'Ledgerly features' }}
        features={[
          { id: 'invoices', icon: ReceiptIcon, title: 'Invoices', tagline: 'Sent in a minute', description: 'From a template.', media: <span>invoice picture</span> },
          { id: 'reminders', icon: BellIcon, title: 'Reminders', tagline: 'Paid on time', description: 'Polite, then firm.' },
        ]}
        onValueChange={onValueChange}
        headingLevel={3}
      />,
    )
    expect(screen.getByRole('heading', { level: 3, name: 'Your books, live' })).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: 'Ledgerly features' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Invoices', 'Reminders'])
    expect(screen.getByRole('tabpanel')).toHaveTextContent('invoice picture')
    await user.click(screen.getByRole('tab', { name: 'Reminders' }))
    expect(onValueChange).toHaveBeenCalledWith('reminders')
    expect(screen.getByRole('tab', { name: 'Reminders' })).toHaveAttribute('aria-selected', 'true')
  })

  test('controlled: value decides the open tab, and a pick only asks for a change', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = reduced(<FeatureTabs value="traces" onValueChange={onValueChange} />)
    expect(screen.getByRole('tab', { name: /Traces/ })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('tab', { name: /Alerts/ }))
    expect(onValueChange).toHaveBeenCalledWith('alerts')
    expect(screen.getByRole('tab', { name: /Traces/ })).toHaveAttribute('aria-selected', 'true')
    rerender(
      <YoujProvider reducedMotion="always">
        <FeatureTabs value="alerts" onValueChange={onValueChange} />
      </YoujProvider>,
    )
    expect(screen.getByRole('tab', { name: /Alerts/ })).toHaveAttribute('aria-selected', 'true')
  })
})
