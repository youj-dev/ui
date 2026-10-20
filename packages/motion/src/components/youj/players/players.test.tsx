import { useEffect } from 'react'
import { act, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { LottiePlayer } from './lottie-player'

// ---------------------------------------------------------------- fakes

const h = vi.hoisted(() => {
  type Fn = (...args: unknown[]) => void
  const lottie = {
    props: {} as Record<string, unknown>,
    player: null as null | ReturnType<typeof makeLottie>,
  }
  function makeLottie() {
    const listeners = new Map<string, Set<Fn>>()
    return {
      isReady: true,
      isLoaded: true,
      isPlaying: false,
      totalFrames: 90,
      currentFrame: 0,
      play: vi.fn(),
      pause: vi.fn(),
      setFrame: vi.fn(),
      setMode: vi.fn(),
      getSlotIds: () => [] as string[],
      getSlotType: () => undefined,
      setColorSlot: vi.fn(() => true),
      addEventListener: (type: string, fn: Fn) => void (listeners.get(type) ?? listeners.set(type, new Set()).get(type)!).add(fn),
      removeEventListener: (type: string, fn: Fn) => void listeners.get(type)?.delete(fn),
      emit: (type: string, event: Record<string, unknown> = {}) => listeners.get(type)?.forEach((fn) => fn({ type, ...event })),
    }
  }
  return { lottie, makeLottie }
})

vi.mock('@lottiefiles/dotlottie-react', () => ({
  DotLottieReact: (props: Record<string, unknown> & { dotLottieRefCallback: (p: unknown) => void }) => {
    h.lottie.props = props
    useEffect(() => props.dotLottieRefCallback(h.lottie.player), [props])
    return <canvas />
  },
}))

// IntersectionObserver double: tests decide when elements enter or leave the viewport.
const observers: { cb: IntersectionObserverCallback; disconnected: boolean }[] = []
class FakeIO {
  entry: { cb: IntersectionObserverCallback; disconnected: boolean }
  constructor(cb: IntersectionObserverCallback) {
    this.entry = { cb, disconnected: false }
    observers.push(this.entry)
  }
  observe() {}
  disconnect() {
    this.entry.disconnected = true
  }
}
const setInView = (isIntersecting: boolean) =>
  act(() => {
    for (const o of observers) if (!o.disconnected) o.cb([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)
  })

beforeEach(() => {
  observers.length = 0
  vi.stubGlobal('IntersectionObserver', FakeIO)
  // LottiePlayer fetches `src` itself. By default the request never settles; the loading tests answer their own.
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  h.lottie.player = h.makeLottie()
})
afterEach(() => vi.unstubAllGlobals())

// ---------------------------------------------------------------- Lottie

describe('LottiePlayer', () => {
  test('reduced motion shows the last frame as a poster and never plays', () => {
    render(
      <YoujProvider reducedMotion="always">
        <LottiePlayer src="/a.json" autoplay loop />
      </YoujProvider>,
    )
    setInView(true)
    const player = h.lottie.player!
    expect(player.setFrame).toHaveBeenLastCalledWith(89)
    expect(player.play).not.toHaveBeenCalled()
  })

  test('reduced motion honours an explicit poster frame and a segment start', () => {
    const { rerender } = render(
      <YoujProvider reducedMotion="always">
        <LottiePlayer src="/a.json" posterFrame={12} />
      </YoujProvider>,
    )
    expect(h.lottie.player!.setFrame).toHaveBeenLastCalledWith(12)
    rerender(
      <YoujProvider reducedMotion="always">
        <LottiePlayer src="/a.json" posterFrame="first" segment={[20, 40]} />
      </YoujProvider>,
    )
    expect(h.lottie.player!.setFrame).toHaveBeenLastCalledWith(20)
  })

  test('speed is divided by the time scale', () => {
    const { rerender } = render(
      <YoujProvider timeScale={2}>
        <LottiePlayer src="/a.json" />
      </YoujProvider>,
    )
    expect(h.lottie.props.speed).toBe(0.5)
    rerender(
      <YoujProvider timeScale={0.5}>
        <LottiePlayer src="/a.json" speed={1.5} />
      </YoujProvider>,
    )
    expect(h.lottie.props.speed).toBe(3)
  })

  test('autoplay waits for the viewport and pauses offscreen', () => {
    render(<LottiePlayer src="/a.json" autoplay loop />)
    const player = h.lottie.player!
    expect(player.play).not.toHaveBeenCalled()

    setInView(true)
    expect(player.play).toHaveBeenCalledTimes(1)

    setInView(false)
    expect(player.pause).toHaveBeenCalled()

    setInView(true)
    expect(player.play).toHaveBeenCalledTimes(2)
  })

  test('a finished one-shot does not replay when it scrolls back into view', () => {
    render(<LottiePlayer src="/a.json" autoplay />)
    const player = h.lottie.player!
    setInView(true)
    act(() => player.emit('complete'))
    setInView(false)
    setInView(true)
    expect(player.play).toHaveBeenCalledTimes(1)
  })

  test('playOnView starts only once the player has been seen', () => {
    render(<LottiePlayer src="/a.json" playOnView />)
    expect(h.lottie.player!.play).not.toHaveBeenCalled()
    setInView(true)
    expect(h.lottie.player!.play).toHaveBeenCalledTimes(1)
  })

  test('controlled playing overrides autoplay', () => {
    const { rerender } = render(<LottiePlayer src="/a.json" autoplay playing={false} />)
    setInView(true)
    expect(h.lottie.player!.play).not.toHaveBeenCalled()
    rerender(<LottiePlayer src="/a.json" autoplay playing />)
    expect(h.lottie.player!.play).toHaveBeenCalledTimes(1)
  })

  test('disconnects its observer on unmount', () => {
    const { unmount } = render(<LottiePlayer src="/a.json" autoplay />)
    unmount()
    expect(observers.every((o) => o.disconnected)).toBe(true)
  })
})

describe('LottiePlayer loading', () => {
  // Requests are shared by URL while in flight, so each test loads its own file.
  const respond = (body: string | Uint8Array, { ok = true, status = 200, statusText = 'OK' } = {}) => {
    const bytes = typeof body === 'string' ? new TextEncoder().encode(body) : body
    return { ok, status, statusText, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }
  }
  function answerFetch() {
    let settle!: (response: unknown) => void
    const fetch = vi.fn(() => new Promise((resolve) => (settle = resolve)))
    vi.stubGlobal('fetch', fetch)
    return { fetch, respond: (response: unknown) => act(async () => settle(response)) }
  }

  test('fetches the file itself and hands dotLottie the data, never the URL', async () => {
    const request = answerFetch()
    render(<LottiePlayer src="/check.json" />)
    expect(request.fetch).toHaveBeenCalledWith('/check.json')
    expect(h.lottie.props.src).toBeUndefined()
    expect(h.lottie.props.data).toBeUndefined()
    await request.respond(respond('{"v":"5.7.0"}'))
    expect(h.lottie.props.data).toBe('{"v":"5.7.0"}')
  })

  test('the data waits for dotLottie to be ready: an earlier load would be dropped', async () => {
    h.lottie.player!.isReady = false
    const request = answerFetch()
    render(<LottiePlayer src="/early.json" />)
    await request.respond(respond('{"v":"5.7.0"}'))
    expect(h.lottie.props.data).toBeUndefined()
    h.lottie.player!.isReady = true
    act(() => h.lottie.player!.emit('ready'))
    expect(h.lottie.props.data).toBe('{"v":"5.7.0"}')
  })

  test('a remount mid-load picks up the same request instead of aborting it', async () => {
    const request = answerFetch()
    render(<LottiePlayer src="/remount.json" />).unmount()
    render(<LottiePlayer src="/remount.json" />)
    expect(request.fetch).toHaveBeenCalledTimes(1)
    await request.respond(respond('{"v":"5.7.0"}'))
    expect(h.lottie.props.data).toBe('{"v":"5.7.0"}')
  })

  test('a .lottie file (a zip) stays binary', async () => {
    const request = answerFetch()
    render(<LottiePlayer src="/sting.lottie" />)
    await request.respond(respond(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3])))
    expect(h.lottie.props.data).toBeInstanceOf(ArrayBuffer)
  })

  test('a failed load reaches onError, but not once the player has gone', async () => {
    const onError = vi.fn()
    let request = answerFetch()
    render(<LottiePlayer src="/missing.json" onError={onError} />)
    await request.respond(respond('', { ok: false, status: 404, statusText: 'Not Found' }))
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('404 Not Found') }))

    onError.mockClear()
    request = answerFetch()
    render(<LottiePlayer src="/unmounted.json" onError={onError} />).unmount()
    await request.respond(respond('', { ok: false, status: 500, statusText: 'Server Error' }))
    expect(onError).not.toHaveBeenCalled()
  })

  test('dotLottie rejecting the data reaches onError', () => {
    const onError = vi.fn()
    render(<LottiePlayer data={{ v: '5.7.0' }} onError={onError} />)
    const error = new Error('Invalid Lottie JSON object')
    act(() => h.lottie.player!.emit('loadError', { error }))
    expect(onError).toHaveBeenCalledWith(error)
  })

  test('with neither src nor data it renders empty and requests nothing', () => {
    render(<LottiePlayer />)
    expect(fetch).not.toHaveBeenCalled()
    expect(h.lottie.props.data).toBeUndefined()
  })

  test('inline data is passed as is, with no request', () => {
    const json = { v: '5.7.0' }
    render(<LottiePlayer data={json} />)
    expect(fetch).not.toHaveBeenCalled()
    expect(h.lottie.props.data).toBe(json)
  })
})
