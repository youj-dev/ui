import { act, fireEvent, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { SessionTimeout, useSessionTimeout, type SessionTimeoutProps } from './session-timeout'

/* Every test runs on fake timers, which also fake Date: the clock under test is a timestamp. */
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

class FakeChannel {
  static all = new Set<FakeChannel>()
  onmessage: ((event: MessageEvent) => void) | null = null
  constructor(public name: string) {
    FakeChannel.all.add(this)
  }
  postMessage(data: unknown) {
    for (const other of FakeChannel.all) if (other !== this && other.name === this.name) other.onmessage?.({ data } as MessageEvent)
  }
  close() {
    FakeChannel.all.delete(this)
  }
}

function setup(props: Partial<SessionTimeoutProps> = {}, reducedMotion: 'always' | 'never' = 'always') {
  const handlers = { onWarn: vi.fn(), onTimeout: vi.fn(), onExtend: vi.fn(), onSignOut: vi.fn(), onSignIn: vi.fn() }
  const ui = (p: Partial<SessionTimeoutProps>) => (
    <YoujProvider reducedMotion={reducedMotion}>
      <SessionTimeout timeout={20_000} warnBefore={10_000} channel={false} {...handlers} {...p}>
        <main>The app</main>
      </SessionTimeout>
    </YoujProvider>
  )
  return { ...render(ui(props)), ...handlers }
}

const dialog = () => screen.queryByRole('alertdialog')
const live = () => document.querySelector('[data-slot=session-timeout-announcer]')!

describe('SessionTimeout', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    FakeChannel.all.clear()
  })

  test('warns once the session has been idle for timeout minus warnBefore, and counts down', async () => {
    const { onWarn } = setup({}, 'never')
    await advance(9_000)
    expect(dialog()).toBeNull()
    await advance(1_000)
    expect(dialog()).toBeInTheDocument()
    expect(onWarn).toHaveBeenCalledTimes(1)
    expect(screen.getByText("You'll be signed out in 0:10.")).toBeInTheDocument()
    await advance(3_000)
    expect(screen.getByText("You'll be signed out in 0:07.")).toBeInTheDocument()
    expect(onWarn).toHaveBeenCalledTimes(1)
  })

  test('activity before the warning restarts the clock; activity during it does not', async () => {
    setup({}, 'never')
    await advance(8_000)
    fireEvent.pointerMove(document)
    await advance(8_000)
    expect(dialog()).toBeNull()
    await advance(2_000)
    expect(dialog()).toBeInTheDocument()
    await advance(2_000)
    fireEvent.keyDown(document, { key: 'a' })
    await advance(1_000)
    expect(dialog()).toBeInTheDocument()
    expect(screen.getByText("You'll be signed out in 0:07.")).toBeInTheDocument()
  })

  test('the session ends on time: onTimeout fires once and the signed-out page replaces the app, focus on its heading', async () => {
    const { onTimeout, onSignIn } = setup()
    await advance(20_000)
    expect(onTimeout).toHaveBeenCalledTimes(1)
    expect(dialog()).toBeNull()
    expect(screen.queryByText('The app')).toBeNull()
    const heading = screen.getByRole('heading', { name: "You've been signed out" })
    expect(heading).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Sign in again' }))
    expect(onSignIn).toHaveBeenCalledTimes(1)
    await advance(60_000)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  test('works from timestamps: a tab that was asleep past the deadline signs out the moment it wakes', async () => {
    const { onTimeout } = setup()
    // The tab was hidden and its timers never ran; only the clock moved.
    vi.setSystemTime(Date.now() + 25_000)
    fireEvent(document, new Event('visibilitychange'))
    expect(onTimeout).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('heading', { name: "You've been signed out" })).toBeInTheDocument()
  })

  test('Stay signed in awaits onExtend, closes the dialog and starts a fresh clock', async () => {
    const onExtend = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 500)))
    const { onTimeout } = setup({ onExtend })
    await advance(10_000)
    const stay = screen.getByRole('button', { name: 'Stay signed in' })
    await advance(50)
    expect(stay).toHaveFocus()
    fireEvent.click(stay)
    expect(onExtend).toHaveBeenCalledTimes(1)
    expect(dialog()).toBeInTheDocument()
    await advance(1_000)
    await advance(100)
    expect(dialog()).toBeNull()
    await advance(8_000)
    expect(dialog()).toBeNull()
    await advance(3_000)
    expect(dialog()).toBeInTheDocument()
    expect(onTimeout).not.toHaveBeenCalled()
  })

  test('a failing onExtend keeps the warning up', async () => {
    const onExtend = vi.fn().mockRejectedValue(new Error('offline'))
    setup({ onExtend })
    await advance(10_000)
    fireEvent.click(screen.getByRole('button', { name: 'Stay signed in' }))
    await advance(100)
    expect(dialog()).toBeInTheDocument()
  })

  test('Escape means stay signed in', async () => {
    const { onExtend } = setup()
    await advance(10_000)
    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' })
    await advance(100)
    expect(onExtend).toHaveBeenCalledTimes(1)
    expect(dialog()).toBeNull()
    expect(screen.getByText('The app')).toBeInTheDocument()
  })

  test('Sign out now calls onSignOut and shows the signed-out page without onTimeout', async () => {
    const { onSignOut, onTimeout } = setup()
    await advance(10_000)
    fireEvent.click(screen.getByRole('button', { name: 'Sign out now' }))
    await advance(100)
    expect(onSignOut).toHaveBeenCalledTimes(1)
    expect(onTimeout).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: "You've been signed out" })).toBeInTheDocument()
  })

  test('speaks the countdown at the start, each minute and at 30 and 15 seconds, not every second', async () => {
    setup({ timeout: 200_000, warnBefore: 120_000 })
    await advance(79_000)
    expect(dialog()).toBeNull()
    await advance(1_000)
    // The dialog's description says the first one as it opens; the live region stays quiet.
    expect(dialog()).toHaveAccessibleDescription(/2 minutes/)
    expect(live()).toHaveTextContent('')
    await advance(30_000)
    expect(live()).toHaveTextContent('')
    await advance(30_000)
    await advance(100)
    expect(live()).toHaveTextContent("You'll be signed out in 1 minute.")
    await advance(10_000)
    expect(live()).toHaveTextContent("You'll be signed out in 1 minute.")
    await advance(20_000)
    await advance(100)
    expect(live()).toHaveTextContent("You'll be signed out in 30 seconds.")
    await advance(15_000)
    await advance(100)
    expect(live()).toHaveTextContent("You'll be signed out in 15 seconds.")
  })

  test('under reduced motion the visible line is a static phrase, not a ticking clock', async () => {
    setup({ timeout: 130_000, warnBefore: 125_000 }, 'always')
    await advance(5_000)
    const line = document.querySelector('[data-slot=session-timeout-countdown]')!
    expect(line).toHaveTextContent("You'll be signed out in 2 minutes, 5 seconds.")
    await advance(3_000)
    expect(line).toHaveTextContent("You'll be signed out in 2 minutes, 5 seconds.")
  })

  test('another tab being active, or staying signed in, clears the warning here', async () => {
    vi.stubGlobal('BroadcastChannel', FakeChannel)
    const { onTimeout } = setup({ channel: 'test' })
    const other = new FakeChannel('test')
    await advance(10_000)
    expect(dialog()).toBeInTheDocument()
    act(() => other.postMessage({ type: 'extend', at: Date.now() }))
    await advance(100)
    expect(dialog()).toBeNull()
    await advance(15_000)
    expect(dialog()).toBeInTheDocument()
    expect(onTimeout).not.toHaveBeenCalled()
  })

  test('activity here is sent to the other tabs, and a sign-out elsewhere signs this tab out without calling onTimeout', async () => {
    vi.stubGlobal('BroadcastChannel', FakeChannel)
    const { onTimeout } = setup({ channel: 'test' })
    const other = new FakeChannel('test')
    const heard = vi.fn()
    other.onmessage = ({ data }) => heard(data.type)
    fireEvent.keyDown(document, { key: 'a' })
    expect(heard).toHaveBeenCalledWith('activity')
    act(() => other.postMessage({ type: 'signout', at: Date.now() }))
    expect(screen.getByRole('heading', { name: "You've been signed out" })).toBeInTheDocument()
    expect(onTimeout).not.toHaveBeenCalled()
  })

  test('throttles activity: a burst of events makes one broadcast', async () => {
    vi.stubGlobal('BroadcastChannel', FakeChannel)
    setup({ channel: 'test' })
    const other = new FakeChannel('test')
    const heard = vi.fn()
    other.onmessage = heard
    for (let i = 0; i < 20; i++) fireEvent.pointerMove(document)
    expect(heard).toHaveBeenCalledTimes(1)
    await advance(1_000)
    fireEvent.pointerMove(document)
    expect(heard).toHaveBeenCalledTimes(2)
  })

  test('events limits what counts as activity', async () => {
    setup({ events: ['key'] })
    await advance(8_000)
    fireEvent.pointerMove(document)
    await advance(2_000)
    expect(dialog()).toBeInTheDocument()
  })

  test('its words come from the language pack', async () => {
    render(
      <YoujProvider reducedMotion="always" labels={de} locale="de">
        <SessionTimeout timeout={20_000} warnBefore={10_000} channel={false} />
      </YoujProvider>,
    )
    await advance(10_000)
    expect(screen.getByRole('button', { name: 'Angemeldet bleiben' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jetzt abmelden' })).toBeInTheDocument()
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Sie werden gleich abgemeldet')
  })
})

describe('useSessionTimeout', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  function Probe() {
    const s = useSessionTimeout({ timeout: 60_000, warnBefore: 30_000, channel: false })
    return (
      <>
        <output>{`${s.status} ${s.secondsLeft}`}</output>
        <button type="button" onClick={s.simulateIdle}>
          idle
        </button>
        <button type="button" onClick={s.reset}>
          reset
        </button>
      </>
    )
  }

  test('simulateIdle jumps to the start of the warning and reset starts a fresh session', async () => {
    render(<Probe />)
    expect(screen.getByRole('status')).toHaveTextContent('active 0')
    fireEvent.click(screen.getByText('idle'))
    expect(screen.getByRole('status')).toHaveTextContent('warning 30')
    await advance(30_000)
    expect(screen.getByRole('status')).toHaveTextContent('signedOut 0')
    fireEvent.click(screen.getByText('reset'))
    expect(screen.getByRole('status')).toHaveTextContent('active 0')
  })
})
