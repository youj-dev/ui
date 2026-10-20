import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { TileBoard } from './tile-board'
import { clockText, secondsBetween } from './tile-board/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('tile board clock helpers', () => {
  test('seconds read as minutes and seconds, and hours when there are any', () => {
    expect(clockText(252)).toBe('04:12')
    expect(clockText(3725)).toBe('1:02:05')
    expect(clockText(-5)).toBe('00:00')
  })

  test('the time since is never negative', () => {
    expect(secondsBetween('2026-10-13T14:08:00Z', Date.parse('2026-10-13T14:12:12Z'))).toBe(252)
    expect(secondsBetween('2026-10-13T14:08:00Z', Date.parse('2026-10-13T14:00:00Z'))).toBe(0)
  })
})

describe('tile board block', () => {
  test('shows every station with its state, and the stopped one’s timer and the stopped count', () => {
    reduced(<TileBoard demoMarker={false} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Station board' })).toBeInTheDocument()
    expect(screen.getByText('1 stopped')).toBeInTheDocument()
    const tile = screen.getByRole('button', { name: /^Weld 1, Stopped/ })
    expect(within(tile).getByText('04:12')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Cut, Running/ })).toHaveTextContent('38 s')
    expect(screen.getByRole('button', { name: /^Assy, On hold/ })).toHaveTextContent('QC hold')
  })

  test('the panel starts on the stopped station with its reason, responder and escalation countdown', () => {
    reduced(<TileBoard demoMarker={false} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Weld 1 stopped' })).toBeInTheDocument()
    expect(screen.getByRole('timer', { name: 'Stopped for' })).toHaveTextContent('04:12')
    expect(screen.getByRole('button', { name: 'Maintenance', pressed: true })).toBeInTheDocument()
    expect(screen.getByText('Ben Okafor')).toBeInTheDocument()
    expect(screen.getByText('maintenance · on the way')).toBeInTheDocument()
    expect(screen.getByText('Supervisor paged in 01:48')).toBeInTheDocument()
  })

  test('choosing a reason reports it, and selecting another station swaps the panel and disables the actions', async () => {
    const user = userEvent.setup()
    const onReasonChange = vi.fn()
    reduced(<TileBoard demoMarker={false} onReasonChange={onReasonChange} />)
    await user.click(screen.getByRole('button', { name: 'Material' }))
    expect(onReasonChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'weld-1' }), 'material')
    await user.click(screen.getByRole('button', { name: /^Cut, Running/ }))
    expect(screen.getByRole('heading', { level: 3, name: 'Cut is running' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resolve' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Escalate now' })).toBeDisabled()
  })

  test('Escalate now pages the supervisor and reports it', async () => {
    const user = userEvent.setup()
    const onEscalate = vi.fn()
    reduced(<TileBoard demoMarker={false} onEscalate={onEscalate} />)
    await user.click(screen.getByRole('button', { name: 'Escalate now' }))
    expect(onEscalate).toHaveBeenCalledWith(expect.objectContaining({ id: 'weld-1' }))
    expect(screen.getByText('Supervisor paged')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Escalate now' })).toBeDisabled()
  })

  test('Resolve awaits the callback, then the station runs again and the count clears', async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn()
    reduced(<TileBoard demoMarker={false} onResolve={onResolve} />)
    await user.click(screen.getByRole('button', { name: 'Resolve' }))
    expect(onResolve).toHaveBeenCalledWith(expect.objectContaining({ id: 'weld-1' }))
    expect(await screen.findByText('All running')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Weld 1 is running' })).toBeInTheDocument()
  })

  test('its own clock counts the timers up while now is left out, and a passed now holds them still', () => {
    vi.useFakeTimers()
    try {
      const { unmount } = reduced(<TileBoard demoMarker={false} />)
      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(screen.getByRole('timer', { name: 'Stopped for' })).toHaveTextContent('04:15')
      unmount()
      reduced(<TileBoard demoMarker={false} now="2026-10-13T14:12:12Z" />)
      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(screen.getByRole('timer', { name: 'Stopped for' })).toHaveTextContent('04:12')
    } finally {
      vi.useRealTimers()
    }
  })

  test('a block on demo stations says so, and your tiles and words drive the content', () => {
    const { unmount } = reduced(<TileBoard />)
    expect(screen.getByText('Demo data')).toBeInTheDocument()
    unmount()
    reduced(<TileBoard copy={{ title: 'Line board' }} tiles={[{ id: 'x', name: 'Saw', status: 'idle' }]} />)
    expect(screen.queryByText('Demo data')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Line board' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Saw is idle' })).toBeInTheDocument()
    expect(screen.getByText('All running')).toBeInTheDocument()
  })

  test('your statuses drive the tiles, the alert and the resting status after Resolve', async () => {
    const user = userEvent.setup()
    reduced(
      <TileBoard
        now="2026-10-13T10:00:00Z"
        copy={{ title: 'Lanes', alertCount: (n) => `${n} need help`, allClear: 'All clear', alertTitle: (name) => `${name} needs help`, statusTitle: (name, status) => `${name}: ${status}` }}
        statuses={[
          { id: 'open', label: 'Open', tone: 'success' },
          { id: 'paused', label: 'Paused', tone: 'warning' },
          { id: 'help', label: 'Needs help', tone: 'danger', alert: true },
        ]}
        reasons={[{ id: 'a', label: 'Price check' }]}
        tiles={[
          { id: 'r1', name: 'Reg 1', status: 'open', note: '2 in line' },
          { id: 'r2', name: 'Reg 2', status: 'paused' },
          { id: 'r3', name: 'Reg 3', status: 'help', since: '2026-10-13T09:58:00Z', reason: 'a' },
        ]}
        onResolve={() => undefined}
      />,
    )
    expect(screen.getByText('1 need help')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Reg 1, Open/ })).toHaveTextContent('2 in line')
    expect(screen.getByRole('button', { name: /^Reg 3, Needs help/ })).toHaveTextContent('02:00')
    expect(screen.getByRole('heading', { level: 3, name: 'Reg 3 needs help' })).toBeInTheDocument()
    expect(screen.getByRole('timer', { name: 'Stopped for' })).toHaveTextContent('02:00')
    await user.click(screen.getByRole('button', { name: /^Reg 2, Paused/ }))
    expect(screen.getByRole('heading', { level: 3, name: 'Reg 2: Paused' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resolve' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /^Reg 3, Needs help/ }))
    await user.click(screen.getByRole('button', { name: 'Resolve' }))
    expect(await screen.findByText('All clear')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Reg 3, Open/ })).toBeInTheDocument()
  })

  test('format writes the cycle and arrival figures', () => {
    reduced(<TileBoard demoMarker={false} format={{ cycle: (s) => `${s} sec`, eta: (m) => `in ${m}m` }} />)
    expect(screen.getByRole('button', { name: /^Cut, Running/ })).toHaveTextContent('38 sec')
    expect(screen.getByText('in 2m')).toBeInTheDocument()
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<TileBoard embedded={false} demoMarker={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Station board' })).toBeInTheDocument()
  })
})
