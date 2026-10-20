import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { LoopVideo } from './loop-video'
import { loopsFromManifest, type LoopClip } from './promo-video'

const scheme = vi.hoisted(() => ({ mounted: true, dark: false }))
vi.mock('@/lib/site-theme', () => ({ useSiteTheme: () => scheme }))

// The shape apps/promo publishes for the topic loops.
const video = (name: string, width: number, height: number) => ({
  title: 'Icons on their drawing boards, then the whole set in waves.',
  loop: true,
  width,
  height,
  sources: [
    { src: `/promo/${name}.webm`, type: 'video/webm; codecs="vp9"' },
    { src: `/promo/${name}.mp4`, type: 'video/mp4; codecs="avc1.64002a"' },
  ],
  poster: { src: `/promo/${name}.jpg` },
})
// What the site publishes: each topic's wide cut, and nothing else.
const manifest = {
  videos: {
    'loop-icons': video('loop-icons', 1920, 1080),
    'loop-motion': video('loop-motion', 1920, 1080),
    'loop-illustrations': video('loop-illustrations', 1920, 1080),
  },
  loops: {
    icons: { wide: 'loop-icons' },
    motion: { wide: 'loop-motion' },
    illustrations: { wide: 'loop-illustrations' },
    // Named, but never rendered.
    themes: { wide: 'loop-themes' },
  },
}
// A manifest that also names a strip cut and a portrait cut, which apps/promo keeps as local exports: the reader takes them when they're there.
const withStrips = {
  videos: {
    ...manifest.videos,
    'loop-icons-tile': video('loop-icons-tile', 1120, 448),
    'loop-icons-tile-light': video('loop-icons-tile-light', 1120, 448),
    'loop-illustrations-tile': video('loop-illustrations-tile', 1120, 448),
    'loop-illustrations-tile-light': video('loop-illustrations-tile-light', 1120, 448),
  },
  loops: {
    icons: { wide: 'loop-icons', tall: 'loop-icons-tall', tile: { dark: 'loop-icons-tile', light: 'loop-icons-tile-light' } },
    illustrations: { wide: 'loop-illustrations', tile: { dark: 'loop-illustrations-tile', light: 'loop-illustrations-tile-light' } },
    // Named, but never rendered.
    themes: { wide: 'loop-themes', tile: { dark: 'loop-themes-tile' } },
  },
}

describe('loopsFromManifest', () => {
  it('reads each topic’s wide cut by name, WebM first, with its poster, size and title', () => {
    const loops = loopsFromManifest(manifest)
    expect(loops.icons!.title).toBe(manifest.videos['loop-icons'].title)
    expect(loops.icons!.wide).toEqual({ sources: manifest.videos['loop-icons'].sources, poster: '/promo/loop-icons.jpg', width: 1920, height: 1080 })
  })

  it('needs no strip or portrait cut: a topic with only its wide cut is a loop', () => {
    const { icons, motion } = loopsFromManifest(manifest)
    expect(icons!.tile).toBeUndefined()
    expect(motion!.wide!.poster).toBe('/promo/loop-motion.jpg')
    expect(motion!.tile).toBeUndefined()
  })

  it('reads the illustrations loop like every other part’s', () => {
    const { illustrations } = loopsFromManifest(manifest)
    expect(illustrations!.wide!.poster).toBe('/promo/loop-illustrations.jpg')
    expect(illustrations!.wide!.sources[0]!.src).toBe('/promo/loop-illustrations.webm')
  })

  it('reads a strip cut in each scheme when the manifest names one, and leaves the portrait cut alone', () => {
    const { icons, illustrations } = loopsFromManifest(withStrips)
    expect(icons!.tile!.dark!.poster).toBe('/promo/loop-icons-tile.jpg')
    expect(icons!.tile!.light!.poster).toBe('/promo/loop-icons-tile-light.jpg')
    expect(icons).not.toHaveProperty('tall')
    expect(illustrations!.tile!.dark!.sources[0]!.src).toBe('/promo/loop-illustrations-tile.webm')
    expect(illustrations!.tile!.light!.poster).toBe('/promo/loop-illustrations-tile-light.jpg')
  })

  it('leaves out cuts, and topics, whose videos were never rendered', () => {
    const loops = loopsFromManifest(manifest)
    expect(loops.themes).toBeUndefined()
    expect(loops.components).toBeUndefined()
    expect(loopsFromManifest(withStrips).themes).toBeUndefined()
    expect(loopsFromManifest({})).toEqual({})
  })
})

/* Motion's useInView on an observer that reports every element in view (or out of it) at once. */
function inView(visible: boolean) {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private report: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.report([{ isIntersecting: visible, intersectionRatio: visible ? 1 : 0, target } as unknown as IntersectionObserverEntry], this as never)
      }
      unobserve() {}
      disconnect() {}
    },
  )
}

describe('LoopVideo', () => {
  const { icons } = loopsFromManifest(manifest)
  // A dark and a light cut of one loop, as the homepage film has (here, the strip cuts of a manifest that names them).
  const tile = loopsFromManifest(withStrips).icons!.tile as { dark: LoopClip; light: LoopClip }
  let play: ReturnType<typeof vi.spyOn>
  let pause: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    scheme.dark = false
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  })
  afterEach(() => {
    // Unmount before the media mocks go: an effect still pending would otherwise call the real play().
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('is one labeled image, its poster painted first, with no video before the page is idle', () => {
    const { container } = render(<LoopVideo title={icons!.title} dark={icons!.wide!} sizes="100vw" />)
    expect(screen.getByRole('img', { name: icons!.title })).toBeInTheDocument()
    expect(container.querySelector('img')).toHaveAttribute('src', '/promo/loop-icons.jpg')
    expect(container.querySelector('img')).toHaveAttribute('alt', '')
    expect(container.querySelector('video')).toBeNull()
  })

  it('wakes the loop in view: muted, looping, inline, loading nothing until it plays, hidden from assistive tech', async () => {
    inView(true)
    const { container } = render(<LoopVideo title={icons!.title} dark={icons!.wide!} sizes="100vw" />)
    await waitFor(() => expect(container.querySelector('video')).not.toBeNull())
    const loop = container.querySelector('video')!
    expect(loop.querySelector('source')).toHaveAttribute('src', '/promo/loop-icons.webm')
    expect(loop).toHaveAttribute('loop')
    expect(loop).toHaveAttribute('playsinline')
    expect(loop).toHaveAttribute('preload', 'none')
    // The poster is already painted under it (the loop fades in over it), so the video asks for none of its own.
    expect(loop).not.toHaveAttribute('poster')
    expect(loop).toHaveAttribute('aria-hidden', 'true')
    expect(loop.muted).toBe(true)
    await waitFor(() => expect(play).toHaveBeenCalled())
  })

  it('holds still while it is off screen', async () => {
    inView(false)
    render(<LoopVideo title={icons!.title} dark={icons!.wide!} sizes="100vw" />)
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)))
    expect(play).not.toHaveBeenCalled()
  })

  it('keeps the poster under reduced motion', async () => {
    inView(true)
    const { container } = render(
      <YoujProvider reducedMotion="always">
        <LoopVideo title={icons!.title} dark={icons!.wide!} sizes="100vw" controls />
      </YoujProvider>,
    )
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)))
    expect(container.querySelector('video')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(play).not.toHaveBeenCalled()
  })

  it('follows the page’s scheme: the light cut in light, the dark in dark, each poster shown only in its own', async () => {
    inView(true)
    const { container, unmount } = render(<LoopVideo title={icons!.title} dark={tile.dark} light={tile.light} sizes="100vw" />)
    const [darkPoster, lightPoster] = [...container.querySelectorAll('picture')]
    expect(darkPoster).toHaveClass('hidden', 'dark:block')
    expect(lightPoster).toHaveClass('dark:hidden')
    await waitFor(() => expect(container.querySelector('video source')).toHaveAttribute('src', '/promo/loop-icons-tile-light.webm'))
    unmount()
    scheme.dark = true
    const dark = render(<LoopVideo title={icons!.title} dark={tile.dark} light={tile.light} sizes="100vw" />)
    await waitFor(() => expect(dark.container.querySelector('video source')).toHaveAttribute('src', '/promo/loop-icons-tile.webm'))
  })

  it('paints the poster in the best format the browser reads, at the size the slot needs, the JPG last', () => {
    const wide = { ...icons!.wide!, posterSet: { avif: '/promo/a-sm.avif 854w, /promo/a.avif 1280w', webp: '/promo/a-sm.webp 854w, /promo/a.webp 1280w', jpg: '/promo/a-sm.jpg 854w, /promo/a.jpg 1280w' } }
    const { container } = render(<LoopVideo title={icons!.title} dark={wide} sizes="(min-width: 48rem) 48rem, 100vw" />)
    const picture = container.querySelector('picture')!
    expect([...picture.children].map((el) => el.tagName)).toEqual(['SOURCE', 'SOURCE', 'IMG'])
    expect([...picture.querySelectorAll('source')].map((el) => el.getAttribute('type'))).toEqual(['image/avif', 'image/webp'])
    expect(picture.querySelector('source')).toHaveAttribute('sizes', '(min-width: 48rem) 48rem, 100vw')
    expect(picture.querySelector('img')).toHaveAttribute('srcset', wide.posterSet.jpg)
  })

  it('plays the cut made for the screen: a phone gets the small one, every source in the order the manifest gives', async () => {
    inView(true)
    const both = {
      ...icons!.wide!,
      sources: [
        { src: '/promo/a-sm.av1.webm', type: 'video/webm; codecs="av01.0.04M.08"', media: '(max-width: 640px)' },
        { src: '/promo/a-sm.mp4', type: 'video/mp4; codecs="avc1.64001f"', media: '(max-width: 640px)' },
        { src: '/promo/a.av1.webm', type: 'video/webm; codecs="av01.0.05M.08"' },
        { src: '/promo/a.mp4', type: 'video/mp4; codecs="avc1.64001f"' },
      ],
    }
    const sources = async (phone: boolean) => {
      vi.stubGlobal('matchMedia', (query: string) => ({ matches: phone && query === '(max-width: 640px)' }))
      const { container, unmount } = render(<LoopVideo title={icons!.title} dark={both} sizes="100vw" />)
      await waitFor(() => expect(container.querySelector('video')).not.toBeNull())
      const found = [...container.querySelectorAll('video source')].map((el) => el.getAttribute('src'))
      unmount()
      return found
    }
    expect(await sources(true)).toEqual(['/promo/a-sm.av1.webm', '/promo/a-sm.mp4', '/promo/a.av1.webm', '/promo/a.mp4'])
    expect(await sources(false)).toEqual(['/promo/a.av1.webm', '/promo/a.mp4'])
  })

  it('pauses and plays again from its own button', async () => {
    inView(true)
    render(<LoopVideo title={icons!.title} dark={icons!.wide!} sizes="100vw" controls />)
    const button = await screen.findByRole('button', { name: 'Pause motion' })
    act(() => fireEvent.click(button))
    expect(pause).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Play motion' })).toBeInTheDocument()
  })
})
