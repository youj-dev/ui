import { useRef } from 'react'
import { act, render, screen } from '@testing-library/react'
import { RootProvider } from 'fumadocs-ui/provider/base'
import { YoujProvider } from '@youj/core'
import { FRAME_CHANNEL, readFrameMessage, useFrameState, useFrameSync, type FrameReveal, type FrameState } from './frame-sync'
import type { PreviewMotion } from './preview'
import { SHOWCASE_LOOK_KEY, SHOWCASE_THEME_KEY, setShowcasePreset, setShowcaseLook } from './showcase-theme'

const STATE: FrameState = { dark: true, preset: 'graphite', speed: 0.5, reduced: false, style: 'classic' }
const REVEAL: FrameReveal = { from: 'start', duration: 340, easing: [0.16, 1, 0.3, 1] }
const message = (data: unknown, source: MessageEventSource | null, origin = window.location.origin) =>
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data, source, origin }))
  })

describe('readFrameMessage', () => {
  it('accepts the three messages, well formed', () => {
    expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'hello' })).toEqual({ channel: FRAME_CHANNEL, kind: 'hello' })
    expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'ready' })).toEqual({ channel: FRAME_CHANNEL, kind: 'ready' })
    expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'state', state: STATE })).toEqual({ channel: FRAME_CHANNEL, kind: 'state', state: STATE })
    expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'state', state: { ...STATE, speed: 2 } })?.kind).toBe('state')
  })

  it('drops a leftover `theme` from an older page, keeping the state', () => {
    expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'state', state: { ...STATE, theme: null } })).toEqual({ channel: FRAME_CHANNEL, kind: 'state', state: STATE })
  })

  it('rejects anything else: other channels, unknown presets, speeds or shapes', () => {
    expect(readFrameMessage('youj:frame')).toBeNull()
    expect(readFrameMessage({ channel: 'other', kind: 'hello' })).toBeNull()
    expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'state' })).toBeNull()
    expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'state', state: { ...STATE, preset: 'neon' } })).toBeNull()
    expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'state', state: { ...STATE, speed: 3 } })).toBeNull()
    expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'state', state: { ...STATE, dark: 'yes' } })).toBeNull()
    expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'state', state: { ...STATE, style: 'neon' } })).toBeNull()
  })

  it('carries the frame’s size when it names one, and rejects a malformed one', () => {
    const sized = { ...STATE, size: { density: 'compact', scaling: '75%' } }
    expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'state', state: sized })).toEqual({ channel: FRAME_CHANNEL, kind: 'state', state: sized })
    // None: the item's own size.
    expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'state', state: STATE })).not.toHaveProperty('state.size')
    for (const size of [null, 'compact', { density: 'airy', scaling: '90%' }, { density: 'roomy', scaling: '91%' }, { density: 'roomy' }])
      expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'state', state: { ...STATE, size } })).toBeNull()
  })

  it('reads a state without a style as Clean, the default, as the gallery’s capture sends it', () => {
    const { style: _, ...capture } = STATE
    expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'state', state: capture })).toEqual({ channel: FRAME_CHANNEL, kind: 'state', state: { ...STATE, style: 'clean' } })
    expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'state', state: STATE })).toMatchObject({ state: { style: 'classic' } })
  })

  it('carries a well-formed reveal with its state, and drops a malformed one without losing the state', () => {
    expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'state', state: STATE, reveal: REVEAL })).toEqual({ channel: FRAME_CHANNEL, kind: 'state', state: STATE, reveal: REVEAL })
    for (const reveal of [
      { ...REVEAL, from: 'left' },
      { ...REVEAL, duration: -1 },
      { ...REVEAL, duration: Infinity },
      { ...REVEAL, duration: 60_000 },
      { ...REVEAL, easing: [0, 0, 1] },
      { ...REVEAL, easing: [0, 0, 1, 'x'] },
      'sweep',
    ]) {
      expect(readFrameMessage({ channel: FRAME_CHANNEL, kind: 'state', state: STATE, reveal })).toEqual({ channel: FRAME_CHANNEL, kind: 'state', state: STATE })
    }
  })
})

describe('useFrameState (inside the frame)', () => {
  function Frame() {
    const { framed, state } = useFrameState()
    return <p data-testid="frame">{framed ? `framed ${state ? `${state.preset} ${state.dark ? 'dark' : 'light'} ${state.speed}` : 'waiting'}` : 'standalone'}</p>
  }

  afterEach(() => {
    vi.restoreAllMocks()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-yj-theme')
  })

  it('stands alone when it isn’t in a frame', () => {
    render(<Frame />)
    expect(screen.getByTestId('frame')).toHaveTextContent('standalone')
  })

  it('says hello, then applies the page’s mode and preset to its document without a reload', () => {
    const parent = { postMessage: vi.fn() }
    vi.spyOn(window, 'parent', 'get').mockReturnValue(parent as unknown as Window)
    render(<Frame />)
    expect(parent.postMessage).toHaveBeenCalledWith({ channel: FRAME_CHANNEL, kind: 'hello' }, window.location.origin)
    expect(screen.getByTestId('frame')).toHaveTextContent('framed waiting')

    message({ channel: FRAME_CHANNEL, kind: 'state', state: STATE }, parent as unknown as Window)
    expect(screen.getByTestId('frame')).toHaveTextContent('framed graphite dark 0.5')
    const html = document.documentElement
    expect(html).toHaveClass('dark')
    expect(html).toHaveAttribute('data-theme', 'dark')
    expect(html).toHaveAttribute('data-yj-theme', 'graphite')

    message({ channel: FRAME_CHANNEL, kind: 'state', state: { ...STATE, dark: false, preset: 'meadow' } }, parent as unknown as Window)
    expect(html).toHaveClass('light')
    expect(html).not.toHaveClass('dark')
    expect(html).toHaveAttribute('data-yj-theme', 'meadow')
  })

  it("sets a website's demo on a white page and an app's on the gray, from the first state, though the server already named the preset", () => {
    const parent = { postMessage: vi.fn() }
    vi.spyOn(window, 'parent', 'get').mockReturnValue(parent as unknown as Window)
    const html = document.documentElement
    function Item({ page }: { page: 'gray' | 'white' }) {
      useFrameState(page)
      return null
    }
    // Whites stay white: a website's demo keeps the gray page under white cards too (a white page would gray them).
    for (const [page, value] of [['white', '0'], ['gray', '0']] as const) {
      html.removeAttribute('style')
      html.setAttribute('data-yj-theme', 'graphite')
      const { unmount } = render(<Item page={page} />)
      message({ channel: FRAME_CHANNEL, kind: 'state', state: { ...STATE, dark: false } }, parent as unknown as Window)
      expect([page, html.style.getPropertyValue('--yj-neutral-page')]).toEqual([page, value])
      unmount()
    }
    html.removeAttribute('style')
  })

  it('ignores messages from other windows or origins, and malformed ones', () => {
    const parent = { postMessage: vi.fn() }
    vi.spyOn(window, 'parent', 'get').mockReturnValue(parent as unknown as Window)
    render(<Frame />)
    message({ channel: FRAME_CHANNEL, kind: 'state', state: STATE }, window)
    message({ channel: FRAME_CHANNEL, kind: 'state', state: STATE }, parent as unknown as Window, 'https://elsewhere.example')
    message({ channel: FRAME_CHANNEL, kind: 'state', state: { ...STATE, preset: 'neon' } }, parent as unknown as Window)
    expect(screen.getByTestId('frame')).toHaveTextContent('framed waiting')
    expect(document.documentElement).not.toHaveAttribute('data-yj-theme')
  })

  describe('a theme picked in the theme bar', () => {
    type Transition = { ready: Promise<void>; finished: Promise<void> }
    let start: ReturnType<typeof vi.fn>
    let animate: ReturnType<typeof vi.fn>
    let finish: () => void

    beforeEach(() => {
      animate = vi.fn()
      document.documentElement.animate = animate as unknown as typeof document.documentElement.animate
      start = vi.fn((update: () => void): Transition => {
        update()
        return { ready: Promise.resolve(), finished: new Promise<void>((resolve) => (finish = resolve)) }
      })
      Object.assign(document, { startViewTransition: start })
    })
    afterEach(() => {
      finish?.()
      delete (document as { startViewTransition?: unknown }).startViewTransition
    })

    const framed = () => {
      const parent = { postMessage: vi.fn() }
      vi.spyOn(window, 'parent', 'get').mockReturnValue(parent as unknown as Window)
      render(<Frame />)
      return parent as unknown as Window
    }

    it('sweeps in from the edge it names, in a view transition, on the page’s clock', async () => {
      const parent = framed()
      message({ channel: FRAME_CHANNEL, kind: 'state', state: STATE, reveal: REVEAL }, parent)
      expect(start).toHaveBeenCalledOnce()
      // The new theme is in place for the transition's new snapshot.
      expect(screen.getByTestId('frame')).toHaveTextContent('framed graphite dark 0.5')
      expect(document.documentElement).toHaveAttribute('data-yj-theme', 'graphite')
      await act(async () => {})
      expect(animate).toHaveBeenCalledWith(
        { clipPath: ['inset(0 100% 0 0)', 'inset(0 0 0 0)'] },
        { duration: 340, easing: 'cubic-bezier(0.16,1,0.3,1)', pseudoElement: '::view-transition-new(root)' },
      )
    })

    it('sweeps from the other edge the other way', async () => {
      const parent = framed()
      message({ channel: FRAME_CHANNEL, kind: 'state', state: STATE, reveal: { ...REVEAL, from: 'end' } }, parent)
      await act(async () => {})
      expect(animate.mock.lastCall?.[0]).toEqual({ clipPath: ['inset(0 0 0 100%)', 'inset(0 0 0 0)'] })
    })

    it('holds the default crossfade for the sweep, and lets it go after', async () => {
      const parent = framed()
      message({ channel: FRAME_CHANNEL, kind: 'state', state: STATE, reveal: REVEAL }, parent)
      const hold = () => Array.from(document.head.querySelectorAll('style')).find((s) => s.textContent?.includes('::view-transition-new(root)'))
      expect(hold()).toBeDefined()
      await act(async () => finish())
      expect(hold()).toBeUndefined()
    })

    it('mid-sweep, shows a newer theme at once instead of starting over', async () => {
      const parent = framed()
      message({ channel: FRAME_CHANNEL, kind: 'state', state: STATE, reveal: REVEAL }, parent)
      message({ channel: FRAME_CHANNEL, kind: 'state', state: { ...STATE, preset: 'meadow' }, reveal: REVEAL }, parent)
      expect(start).toHaveBeenCalledOnce()
      expect(document.documentElement).toHaveAttribute('data-yj-theme', 'meadow')
      await act(async () => finish())
      message({ channel: FRAME_CHANNEL, kind: 'state', state: { ...STATE, preset: 'basalt' }, reveal: REVEAL }, parent)
      expect(start).toHaveBeenCalledTimes(2)
    })

    it('switches in place under reduced motion, the site’s or the system’s', () => {
      const parent = framed()
      message({ channel: FRAME_CHANNEL, kind: 'state', state: { ...STATE, reduced: true }, reveal: REVEAL }, parent)
      expect(start).not.toHaveBeenCalled()
      expect(document.documentElement).toHaveAttribute('data-yj-theme', 'graphite')

      vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({ matches: query.includes('reduce'), addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList)
      message({ channel: FRAME_CHANNEL, kind: 'state', state: { ...STATE, preset: 'meadow' }, reveal: REVEAL }, parent)
      expect(start).not.toHaveBeenCalled()
      expect(document.documentElement).toHaveAttribute('data-yj-theme', 'meadow')
    })

    it('switches in place without View Transitions', () => {
      delete (document as { startViewTransition?: unknown }).startViewTransition
      const parent = framed()
      message({ channel: FRAME_CHANNEL, kind: 'state', state: STATE, reveal: REVEAL }, parent)
      expect(document.documentElement).toHaveAttribute('data-yj-theme', 'graphite')
      expect(animate).not.toHaveBeenCalled()
    })
  })

  it('stops listening when it unmounts', () => {
    vi.spyOn(window, 'parent', 'get').mockReturnValue({ postMessage: vi.fn() } as unknown as Window)
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<Frame />)
    unmount()
    expect(remove).toHaveBeenCalledWith('message', expect.any(Function))
  })
})

describe('useFrameSync (on the page)', () => {
  function Page({ motion, look }: { motion?: PreviewMotion; look?: boolean }) {
    const frame = useRef<HTMLIFrameElement>(null)
    const { ready } = useFrameSync(frame, { motion, look })
    return (
      <>
        <iframe ref={frame} title="demo" />
        <p data-testid="ready">{String(ready)}</p>
      </>
    )
  }
  const site = (ui: React.ReactNode) => (
    <RootProvider theme={{ defaultTheme: 'dark', enableSystem: false }} search={{ enabled: false }}>
      {ui}
    </RootProvider>
  )
  const hello = (frame: HTMLIFrameElement) => {
    const post = vi.spyOn(frame.contentWindow!, 'postMessage')
    message({ channel: FRAME_CHANNEL, kind: 'hello' }, frame.contentWindow)
    return (post.mock.lastCall?.[0] as { state: FrameState }).state
  }

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    window.history.replaceState(null, '', '/examples')
    // What the old site-wide switcher left behind: read by nothing now.
    localStorage.setItem('youj-site-preset', 'terminal')
    localStorage.setItem('youj-site-style', 'classic')
  })

  it('answers the frame’s hello with the default look, Basalt in Clean, whatever the site once stored', () => {
    render(site(<Page />))
    const frame = screen.getByTitle('demo') as HTMLIFrameElement
    const post = vi.spyOn(frame.contentWindow!, 'postMessage')
    message({ channel: FRAME_CHANNEL, kind: 'hello' }, frame.contentWindow)
    expect(post).toHaveBeenLastCalledWith(
      { channel: FRAME_CHANNEL, kind: 'state', state: { dark: true, preset: 'basalt', speed: 1, reduced: false, style: 'clean' } },
      window.location.origin,
    )
  })

  it('sends every change of the page’s preset and style at once, and writes neither to the site', () => {
    render(site(<Page />))
    const frame = screen.getByTitle('demo') as HTMLIFrameElement
    const post = vi.spyOn(frame.contentWindow!, 'postMessage')
    const last = () => (post.mock.lastCall?.[0] as { state: FrameState }).state

    act(() => setShowcasePreset('meadow'))
    expect(last()).toMatchObject({ preset: 'meadow', style: 'clean' })
    act(() => setShowcaseLook('classic'))
    expect(last()).toMatchObject({ preset: 'meadow', style: 'classic' })
    expect(localStorage.getItem(SHOWCASE_LOOK_KEY)).toBe('classic')
    expect(window.location.search).toBe('?theme=meadow&look=classic')
    act(() => setShowcasePreset('basalt'))
    expect(last()).toMatchObject({ preset: 'basalt' })
    expect(localStorage.getItem('youj-site-preset')).toBe('terminal')
    expect(document.documentElement).not.toHaveAttribute('data-yj-theme')
  })

  it('takes the height a section or card reports, the tallest until the demo reloads or the frame changes width', () => {
    function Sized() {
      const frame = useRef<HTMLIFrameElement>(null)
      const { height, reset, remeasure } = useFrameSync(frame)
      return (
        <>
          <iframe ref={frame} title="demo" />
          <p data-testid="height">{String(height)}</p>
          <button onClick={reset}>reload</button>
          <button onClick={remeasure}>resize</button>
        </>
      )
    }
    render(site(<Sized />))
    const frame = screen.getByTitle('demo') as HTMLIFrameElement
    const shown = () => screen.getByTestId('height').textContent
    expect(shown()).toBe('null')
    message({ channel: FRAME_CHANNEL, kind: 'size', height: 480 }, frame.contentWindow)
    expect(shown()).toBe('480')
    // Content sized by the viewport can't shrink the frame in a loop.
    message({ channel: FRAME_CHANNEL, kind: 'size', height: 420 }, frame.contentWindow)
    expect(shown()).toBe('480')
    message({ channel: FRAME_CHANNEL, kind: 'size', height: 610 }, frame.contentWindow)
    expect(shown()).toBe('610')
    // A new width keeps the height until the demo reports its new one, which then replaces it.
    act(() => screen.getByText('resize').click())
    expect(shown()).toBe('610')
    message({ channel: FRAME_CHANNEL, kind: 'size', height: 360 }, frame.contentWindow)
    expect(shown()).toBe('360')
    act(() => screen.getByText('reload').click())
    message({ channel: FRAME_CHANNEL, kind: 'size', height: 300 }, frame.contentWindow)
    expect(shown()).toBe('300')
    // Another window's, or a malformed one, is ignored.
    message({ channel: FRAME_CHANNEL, kind: 'size', height: 900 }, window)
    message({ channel: FRAME_CHANNEL, kind: 'size', height: -1 }, frame.contentWindow)
    message({ channel: FRAME_CHANNEL, kind: 'size', height: Infinity }, frame.contentWindow)
    expect(shown()).toBe('300')
  })

  it('sends the frame’s own speed and reduced motion, from its toolbar', () => {
    const { rerender } = render(site(<Page motion={{ speed: 0.25, reduced: false }} />))
    const frame = screen.getByTitle('demo') as HTMLIFrameElement
    expect(hello(frame)).toMatchObject({ speed: 0.25, reduced: false })
    const post = vi.spyOn(frame.contentWindow!, 'postMessage')
    rerender(site(<Page motion={{ speed: 1, reduced: true }} />))
    expect(post.mock.lastCall?.[0]).toMatchObject({ state: { speed: 1, reduced: true } })
    expect((post.mock.lastCall?.[0] as { reveal?: FrameReveal }).reveal).toBeUndefined()
  })

  it('sends the defaults to a frame that themes itself (Create’s), whatever the page picked', () => {
    sessionStorage.setItem(SHOWCASE_THEME_KEY, 'meadow')
    localStorage.setItem(SHOWCASE_LOOK_KEY, 'classic')
    render(site(<Page look={false} />))
    expect(hello(screen.getByTitle('demo') as HTMLIFrameElement)).toMatchObject({ preset: 'basalt', style: 'clean' })
  })

  it('opens with a linked or remembered choice, and reads a stale one as the default', () => {
    sessionStorage.setItem(SHOWCASE_THEME_KEY, 'meadow')
    const { unmount } = render(site(<Page />))
    expect(hello(screen.getByTitle('demo') as HTMLIFrameElement)).toMatchObject({ preset: 'meadow' })
    unmount()
    // Custom and the site-following default are gone; neither is a preset.
    sessionStorage.setItem(SHOWCASE_THEME_KEY, 'custom')
    window.history.replaceState(null, '', '/examples?theme=site')
    render(site(<Page />))
    expect(hello(screen.getByTitle('demo') as HTMLIFrameElement)).toMatchObject({ preset: 'basalt' })
  })

  describe('a pick in the theme bar', () => {
    /** A frame on screen that has painted its demo. */
    const shown = (ui: React.ReactNode = <Page />) => {
      render(site(ui))
      const frame = screen.getByTitle('demo') as HTMLIFrameElement
      vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue({ top: 100, left: 0, bottom: 500, right: 800, width: 800, height: 400 } as DOMRect)
      message({ channel: FRAME_CHANNEL, kind: 'ready' }, frame.contentWindow)
      const post = vi.spyOn(frame.contentWindow!, 'postMessage')
      const reveal = () => (post.mock.lastCall?.[0] as { reveal?: FrameReveal }).reveal
      return { frame, post, reveal }
    }

    afterEach(() => vi.restoreAllMocks())

    it('sweeps the frame from the side the selection moved away from, on the page’s clock', () => {
      const { reveal } = shown()
      act(() => setShowcasePreset('meadow'))
      // Basalt, the default, leads the bar: any other preset follows the key in from the start.
      expect(reveal()).toMatchObject({ from: 'start', duration: 340, easing: [0.2, 0, 0, 1] })
      act(() => setShowcasePreset('basalt'))
      expect(reveal()).toMatchObject({ from: 'end' })
    })

    it('sweeps a new style in too: Classic follows the key in from the start, Bezel from the end', () => {
      const { post, reveal } = shown()
      act(() => setShowcaseLook('classic'))
      expect(post.mock.lastCall?.[0]).toMatchObject({ state: { style: 'classic' } })
      expect(reveal()).toMatchObject({ from: 'start', duration: 340 })
      act(() => setShowcaseLook('bezel'))
      expect(reveal()).toMatchObject({ from: 'end' })
    })

    it('leaves a hello to swap in place', () => {
      const { frame, reveal } = shown()
      message({ channel: FRAME_CHANNEL, kind: 'hello' }, frame.contentWindow)
      expect(reveal()).toBeUndefined()
    })

    it('holds a frame out of view until those in view have swept, then swaps it in place', () => {
      vi.useFakeTimers()
      try {
        const { frame, post } = shown()
        vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue({ top: 2000, left: 0, bottom: 2400, right: 800, width: 800, height: 400 } as DOMRect)
        post.mockClear()
        act(() => setShowcasePreset('meadow'))
        act(() => setShowcasePreset('graphite'))
        // The frames share the page's thread: nothing yet, while those in view sweep.
        expect(post).not.toHaveBeenCalled()
        act(() => vi.advanceTimersByTime(340 + 560))
        // Then the latest pick, once, without a sweep.
        expect(post).toHaveBeenCalledOnce()
        expect(post.mock.lastCall?.[0]).toEqual({ channel: FRAME_CHANNEL, kind: 'state', state: expect.objectContaining({ preset: 'graphite' }) })
      } finally {
        vi.useRealTimers()
      }
    })

    it('swaps in place under the system’s reduced motion', () => {
      const { reveal } = shown(
        <YoujProvider reducedMotion="always">
          <Page />
        </YoujProvider>,
      )
      act(() => setShowcasePreset('meadow'))
      expect(reveal()).toBeUndefined()
    })

    it('waits for the frame’s demo to paint', () => {
      render(site(<Page />))
      const frame = screen.getByTitle('demo') as HTMLIFrameElement
      vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue({ top: 100, left: 0, bottom: 500, right: 800, width: 800, height: 400 } as DOMRect)
      const post = vi.spyOn(frame.contentWindow!, 'postMessage')
      act(() => setShowcasePreset('meadow'))
      expect((post.mock.lastCall?.[0] as { reveal?: FrameReveal }).reveal).toBeUndefined()
    })
  })

  it('reports the frame ready once its demo has painted, and only for its own frame', () => {
    render(site(<Page />))
    const frame = screen.getByTitle('demo') as HTMLIFrameElement
    message({ channel: FRAME_CHANNEL, kind: 'ready' }, window)
    expect(screen.getByTestId('ready')).toHaveTextContent('false')
    message({ channel: FRAME_CHANNEL, kind: 'ready' }, frame.contentWindow)
    expect(screen.getByTestId('ready')).toHaveTextContent('true')
  })
})
