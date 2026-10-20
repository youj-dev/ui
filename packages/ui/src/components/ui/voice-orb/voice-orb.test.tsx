import { act, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { VoiceOrb } from './voice-orb'

// Just enough of a WebGL2 context to compile, link and draw; draws and context losses are counted.
function fakeWebGL2() {
  const calls = { drawArrays: 0, loseContext: 0, uniform4f: [] as number[][], rings: [] as number[][] }
  const gl = new Proxy(
    {},
    {
      get: (_, key) => {
        if (key === 'drawArrays') return () => void calls.drawArrays++
        if (key === 'uniform4fv') return (_loc: unknown, v: Float32Array) => void calls.rings.push([...v])
        if (key === 'uniform4f') return (_loc: unknown, ...v: number[]) => void calls.uniform4f.push(v)
        if (key === 'getExtension') return () => ({ loseContext: () => void calls.loseContext++ })
        if (key === 'isContextLost') return () => false
        if (typeof key === 'string' && /^[A-Z0-9_]+$/.test(key)) return 0
        return () => ({})
      },
    },
  )
  return { gl, calls }
}

class FakeAnalyser {
  fftSize = 2048
  smoothingTimeConstant = 0.8
  minDecibels = -100
  maxDecibels = -30
  get frequencyBinCount() {
    return this.fftSize / 2
  }
  connect = vi.fn()
  disconnect = vi.fn()
  getFloatTimeDomainData = (out: Float32Array) => out.fill(0.25)
  getByteFrequencyData = (out: Uint8Array) => out.fill(200)
}

const contexts: FakeAudioContext[] = []
class FakeAudioContext {
  state = 'running'
  sampleRate = 48000
  destination = {}
  analyzer = new FakeAnalyser()
  source = { connect: vi.fn(), disconnect: vi.fn() }
  close = vi.fn(async () => {})
  resume = vi.fn(async () => {})
  constructor() {
    contexts.push(this)
  }
  createAnalyser = () => this.analyzer
  createMediaStreamSource = vi.fn(() => this.source)
  createMediaElementSource = vi.fn(() => this.source)
}

let frames: FrameRequestCallback[] = []
/** Runs the queued animation frames, `n` times, 1/60 s apart. */
function flush(n = 1) {
  for (let i = 0; i < n; i++) {
    const queued = frames
    frames = []
    act(() => queued.forEach((f) => f(1000 + i * 17)))
  }
}

beforeEach(() => {
  frames = []
  contexts.length = 0
  vi.stubGlobal('requestAnimationFrame', vi.fn((f: FrameRequestCallback) => frames.push(f)))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.stubGlobal('AudioContext', FakeAudioContext)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 168, height: 168, top: 0, left: 0, right: 168, bottom: 168, x: 0, y: 0, toJSON: () => ({}) })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const noContext = () => vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
const withWebGL = () => {
  const fake = fakeWebGL2()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((type: string) => (type === 'webgl2' ? fake.gl : null)) as never)
  return fake.calls
}

describe('VoiceOrb', () => {
  test('is an image named by the agent and its state', () => {
    noContext()
    const { rerender } = render(<VoiceOrb />)
    expect(screen.getByRole('img', { name: 'Voice agent: Idle' })).toBeInTheDocument()
    rerender(<VoiceOrb state="speaking" label="Ada" />)
    expect(screen.getByRole('img', { name: 'Ada: Speaking' })).toBeInTheDocument()
    const root = document.querySelector('[data-slot=voice-orb]')!
    expect(root).toHaveAttribute('data-state', 'speaking')
    expect(root).toHaveAttribute('data-size', 'default')
  })

  test('announces a change of state politely, not the first one', () => {
    noContext()
    const { rerender } = render(<VoiceOrb state="listening" />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('')
    rerender(<VoiceOrb state="thinking" />)
    expect(status).toHaveTextContent('Thinking')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })

  test('speaks the language pack’s words', () => {
    noContext()
    render(
      <YoujProvider labels={de}>
        <VoiceOrb state="listening" />
      </YoujProvider>,
    )
    expect(screen.getByRole('img', { name: 'Sprachassistent: Hört zu' })).toBeInTheDocument()
  })

  test('draws with WebGL2, runs a loop, and keeps its canvas reusable on unmount', () => {
    const calls = withWebGL()
    const { unmount } = render(<VoiceOrb state="speaking" level={0.8} />)
    expect(document.querySelector('[data-slot=voice-orb]')).toHaveAttribute('data-yj-renderer', 'webgl')
    flush(3)
    expect(calls.drawArrays).toBeGreaterThanOrEqual(2)
    unmount()
    expect(calls.loseContext).toBe(0)
    expect(cancelAnimationFrame).toHaveBeenCalled()
  })

  test('falls back to the CSS disc without a canvas context, which scales with the level', () => {
    noContext()
    render(<VoiceOrb level={1} />)
    expect(document.querySelector('[data-slot=voice-orb]')).toHaveAttribute('data-yj-renderer', 'css')
    flush()
    expect((document.querySelector('[data-slot=voice-orb-body]') as HTMLElement).style.transform).toBe('scale(1.0800)')
  })

  test('under reduced motion draws one still frame and starts no loop', () => {
    const calls = withWebGL()
    render(
      <YoujProvider reducedMotion="always">
        <VoiceOrb state="thinking" level={0.5} />
      </YoujProvider>,
    )
    flush()
    expect(calls.drawArrays).toBe(1)
    expect(frames).toHaveLength(0)
    // The picture holds still at its resting radius, grayed by nothing; only its size follows the level.
    expect(calls.uniform4f.at(-1)).toEqual([0.62, 1, 0.55, 0])
    expect((document.querySelector('[data-slot=voice-orb-body]') as HTMLElement).style.transform).toBe('scale(1.0400)')
  })

  test('analyzes a MediaStream lazily and closes its context on unmount, leaving the tracks alone', () => {
    noContext()
    const stop = vi.fn()
    class FakeMediaStream {
      getTracks = () => [{ stop }]
    }
    vi.stubGlobal('MediaStream', FakeMediaStream)
    const stream = new FakeMediaStream() as unknown as MediaStream
    const { rerender, unmount } = render(<VoiceOrb state="listening" />)
    expect(contexts).toHaveLength(0)
    rerender(<VoiceOrb state="listening" audio={stream} />)
    expect(contexts).toHaveLength(1)
    const ctx = contexts[0]!
    expect(ctx.createMediaStreamSource).toHaveBeenCalledWith(stream)
    expect(ctx.source.connect).toHaveBeenCalledWith(ctx.analyzer)
    flush(2)
    // A loud, flat reading: the CSS disc grows with it.
    expect((document.querySelector('[data-slot=voice-orb-body]') as HTMLElement).style.transform).not.toBe('scale(1.0000)')
    unmount()
    expect(ctx.close).toHaveBeenCalled()
    expect(stop).not.toHaveBeenCalled()
  })

  test('taps an app’s AudioNode without touching its context', () => {
    noContext()
    const ctx = new FakeAudioContext()
    const node = { context: ctx, connect: vi.fn(), disconnect: vi.fn() } as unknown as AudioNode
    const { unmount } = render(<VoiceOrb state="speaking" audio={node} />)
    expect(node.connect).toHaveBeenCalledWith(ctx.analyzer)
    unmount()
    expect(node.disconnect).toHaveBeenCalledWith(ctx.analyzer)
    expect(ctx.close).not.toHaveBeenCalled()
  })

  test('keeps a media element playing through its context after unmount', () => {
    noContext()
    const audio = document.createElement('audio')
    const { unmount } = render(<VoiceOrb state="speaking" audio={audio} />)
    const ctx = contexts[0]!
    expect(ctx.createMediaElementSource).toHaveBeenCalledWith(audio)
    expect(ctx.source.connect).toHaveBeenCalledWith(ctx.destination)
    unmount()
    expect(ctx.source.disconnect).toHaveBeenCalledWith(ctx.analyzer)
    expect(ctx.close).not.toHaveBeenCalled()
    // Mounting again reuses the element's one source.
    render(<VoiceOrb state="speaking" audio={audio} />)
    expect(contexts).toHaveLength(1)
  })

  test('names a muted microphone and keeps the glow inside its box unless it spills', () => {
    noContext()
    const { rerender } = render(<VoiceOrb state="listening" muted label="Ada" />)
    expect(screen.getByRole('img', { name: 'Ada: Listening, microphone off' })).toBeInTheDocument()
    expect(document.querySelector('[data-slot=voice-orb]')).toHaveAttribute('data-yj-muted', 'true')
    expect(document.querySelector('canvas')).toHaveClass('inset-0')
    rerender(<VoiceOrb state="listening" spill />)
    expect(document.querySelector('canvas')).toHaveClass('-inset-1/4')
  })

  test('speaking sends rings out with the level; the sphere’s radius stays round and only scales', () => {
    const calls = withWebGL()
    render(<VoiceOrb state="speaking" level={0.9} />)
    flush(30)
    const rings = calls.rings.at(-1) ?? []
    const live = [0, 4, 8, 12].filter((i) => (rings[i + 1] ?? 0) > 0.01)
    expect(live.length).toBeGreaterThan(0)
    const radius = calls.uniform4f.at(-1)?.[0] ?? 0
    // Out from the orb: every ring sits beyond the sphere's edge.
    for (const i of live) expect(rings[i]).toBeGreaterThan(radius)
    expect(radius).toBeGreaterThan(0.62)
  })
})
