import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { RoadmapTimeline } from './roadmap-timeline'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const stat = (name: string) => screen.getByText(name, { selector: '[data-slot=eyebrow]' }).closest('div')!.querySelector('dd')!

describe('RoadmapTimeline', () => {
  test('puts the year on a ruler, a pin per milestone, as a section with an h2', () => {
    reduced(<RoadmapTimeline />)
    expect(screen.getByRole('heading', { level: 2, name: '2026 roadmap' })).toBeInTheDocument()
    expect(screen.getByText('7 milestones')).toBeInTheDocument()
    const ruler = screen.getByRole('listbox', { name: 'Milestones this year' })
    // Mobile beta and Public API land two days apart and share a pin.
    expect(within(ruler).getAllByRole('option')).toHaveLength(6)
    expect(within(ruler).getByRole('option', { name: 'SSO and audit log, Oct 28, At risk' })).toHaveAttribute('aria-selected', 'true')
  })

  test('the foot counts what shipped, how soon the next lands and what is at risk', () => {
    reduced(<RoadmapTimeline />)
    expect(stat('Shipped')).toHaveTextContent('5 of 7')
    expect(stat('Next')).toHaveTextContent('in 15 days')
    expect(stat('At risk')).toHaveTextContent('1')
  })

  test('picking a milestone reports it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<RoadmapTimeline onValueChange={onValueChange} />)
    await user.click(screen.getByRole('option', { name: /^Version 2/ }))
    expect(onValueChange).toHaveBeenCalledWith('v2')
    expect(document.querySelector('[data-slot=milestone-ruler-callout]')).toHaveTextContent('Rebuilt sync engine')
  })

  test('your milestones, year, day and words drive the content', () => {
    reduced(
      <RoadmapTimeline
        year={2027}
        today="2027-03-18"
        items={[
          { id: 'alpha', date: '2027-03-02', title: 'Alpha' },
          { id: 'beta', date: '2027-07-06', title: 'Beta', major: true },
          { id: 'old', date: '2026-12-01', title: 'Last year' },
        ]}
        statuses={[
          { id: 'done', label: 'Done', role: 'done' },
          { id: 'upcoming', label: 'Upcoming', role: 'upcoming' },
          { id: 'at-risk', label: 'At risk', tone: 'warning', role: 'attention' },
        ]}
        copy={{ title: (year) => `Plan ${year}` }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Plan 2027' })).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(2)
    expect(stat('Done')).toHaveTextContent('1 of 2')
    expect(stat('Next')).toHaveTextContent('in 110 days')
    expect(stat('At risk')).toHaveTextContent('0')
  })

  test('with no milestones the ruler says so and the counts are empty', () => {
    reduced(<RoadmapTimeline items={[]} year={2026} today="2026-10-13" />)
    expect(screen.getByText('No milestones')).toBeInTheDocument()
    expect(stat('Next')).toHaveTextContent('None')
  })

  test('your statuses name the foot, drive the pins and count what needs attention', () => {
    reduced(
      <RoadmapTimeline
        year={2027}
        today="2027-04-05"
        statuses={[
          { id: 'complete', label: 'Complete', role: 'done' },
          { id: 'scheduled', label: 'Scheduled', role: 'upcoming' },
          { id: 'delayed', label: 'Delayed', tone: 'danger', role: 'attention' },
        ]}
        items={[
          { id: 'a', date: '2027-02-08', title: 'Demolition', status: 'complete' },
          { id: 'b', date: '2027-04-12', title: 'Inspection', status: 'delayed' },
          { id: 'c', date: '2027-05-03', title: 'Drywall' },
        ]}
      />,
    )
    expect(stat('Complete')).toHaveTextContent('1 of 3')
    expect(stat('Delayed')).toHaveTextContent('1')
    expect(stat('Delayed').querySelector('.bg-danger')).not.toBeNull()
    expect(screen.queryByText('Shipped', { selector: '[data-slot=eyebrow]' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: /^Inspection/ })).toHaveAccessibleName(expect.stringContaining('At risk'))
    expect(stat('Next')).toHaveTextContent('in 7 days')
  })

  test('statuses without a done or attention role leave those figures out of the foot', () => {
    reduced(<RoadmapTimeline statuses={[{ id: 'planned', label: 'Planned', role: 'upcoming' }]} />)
    expect(screen.queryByText('Shipped', { selector: '[data-slot=eyebrow]' })).not.toBeInTheDocument()
    expect(screen.getByText('Next', { selector: '[data-slot=eyebrow]' })).toBeInTheDocument()
  })

  test('an error shows its message, dashes the figures and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<RoadmapTimeline error="Couldn’t load the timeline." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the timeline.')).toBeInTheDocument()
    expect(stat('Shipped')).toHaveTextContent('—')
    expect(screen.queryByText('7 milestones')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the ruler and the figures as skeletons', () => {
    reduced(<RoadmapTimeline loading />)
    expect(screen.getByText('Loading the timeline')).toBeInTheDocument()
    expect(stat('Shipped').querySelector('[data-slot=skeleton]')).not.toBeNull()
    expect(screen.queryByText('7 milestones')).not.toBeInTheDocument()
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<RoadmapTimeline embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: '2026 roadmap' })).toBeInTheDocument()
  })
})
