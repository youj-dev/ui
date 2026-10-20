import { act, fireEvent, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { VoiceCall } from './voice-call'

const volume = () => screen.getAllByRole('slider', { hidden: true }).find((el) => el.getAttribute('aria-label') === 'Speaker volume')!
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('VoiceCall block', () => {
  test('shows the agent, what it is doing, the clock and the call controls, with the demo marked', () => {
    reduced(<VoiceCall />)
    expect(screen.getByRole('heading', { level: 2, name: 'Ada' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Ada: Speaking' })).toBeInTheDocument()
    expect(screen.getByRole('timer', { name: 'Call time' })).toHaveTextContent('0:00')
    expect(screen.getByRole('button', { name: 'Mute' })).toHaveAttribute('aria-pressed', 'false')
    expect(volume()).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Voice level' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'End call' })).toBeInTheDocument()
    expect(document.querySelector('[data-slot=demo-marker]')).toHaveTextContent('Demo data')
  })

  test('props drive the content and copy rewrites it; no demo marker with your data', () => {
    reduced(<VoiceCall agent={{ name: 'Juno', role: 'Bookings' }} agentState="listening" level={0.5} caption="Two nights, please." copy={{ listening: 'Hearing you' }} />)
    expect(screen.getByRole('heading', { name: 'Juno' })).toBeInTheDocument()
    expect(screen.getByText('Bookings')).toBeInTheDocument()
    expect(screen.getByText('Hearing you')).toBeInTheDocument()
    expect(screen.getByText('Two nights, please.')).toBeInTheDocument()
    expect(document.querySelector('[data-slot=demo-marker]')).toBeNull()
  })

  test('mute grays the orb, says so, and reports the change', () => {
    const onMutedChange = vi.fn()
    reduced(<VoiceCall agentState="listening" level={0.6} onMutedChange={onMutedChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }))
    expect(onMutedChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('button', { name: 'Mute' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('You’re muted')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Ada: Listening, microphone off' })).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Voice level' })).toHaveAttribute('aria-valuenow', '0')
  })

  test('End call awaits onHangUp, then shows the call ended with Call again', async () => {
    let finish = () => {}
    const onHangUp = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
    const onCallAgain = vi.fn()
    reduced(<VoiceCall agentState="speaking" onHangUp={onHangUp} onCallAgain={onCallAgain} />)
    fireEvent.click(screen.getByRole('button', { name: 'End call' }))
    expect(onHangUp).toHaveBeenCalled()
    expect(screen.queryByText(/Call ended/)).toBeNull()
    await act(async () => finish())
    expect(screen.getByText(/Call ended · Lasted 0:00/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'End call' })).toBeNull()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Call again' })))
    expect(onCallAgain).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'End call' })).toBeInTheDocument()
  })

  test('the clock counts from startedAt', () => {
    vi.useFakeTimers({ now: 1_000_000 })
    reduced(<VoiceCall agentState="thinking" startedAt={1_000_000 - 125_000} />)
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByRole('timer', { name: 'Call time' })).toHaveTextContent('2:06')
  })

  test('the volume reports 0–1', () => {
    const onVolumeChange = vi.fn()
    reduced(<VoiceCall agentState="speaking" defaultVolume={0.5} onVolumeChange={onVolumeChange} />)
    const slider = volume()
    expect(slider).toHaveAttribute('aria-valuetext', '50%')
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(onVolumeChange).toHaveBeenCalledWith(0.55)
  })

  test('the script, agent and copy of another world drive the demo call', () => {
    reduced(
      <VoiceCall
        demoMarker={false}
        agent={{ name: 'Nova', role: 'Cedar Park Family Clinic' }}
        script={[{ state: 'speaking', ms: 5000, caption: 'Would you like to book a visit?' }]}
        copy={{ speaking: 'On the line', hangUp: 'Hang up' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Nova' })).toBeInTheDocument()
    expect(screen.getByText('Cedar Park Family Clinic')).toBeInTheDocument()
    expect(screen.getByText('Would you like to book a visit?')).toBeInTheDocument()
    expect(screen.getByText('On the line')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hang up' })).toBeInTheDocument()
  })
})
