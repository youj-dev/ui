import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { HourLanes } from './hour-lanes'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const stat = (name: string) => screen.getByText(name, { selector: '[data-slot=eyebrow]' }).closest('div')!.querySelector('dd')!
const highlighted = () => document.querySelectorAll('[data-slot=density-lanes-column][data-highlighted]').length
const lane = { id: 'fw', label: 'Firewall', tone: 'chart-2' as const, values: Array.from({ length: 24 }, (_, h) => (h === 3 ? 40 : 2)) }

describe('HourLanes', () => {
  test('draws a lane per source across the day, as a section with an h2', () => {
    reduced(<HourLanes />)
    expect(screen.getByRole('heading', { level: 2, name: 'Alerts by hour' })).toBeInTheDocument()
    const grid = screen.getByRole('grid', { name: 'Alerts by time of day, per source' })
    expect(within(grid).getAllByRole('row')).toHaveLength(6)
    expect(within(grid).getAllByRole('rowheader')[0]).toHaveTextContent('Identity26%')
    expect(within(grid).getAllByRole('gridcell')[25]).toHaveAccessibleName('12:30: 65 alerts')
  })

  test('flags the peak and sums it up in the foot', () => {
    reduced(<HourLanes />)
    expect(screen.getByText('Peak 12:00 · 232 alerts')).toBeInTheDocument()
    expect(stat('Peak hour')).toHaveTextContent('12:00')
    expect(stat('Off-hours')).toHaveTextContent('30%')
    expect(stat('Night lead')).toHaveTextContent('Network')
  })

  test('the Off-hours switch keeps the night in color', async () => {
    const user = userEvent.setup()
    const onShowOffHoursChange = vi.fn()
    reduced(<HourLanes onShowOffHoursChange={onShowOffHoursChange} />)
    expect(highlighted()).toBe(0)
    await user.click(screen.getByRole('switch', { name: 'Off-hours' }))
    expect(onShowOffHoursChange).toHaveBeenCalledWith(true)
    expect(highlighted()).toBeGreaterThan(0)
    expect(within(screen.getByRole('grid')).getAllByRole('gridcell')[2]).toHaveAccessibleName(/, highlighted$/)
    expect(within(screen.getByRole('grid')).getAllByRole('gridcell')[24]).not.toHaveAccessibleName(/highlighted/)
  })

  test('your lanes, hours and words drive the content', () => {
    reduced(<HourLanes lanes={[lane]} offHours={[18, 8]} copy={{ title: 'Alarms', peakHour: 'Busiest' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Alarms' })).toBeInTheDocument()
    expect(within(screen.getByRole('grid')).getAllByRole('gridcell')).toHaveLength(24)
    expect(stat('Busiest')).toHaveTextContent('03:00')
    expect(stat('Night lead')).toHaveTextContent('Firewall')
  })

  test('copy words the unit, and format words the counts, in the cells and the peak flag', () => {
    reduced(<HourLanes lanes={[lane]} format={(n) => `${n}k`} copy={{ countLabel: (c: string) => `${c} visits` }} />)
    expect(within(screen.getByRole('grid')).getAllByRole('gridcell')[3]).toHaveAccessibleName('03:00: 40k visits')
    expect(screen.getByText('Peak 03:00 · 40k visits')).toBeInTheDocument()
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<HourLanes embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Alerts by hour' })).toBeInTheDocument()
  })

  test('loading holds the lanes’ place and the foot’s figures', () => {
    reduced(<HourLanes loading />)
    expect(screen.getByText('Loading the chart')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    expect(stat('Peak hour')).not.toHaveTextContent('12:00')
    expect(stat('Peak hour').querySelector('[data-slot=skeleton]')).not.toBeNull()
  })

  test('no lanes shows the empty state, and your empty node replaces it', () => {
    const { unmount } = reduced(<HourLanes lanes={[]} />)
    expect(screen.getByText('Nothing to show')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    expect(stat('Peak hour')).toHaveTextContent('—')
    unmount()
    reduced(<HourLanes lanes={[]} empty={<p>Connect a source</p>} />)
    expect(screen.getByText('Connect a source')).toBeInTheDocument()
    expect(screen.queryByText('Nothing to show')).not.toBeInTheDocument()
  })

  test('an error shows its message, dashes the figures, and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<HourLanes error="Couldn’t load the counts." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the counts.')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    expect(stat('Night lead')).toHaveTextContent('—')
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
