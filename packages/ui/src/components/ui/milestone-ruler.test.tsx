import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { MilestoneRuler, type Milestone } from './milestone-ruler'

const MILESTONES: Milestone[] = [
  { id: 'beta', date: '2026-03-02', title: 'Beta', description: 'For ten pilot teams', major: true },
  { id: 'android', date: '2026-06-01', title: 'Android app' },
  { id: 'ios', date: '2026-06-02', title: 'iOS app' },
  { id: 'pricing', date: '2026-09-15', title: 'New pricing', status: 'at-risk' },
  { id: 'v2', date: '2026-11-26', title: 'Version 2', description: 'Rebuilt sync engine', major: true },
]
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const callout = () => document.querySelector('[data-slot=milestone-ruler-callout]')

describe('MilestoneRuler', () => {
  test('is a named listbox of pins, each named by its milestone, date and status, described by a summary', () => {
    reduced(<MilestoneRuler milestones={MILESTONES} today="2026-07-01" label="Roadmap" />)
    const list = screen.getByRole('listbox', { name: 'Roadmap' })
    expect(list).toHaveAccessibleDescription('5 milestones, 3 done.')
    const pins = within(list).getAllByRole('option')
    // Android and iOS are a day apart: one pin with a count.
    expect(pins).toHaveLength(4)
    expect(pins[0]).toHaveAccessibleName('Beta, Mar 2, Done')
    expect(pins[0]).toHaveAccessibleDescription('For ten pilot teams')
    expect(pins[1]).toHaveAccessibleName('2 milestones: Android app, Jun 1, Done; iOS app, Jun 2, Done')
    expect(pins[1]).toHaveAttribute('data-yj-count', '2')
    expect(pins[2]).toHaveAccessibleName('New pricing, Sep 15, At risk')
    expect(pins.map((p) => p.getAttribute('data-status'))).toEqual(['done', 'done', 'at-risk', 'upcoming'])
  })

  test('shows the next milestone from today by default, and marks today and the months', () => {
    reduced(<MilestoneRuler milestones={MILESTONES} today="2026-07-01" />)
    expect(screen.getByRole('option', { name: /^New pricing/ })).toHaveAttribute('aria-selected', 'true')
    expect(callout()).toHaveTextContent('Sep 15 · At risk')
    expect(callout()).toHaveTextContent('New pricing')
    expect(document.querySelector('[data-slot=milestone-ruler-today]')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot=milestone-ruler-month]')).toHaveLength(12)
  })

  test('is one tab stop: the arrows walk the pins, selection follows focus, Home and End go to the ends', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<MilestoneRuler milestones={MILESTONES} today="2026-07-01" onValueChange={onValueChange} />)
    await user.tab()
    expect(document.activeElement).toHaveAccessibleName('New pricing, Sep 15, At risk')
    expect(screen.getAllByRole('option').filter((o) => o.tabIndex === 0)).toHaveLength(1)
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toHaveAccessibleName('Version 2, Nov 26, Upcoming')
    expect(onValueChange).toHaveBeenLastCalledWith('v2')
    expect(callout()).toHaveTextContent('Rebuilt sync engine')
    await user.keyboard('{Home}')
    expect(document.activeElement).toHaveAccessibleName('Beta, Mar 2, Done')
    await user.keyboard('{ArrowLeft}{End}{ArrowLeft}')
    expect(document.activeElement).toHaveAccessibleName('New pricing, Sep 15, At risk')
    expect(onValueChange).toHaveBeenLastCalledWith('pricing')
  })

  test('a shared pin lists its milestones in the callout', async () => {
    const user = userEvent.setup()
    reduced(<MilestoneRuler milestones={MILESTONES} today="2026-07-01" />)
    await user.click(screen.getByRole('option', { name: /^2 milestones/ }))
    expect(callout()).toHaveTextContent('Jun 1 – Jun 2 · Done')
    expect(callout()).toHaveTextContent('Android app')
    expect(callout()).toHaveTextContent('iOS app')
  })

  test('controlled: shows the value it is given and reports picks', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<MilestoneRuler milestones={MILESTONES} today="2026-07-01" value="beta" onValueChange={onValueChange} />)
    expect(callout()).toHaveTextContent('Beta')
    await user.click(screen.getByRole('option', { name: /^Version 2/ }))
    expect(onValueChange).toHaveBeenCalledWith('v2')
  })

  test('with no milestones it draws the year and says so', () => {
    reduced(<MilestoneRuler milestones={[]} today="2026-07-01" />)
    expect(screen.getByText('No milestones')).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot=milestone-ruler-tick]').length).toBeGreaterThan(40)
  })

  test('translates through the labels', () => {
    render(
      <YoujProvider reducedMotion="always" labels={{ milestoneRulerDone: 'Fertig', milestoneRuler: 'Meilensteine' }}>
        <MilestoneRuler milestones={MILESTONES.slice(0, 1)} today="2026-07-01" />
      </YoujProvider>,
    )
    expect(screen.getByRole('option')).toHaveAccessibleName('Beta, Mar 2, Fertig')
    expect(screen.getByRole('listbox', { name: 'Meilensteine' })).toBeInTheDocument()
  })
})
