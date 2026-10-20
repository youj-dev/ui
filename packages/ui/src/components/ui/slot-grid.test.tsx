import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { SlotGrid, type SlotGridSlot } from './slot-grid'

const at = (day: number, hour: number) => new Date(2026, 8, 28 + day, hour).getTime()
const SLOTS: SlotGridSlot[] = [
  { id: 'a', start: at(0, 7), left: 3, capacity: 8 },
  { id: 'b', start: at(0, 10), left: 0, capacity: 8 },
  { id: 'c', start: at(1, 7), left: 1, capacity: 8 },
  { id: 'd', start: at(1, 10), left: 5, capacity: 8, mine: true },
  { id: 'e', start: at(2, 10), left: 8, capacity: 8 },
]
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const cell = (name: string) => screen.getByRole('gridcell', { name })

describe('SlotGrid', () => {
  test('lays the week out as a grid, days across and times down, every cell spoken with its state', () => {
    reduced(<SlotGrid slots={SLOTS} days={3} layout="week" />)
    const grid = screen.getByRole('grid', { name: 'Available times' })
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(3)
    expect(within(grid).getAllByRole('rowheader').map((h) => h.textContent)).toEqual(['07:00', '10:00'])
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(6)
    expect(cell('Monday, September 28, 07:00, 3 left')).toHaveAttribute('data-state', 'open')
    expect(cell('Monday, September 28, 10:00, Full')).toHaveAttribute('aria-disabled', 'true')
    expect(cell('Tuesday, September 29, 07:00, 1 left')).toHaveAttribute('data-state', 'few')
    expect(cell('Tuesday, September 29, 10:00, Yours')).toHaveAttribute('data-state', 'mine')
    expect(cell('Wednesday, September 30, 07:00, Unavailable')).toHaveAttribute('data-state', 'closed')
    // Three of eight places lit for a:3 of 8; none for the full slot.
    const lit = (name: string) => cell(name).querySelectorAll('[data-slot=slot-grid-pip][data-state=on]').length
    expect(lit('Monday, September 28, 07:00, 3 left')).toBe(3)
    expect(lit('Monday, September 28, 10:00, Full')).toBe(0)
  })

  test('is one tab stop that the arrow keys, Home and End walk', async () => {
    const user = userEvent.setup()
    reduced(<SlotGrid slots={SLOTS} days={3} layout="week" />)
    expect(screen.getAllByRole('gridcell').filter((c) => c.tabIndex === 0)).toHaveLength(1)
    await user.tab()
    expect(cell('Monday, September 28, 07:00, 3 left')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(cell('Tuesday, September 29, 07:00, 1 left')).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(cell('Tuesday, September 29, 10:00, Yours')).toHaveFocus()
    await user.keyboard('{Home}')
    expect(cell('Monday, September 28, 10:00, Full')).toHaveFocus()
    await user.keyboard('{Control>}{End}{/Control}')
    expect(cell('Wednesday, September 30, 10:00, 8 left')).toHaveFocus()
    await user.keyboard('{ArrowDown}{ArrowRight}')
    expect(cell('Wednesday, September 30, 10:00, 8 left')).toHaveFocus()
  })

  test('mirrors left and right in RTL', async () => {
    const user = userEvent.setup()
    reduced(
      <div dir="rtl">
        <SlotGrid slots={SLOTS} days={3} layout="week" />
      </div>,
    )
    await user.tab()
    await user.keyboard('{ArrowLeft}')
    expect(cell('Tuesday, September 29, 07:00, 1 left')).toHaveFocus()
  })

  test('Enter or a click picks a slot with room and reports it; full and booked slots stay unpicked', async () => {
    const user = userEvent.setup()
    const picks: string[] = []
    reduced(<SlotGrid slots={SLOTS} days={3} layout="week" onValueChange={(id) => picks.push(id)} />)
    await user.tab()
    await user.keyboard('{ArrowRight}{Enter}')
    expect(cell('Tuesday, September 29, 07:00, 1 left')).toHaveAttribute('aria-selected', 'true')
    await user.click(cell('Monday, September 28, 10:00, Full'))
    await user.click(cell('Tuesday, September 29, 10:00, Yours'))
    await user.click(cell('Wednesday, September 30, 10:00, 8 left'))
    expect(picks).toEqual(['c', 'e'])
    expect(cell('Tuesday, September 29, 07:00, 1 left')).toHaveAttribute('aria-selected', 'false')
    expect(cell('Wednesday, September 30, 10:00, 8 left')).toHaveAttribute('data-picked')
  })

  test('the day view shows one day under a day picker, and left and right step the day', async () => {
    const user = userEvent.setup()
    reduced(<SlotGrid slots={SLOTS} days={3} layout="day" />)
    const days = screen.getByRole('group', { name: 'Days' })
    expect(within(days).getAllByRole('button')).toHaveLength(3)
    expect(within(days).getByRole('button', { name: 'Monday, September 28, 1 open' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('gridcell')).toHaveLength(2)
    await user.tab()
    await user.tab()
    expect(cell('Monday, September 28, 07:00, 3 left')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(cell('Tuesday, September 29, 07:00, 1 left')).toHaveFocus()
    expect(within(days).getByRole('button', { name: 'Tuesday, September 29, 1 open' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(days).getByRole('button', { name: /^Wednesday/ }))
    expect(screen.getByRole('gridcell', { name: 'Wednesday, September 30, 10:00, 8 left' })).toBeInTheDocument()
  })

  test('with motion, the cells wait for the grid to come into view; reduced motion draws them in place', () => {
    const { unmount } = render(<SlotGrid slots={SLOTS} days={3} layout="week" />)
    expect(screen.getAllByRole('gridcell')[0]).toHaveClass('opacity-0')
    unmount()
    reduced(<SlotGrid slots={SLOTS} days={3} layout="week" />)
    expect(screen.getAllByRole('gridcell')[0]).not.toHaveClass('opacity-0')
    expect(document.querySelector('[data-slot=slot-grid]')).toHaveAttribute('data-reduced-motion')
  })

  test('speaks the provider’s language', () => {
    render(
      <YoujProvider reducedMotion="always" locale="de-DE" labels={de}>
        <SlotGrid slots={SLOTS} days={3} layout="week" />
      </YoujProvider>,
    )
    expect(screen.getByRole('grid', { name: 'Verfügbare Zeiten' })).toBeInTheDocument()
    expect(cell('Montag, 28. September, 07:00, noch 3')).toBeInTheDocument()
    expect(cell('Montag, 28. September, 10:00, Ausgebucht')).toBeInTheDocument()
  })
})
