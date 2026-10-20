import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AudioRecorder } from './audio-recorder'

class FakeTrack {
  kind = 'audio'
  stop = vi.fn()
}
class FakeMediaStream {
  tracks = [new FakeTrack()]
  getTracks = () => this.tracks
  getAudioTracks = () => this.tracks
}

const recorders: FakeMediaRecorder[] = []
class FakeMediaRecorder {
  static isTypeSupported = vi.fn((type: string) => type.startsWith('audio/webm'))
  state: 'inactive' | 'recording' | 'paused' = 'inactive'
  mimeType: string
  ondataavailable: ((e: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  constructor(
    public stream: FakeMediaStream,
    options?: { mimeType?: string },
  ) {
    this.mimeType = options?.mimeType ?? 'audio/webm'
    recorders.push(this)
  }
  start = vi.fn(() => void (this.state = 'recording'))
  pause = vi.fn(() => void (this.state = 'paused'))
  resume = vi.fn(() => void (this.state = 'recording'))
  stop = vi.fn(() => {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['take'], { type: this.mimeType }) })
    this.onstop?.()
  })
}

const contexts: FakeAudioContext[] = []
class FakeAudioContext {
  state = 'running'
  sampleRate = 48000
  destination = {}
  close = vi.fn(async () => {})
  resume = vi.fn(async () => {})
  constructor() {
    contexts.push(this)
  }
  createAnalyser = () => ({
    fftSize: 1024,
    frequencyBinCount: 512,
    connect: vi.fn(),
    disconnect: vi.fn(),
    getFloatTimeDomainData: (out: Float32Array) => out.fill(0.25),
    getByteFrequencyData: (out: Uint8Array) => out.fill(100),
  })
  createMediaStreamSource = vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() }))
  decodeAudioData = vi.fn(async () => ({ duration: 9, getChannelData: () => Float32Array.from({ length: 4800 }, (_, i) => Math.sin(i / 50)) }))
}

let clock = 0
let frames: FrameRequestCallback[] = []
/** Moves the clock on by `seconds`, a frame every 1/20 s. */
function advance(seconds: number) {
  for (let t = 0; t < seconds; t += 0.05) {
    clock += 50
    const queued = frames
    frames = []
    act(() => queued.forEach((f) => f(clock)))
  }
}

/** The recorder's own polite live region. */
const said = () => document.querySelector('[data-slot=audio-recorder] > [role=status]')

const mic = () => vi.fn(async () => new FakeMediaStream() as unknown as MediaStream)

async function startRecording(getStream = mic(), props: Partial<React.ComponentProps<typeof AudioRecorder>> = {}) {
  const view = render(<AudioRecorder getStream={getStream} {...props} />)
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Start recording' }))
  })
  return { ...view, getStream }
}

beforeEach(() => {
  clock = 0
  frames = []
  recorders.length = 0
  contexts.length = 0
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder)
  vi.stubGlobal('MediaStream', FakeMediaStream)
  vi.stubGlobal('AudioContext', FakeAudioContext)
  vi.stubGlobal('requestAnimationFrame', vi.fn((f: FrameRequestCallback) => frames.push(f)))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
  URL.createObjectURL = vi.fn(() => 'blob:take')
  URL.revokeObjectURL = vi.fn()
  FakeMediaRecorder.isTypeSupported.mockImplementation((type: string) => type.startsWith('audio/webm'))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('AudioRecorder', () => {
  it('starts idle: a named group with a record button and a hint', () => {
    render(<AudioRecorder getStream={mic()} maxDuration={60} />)
    expect(screen.getByRole('group', { name: 'Audio recorder' })).toHaveAttribute('data-state', 'idle')
    expect(screen.getByRole('button', { name: 'Start recording' })).toBeInTheDocument()
    expect(screen.getByText(/Record a voice note/)).toHaveTextContent('Record a voice note · Up to 1:00')
  })

  it('records from the stream, counts the time and announces it', async () => {
    const { getStream } = await startRecording()
    expect(getStream).toHaveBeenCalledOnce()
    expect(recorders[0]?.start).toHaveBeenCalled()
    expect(screen.getByRole('group', { name: 'Audio recorder' })).toHaveAttribute('data-state', 'recording')
    expect(said()).toHaveTextContent('Recording')
    advance(2.1)
    expect(screen.getByRole('timer', { name: 'Recording time' })).toHaveTextContent('0:02')
  })

  it('stops into playback, saves through onRecordingComplete, then turns read-only', async () => {
    const onRecordingComplete = vi.fn(async () => {})
    await startRecording(mic(), { onRecordingComplete })
    advance(3)
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Stop recording' })))
    const group = screen.getByRole('group', { name: 'Audio recorder' })
    expect(group).toHaveAttribute('data-state', 'recorded')
    expect(said()).toHaveTextContent('Recording stopped, 0:03')
    expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save' })))
    expect(onRecordingComplete).toHaveBeenCalledWith(expect.any(Blob), { duration: expect.closeTo(3, 1), mimeType: 'audio/webm;codecs=opus' })
    await waitFor(() => expect(group).toHaveAttribute('data-state', 'saved'), { timeout: 4000 })
    expect(document.querySelector('[data-slot=audio-recorder-saved]')).toHaveTextContent('Saved')
    expect(screen.queryByRole('button', { name: 'Discard recording' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled()
  })

  it('keeps the take unsaved when onRecordingComplete rejects', async () => {
    const onRecordingComplete = vi.fn(async () => {
      throw new Error('Upload failed')
    })
    await startRecording(mic(), { onRecordingComplete })
    advance(1)
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Stop recording' })))
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save' })))
    expect(onRecordingComplete).toHaveBeenCalledOnce()
    // youj-allow: sleep — proving the state does not move on after a failed save has no condition to wait for, only time to give it.
    await new Promise((done) => setTimeout(done, 50))
    expect(screen.getByRole('group', { name: 'Audio recorder' })).toHaveAttribute('data-state', 'recorded')
    expect(screen.getByRole('button', { name: 'Discard recording' })).toBeInTheDocument()
  })

  it('keeps one size: the stage and the controls row are fixed in every state', async () => {
    await startRecording()
    const stage = document.querySelector('[data-slot=audio-recorder-stage]')
    const row = document.querySelector('[data-slot=audio-recorder-controls]')
    expect(stage).toHaveClass('h-23')
    expect(row?.className).toMatch(/\bh-control\b/)
    advance(1)
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Stop recording' })))
    expect(document.querySelector('[data-slot=audio-recorder-stage]')).toBe(stage)
    expect(document.querySelector('[data-slot=audio-recorder-controls]')).toBe(row)
  })

  it('never plays by itself, and plays on the play button', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    await startRecording()
    advance(1)
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Stop recording' })))
    expect(play).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(play).toHaveBeenCalledOnce()
  })

  it('pauses and resumes the recorder and the clock', async () => {
    await startRecording()
    advance(1)
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Pause recording' })))
    expect(recorders[0]?.pause).toHaveBeenCalled()
    expect(said()).toHaveTextContent('Recording paused')
    clock += 5000
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Resume recording' })))
    expect(recorders[0]?.resume).toHaveBeenCalled()
    advance(1.1)
    expect(screen.getByRole('timer')).toHaveTextContent('0:02')
  })

  it('stops at maxDuration and says why', async () => {
    await startRecording(mic(), { maxDuration: 3 })
    expect(screen.getByText('0:03 left')).toBeInTheDocument()
    advance(3.2)
    expect(recorders[0]?.stop).toHaveBeenCalled()
    expect(screen.getByRole('group', { name: 'Audio recorder' })).toHaveAttribute('data-state', 'recorded')
    expect(said()).toHaveTextContent('Time limit reached. Recording stopped, 0:03')
  })

  it('releases the microphone and the analyzer when a take stops', async () => {
    await startRecording()
    const stream = recorders[0]!.stream
    advance(1)
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Stop recording' })))
    expect(stream.tracks[0]?.stop).toHaveBeenCalled()
    expect(contexts[0]?.close).toHaveBeenCalled()
  })

  it('cleans up the tracks, recorder and context when it unmounts mid-take', async () => {
    const { unmount } = await startRecording()
    const recorder = recorders[0]!
    advance(1)
    unmount()
    expect(recorder.stop).toHaveBeenCalled()
    expect(recorder.stream.tracks[0]?.stop).toHaveBeenCalled()
    expect(contexts[0]?.close).toHaveBeenCalled()
  })

  it('explains a refused microphone and lets you try again', async () => {
    const getStream = vi.fn(() => Promise.reject(new DOMException('no', 'NotAllowedError')))
    await startRecording(getStream)
    expect(document.querySelector('[data-slot=audio-recorder-error]')).toHaveTextContent(/Microphone access is blocked/)
    expect(said()).toHaveTextContent(/Microphone access is blocked/)
    expect(screen.getByRole('group', { name: 'Audio recorder' })).toHaveAttribute('data-state', 'idle')
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Start recording' })))
    expect(getStream).toHaveBeenCalledTimes(2)
  })

  it('says when there is no microphone, and when the browser cannot record', async () => {
    const { unmount } = await startRecording(vi.fn(() => Promise.reject(new DOMException('none', 'NotFoundError'))))
    expect(document.querySelector('[data-slot=audio-recorder-error]')).toHaveTextContent(/No microphone found/)
    unmount()
    vi.stubGlobal('MediaRecorder', undefined)
    await startRecording()
    expect(document.querySelector('[data-slot=audio-recorder-error]')).toHaveTextContent('This browser can’t record audio.')
  })

  it('records in the app’s mimeType when supported, else falls back', async () => {
    FakeMediaRecorder.isTypeSupported.mockImplementation((type: string) => type === 'audio/mp4' || type === 'audio/ogg')
    const first = await startRecording(mic(), { mimeType: 'audio/ogg' })
    expect(recorders[0]?.mimeType).toBe('audio/ogg')
    first.unmount()
    await startRecording(mic(), { mimeType: 'audio/x-unknown' })
    expect(recorders[1]?.mimeType).toBe('audio/mp4')
  })

  it('discards with Undo, and calls onDiscard once the window closes', async () => {
    const onDiscard = vi.fn()
    await startRecording(mic(), { onDiscard })
    advance(1)
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Stop recording' })))
    vi.useFakeTimers()
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Discard recording' })))
    expect(screen.getByRole('group', { name: 'Audio recorder' })).toHaveAttribute('data-state', 'idle')
    expect(said()).toHaveTextContent('Recording discarded')
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Undo' })))
    expect(screen.getByRole('group', { name: 'Audio recorder' })).toHaveAttribute('data-state', 'recorded')
    expect(onDiscard).not.toHaveBeenCalled()
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Discard recording' })))
    act(() => vi.advanceTimersByTime(7000))
    expect(onDiscard).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:take')
  })

  it('opens an existing recording saved, for playback only', async () => {
    await act(async () => {
      render(<AudioRecorder value={new Blob(['x'], { type: 'audio/wav' })} />)
    })
    expect(screen.getByRole('group', { name: 'Audio recorder' })).toHaveAttribute('data-state', 'saved')
    expect(screen.getByRole('slider', { name: 'Seek' })).toBeInTheDocument()
    expect(document.querySelector('[data-slot=audio-recorder-time]')).toHaveTextContent('0:00 / 0:09')
    expect(screen.queryByRole('button', { name: 'Discard recording' })).toBeNull()
  })

  it('gives a saved take back its actions with saved={false}', async () => {
    await act(async () => {
      render(<AudioRecorder value={new Blob(['x'], { type: 'audio/wav' })} saved={false} />)
    })
    expect(screen.getByRole('group', { name: 'Audio recorder' })).toHaveAttribute('data-state', 'recorded')
    expect(screen.getByRole('button', { name: 'Discard recording' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('shows a still level meter under reduced motion', async () => {
    render(
      <YoujProvider reducedMotion="always">
        <AudioRecorder getStream={mic()} />
      </YoujProvider>,
    )
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Start recording' })))
    advance(0.5)
    const meter = document.querySelector('[data-slot=audio-recorder-meter]')
    expect(meter).toBeInTheDocument()
    expect(document.querySelector('[data-slot=audio-recorder-wave]')).toBeNull()
    expect(meter?.querySelectorAll('[data-yj-lit]').length).toBeGreaterThan(0)
  })
})
