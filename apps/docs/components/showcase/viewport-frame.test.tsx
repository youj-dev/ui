import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RootProvider } from 'fumadocs-ui/provider/base'
import { FRAME_CHANNEL, type FrameState } from '@/lib/frame-sync'
import { ViewportFrame } from './viewport-frame'

const site = (ui: React.ReactNode) =>
  render(
    <RootProvider theme={{ defaultTheme: 'dark', enableSystem: false }} search={{ enabled: false }}>
      {ui}
    </RootProvider>,
  )

const frame = (zoomable = true) => site(<ViewportFrame src="/view/blocks/app-analytics-overview" title="Analytics overview" zoomable={zoomable} />)

type User = ReturnType<typeof userEvent.setup>

/** View options holds everything past the essentials: open it. */
const openView = async (user: User) => {
  await user.click(screen.getByRole('button', { name: /^View options/ }))
  return screen.findByRole('dialog')
}

const close = async (user: User) => {
  await user.click(screen.getByRole('button', { name: /^View options/ }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
}

/** The zoom View options shows as picked: `Fit`, `50%`… */
const zoom = async (user: User) => {
  const panel = await openView(user)
  const picked = within(panel).getByRole('combobox', { name: /^Zoom:/ }).getAttribute('aria-label')!.replace('Zoom: ', '')
  await close(user)
  return picked
}

const pickZoom = async (user: User, label: string) => {
  const panel = await openView(user)
  await user.click(within(panel).getByRole('combobox', { name: /^Zoom:/ }))
  await user.click(await screen.findByRole('option', { name: new RegExp(`^${label}`) }))
  await close(user)
}

/** The scale the demo is drawn at, from its iframe: '' at 100%. */
const drawn = (title = 'Analytics overview preview') => (screen.getByTitle(title) as HTMLIFrameElement).style.transform

/** The frame's demo loads once its stage is near the screen; setup.ts's observer never reports that, so these do. */
const seen = () =>
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
      }
      unobserve() {}
      disconnect() {}
    },
  )

beforeEach(() => {
  localStorage.clear()
  seen()
})
afterEach(() => vi.unstubAllGlobals())

describe('ViewportFrame loading', () => {
  it('holds the demo back until its stage is near the screen', () => {
    vi.unstubAllGlobals()
    frame()
    expect(screen.queryByTitle('Analytics overview preview')).toBeNull()
    expect(screen.getByText('Loading Analytics overview…')).toBeInTheDocument()
  })

  it('loads it once the stage is near', () => {
    frame()
    expect(screen.getByTitle('Analytics overview preview')).toHaveAttribute('src', '/view/blocks/app-analytics-overview')
  })
})

describe('ViewportFrame zoom', () => {
  it('starts at Fit and remembers a picked zoom', async () => {
    const user = userEvent.setup()
    frame()
    expect(await zoom(user)).toBe('Fit')
    await pickZoom(user, '75%')
    expect(await zoom(user)).toBe('75%')
    expect(drawn()).toBe('scale(0.75)')
    expect(localStorage.getItem('youj-preview-zoom')).toBe('75')
  })

  it('opens at the stored zoom, and ignores one it does not know', async () => {
    const user = userEvent.setup()
    localStorage.setItem('youj-preview-zoom', '50')
    const { unmount } = frame()
    expect(await zoom(user)).toBe('50%')
    unmount()
    localStorage.setItem('youj-preview-zoom', '300')
    frame()
    expect(await zoom(user)).toBe('Fit')
  })

  it('steps with ⌘/Ctrl − and + inside the frame, and leaves other keys alone', () => {
    localStorage.setItem('youj-preview-zoom', '75')
    frame()
    const reload = screen.getByRole('button', { name: 'Reload' })
    fireEvent.keyDown(reload, { key: '-', metaKey: true })
    expect(drawn()).toBe('scale(0.5)')
    fireEvent.keyDown(reload, { key: '-', ctrlKey: true })
    expect(drawn()).toBe('scale(0.5)')
    fireEvent.keyDown(reload, { key: '=', ctrlKey: true })
    fireEvent.keyDown(reload, { key: '+', metaKey: true })
    expect(drawn()).toBe('')
    const plain = fireEvent.keyDown(reload, { key: '-' })
    expect(plain).toBe(true)
    expect(drawn()).toBe('')
  })

  it('draws the demo at the chosen scale, laid out wider to fill the frame', async () => {
    const user = userEvent.setup()
    frame()
    await pickZoom(user, '50%')
    const iframe = screen.getByTitle('Analytics overview preview')
    expect(iframe.style.transform).toBe('scale(0.5)')
    expect(iframe.style.width).toBe('200%')
    await pickZoom(user, '100%')
    expect(iframe.style.transform).toBe('')
  })

  it('has no zoom control unless asked', async () => {
    const user = userEvent.setup()
    frame(false)
    const panel = await openView(user)
    expect(within(panel).queryByRole('combobox', { name: /^Zoom:/ })).not.toBeInTheDocument()
    expect(within(panel).getByRole('combobox', { name: /^Viewport:/ })).toBeInTheDocument()
  })
})

describe('ViewportFrame menus', () => {
  const stories = [
    { id: 'Card', name: 'Card' },
    { id: 'Split', name: 'Split' },
  ]
  const scenes = [
    { id: 'security', name: 'Security', category: 'lifecycle' },
    { id: 'cloud', name: 'Cloud regions', category: 'infrastructure' },
  ]

  it('switches the story from the kit’s menu, and passes it to the demo', async () => {
    const user = userEvent.setup()
    site(<ViewportFrame src="/view/blocks/auth-login" title="Login" stories={stories} />)
    expect(screen.getByRole('combobox', { name: 'Story: Card' })).toBeInTheDocument()
    await user.click(screen.getByRole('combobox', { name: 'Story: Card' }))
    await user.click(await screen.findByRole('option', { name: 'Split' }))
    expect(screen.getByTitle('Login preview')).toHaveAttribute('src', '/view/blocks/auth-login?story=Split')
  })

  it('passes a picked scene to the demo as ?illustration=, and Default drops it', async () => {
    Element.prototype.scrollIntoView ??= () => {}
    const user = userEvent.setup()
    site(<ViewportFrame src="/view/blocks/auth-login" title="Login" illustrations={scenes} />)
    await user.click(await screen.findByRole('button', { name: 'Illustration: Default' }))
    await user.click(await screen.findByRole('option', { name: /Security/ }))
    expect(screen.getByTitle('Login preview')).toHaveAttribute('src', '/view/blocks/auth-login?illustration=security')
    expect(screen.getByRole('link', { name: 'Open in a new tab' })).toHaveAttribute('href', '/view/blocks/auth-login?illustration=security')
    await user.click(screen.getByRole('button', { name: 'Illustration: Security' }))
    await user.click(await screen.findByRole('option', { name: /Default/ }))
    expect(screen.getByTitle('Login preview')).toHaveAttribute('src', '/view/blocks/auth-login')
  })
})

describe('ViewportFrame toolbar', () => {
  const full = (picker?: React.ReactNode) =>
    site(
      <ViewportFrame
        src="/view/blocks/auth-login"
        title="Login"
        zoomable
        size={{ density: 'compact', scaling: '90%' }}
        picker={picker}
        files={[{ path: 'components/login.tsx', lines: 1, src: '/code/login.json' }]}
        stories={[
          { id: 'Card', name: 'Card' },
          { id: 'Split', name: 'Split' },
        ]}
        illustrations={[{ id: 'security', name: 'Security', category: 'lifecycle' }]}
      />,
    )

  it('keeps to the essentials in one compact row: tabs, menus, the look, View options, Reload and Open', async () => {
    const { container } = full(<button type="button">Look</button>)
    const illustration = await screen.findByRole('button', { name: /^Illustration:/ })
    const toolbar = container.querySelector<HTMLElement>('[data-slot=preview-toolbar]')!
    const controls = [
      screen.getByRole('tablist', { name: 'Login' }),
      screen.getByRole('combobox', { name: /^Story:/ }),
      illustration,
      screen.getByRole('button', { name: /^View options/ }),
      screen.getByRole('button', { name: 'Reload' }),
      screen.getByRole('link', { name: 'Open in a new tab' }),
    ]
    for (const control of controls) {
      expect(toolbar).toContainElement(control)
      expect(control.className).toMatch(/control-xs/)
      expect(control.className).not.toMatch(/(^|\s)(pointer-coarse:)?(h|size)-(7|8|9|10)(\s|$)/)
    }
    expect(toolbar).toContainElement(screen.getByRole('button', { name: 'Look' }))
    // The secondary settings wait in View options.
    expect(screen.queryByRole('combobox', { name: /^Zoom:/ })).toBeNull()
    expect(screen.queryByRole('combobox', { name: /^Viewport:/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Size/ })).toBeNull()
    expect(screen.queryByRole('combobox', { name: /^Motion/ })).toBeNull()
  })

  it('holds the viewport, zoom, size and motion in View options, and dots the trigger once one is off its default', async () => {
    const user = userEvent.setup()
    full(<button type="button">Look</button>)
    expect(screen.getByRole('button', { name: 'View options' })).toBeInTheDocument()
    const panel = await openView(user)
    for (const name of ['Viewport', 'Size', 'Motion']) expect(within(panel).getByRole('region', { name })).toBeInTheDocument()
    // From `lg` up the look is in the toolbar, so not in here.
    expect(within(panel).queryByRole('region', { name: 'Look' })).toBeNull()
    // Every setting is a menu, its current choice on the trigger.
    for (const name of ['Viewport', 'Zoom', 'Density', 'Scale', 'Speed', 'Reduced motion']) expect(within(panel).getByRole('combobox', { name: new RegExp(`^${name}:`) })).toBeInTheDocument()
    expect(within(panel).queryByRole('group', { name: 'Speed' })).toBeNull()
    await user.click(within(panel).getByRole('combobox', { name: 'Viewport: Desktop' }))
    await user.click(await screen.findByRole('option', { name: /^Tablet/ }))
    expect(screen.getByRole('button', { name: 'View options, changed' })).toBeInTheDocument()
  })

  it('moves the look into View options below `lg`, where the toolbar hides it so the row never wraps', async () => {
    const user = userEvent.setup()
    const original = window.matchMedia
    window.matchMedia = ((query: string) => ({ matches: query.includes('1023.98px'), media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia
    try {
      const { container } = full(<button type="button">Look</button>)
      const toolbar = container.querySelector<HTMLElement>('[data-slot=preview-toolbar]')!
      expect(toolbar).toHaveClass('flex-nowrap')
      expect(screen.getByRole('button', { name: 'Look' }).parentElement).toHaveClass('max-lg:hidden')
      const panel = await openView(user)
      expect(within(within(panel).getByRole('region', { name: 'Look' })).getByRole('button', { name: 'Look' })).toBeInTheDocument()
      // Not a phone: the viewport section stays.
      expect(within(panel).getByRole('region', { name: 'Viewport' })).toBeInTheDocument()
    } finally {
      window.matchMedia = original
    }
  })
})

describe('ViewportFrame motion', () => {
  it('runs its demo at the speed its Motion menu picks, or in the reduced state, for this frame only', async () => {
    const user = userEvent.setup()
    site(<ViewportFrame src="/view/blocks/auth-login" title="Login" />)
    const frame = screen.getByTitle('Login preview') as HTMLIFrameElement
    const post = vi.spyOn(frame.contentWindow!, 'postMessage')
    const state = () => (post.mock.lastCall?.[0] as { state: FrameState }).state
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { channel: FRAME_CHANNEL, kind: 'hello' }, source: frame.contentWindow, origin: window.location.origin }))
    })
    expect(state()).toMatchObject({ preset: 'basalt', speed: 1, reduced: false })

    const panel = await openView(user)
    await user.click(within(panel).getByRole('combobox', { name: 'Speed: 1×' }))
    await user.click(await screen.findByRole('option', { name: /Half speed/ }))
    expect(state()).toMatchObject({ speed: 0.5, reduced: false })
    await user.click(within(panel).getByRole('combobox', { name: 'Reduced motion: Off' }))
    await user.click(await screen.findByRole('option', { name: /^On/ }))
    expect(state()).toMatchObject({ speed: 1, reduced: true })
    // The reduced state has no speed: none is shown until it's off again.
    expect(within(panel).getByRole('combobox', { name: 'Speed: —' })).toBeDisabled()
  })
})

describe('ViewportFrame framing', () => {
  const report = (frame: HTMLIFrameElement, height: number) =>
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { channel: FRAME_CHANNEL, kind: 'size', height }, source: frame.contentWindow, origin: window.location.origin }))
    })
  const stage = (frame: HTMLIFrameElement) => frame.closest('[data-framing]') as HTMLElement

  it('fills the frame with a page, at the height it is given', () => {
    site(<ViewportFrame src="/view/blocks/app-settings" title="Settings" height="700px" />)
    const frame = screen.getByTitle('Settings preview') as HTMLIFrameElement
    report(frame, 300)
    expect(stage(frame).style.height).toBe('700px')
    expect(stage(frame)).toHaveAttribute('data-framing', 'screen')
  })

  it('fits a card to the height its stage reports, up to the frame’s, on the stage itself with no screen around it', () => {
    site(<ViewportFrame src="/view/blocks/app-health-dial" title="Service Health" height="900px" framing="card" />)
    const frame = screen.getByTitle('Service Health preview') as HTMLIFrameElement
    report(frame, 560)
    expect(stage(frame).style.height).toContain('560px')
    expect(frame.parentElement).not.toHaveClass('ring-1')
    // A smaller report, as content sized by the viewport settles, doesn't shrink it in a loop.
    report(frame, 100)
    expect(stage(frame).style.height).toContain('560px')
  })

  it('fits a section to its height as drawn, starting from a guess until it reports', () => {
    site(<ViewportFrame src="/view/blocks/marketing-metrics" title="Metrics" height="900px" framing="section" />)
    const frame = screen.getByTitle('Metrics preview') as HTMLIFrameElement
    expect(stage(frame).style.height).toContain('520px')
    report(frame, 410)
    expect(stage(frame).style.height).toContain('410px')
    expect(frame.parentElement).toHaveClass('ring-1')
  })
})
