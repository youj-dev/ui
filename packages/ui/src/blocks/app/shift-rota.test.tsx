import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ShiftRota } from './shift-rota'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('Shift rota block', () => {
  test('shows who is on call now, the time left in mono, who is next, and the week’s rota', () => {
    reduced(<ShiftRota />)
    expect(screen.getByRole('heading', { level: 2, name: 'On call' })).toBeInTheDocument()
    const current = screen.getByRole('group', { name: 'On call now' })
    expect(current).toHaveTextContent('Iris Okafor')
    expect(screen.getByRole('timer')).toHaveTextContent(/18\s?h\s?27\s?m\s?52\s?s/)
    expect(current).toHaveTextContent('Jonas Weber')
    expect(screen.getByRole('group', { name: 'This week' })).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot=time-lanes-shift]')).toHaveLength(8)
  })

  test('the countdown ticks every second', async () => {
    vi.useFakeTimers()
    try {
      reduced(<ShiftRota />)
      await act(async () => vi.advanceTimersByTime(3000))
      expect(screen.getByRole('timer')).toHaveTextContent(/27\s?m\s?49\s?s/)
    } finally {
      vi.useRealTimers()
    }
  })

  test('Swap hands the rest of the shift to a teammate as a hatched override, and says so', async () => {
    const user = userEvent.setup()
    reduced(<ShiftRota />)
    await user.click(screen.getByRole('button', { name: 'Swap' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Theo Park' }))
    expect(screen.getByRole('group', { name: 'On call now' })).toHaveTextContent('Theo Park')
    expect(screen.getByRole('group', { name: 'On call now' })).toHaveTextContent('Covering Iris Okafor')
    expect(document.querySelectorAll('[data-slot=time-lanes-shift][data-override]')).toHaveLength(3)
    expect(screen.getAllByRole('status').map((s) => s.textContent)).toContain('Theo Park is on call until Thu 09:00')
  })

  test('Contact calls onContact with the person on shift', async () => {
    const user = userEvent.setup()
    const paged: string[] = []
    reduced(<ShiftRota onContact={(p: { name: string }) => void paged.push(p.name)} embedded />)
    expect(screen.getByRole('heading', { level: 2, name: 'On call' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Page' }))
    await waitFor(() => expect(paged).toEqual(['Iris Okafor']))
  })

  test('your people, shifts, week and words drive the card, and the contact button reads your label', async () => {
    const user = userEvent.setup()
    const week = new Date(2026, 10, 2).getTime()
    const hour = 3_600_000
    const contacted: string[] = []
    reduced(
      <ShiftRota
        people={[
          { id: 'ana', name: 'Ana Ferreira', detail: 'Charge nurse' },
          { id: 'ben', name: 'Ben Achterberg' },
        ]}
        shifts={[
          { id: 'd', lane: 'ana', start: week + 7 * hour, end: week + 19 * hour },
          { id: 'n', lane: 'ben', start: week + 19 * hour, end: week + 31 * hour },
        ]}
        week={week}
        now={week + 10 * hour}
        copy={{ title: 'Ward shifts', current: 'On shift now', onDuty: 'On shift', contact: 'Call', contacting: 'Calling…', contacted: 'Called' }}
        onContact={(p: { name: string }) => void contacted.push(p.name)}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Ward shifts' })).toBeInTheDocument()
    const current = screen.getByRole('group', { name: 'On shift now' })
    expect(current).toHaveTextContent('Ana Ferreira')
    expect(current).toHaveTextContent('Charge nurse')
    expect(current).toHaveTextContent('On shift')
    expect(current).toHaveTextContent('Ben Achterberg')
    expect(screen.getByRole('timer')).toHaveTextContent(/9\s?h\s?00\s?m/)
    expect(screen.queryByRole('button', { name: 'Page' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Call' }))
    await waitFor(() => expect(contacted).toEqual(['Ana Ferreira']))
  })
})
