import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { Film } from './film'
import { homeFromManifest } from './promo-video'

const scheme = vi.hoisted(() => ({ mounted: true, dark: false }))
vi.mock('@/lib/site-theme', () => ({ useSiteTheme: () => scheme }))

const TITLE = 'A release card drafts itself from the primitives, ships, and takes on a new theme.'

// The shape apps/promo publishes for the homepage's film.
const video = (name: string) => ({
  title: TITLE,
  loop: true,
  width: 1920,
  height: 1080,
  sources: [
    { src: `/promo/${name}.webm`, type: 'video/webm; codecs="vp9"' },
    { src: `/promo/${name}.mp4`, type: 'video/mp4; codecs="avc1.64002a"' },
  ],
  poster: { src: `/promo/${name}.jpg` },
})
const manifest = {
  videos: { 'home-film': video('home-film'), 'home-film-light': video('home-film-light') },
  home: { dark: 'home-film', light: 'home-film-light' },
}

describe('homeFromManifest', () => {
  it('reads the film in each scheme by name, WebM first, with its poster, size and title', () => {
    const film = homeFromManifest(manifest)!
    expect(film.title).toBe(TITLE)
    expect(film.dark).toEqual({ sources: manifest.videos['home-film'].sources, poster: '/promo/home-film.jpg', width: 1920, height: 1080 })
    expect(film.light!.poster).toBe('/promo/home-film-light.jpg')
  })

  it('lets one scheme stand in for the other, and finds no film without a video', () => {
    expect(homeFromManifest({ ...manifest, home: { light: 'home-film-light' } })).toEqual({ title: TITLE, dark: homeFromManifest(manifest)!.light, light: undefined })
    expect(homeFromManifest({ ...manifest, home: { dark: 'home-film-missing' } })).toBeNull()
    expect(homeFromManifest({ videos: manifest.videos })).toBeNull()
    expect(homeFromManifest({})).toBeNull()
  })
})

/* Motion's useInView on an observer that reports every element in view at once. */
function everythingInView() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private report: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.report([{ isIntersecting: true, intersectionRatio: 1, target } as unknown as IntersectionObserverEntry], this as never)
      }
      unobserve() {}
      disconnect() {}
    },
  )
}

describe('Film', () => {
  const film = homeFromManifest(manifest)!
  let play: ReturnType<typeof vi.spyOn>

  // The loop hydrates once it nears the screen, from a chunk of its own: have that in, as a visit would by then.
  beforeAll(() => import('./loop-video'))
  beforeEach(() => {
    scheme.dark = false
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  })
  afterEach(() => {
    // Unmount before the media mocks go: an effect still pending would otherwise call the real play().
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('is one image named by what it shows, both schemes’ posters painted first, and no video before the page is idle', async () => {
    const { container } = await act(async () => render(<Film film={film} />))
    expect(screen.getByRole('img', { name: TITLE })).toBeInTheDocument()
    const [dark, light] = [...container.querySelectorAll('picture')]
    expect(dark!.querySelector('img')).toHaveAttribute('src', '/promo/home-film.jpg')
    expect(dark).toHaveClass('hidden', 'dark:block')
    expect(light!.querySelector('img')).toHaveAttribute('src', '/promo/home-film-light.jpg')
    expect(light).toHaveClass('dark:hidden')
    expect(container.querySelector('video')).toBeNull()
  })

  it('plays the page’s scheme silently, with a pause button and no player controls or captions', async () => {
    everythingInView()
    const { container } = render(<Film film={film} />)
    await waitFor(() => expect(container.querySelector('video source')).toHaveAttribute('src', '/promo/home-film-light.webm'))
    const loop = container.querySelector('video')!
    expect(loop.muted).toBe(true)
    expect(loop).toHaveAttribute('loop')
    expect(loop).not.toHaveAttribute('controls')
    expect(loop.querySelector('track')).toBeNull()
    await waitFor(() => expect(play).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: 'Pause motion' })).toBeInTheDocument()
  })

  it('follows a theme switch mid-play, picking the other scheme’s cut up where it was', async () => {
    everythingInView()
    const { container, rerender } = render(<Film film={film} />)
    await waitFor(() => expect(container.querySelector('video')).not.toBeNull())
    const light = container.querySelector('video')!
    light.currentTime = 7.5
    fireEvent.timeUpdate(light)

    scheme.dark = true
    rerender(<Film film={film} />)
    await waitFor(() => expect(container.querySelector('video source')).toHaveAttribute('src', '/promo/home-film.webm'))
    const dark = container.querySelector('video')!
    expect(dark).not.toBe(light)
    Object.defineProperty(dark, 'duration', { value: 22, configurable: true })
    fireEvent.loadedMetadata(dark)
    expect(dark.currentTime).toBe(7.5)
  })

  it('keeps the poster under reduced motion, with nothing to pause', async () => {
    everythingInView()
    const { container } = render(
      <YoujProvider reducedMotion="always">
        <Film film={film} />
      </YoujProvider>,
    )
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)))
    expect(container.querySelector('video')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(play).not.toHaveBeenCalled()
  })
})
