import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SeatPlan, type SeatPlanRow, type SeatPlanTier } from './seat-plan'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const tiers: SeatPlanTier[] = [
  { id: 'legroom', name: 'Extra legroom', price: 45 },
  { id: 'standard', name: 'Standard' },
]
const rows: SeatPlanRow[] = [
  { id: '1', label: '1', seats: [1, 2, 3, 4].map((n) => ({ id: `1${'ABCD'[n - 1]}`, number: n, label: `1${'ABCD'[n - 1]}`, tier: 'legroom' })) },
  { id: '2', label: '2', seats: [1, 2, 3, 4].map((n) => ({ id: `2${'ABCD'[n - 1]}`, number: n, label: `2${'ABCD'[n - 1]}`, tier: 'standard' })) },
]

describe('SeatPlan', () => {
  test('picking a seat adds it to the selection and the total; removing it takes it off', async () => {
    const user = userEvent.setup()
    reduced(<SeatPlan defaultPicked={[]} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Nightjar' })).toBeInTheDocument()
    await user.click(screen.getByRole('gridcell', { name: 'Row J, seat 3, €32, available' }))
    expect(screen.getByRole('gridcell', { name: 'Row J, seat 3, €32, selected' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Row J · Seat 3')).toBeInTheDocument()
    expect(screen.getByText('1 of 8')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove J3' }))
    expect(screen.queryByText('Row J · Seat 3')).toBeNull()
  })

  test('the demo opens with two seats, fees and a timer', () => {
    reduced(<SeatPlan />)
    expect(screen.getByText('Booking fees')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('9:12')
  })

  test('a tier with no price shows none, and with no price anywhere the sums, the fees and the timer go', async () => {
    const user = userEvent.setup()
    reduced(<SeatPlan rows={rows} tiers={[{ id: 'legroom', name: 'Zone one' }, { id: 'standard', name: 'Zone two' }]} aisles={[2]} defaultPicked={[]} hold={null} max={1} copy={{ selection: 'Your seat', seat: (row: string, n: number) => `Row ${row} · Desk ${n}` }} />)
    await user.click(screen.getByRole('gridcell', { name: 'Row 2, Seat 3, available' }))
    expect(screen.getByText('Row 2 · Desk 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove 2C' })).toBeInTheDocument()
    expect(screen.queryByText('Total')).toBeNull()
    expect(screen.queryByText('Booking fees')).toBeNull()
    expect(screen.queryByRole('timer')).toBeNull()
    expect(document.body).not.toHaveTextContent('€')
  })

  test('mixed tiers: only the priced seat carries a price, a fee of 0 drops the fees line, and format rewrites the amounts', async () => {
    const user = userEvent.setup()
    reduced(<SeatPlan rows={rows} tiers={tiers} aisles={[2]} defaultPicked={['1A', '2A']} fee={0} format={(price) => `${price} pts`} />)
    expect(screen.getByRole('gridcell', { name: 'Row 1, seat 1, 45 pts, selected' })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: 'Row 2, Seat 1, selected' })).toBeInTheDocument()
    expect(screen.getAllByText('45 pts').length).toBeGreaterThan(0)
    expect(screen.queryByText('Booking fees')).toBeNull()
    expect(screen.queryByText('0 pts')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Remove 1A' }))
    expect(screen.getByText('1 of 8')).toBeInTheDocument()
  })

  test('max limits the picks, and onConfirm gets the picked seats', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    reduced(<SeatPlan rows={rows} tiers={tiers} aisles={[2]} defaultPicked={[]} max={1} onConfirm={onConfirm} />)
    await user.click(screen.getByRole('gridcell', { name: 'Row 1, seat 1, €45, available' }))
    expect(screen.getByText('1 of 1')).toBeInTheDocument()
    await user.click(screen.getByRole('gridcell', { name: 'Row 1, seat 2, €45, available' }))
    expect(screen.getByText('1 of 1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Checkout' }))
    expect(onConfirm).toHaveBeenCalledWith(['1A'])
  })

  test('copy rewrites the title and the selection, and the stage word follows stage', () => {
    reduced(<SeatPlan rows={rows} tiers={tiers} defaultPicked={[]} stage="Front of cabin" copy={{ title: 'Choose your seats', selection: 'Passengers' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Choose your seats' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Passengers' })).toBeInTheDocument()
    expect(screen.getByText('Front of cabin')).toBeInTheDocument()
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<SeatPlan embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Nightjar' })).toBeInTheDocument()
  })

  test('with no rows it shows the empty state instead of the plan', () => {
    reduced(<SeatPlan rows={[]} />)
    expect(screen.getByText('No seats to pick')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).toBeNull()
  })

  test('your empty node replaces the default message', () => {
    reduced(<SeatPlan rows={[]} empty={<p>Seating opens Monday</p>} />)
    expect(screen.getByText('Seating opens Monday')).toBeInTheDocument()
    expect(screen.queryByText('No seats to pick')).toBeNull()
  })

  test('an error shows its message and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<SeatPlan error="Couldn’t load the seats." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the seats.')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).toBeNull()
    expect(screen.queryByText('Row F · Seat 7')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the plan’s place and shows no picked seats beside it', () => {
    reduced(<SeatPlan loading />)
    expect(screen.getByText('Loading the seats')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).toBeNull()
    expect(screen.queryByText('Row F · Seat 7')).toBeNull()
    expect(screen.queryByText('1 of 8')).toBeNull()
  })
})
