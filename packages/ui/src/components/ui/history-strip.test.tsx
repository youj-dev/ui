import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { HistoryStrip, type UptimeDay } from './history-strip'

const DAYS: UptimeDay[] = [
  { date: '2026-09-24', uptime: 1, incidents: 0 },
  { date: '2026-09-25', uptime: null },
  { date: '2026-09-26', uptime: 1 - 9 / 1440, incidents: 1, note: 'Config push' },
  { date: '2026-09-27', uptime: 1 - 192 / 1440, downtimeMinutes: 192, incidents: 2 },
  { date: '2026-09-28', uptime: 0.9995, incidents: 0 },
]
const reduced = (ui: React.ReactNode) => <YoujProvider reducedMotion="always">{ui}</YoujProvider>
const cells = () => screen.getAllByRole('listitem')
const focused = () => document.activeElement?.getAttribute('aria-label')

describe('HistoryStrip', () => {
  test('is a named group holding a list of days, each named with its date, uptime, downtime and incidents', () => {
    render(reduced(<HistoryStrip days={DAYS} label="Daily uptime, api" />))
    const group = screen.getByRole('group', { name: 'Daily uptime, api' })
    expect(within(group).getAllByRole('listitem').map((c) => c.getAttribute('aria-label'))).toEqual([
      'Thu, Sep 24: 100% uptime',
      'Fri, Sep 25: no data',
      'Sat, Sep 26: 99.37% uptime, 9 min down, 1 incident. Config push',
      'Sun, Sep 27: 86.66% uptime, 3 hr 12 min down, 2 incidents',
      'Mon, Sep 28: 99.95% uptime, 1 min down',
    ])
  })

  test('describes the window: days, the average and how many had downtime', () => {
    render(reduced(<HistoryStrip days={DAYS} />))
    expect(screen.getByRole('group', { name: 'Uptime' })).toHaveAccessibleDescription('5 days at 96.49% uptime on average. 3 days with downtime.')
  })

  test('tones each day by the target and critical lines, and marks days without data', () => {
    render(reduced(<HistoryStrip days={DAYS} />))
    expect(cells().map((c) => c.getAttribute('data-tone'))).toEqual(['success', 'none', 'warning', 'danger', 'success'])
    // A looser target turns the 99.37% day healthy.
    render(reduced(<HistoryStrip days={DAYS} target={0.99} critical={0.9} label="Loose" />))
    expect(within(screen.getByRole('group', { name: 'Loose' })).getAllByRole('listitem').map((c) => c.getAttribute('data-tone'))).toEqual([
      'success',
      'none',
      'success',
      'danger',
      'success',
    ])
  })

  test('one tab stop on today; arrows step a day, Page keys a week, Home and End go to the ends', async () => {
    const user = userEvent.setup()
    render(reduced(<HistoryStrip days={DAYS} />))
    expect(cells().map((c) => c.tabIndex)).toEqual([-1, -1, -1, -1, 0])
    await user.tab()
    expect(focused()).toMatch(/^Mon, Sep 28/)
    await user.keyboard('{ArrowLeft}')
    expect(focused()).toMatch(/^Sun, Sep 27/)
    expect(cells().map((c) => c.tabIndex)).toEqual([-1, -1, -1, 0, -1])
    await user.keyboard('{PageUp}')
    expect(focused()).toMatch(/^Thu, Sep 24/)
    await user.keyboard('{ArrowLeft}')
    expect(focused()).toMatch(/^Thu, Sep 24/)
    await user.keyboard('{ArrowRight}')
    expect(focused()).toMatch(/^Fri, Sep 25/)
    await user.keyboard('{PageDown}')
    expect(focused()).toMatch(/^Mon, Sep 28/)
    await user.keyboard('{Home}')
    expect(focused()).toMatch(/^Thu, Sep 24/)
    await user.keyboard('{End}')
    expect(focused()).toMatch(/^Mon, Sep 28/)
  })

  test('mirrors the arrow keys in a right-to-left document', async () => {
    const user = userEvent.setup()
    render(
      <div dir="rtl">
        {reduced(<HistoryStrip days={DAYS} />)}
      </div>,
    )
    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(focused()).toMatch(/^Sun, Sep 27/)
    await user.keyboard('{ArrowLeft}')
    expect(focused()).toMatch(/^Mon, Sep 28/)
  })

  test('hovering a day shows its date, uptime, downtime, incidents and note', async () => {
    const user = userEvent.setup()
    render(reduced(<HistoryStrip days={DAYS} />))
    await user.hover(cells()[2]!)
    await waitFor(() => expect(document.querySelector('[data-slot=history-strip-tooltip]')).toHaveTextContent('Sat, Sep 2699.37%· 9 min down1 incidentConfig push'))
    expect(cells()[2]).toHaveAttribute('data-active')
    await user.hover(cells()[1]!)
    await waitFor(() => expect(document.querySelector('[data-slot=history-strip-tooltip]')).toHaveTextContent('Fri, Sep 25: no data'))
  })

  test('as decoration it has no tab stops and is hidden from assistive technology', () => {
    const { container } = render(reduced(<HistoryStrip days={DAYS} interactive={false} size="sm" />))
    const root = container.querySelector('[data-slot=history-strip]')!
    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root).toHaveAttribute('data-size', 'sm')
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
    expect(container.querySelectorAll('[tabindex]')).toHaveLength(0)
    expect(container.querySelector('[data-slot=history-strip-axis]')).toBeNull()
  })

  test('marks days with incidents with a pip', () => {
    const { container } = render(reduced(<HistoryStrip days={DAYS} />))
    expect(container.querySelectorAll('[data-slot=history-strip-pip]')).toHaveLength(2)
  })

  test('with reduced motion the cells are drawn in place', () => {
    const { container } = render(reduced(<HistoryStrip days={DAYS} />))
    expect(container.querySelector('[data-slot=history-strip]')).toHaveAttribute('data-reduced-motion')
    for (const bar of container.querySelectorAll<HTMLElement>('[data-slot=history-strip-bar]')) {
      expect(bar).toHaveClass('scale-y-100')
      expect(bar.style.transitionDelay).toBe('')
    }
  })

  test('speaks the provider’s labels', () => {
    render(
      <YoujProvider reducedMotion="always" labels={{ uptime: 'Verfügbarkeit', uptimeNoData: (date) => `${date}: keine Daten` }}>
        <HistoryStrip days={DAYS} />
      </YoujProvider>,
    )
    expect(screen.getByRole('group', { name: 'Verfügbarkeit' })).toBeInTheDocument()
    expect(cells()[1]).toHaveAttribute('aria-label', 'Fri, Sep 25: keine Daten')
  })

  test('without measured days there is no summary; unmounting with a tooltip open leaves nothing behind', async () => {
    const user = userEvent.setup()
    const { unmount } = render(reduced(<HistoryStrip days={[{ date: '2026-09-28', uptime: null }]} />))
    expect(screen.getByRole('group', { name: 'Uptime' })).not.toHaveAttribute('aria-describedby')
    await user.hover(cells()[0]!)
    await waitFor(() => expect(document.querySelector('[data-slot=history-strip-tooltip]')).toBeInTheDocument())
    unmount()
    expect(document.querySelector('[data-slot=history-strip-tooltip]')).toBeNull()
  })
})
