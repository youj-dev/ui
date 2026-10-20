import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { TimeLanes, type RotaLane, type RotaShift } from './time-lanes'

const HOUR = 3_600_000
const WEEK = new Date(2026, 8, 28).getTime()
const at = (day: number, hour: number) => WEEK + (day * 24 + hour) * HOUR

const LANES: RotaLane[] = [
  { id: 'ada', name: 'Ada Lovelace' },
  { id: 'grace', name: 'Grace Hopper' },
]
const SHIFTS: RotaShift[] = [
  { id: 's1', lane: 'ada', start: at(0, 9), end: at(1, 9) },
  { id: 's2', lane: 'grace', start: at(1, 9), end: at(2, 9) },
  { id: 's3', lane: 'ada', start: at(2, 9), end: at(3, 9) },
  { id: 'o1', lane: 'grace', start: at(2, 12), end: at(2, 18), override: true, note: 'Covering Ada' },
]

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const shift = (id: string) => document.querySelector<HTMLElement>(`[data-shift-id="${id}"]`)!

describe('TimeLanes', () => {
  test('names each shift with who and when, marks overrides, and states the past, present and future', () => {
    reduced(<TimeLanes lanes={LANES} shifts={SHIFTS} start={WEEK} now={at(1, 12)} locale="en-GB" />)
    expect(screen.getByRole('group', { name: 'On-call rota' })).toHaveAccessibleDescription('Arrow keys move between shifts; Enter opens one.')
    expect(shift('s1')).toHaveAccessibleName('Ada Lovelace, Mon 09:00 to Tue 09:00')
    expect(shift('o1')).toHaveAccessibleName('Grace Hopper, Wed 12:00 to Wed 18:00, override')
    expect(shift('s1')).toHaveAttribute('data-state', 'ended')
    expect(shift('s2')).toHaveAttribute('data-state', 'current')
    expect(shift('s3')).toHaveAttribute('data-state', 'upcoming')
    // One lane per person, as a named group.
    expect(screen.getByRole('group', { name: 'Grace Hopper' })).toBeInTheDocument()
  })

  test('draws a baton at each handoff and the now line at the time', () => {
    reduced(<TimeLanes lanes={LANES} shifts={SHIFTS} start={WEEK} now={at(3, 12)} />)
    // Mon→Tue (ada→grace) and Tue→Wed (grace→ada).
    expect(document.querySelectorAll('[data-slot=time-lanes-baton]')).toHaveLength(2)
    expect(document.querySelector<HTMLElement>('[data-slot=time-lanes-now]')!.style.translate).toBe(`calc(${3.5 / 7} * 100% * var(--rota-dir)) 0`)
  })

  test('has no now line outside the week, or with now set to null', () => {
    reduced(<TimeLanes lanes={LANES} shifts={SHIFTS} start={WEEK} now={null} />)
    expect(document.querySelector('[data-slot=time-lanes-now]')).toBeNull()
  })

  test('is one tab stop, on the current shift, and arrow keys walk along and across lanes', async () => {
    const user = userEvent.setup()
    reduced(<TimeLanes lanes={LANES} shifts={SHIFTS} start={WEEK} now={at(1, 12)} />)
    await user.tab()
    expect(shift('s2')).toHaveFocus()
    expect([...document.querySelectorAll('[data-slot=time-lanes-shift]')].filter((s) => s.getAttribute('tabindex') === '0')).toHaveLength(1)
    await user.keyboard('{ArrowRight}')
    expect(shift('o1')).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(shift('s3')).toHaveFocus()
    await user.keyboard('{Home}')
    expect(shift('s1')).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(shift('s1')).toHaveFocus()
    await user.keyboard('{End}')
    expect(shift('s3')).toHaveFocus()
    // Focus left the rota and comes back to the shift it left.
    await user.tab({ shift: true })
    await user.tab()
    expect(shift('s3')).toHaveFocus()
  })

  test('Enter opens the shift’s detail: when, how long, the override and the handoff', async () => {
    const user = userEvent.setup()
    reduced(<TimeLanes lanes={LANES} shifts={SHIFTS} start={WEEK} now={at(1, 12)} locale="en-GB" renderDetail={(s) => <button type="button">Swap {s.id}</button>} />)
    await user.tab()
    await user.keyboard('{Enter}')
    const detail = await waitFor(() => document.querySelector<HTMLElement>('[data-slot=time-lanes-detail]')!)
    expect(detail).toHaveTextContent('Grace Hopper')
    expect(detail).toHaveTextContent('On call now')
    expect(detail).toHaveTextContent('24h')
    expect(detail).toHaveTextContent('Hands off to Ada Lovelace')
    expect(screen.getByRole('button', { name: 'Swap s2' })).toBeInTheDocument()
  })

  test('mirrors the arrow keys in RTL', async () => {
    const user = userEvent.setup()
    reduced(
      <div dir="rtl">
        <TimeLanes lanes={LANES} shifts={SHIFTS} start={WEEK} now={at(0, 12)} />
      </div>,
    )
    await user.tab()
    expect(shift('s1')).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(shift('s3')).toHaveFocus()
  })

  test('a proposed shift is dashed, says so, is never on call and hands nothing off', async () => {
    const user = userEvent.setup()
    const shifts: RotaShift[] = [
      { id: 'a', lane: 'ada', start: at(0, 9), end: at(1, 9), label: '4821' },
      { id: 'p', lane: 'grace', start: at(1, 9), end: at(2, 9), label: '4935', proposed: true },
    ]
    reduced(<TimeLanes lanes={LANES} shifts={shifts} start={WEEK} now={at(1, 12)} locale="en-GB" />)
    expect(shift('p')).toHaveAttribute('data-proposed')
    expect(shift('p')).toHaveAttribute('data-state', 'upcoming')
    expect(shift('p')).toHaveAccessibleName('4935, Grace Hopper, Tue 09:00 to Wed 09:00, Proposed')
    expect(shift('a')).toHaveAccessibleName('4821, Ada Lovelace, Mon 09:00 to Tue 09:00')
    expect(document.querySelectorAll('[data-slot=time-lanes-baton]')).toHaveLength(0)
    await user.click(shift('p'))
    const detail = await waitFor(() => document.querySelector<HTMLElement>('[data-slot=time-lanes-detail]')!)
    expect(detail).toHaveTextContent('Proposed')
    expect(detail).not.toHaveTextContent('On call now')
  })

  test('hours turns the axis into a day, ticking by the hour', () => {
    const day = new Date(2026, 9, 5, 8).getTime()
    reduced(<TimeLanes lanes={LANES} shifts={[{ id: 'h', lane: 'ada', start: day + 2 * 3_600_000, end: day + 5 * 3_600_000 }]} start={day} hours={9} now={day + 4 * 3_600_000} locale="en-GB" />)
    const ticks = [...document.querySelectorAll('[data-slot=time-lanes-hour]')].map((el) => el.textContent)
    expect(ticks).toEqual(['08:00', '10:00', '12:00', '14:00', '16:00'])
    expect(document.querySelectorAll('[data-slot=time-lanes-day]')).toHaveLength(0)
    expect(shift('h')).toHaveAttribute('data-state', 'current')
    expect(document.querySelector('[data-slot=time-lanes-now]')).toHaveTextContent('12:00')
  })
})
