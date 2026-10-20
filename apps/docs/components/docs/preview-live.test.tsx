import { useId } from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider, useYoujLook } from '@youj/core'
import { RootProvider } from 'fumadocs-ui/provider/base'
import { PreviewLive } from './preview-live'

const probe = vi.hoisted(() => ({ mounts: 0 }))

// A probe example that reports the YoujProvider settings it runs under.
vi.mock('@/examples', async () => {
  const { useEffect } = await import('react')
  const { useYouj, useYoujLook } = await import('@youj/core/lib/youj/provider')
  function Probe() {
    const k = useYouj()
    const style = useYoujLook()
    useEffect(() => {
      probe.mounts++
    }, [])
    return (
      <p data-testid="probe">
        scale {k.timeScale} reduced {String(k.reduced)} style {style}
      </p>
    )
  }
  return { examples: { 'test/probe': Probe } }
})

type User = ReturnType<typeof userEvent.setup>

/** Opens one of the island's menus (`scope`'s island) by its tile's name. */
async function openMenu(user: User, scope: HTMLElement, tile: RegExp) {
  await user.click(within(scope).getByRole('button', { name: tile }))
  return screen.findByRole('menu')
}
async function closeMenu(user: User) {
  await user.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
}
/** Picks a theme from `scope`'s Appearance menu. */
async function pickTheme(user: User, scope: HTMLElement, name: string) {
  // The first match is the palette's (Brutal and Terminal are a style too).
  await user.click(within(await openMenu(user, scope, /^Appearance:/)).getAllByRole('menuitemradio', { name: new RegExp(`^${name}`) })[0]!)
  await closeMenu(user)
}
/** Picks a device from the island's Device menu. */
/** Switches the device tile to `name` (a toggle between Desktop and Mobile). */
async function pickDevice(user: User, name: 'Desktop' | 'Mobile') {
  const tile = await screen.findByRole('button', { name: /^Device:/ })
  if (!new RegExp(`^Device: ${name}`).test(tile.getAttribute('aria-label') ?? '')) await user.click(tile)
}

/** Opens the island's Motion and size panel (in `scope`), where the size and the motion live. */
async function openView(user: User, scope: HTMLElement = document.body) {
  await user.click(within(scope).getByRole('button', { name: /^Motion and size/ }))
  return screen.findByRole('dialog')
}
async function closeView(user: User) {
  await user.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
}
/** Picks `option` from one of the panel's menus (Speed, Density, Scale, Reduced motion), each a select. */
async function choose(user: User, panel: HTMLElement, menu: string, option: RegExp) {
  await user.click(within(panel).getByRole('combobox', { name: new RegExp(`^${menu}:`) }))
  await user.click(await screen.findByRole('option', { name: option }))
}
/** Picks a choice from one of the panel's menus, then closes the panel. */
async function press(user: User, menu: string, option: RegExp) {
  await choose(user, await openView(user), menu, option)
  await closeView(user)
}

/** The live half as the frame hosts it, with its id. */
function Frame({ name = 'test/probe', file = 'probe.tsx', view, reserve }: { name?: string; file?: string; view?: string; reserve?: [number, number] }) {
  const id = useId()
  return (
    <div data-frame data-preview-box="">
      <PreviewLive name={name} file={file} id={id} view={view} reserve={reserve} />
    </div>
  )
}

/** A large example (one with a full page), which has the stage's corner: the device toggle and Expand. */
const renderFrame = (name = 'test/probe') => render(<Frame name={name} view="/view/components/probe" />)
/** An example without a full page: the device toggle sits in its corner. */
const renderSmall = (name = 'test/probe') => render(<Frame name={name} />)
const island = () => screen.getByRole('toolbar', { name: /preview controls$/ })
/** A frame's island, by its file's name. */
const islandOf = (file: string) => screen.getByRole('toolbar', { name: `${file}: preview controls` })
/** The stage's top corner: the device toggle, or a large example's way to its full page. */
const corner = () => screen.getByRole('toolbar', { name: /stage controls$/ })

/** Makes matchMedia answer for the queries a test names (the setup's answers false to all). */
function media(matching: (query: string) => boolean) {
  const original = window.matchMedia
  window.matchMedia = ((query: string) => ({ matches: matching(query), media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
  return () => {
    window.matchMedia = original
  }
}

describe('PreviewLive full page', () => {
  const view = '/view/pattern/probe?story=test/probe'

  it('offers the full-page key, in the stage’s corner, for any example with a view', () => {
    render(<Frame view={view} />)
    expect(within(corner()).getByRole('link', { name: 'Open as a full page' })).toHaveAttribute('href', view)
    expect(within(island()).queryByRole('link', { name: 'Open as a full page' })).toBeNull()
    expect(screen.queryByRole('link', { name: /^Expand/ })).toBeNull()
  })

  it('caps a very tall example, with an Expand link to the same page and the fade hidden from assistive tech', () => {
    const { container } = render(<Frame view={view} reserve={[1000, 1000]} />)
    expect(screen.getByRole('link', { name: 'Expand probe.tsx to a full page' })).toHaveAttribute('href', view)
    expect(container.querySelector('[aria-hidden].bg-linear-to-t')).not.toBeNull()
    expect(container.querySelector<HTMLElement>('[data-preview-stage]')!.style.getPropertyValue('--stage-min-sm')).toBe('480px')
  })

  it('leaves a tall but ordinary example, or one with no page, uncapped', () => {
    const tall = render(<Frame view={view} reserve={[900, 700]} />)
    expect(screen.queryByRole('link', { name: /^Expand/ })).toBeNull()
    expect(tall.container.querySelector<HTMLElement>('[data-preview-stage]')!.style.getPropertyValue('--stage-min-sm')).toBe('700px')
    tall.unmount()
    render(<Frame reserve={[1000, 1000]} />)
    expect(screen.queryByRole('link', { name: /^Expand/ })).toBeNull()
  })
})

describe('PreviewLive island', () => {
  it('offers the shared island’s controls, in its order: Code, the look, Entrance, Replay, motion and size, then Copy; the device sits in the stage’s corner', () => {
    renderSmall()
    const names = within(island())
      .getAllByRole('button')
      .map((b) => b.getAttribute('aria-label'))
    expect(names).toEqual(['Code', expect.stringMatching(/^Appearance:/), 'Entrance: None', 'Replay', 'Motion and size', 'Copy the code'])
    expect(within(corner()).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([expect.stringMatching(/^Device: Desktop/)])
    // Outside the stage's provider, over the stage, after it in the document and before the strip: the demo, its corner, then its strip.
    const stage = document.querySelector('[data-preview-stage]')!
    expect(stage).not.toContainElement(corner())
    expect(stage.compareDocumentPosition(corner()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(corner().compareDocumentPosition(island()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Copy is a quiet tile like the rest, not the accent-filled one.
    expect(within(island()).getByRole('button', { name: 'Copy the code' })).toHaveAttribute('data-variant', 'quiet')
  })

  it('gives every example its own island, in a strip under its stage, keys straight on the strip', () => {
    const { container } = render(
      <>
        <Frame file="a.tsx" />
        <Frame file="b.tsx" />
      </>,
    )
    const [a, b] = [...container.querySelectorAll<HTMLElement>('[data-frame]')]
    expect(a).toContainElement(islandOf('a.tsx'))
    expect(b).toContainElement(islandOf('b.tsx'))
    const stage = a!.querySelector('[data-preview-stage]')!
    // After the stage in the document, so the keyboard reaches the demo first.
    expect(stage.compareDocumentPosition(islandOf('a.tsx')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Outside the stage's provider, so the demo's preset and direction stay off it; in the same panel, which carries the aurora behind both.
    expect(stage).not.toContainElement(islandOf('a.tsx'))
    expect(islandOf('a.tsx').closest('.island-dock')!.parentElement).toBe(stage.closest('[data-preview-panel]'))
    expect(islandOf('a.tsx')).toHaveAttribute('aria-orientation', 'horizontal')
    expect(islandOf('a.tsx')).toHaveClass('bg-transparent', 'shadow-none')
  })

  it('opens the code in the large code modal, leaving the preview as it is, and gives focus back to Code on Escape', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ code: 'export default Probe', html: '<pre class="shiki"><code><span class="line">export default Probe</span></code></pre>' }))
    const user = userEvent.setup()
    try {
      const { container } = renderFrame()
      // The stage, not the whole box: the island in it marks its Code tile while the modal it opened is up.
      const stage = () => container.querySelector('[data-preview-stage]')!.outerHTML
      const before = stage()
      const tile = within(island()).getByRole('button', { name: 'Code' })
      await user.click(tile)
      const dialog = await screen.findByRole('dialog')
      expect(within(dialog).getByRole('heading', { name: 'probe.tsx' })).toBeInTheDocument()
      expect(await within(dialog).findByText('npx youj add test')).toBeInTheDocument()
      await vi.waitFor(() => expect(dialog).toHaveTextContent('export default Probe'))
      // The stage is untouched: no code shown in place, no layout change.
      expect(stage()).toBe(before)
      expect(screen.getByTestId('probe')).toBeVisible()
      await user.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      await waitFor(() => expect(tile).toHaveFocus())
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('is one tab stop whose arrows rove its tiles, after the stage’s corner keys', async () => {
    const user = userEvent.setup()
    renderSmall()
    await user.tab()
    expect(within(corner()).getByRole('button', { name: /^Device:/ })).toHaveFocus()
    await user.tab()
    expect(within(island()).getByRole('button', { name: 'Code' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(within(island()).getByRole('button', { name: /^Appearance:/ })).toHaveFocus()
  })
})

describe('PreviewLive device preview', () => {
  afterEach(() => localStorage.clear())

  it('shows a large example (one with a full page) on the reader\'s own device, with only Expand in its corner, even with Mobile picked', async () => {
    localStorage.setItem('youj-preview-device', 'touch')
    renderFrame()
    await screen.findByRole('toolbar', { name: /preview controls$/ })
    expect(within(corner()).getByRole('link', { name: 'Open as a full page' })).toHaveAttribute('href', '/view/components/probe')
    expect(within(corner()).queryByRole('button', { name: /^Device:/ })).toBeNull()
    expect(document.querySelector('[data-phone]')).toBeNull()
  })

  it('toggles between Desktop and Mobile in one tile, following the hardware until one is picked, and writes nothing before', async () => {
    renderSmall()
    expect(await screen.findByRole('button', { name: /^Device: Desktop.*Switch to Mobile$/ })).toBeInTheDocument()
    expect(screen.queryByRole('menu')).toBeNull()
    expect(localStorage.getItem('youj-preview-device')).toBeNull()
  })

  it('draws Mobile on a pointer screen as a phone: 393px, touch, the demo and its overlays inside, remembered', async () => {
    const user = userEvent.setup()
    renderSmall()
    expect(document.querySelector('[data-phone]')).toBeNull()
    await pickDevice(user, 'Mobile')
    const phone = document.querySelector<HTMLElement>('[data-phone-screen]')!
    expect(phone).toBeInTheDocument()
    expect(phone).toContainElement(screen.getByTestId('probe'))
    expect(screen.getByTestId('probe').closest('[data-yj-device]')).toHaveAttribute('data-yj-device', 'touch')
    expect(localStorage.getItem('youj-preview-device')).toBe('touch')
    expect(within(corner()).getByRole('button', { name: /^Device: Mobile/ })).toBeInTheDocument()
    await pickDevice(user, 'Desktop')
    expect(document.querySelector('[data-phone-screen]')).toBeNull()
  })

  it('on touch hardware is full width with no phone, and Desktop forces the pointer device', async () => {
    const user = userEvent.setup()
    const restore = media((q) => q.includes('pointer: coarse'))
    try {
      renderSmall()
      expect(within(corner()).getByRole('button', { name: /^Device: Mobile/ })).toBeInTheDocument()
      expect(document.querySelector('[data-phone]')).toBeNull()
      await pickDevice(user, 'Desktop')
      expect(screen.getByTestId('probe').closest('[data-yj-device]')).toHaveAttribute('data-yj-device', 'pointer')
    } finally {
      restore()
    }
  })

  it('lets a demo wider than the stage scroll instead of clipping it', () => {
    renderFrame()
    const scroller = document.querySelector('.stage-scroll')!
    expect(scroller).toHaveClass('overflow-x-auto')
  })
})

describe('PreviewLive size', () => {
  afterEach(() => localStorage.clear())
  const probeScope = (attribute: string) => screen.getByTestId('probe').closest(`[${attribute}]`)?.getAttribute(attribute)

  it('renders roomy at 100%; Density and Scale in Motion and size re-render the stage at once and are remembered', async () => {
    const user = userEvent.setup()
    renderFrame()
    expect(probeScope('data-yj-density')).toBe('roomy')
    expect(probeScope('data-yj-scaling')).toBe('100')
    const panel = await openView(user)
    expect(within(panel).getByRole('combobox', { name: 'Density: Standard' })).toBeInTheDocument()
    await choose(user, panel, 'Density', /^Compact/)
    expect(probeScope('data-yj-density')).toBe('compact')
    await choose(user, panel, 'Scale', /^80%/)
    expect(probeScope('data-yj-scaling')).toBe('80')
    expect(screen.getByRole('button', { name: 'Motion and size, changed' })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('youj-preview-size')!)).toEqual({ density: 'compact', scaling: '80%' })
    // The size re-renders the demo in place: no remount, unlike the motion.
    expect(screen.getAllByTestId('probe')).toHaveLength(1)
  })

  it('holds one pick for every preview on the page', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Frame />
        <Frame />
      </>,
    )
    const panel = await openView(user, screen.getAllByRole('toolbar', { name: /preview controls$/ })[0]!)
    await choose(user, panel, 'Density', /^Compact/)
    for (const probe of screen.getAllByTestId('probe')) expect(probe.closest('[data-yj-density]')).toHaveAttribute('data-yj-density', 'compact')
  })
})

describe('PreviewLive', () => {
  it('runs the example at normal speed, following the OS motion setting', () => {
    renderFrame()
    expect(screen.getByTestId('probe')).toHaveTextContent('scale 1 reduced false')
    expect(screen.getByRole('button', { name: 'Motion and size' })).toBeInTheDocument()
  })

  it('scales time for the example only, from Motion and size, and says so on the stage', async () => {
    const user = userEvent.setup()
    renderFrame()
    await press(user, 'Speed', /Quarter speed/)
    expect(screen.getByTestId('probe')).toHaveTextContent('scale 4')
    expect(screen.getByText('¼× speed')).toBeInTheDocument()
    await press(user, 'Speed', /Double speed/)
    expect(screen.getByTestId('probe')).toHaveTextContent('scale 0.5')
  })

  it('shows the designed reduced state from the same panel', async () => {
    const user = userEvent.setup()
    renderFrame()
    const panel = await openView(user)
    await choose(user, panel, 'Reduced motion', /^On/)
    expect(within(panel).getByRole('combobox', { name: 'Reduced motion: On' })).toBeInTheDocument()
    expect(within(panel).getByRole('combobox', { name: /^Speed: —/ })).toBeDisabled()
    expect(screen.getByTestId('probe')).toHaveTextContent('reduced true')
    expect(screen.getByText('reduced motion')).toBeInTheDocument()
  })

  it('remounts the example on replay, and when the motion changes', async () => {
    const user = userEvent.setup()
    renderFrame()
    const before = probe.mounts
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }))
    expect(probe.mounts).toBe(before + 1)
    await press(user, 'Speed', /Half speed/)
    expect(probe.mounts).toBe(before + 2)
  })

  it('runs on the site clock: a slowed site slows the stage, and its own speed multiplies that', () => {
    render(
      <YoujProvider timeScale={2}>
        <Frame file="probe.tsx" />
      </YoujProvider>,
    )
    expect(screen.getByTestId('probe')).toHaveTextContent('scale 2')
  })

  it('stays still when the OS reduces motion, and Motion and size says so and holds', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <Frame file="probe.tsx" />
      </YoujProvider>,
    )
    expect(screen.getByTestId('probe')).toHaveTextContent('reduced true')
    expect(screen.getByText('reduced motion')).toBeInTheDocument()
    const panel = await openView(user)
    expect(within(panel).getByText('Reduced by your system')).toBeInTheDocument()
    expect(within(panel).getByRole('combobox', { name: 'Reduced motion: On' })).toBeDisabled()
    expect(within(panel).getByRole('combobox', { name: /^Speed/ })).toBeDisabled()
  })

  it('builds the stage in Clean (the Classic look) like the site’s chrome, and in Bezel once picked: every preview, remembered for the next page', async () => {
    localStorage.clear()
    function SiteStyle() {
      return <p data-testid="site">{useYoujLook()}</p>
    }
    render(
      <YoujProvider>
        <SiteStyle />
        <Frame file="a.tsx" />
        <Frame file="b.tsx" />
      </YoujProvider>,
    )
    const [first, second] = screen.getAllByTestId('probe')
    expect(first).toHaveTextContent('style classic')
    expect(first!.closest('[data-yj-look]')).toHaveAttribute('data-yj-look', 'classic')
    const user = userEvent.setup()
    await user.click(within(await openMenu(user, screen.getAllByRole('toolbar', { name: /preview controls$/ })[0]!, /^Appearance:/)).getByRole('menuitemradio', { name: 'Bezel' }))
    await closeMenu(user)
    expect(first).toHaveTextContent('style bezel')
    expect(second).toHaveTextContent('style bezel')
    expect(first!.closest('[data-yj-look]')).toHaveAttribute('data-yj-look', 'bezel')
    expect(screen.getByTestId('site')).toHaveTextContent('classic')
    expect(localStorage.getItem('youj-showcase-look')).toBe('bezel')
    // A docs page's address never names it.
    expect(window.location.search).toBe('')
    cleanup()
    renderFrame()
    expect(screen.getByTestId('probe')).toHaveTextContent('style bezel')
    localStorage.clear()
  })

  it('wears the preset picked in its toolbar on its own stage, canvas and all, and nowhere else', async () => {
    const user = userEvent.setup()
    document.documentElement.setAttribute('data-yj-theme', 'basalt')
    // The site's own provider sits above every preview, so a preview's theme stays on its stage (a top-level provider would theme the document).
    const { container } = render(
      <YoujProvider>
        <Frame file="a.tsx" />
        <Frame file="b.tsx" />
      </YoujProvider>,
    )
    const [first, second] = [...container.firstElementChild!.children] as HTMLElement[]
    const [one, two] = ['a.tsx', 'b.tsx']
    const stage = (frame: HTMLElement) => frame.querySelector('[data-preview-stage]')!.closest('[data-yj-theme]')
    expect(within(islandOf(one!)).getByRole('button', { name: /^Appearance: Youj/ })).toBeInTheDocument()
    expect(stage(first!)).toHaveAttribute('data-yj-theme', 'basalt')
    await pickTheme(user, islandOf(one!), 'Meadow')
    expect(within(islandOf(one!)).getByRole('button', { name: /^Appearance: Meadow/ })).toBeInTheDocument()
    expect(stage(first!)).toHaveAttribute('data-yj-theme', 'meadow')
    expect(stage(second!)).toHaveAttribute('data-yj-theme', 'basalt')
    expect(islandOf(two!)).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('data-yj-theme', 'basalt')
    // A docs preview's pick is its own: the page's address never names it.
    expect(window.location.search).toBe('')
    document.documentElement.removeAttribute('data-yj-theme')
  })

  it('runs a picked preset with the site’s lively personality', async () => {
    const user = userEvent.setup()
    const { container } = render(<Frame file="a.tsx" />)
    const frame = container.firstElementChild as HTMLElement
    await pickTheme(user, islandOf('a.tsx'), 'Sandstone')
    expect(frame.querySelector('[data-preview-stage]')!.closest('[data-yj-theme]')).toHaveAttribute('data-yj-motion', 'lively')
  })

  it.each([
    ['light', 'Graphite', 'Heather'],
    ['dark', 'Basalt', 'Heather'],
  ] as const)('wears the site’s preset for the mode until one is picked (%s: %s)', async (mode, preset, other) => {
    const user = userEvent.setup()
    localStorage.clear()
    const { container } = render(
      <RootProvider theme={{ defaultTheme: mode, enableSystem: false }} search={{ enabled: false }}>
        <Frame file="a.tsx" />
      </RootProvider>,
    )
    const frame = container.querySelector<HTMLElement>('[data-frame]')!
    const stage = () => frame.querySelector('[data-preview-stage]')!.closest('[data-yj-theme]')
    expect(within(islandOf('a.tsx')).getByRole('button', { name: /^Appearance: Youj/ })).toBeInTheDocument()
    expect(stage()).toHaveAttribute('data-yj-theme', preset.toLowerCase())
    await pickTheme(user, islandOf('a.tsx'), other)
    expect(stage()).toHaveAttribute('data-yj-theme', other.toLowerCase())
  })

  it('lays the stage out right to left from Appearance’s Direction, and back', async () => {
    const user = userEvent.setup()
    const { container } = renderFrame()
    const direction = () => container.querySelector('[data-preview-stage]')!.closest('[dir]')!.getAttribute('dir')
    expect(direction()).toBe('ltr')
    const menu = await openMenu(user, document.body, /^Appearance:/)
    expect(within(menu).getByRole('menuitemradio', { name: 'Left to right' })).toHaveAttribute('aria-checked', 'true')
    await user.click(within(menu).getByRole('menuitemradio', { name: 'Right to left' }))
    expect(direction()).toBe('rtl')
    expect(within(island()).getByRole('button', { name: /right to left$/ })).toBeInTheDocument()
    await user.click(within(screen.getByRole('menu')).getByRole('menuitemradio', { name: 'Left to right' }))
    expect(direction()).toBe('ltr')
    await closeMenu(user)
  })

  it('fails loudly for an unregistered example', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderFrame('test/missing')).toThrow(/No example registered as "test\/missing"/)
    quiet.mockRestore()
  })
})
