import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { WorldClock, type WorldClockProps, type WorldClockZone } from './world-clock'

const TEAM: WorldClockZone[] = [
  { timeZone: 'Europe/London', label: 'London' },
  { timeZone: 'America/New_York', label: 'New York' },
  { timeZone: 'Asia/Singapore', label: 'Singapore' },
]

const reduced = (ui: React.ReactNode, dir?: 'rtl') => render(<YoujProvider reducedMotion="always" dir={dir}>{ui}</YoujProvider>)
const clock = (props: Partial<WorldClockProps> = {}) => reduced(<WorldClock zones={TEAM} now={Date.UTC(2026, 0, 13, 9, 7)} locale="en-GB" {...props} />)
const rows = () => screen.getAllByRole('listitem').filter((li) => li.dataset.slot === 'world-clock-zone')
/** A row's time, as the row says it to a screen reader: "05:00, Tue 13 Jan, GMT-5, Night". */
const timeIn = (label: string) => within(rows().find((r) => r.textContent?.includes(label))!).getByText((_, el) => el?.className === 'sr-only' && !!el.textContent).textContent

describe('WorldClock', () => {
  test('shows the chosen moment in every zone, with its offset and day or night', () => {
    clock({ value: Date.UTC(2026, 0, 13, 10, 0) })
    expect(screen.getByRole('group', { name: 'World clock' })).toBeInTheDocument()
    expect(rows()).toHaveLength(3)
    expect(timeIn('London')).toBe('10:00, Tue 13 Jan, GMT+0, Daytime')
    expect(timeIn('New York')).toBe('05:00, Tue 13 Jan, GMT-5, Night')
    expect(timeIn('Singapore')).toBe('18:00, Tue 13 Jan, GMT+8, Night')
  })

  test('follows the clock until a time is chosen, and Now goes back to it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    clock({ onValueChange })
    const handle = screen.getByRole('slider', { name: 'Proposed time' })
    expect(handle).toHaveTextContent('09:07')
    expect(handle).toHaveAttribute('data-state', 'live')
    expect(screen.getByRole('button', { name: 'Now' })).toBeDisabled()

    handle.focus()
    await user.keyboard('{ArrowRight}')
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(Date.UTC(2026, 0, 13, 9, 15)))
    expect(handle).toHaveTextContent('09:15')
    await user.click(screen.getByRole('button', { name: 'Now' }))
    expect(onValueChange).toHaveBeenLastCalledWith(null)
    expect(handle).toHaveTextContent('09:07')
    expect(handle).toHaveFocus()
  })

  test('keys move by the step, an hour, and to the ends of the day; mirrored in RTL', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<WorldClock zones={TEAM} defaultValue={Date.UTC(2026, 0, 13, 10, 0)} step={30} onValueChange={onValueChange} locale="en-GB" />)
    const handle = screen.getByRole('slider')
    handle.focus()
    await user.keyboard('{ArrowRight}')
    expect(handle).toHaveTextContent('10:30')
    await user.keyboard('{PageUp}')
    expect(handle).toHaveTextContent('11:30')
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}')
    expect(handle).toHaveTextContent('10:30')
    await user.keyboard('{Home}')
    expect(handle).toHaveTextContent('00:00')
    expect(handle).toHaveAttribute('aria-valuenow', '0')
    await user.keyboard('{End}')
    expect(handle).toHaveTextContent('23:30')
    expect(handle).toHaveAttribute('aria-valuetext', 'Tue 13 Jan, 23:30 in London')
    // Past the end of the day, the axis moves on to the next.
    await user.keyboard('{ArrowRight}')
    expect(handle).toHaveAttribute('aria-valuetext', 'Wed 14 Jan, 00:00 in London')
    expect(onValueChange).toHaveBeenCalledTimes(6)
  })

  test('in RTL the arrows follow the reading direction', async () => {
    const user = userEvent.setup()
    reduced(<WorldClock zones={TEAM} defaultValue={Date.UTC(2026, 0, 13, 10, 0)} locale="en-GB" />, 'rtl')
    const handle = screen.getByRole('slider')
    handle.focus()
    await user.keyboard('{ArrowLeft}')
    expect(handle).toHaveTextContent('10:15')
  })

  test('announces the moment in every zone, politely, after a change', async () => {
    const user = userEvent.setup()
    clock({ defaultValue: Date.UTC(2026, 0, 13, 10, 0) })
    screen.getByRole('slider').focus()
    await user.keyboard('{ArrowRight}')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('10:15 in London is 05:15 in New York and 18:15 in Singapore'))
  })

  test('says when a zone is on another day, and marks where its date turns over', () => {
    const { container } = clock({ value: Date.UTC(2026, 0, 13, 20, 0), zones: [TEAM[0]!, { timeZone: 'Asia/Tokyo', label: 'Tokyo' }] })
    expect(timeIn('Tokyo')).toBe('05:00, tomorrow, Wed 14 Jan, GMT+9, Night')
    const tokyo = rows()[1]!
    expect(within(tokyo).getByText('tomorrow')).toBeInTheDocument()
    expect(tokyo.querySelectorAll('[data-slot="world-clock-day-line"]')).toHaveLength(1)
    // Tokyo's midnight is 15:00 in London: the 16th hour cell names the day.
    const cells = tokyo.querySelectorAll('[data-slot="world-clock-hour"]')
    expect(cells[15]).toHaveTextContent('Wed')
    expect(container.querySelectorAll('[data-slot="world-clock-zone"]')[0]!.querySelectorAll('[data-slot="world-clock-day-line"]')).toHaveLength(0)
  })

  test('colors each hour by working hours, the hours around them, and night', () => {
    clock({ value: Date.UTC(2026, 0, 13, 10, 0), zones: [{ timeZone: 'Europe/London', label: 'London', workingHours: [8, 16.5] }] })
    const cells = [...rows()[0]!.querySelectorAll<HTMLElement>('[data-slot="world-clock-hour"]')].map((c) => c.dataset.state)
    expect(cells.slice(0, 7).every((s) => s === 'night')).toBe(true)
    expect(cells[7]).toBe('evening')
    expect(cells.slice(8, 16).every((s) => s === 'work')).toBe(true)
    // 16:00–17:00 is half work; the hour reads by its middle, 16:30, which is after.
    expect(cells[16]).toBe('evening')
    expect(cells[22]).toBe('night')
  })

  test('highlights and names the hours everyone is working', () => {
    const { container } = clock({ value: Date.UTC(2026, 0, 13, 15, 0), zones: TEAM.slice(0, 2) })
    expect(screen.getByText(/Everyone in working hours/)).toHaveTextContent(/14:00\s*–\s*17:00/)
    expect(container.querySelectorAll('[data-slot="world-clock-overlap"]')).toHaveLength(1)
    expect(screen.getByRole('group')).toHaveAttribute('data-yj-overlap')
  })

  test('says so when no hour works for everyone', () => {
    const { container } = clock({ value: Date.UTC(2026, 0, 13, 10, 0), zones: [TEAM[0]!, { timeZone: 'Pacific/Auckland', label: 'Auckland' }] })
    expect(screen.getByText('No hours when everyone is working')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="world-clock-overlap"]')).toHaveLength(0)
  })

  test('a click on the strips moves the cursor there, snapped to the step', () => {
    const onValueChange = vi.fn()
    const { container } = clock({ defaultValue: Date.UTC(2026, 0, 13, 10, 0), onValueChange })
    const track = container.querySelector<HTMLElement>('[data-slot="world-clock-track"]')!
    track.getBoundingClientRect = () => ({ left: 100, right: 580, width: 480, top: 0, bottom: 100, height: 100, x: 100, y: 0, toJSON: () => ({}) })
    fireEvent.pointerDown(track, { button: 0, clientX: 100 + 480 * (12.1 / 24), pointerId: 1 })
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(Date.UTC(2026, 0, 13, 12, 0)))
    fireEvent.pointerMove(track, { clientX: 100 + 480 * (13.7 / 24), pointerId: 1 })
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(Date.UTC(2026, 0, 13, 13, 45)))
    fireEvent.pointerUp(track, { pointerId: 1 })
    fireEvent.pointerMove(track, { clientX: 100, pointerId: 1 })
    expect(onValueChange).toHaveBeenCalledTimes(2)
  })

  test('is controlled by value', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [value, setValue] = useState<Date | null>(new Date(Date.UTC(2026, 0, 13, 10, 0)))
      return (
        <>
          <WorldClock zones={TEAM} value={value} onValueChange={setValue} now={Date.UTC(2026, 0, 13, 9, 7)} locale="en-GB" />
          <output data-testid="out">{value ? value.toISOString() : 'now'}</output>
        </>
      )
    }
    reduced(<Controlled />)
    screen.getByRole('slider').focus()
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByTestId('out')).toHaveTextContent('2026-01-13T09:45:00.000Z')
    await user.click(screen.getByRole('button', { name: 'Now' }))
    expect(screen.getByTestId('out')).toHaveTextContent('now')
  })

  test('reads 12-hour times when asked', () => {
    reduced(<WorldClock zones={TEAM} value={Date.UTC(2026, 0, 13, 15, 0)} hourCycle={12} locale="en-US" />)
    expect(screen.getByRole('slider')).toHaveTextContent('3:00 PM')
    const cells = rows()[0]!.querySelectorAll('[data-slot="world-clock-hour"]')
    expect(cells[13]).toHaveTextContent('1')
    expect(cells[1]).toHaveTextContent('1')
  })

  test('compact keeps one line per zone and drops the legend', () => {
    const { container } = clock({ value: Date.UTC(2026, 0, 13, 10, 0), compact: true })
    expect(screen.getByRole('group')).toHaveAttribute('data-yj-compact')
    expect(container.querySelector('[data-slot="world-clock-legend"]')).toBeNull()
    expect(container.querySelector('[data-slot="world-clock-offset"]')).toBeNull()
  })

  describe('changes of clocks', () => {
    const hoursOf = (container: HTMLElement) => container.querySelectorAll('[data-slot="world-clock-zone"]')[0]!.querySelectorAll('[data-slot="world-clock-hour"]')

    test('the day the clocks go forward is 23 hours long, and skips an hour', () => {
      const { container } = clock({ value: Date.UTC(2026, 2, 29, 12, 0) })
      const hours = [...hoursOf(container)].map((c) => c.textContent)
      expect(hours).toHaveLength(23)
      expect(hours.slice(0, 4)).toEqual(['0', '2', '3', '4'])
    })

    test('the day the clocks go back is 25 hours long, and repeats an hour', () => {
      const { container } = reduced(<WorldClock zones={[{ timeZone: 'America/New_York', label: 'New York' }, TEAM[0]!]} value={Date.UTC(2026, 10, 1, 16, 0)} locale="en-GB" />)
      const hours = [...hoursOf(container)].map((c) => c.textContent)
      expect(hours).toHaveLength(25)
      expect(hours.slice(0, 4)).toEqual(['0', '1', '1', '2'])
    })

    test('the gap between zones follows each one’s own changes', () => {
      // New York moves its clocks on 8 March, London on 29 March: for three weeks they're 4 hours apart, not 5.
      clock({ value: Date.UTC(2026, 2, 20, 12, 0) })
      expect(timeIn('New York')).toBe('08:00, Fri 20 Mar, GMT-4, Daytime')
      expect(screen.getAllByText('GMT-4 · -4h')).toHaveLength(1)
      clock({ value: Date.UTC(2026, 2, 2, 12, 0) })
      expect(screen.getAllByText('GMT-5 · -5h')).toHaveLength(1)
    })

    test('the overlap moves with them', () => {
      clock({ value: Date.UTC(2026, 2, 20, 12, 0), zones: TEAM.slice(0, 2) })
      expect(screen.getByText(/Everyone in working hours/)).toHaveTextContent(/13:00\s*–\s*17:00/)
    })
  })
})
