import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Switchover } from './switchover'
import { DEFAULT_COPY } from './switchover/data'

/** One step of the switchover: the deliberate token × 2.2 at 1× speed. */
const BEAT = 560 * 2.2

const timeline = () => document.querySelector<HTMLElement>('[data-slot="switchover-timeline"]')!
const source = (role: 'primary' | 'backup') => document.querySelector<HTMLElement>(`[data-slot="switchover-source"][data-role="${role}"]`)!
const load = (role: 'primary' | 'backup') => within(source(role)).getByRole('group')

/** Every observed element reports as on screen, so the outage can run. */
function inView() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe = (el: Element) => this.cb([{ isIntersecting: true, target: el, intersectionRatio: 1 } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
      unobserve() {}
      disconnect() {}
    },
  )
}

const setup = (ui: React.ReactNode, motion: 'always' | 'never' = 'always') => {
  vi.useFakeTimers()
  inView()
  return render(<YoujProvider reducedMotion={motion}>{ui}</YoujProvider>)
}
/** Each beat schedules the next once it has rendered, so they're played one act at a time. */
const beats = (n: number) => {
  for (let i = 0; i < n; i++) act(() => vi.advanceTimersByTime(BEAT))
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('Switchover block', () => {
  test('steady: the grid carries the whole home, nothing is logged, and only Simulate outage is live', () => {
    setup(<Switchover />)
    expect(screen.getByRole('heading', { level: 2, name: 'Backup power' })).toBeInTheDocument()
    expect(screen.getAllByText('Grid powering the home')[0]).toBeInTheDocument()
    expect(load('primary')).toHaveAccessibleName('Grid carries 4.8 kW of the load')
    expect(load('backup')).toHaveAccessibleName('Battery carries 0.0 kW of the load')
    expect(screen.getByText('240 V')).toBeInTheDocument()
    expect(screen.getByText('92%')).toBeInTheDocument()
    expect(within(timeline()).getByText('No events yet. Simulate an outage to test the switchover.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Simulate outage' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Switch back' })).toBeDisabled()
  })

  test('Simulate outage runs a grid check at a time, logging and announcing each step, and stops once the grid is back', () => {
    const onSimulate = vi.fn()
    setup(<Switchover onSimulate={onSimulate} />)
    fireEvent.click(screen.getByRole('button', { name: 'Simulate outage' }))
    expect(onSimulate).toHaveBeenCalledOnce()
    expect(within(timeline()).getByText('Grid outage simulated')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Simulate outage' })).toBeDisabled()

    beats(1)
    expect(within(timeline()).getByText('Grid voltage sagging to 221 V, under the 228 V floor')).toBeInTheDocument()
    expect(within(source('primary')).getByText('Unstable')).toBeInTheDocument()
    beats(3)
    expect(within(timeline()).getByText('Grid marked out · switchover starts')).toBeInTheDocument()
    expect(within(source('primary')).getByText('3 of 3 failed')).toBeInTheDocument()
    expect(within(source('primary')).getByRole('img')).toHaveAccessibleName('Grid: 3 of the last checks failed')
    expect(screen.getByText('Grid marked out · switchover starts', { selector: '[role=status]' })).toBeInTheDocument()
    expect(screen.getByText('0 V')).toBeInTheDocument()

    // The load moves a quarter a step.
    beats(2)
    expect(load('primary')).toHaveAccessibleName('Grid carries 2.4 kW of the load')
    expect(load('backup')).toHaveAccessibleName('Battery carries 2.4 kW of the load')
    expect(timeline().querySelector('[aria-current="step"]')).toHaveTextContent('Transfer')
    beats(2)
    expect(load('backup')).toHaveAccessibleName('Battery carries 4.8 kW of the load')
    expect(screen.getAllByText('Battery powering the home')[0]).toBeInTheDocument()
    expect(screen.getByText('89%')).toBeInTheDocument()

    beats(2)
    expect(within(timeline()).getByText('Grid steady at 240 V, 60 Hz · ready to switch back')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch back' })).toBeEnabled()
    // It holds there: switching back is a person's call.
    const logged = within(timeline()).getAllByRole('listitem').length
    beats(5)
    expect(within(timeline()).getAllByRole('listitem')).toHaveLength(logged)
  })

  test('Switch back walks the load home, then the button reports it done', async () => {
    const onSwitchBack = vi.fn()
    setup(<Switchover start={10} onSwitchBack={onSwitchBack} />)
    expect(load('primary')).toHaveAccessibleName('Grid carries 0.0 kW of the load')
    fireEvent.click(screen.getByRole('button', { name: 'Switch back' }))
    await act(async () => {})
    expect(onSwitchBack).toHaveBeenCalledOnce()
    beats(2)
    expect(load('primary')).toHaveAccessibleName('Grid carries 2.4 kW of the load')
    expect(screen.getAllByText('Switching back')[0]).toBeInTheDocument()
    beats(2)
    expect(within(timeline()).getByText('Switch back complete · Grid carries the home, Battery recharging')).toBeInTheDocument()
    expect(load('primary')).toHaveAccessibleName('Grid carries 4.8 kW of the load')
    await act(async () => {})
    // The button's label and its announcement both say so.
    expect(within(screen.getByRole('button', { name: /On grid/ })).getByText('On grid')).toBeInTheDocument()
    // Every stage done, and the outage can run again.
    expect(timeline().querySelectorAll('[data-state="done"]')).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Simulate outage' })).toBeEnabled()
  })

  test('the outage holds in a hidden tab and carries on when it shows again', () => {
    setup(<Switchover start={5} />)
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    beats(3)
    expect(load('primary')).toHaveAccessibleName('Grid carries 3.6 kW of the load')
    hidden.mockReturnValue(false)
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    beats(1)
    expect(load('primary')).toHaveAccessibleName('Grid carries 2.4 kW of the load')
    hidden.mockRestore()
  })

  test('with motion, a pulse runs on every lit strand; reduced motion runs none', () => {
    const first = setup(<Switchover start={6} />, 'never')
    // Split evenly: four strands lit on each line.
    expect(document.querySelectorAll('.ke-rig animateMotion')).toHaveLength(8)
    first.unmount()
    vi.unstubAllGlobals()
    setup(<Switchover start={6} />)
    expect(document.querySelector('.ke-rig')).toHaveAttribute('data-reduced-motion')
    expect(document.querySelectorAll('.ke-rig animateMotion')).toHaveLength(0)
    expect(document.querySelectorAll('.ke-rig .ke-lit[opacity="1"]')).toHaveLength(8)
  })

  test('unmounting mid-outage leaves no timers behind', () => {
    const { unmount } = setup(<Switchover start={3} />)
    beats(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  test('autoPlay starts the outage on its own once the card is on screen', () => {
    setup(<Switchover autoPlay />)
    act(() => vi.advanceTimersByTime(560 * 2))
    expect(within(timeline()).getByText('Grid outage simulated')).toBeInTheDocument()
  })

  test('embedded, it is a section named by an h2; strings and numbers follow the copy', () => {
    setup(<Switchover embedded copy={{ title: 'Notstrom', locale: 'de-DE', carries: (id, kw) => `${id} trägt ${kw} kW` }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Notstrom' })).toBeInTheDocument()
    expect(screen.queryByRole('main')).toBeNull()
    expect(load('primary')).toHaveAccessibleName('Grid trägt 4,8 kW')
  })

  test('sources, labels, format and illustration come from the props: a database failing over has no drawing and its own words', () => {
    setup(
      <Switchover
        primary={{ id: 'Primary', detail: 'db-eu-1' }}
        backup={{ id: 'Replica', detail: 'db-eu-2' }}
        illustration={<p>Cluster diagram</p>}
        format={{ power: { minimumFractionDigits: 0, maximumFractionDigits: 0 } }}
        copy={{
          signalValue: (v: string) => `${v}k qps`,
          health: { healthy: 'Online', degraded: 'Lagging', down: 'Down' },
          stages: { detect: 'Detect', transfer: 'Promote', backup: 'On replica', return: 'Fail back' },
          status: { ...DEFAULT_COPY.status, steady: (p: string) => `${p} serving writes` },
        }}
      />,
    )
    expect(screen.getAllByText('Primary serving writes')[0]).toBeInTheDocument()
    expect(screen.getByText('Cluster diagram')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: DEFAULT_COPY.rig })).toBeNull()
    expect(screen.getByText('240k qps')).toBeInTheDocument()
    expect(within(source('primary')).getByText('Online')).toBeInTheDocument()
    expect(within(source('backup')).getByText('db-eu-2')).toBeInTheDocument()
    expect(load('primary')).toHaveAccessibleName('Primary carries 5 kW of the load')
    expect(screen.getByText('Promote')).toBeInTheDocument()
  })

  test('illustration null leaves out the drawing the default has', () => {
    const { unmount } = setup(<Switchover />)
    expect(screen.getByRole('img', { name: DEFAULT_COPY.rig })).toBeInTheDocument()
    unmount()
    setup(<Switchover illustration={null} />)
    expect(screen.queryByRole('img', { name: DEFAULT_COPY.rig })).toBeNull()
  })

  test('load sets what the sources split, so the figures follow the unit', () => {
    setup(<Switchover load={240} format={{ power: { minimumFractionDigits: 0, maximumFractionDigits: 0 } }} copy={{ carries: (id: string, kw: string) => `${id} carries ${kw} Mbps` }} />)
    expect(load('primary')).toHaveAccessibleName('Grid carries 240 Mbps')
    expect(load('backup')).toHaveAccessibleName('Battery carries 0 Mbps')
  })
})
