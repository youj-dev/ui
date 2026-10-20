import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SoundCueContext } from '@youj/core/internal'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SeatMap, type SeatMapRow, type SeatMapTier } from './seat-map'

const TIERS: SeatMapTier[] = [
  { id: 'front', name: 'Front', price: 68 },
  { id: 'back', name: 'Back', price: 32 },
]
const ROWS: SeatMapRow[] = [
  { id: 'A', label: 'A', seats: [1, 2, 3, 4].map((n) => ({ id: `A${n}`, number: n, tier: 'front', unavailable: n === 3 })) },
  { id: 'B', label: 'B', seats: [1, 2, 3].map((n) => ({ id: `B${n}`, number: n, tier: 'back' })) },
]

const seat = (id: string) => document.querySelector<HTMLElement>(`[data-seat-id="${id}"]`)!
const setup = (props: Partial<React.ComponentProps<typeof SeatMap>> = {}, sink = vi.fn()) =>
  render(
    <SoundCueContext.Provider value={sink}>
      <YoujProvider reducedMotion="always">
        <SeatMap rows={ROWS} tiers={TIERS} aisles={[2]} locale="en-GB" {...props} />
      </YoujProvider>
    </SoundCueContext.Provider>,
  )

describe('SeatMap', () => {
  test('is a grid of rows whose seats say their row, number, price and status', () => {
    setup({ defaultValue: ['B2'] })
    expect(screen.getByRole('grid', { name: 'Seat map' })).toHaveAccessibleDescription('Arrow keys move between seats; Space or Enter picks one.')
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(seat('A1')).toHaveAccessibleName('Row A, seat 1, €68, available')
    expect(seat('A3')).toHaveAccessibleName('Row A, seat 3, €68, unavailable')
    expect(seat('A3')).toHaveAttribute('aria-disabled', 'true')
    expect(seat('B2')).toHaveAccessibleName('Row B, seat 2, €32, selected')
    expect(seat('B2')).toHaveAttribute('aria-selected', 'true')
    // An aisle after the second seat of each row.
    expect(document.querySelectorAll('[data-slot=seat-map-aisle]')).toHaveLength(2)
  })

  test('a tier with no price names its seats without one, and your format rewrites the others', () => {
    setup({ tiers: [{ id: 'front', name: 'Front', price: 68 }, { id: 'back', name: 'Back' }], format: (price) => `${price} pts` })
    expect(seat('A1')).toHaveAccessibleName('Row A, seat 1, 68 pts, available')
    expect(seat('B1')).toHaveAccessibleName('Row B, Seat 1, available')
    expect(document.querySelector('[data-slot=seat-map-legend]')).toHaveTextContent('Front68 pts')
    expect(document.querySelector('[data-slot=seat-map-legend]')).not.toHaveTextContent('Back€')
  })

  test('Space picks and lets go, with toggle cues and announcements', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const sink = vi.fn()
    setup({ onValueChange }, sink)
    await user.tab()
    expect(seat('A1')).toHaveFocus()
    await user.keyboard(' ')
    expect(onValueChange).toHaveBeenLastCalledWith(['A1'])
    expect(seat('A1')).toHaveAttribute('aria-selected', 'true')
    expect(sink).toHaveBeenLastCalledWith('toggleOn', true)
    expect(screen.getByRole('status')).toHaveTextContent('Row A, seat 1 added')
    await user.keyboard('{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith([])
    expect(sink).toHaveBeenLastCalledWith('toggleOff', true)
    expect(screen.getByRole('status')).toHaveTextContent('Row A, seat 1 removed')
  })

  test('arrows move seat to seat and row to row, Home and End to a row’s ends', async () => {
    const user = userEvent.setup()
    setup()
    await user.tab()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(seat('A3')).toHaveFocus()
    await user.keyboard('{ArrowRight}{ArrowDown}')
    // The fourth seat has no seat below in the three-seat row: the nearest is B3.
    expect(seat('B3')).toHaveFocus()
    await user.keyboard('{Home}')
    expect(seat('B1')).toHaveFocus()
    await user.keyboard('{ArrowUp}{End}')
    expect(seat('A4')).toHaveFocus()
    expect(document.querySelectorAll('[data-slot=seat-map-seat][tabindex="0"]')).toHaveLength(1)
  })

  test('taken seats can’t be picked, and the limit stops a pick with the error cue', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const sink = vi.fn()
    setup({ onValueChange, max: 1, defaultValue: ['A1'] }, sink)
    await user.click(seat('A3'))
    expect(onValueChange).not.toHaveBeenCalled()
    await user.click(seat('B1'))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(sink).toHaveBeenLastCalledWith('error', true)
    expect(screen.getByRole('status')).toHaveTextContent('You can pick up to 1 seat')
  })

  test('keeps the venue’s left and right in RTL', async () => {
    const user = userEvent.setup()
    render(
      <div dir="rtl">
        <YoujProvider reducedMotion="always">
          <SeatMap rows={ROWS} tiers={TIERS} />
        </YoujProvider>
      </div>,
    )
    expect(screen.getByRole('grid')).toHaveAttribute('dir', 'ltr')
    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(seat('A2')).toHaveFocus()
  })

  describe('a plan wider than its room', () => {
    afterEach(() => vi.restoreAllMocks())

    test('opens on its centre and fades the edges it can scroll toward', () => {
      vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(600)
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300)
      setup()
      const view = document.querySelector<HTMLElement>('[data-slot=seat-map-viewport]')!
      expect(view).toHaveAttribute('dir', 'ltr')
      expect(view.scrollLeft).toBe(150)
      expect(view).toHaveAttribute('data-overflow-start')
      expect(view).toHaveAttribute('data-overflow-end')
    })

    test('a plan that fits neither scrolls nor fades', () => {
      setup()
      const view = document.querySelector<HTMLElement>('[data-slot=seat-map-viewport]')!
      expect(view.scrollLeft).toBe(0)
      expect(view).not.toHaveAttribute('data-overflow-start')
      expect(view).not.toHaveAttribute('data-overflow-end')
    })

    test('arrowing to a seat scrolls it clear of the fades', async () => {
      const user = userEvent.setup()
      const scrollIntoView = vi.fn()
      HTMLElement.prototype.scrollIntoView = scrollIntoView
      setup()
      await user.tab()
      await user.keyboard('{ArrowRight}')
      expect(seat('A2')).toHaveFocus()
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest', behavior: 'auto' })
      expect(scrollIntoView.mock.contexts.at(-1)).toBe(seat('A2'))
      delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView
    })
  })
})
