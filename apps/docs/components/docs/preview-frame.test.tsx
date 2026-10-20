import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToString } from 'react-dom/server'
import { PreviewFrame } from './preview-frame'

// A probe example, so a mounted demo is visible.
vi.mock('@/examples', () => ({ examples: { 'test/probe': () => <p data-testid="probe">demo</p>, 'test/hover': () => <p data-testid="probe">demo</p>, 'test/down': () => <p data-testid="probe">demo</p> } }))

/** The published file (app/code): what the Code tab fetches. `test/down` fails once, then answers. */
let down = 0
const fetchCode = vi.fn(async (url: string) => {
  if (url === '/code/docs/test/down.json' && down++ === 0) return new Response('', { status: 503 })
  return Response.json({ code: 'export default Probe', html: '<pre class="shiki"><code><span class="line">export default Probe</span></code></pre>' })
})

/** An IntersectionObserver that sees everything it observes, at once (the setup's sees nothing), and keeps the margin it was given. */
class SeesAll {
  static margin: string | undefined
  constructor(private callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    SeesAll.margin = options?.rootMargin
  }
  observe(target: Element) {
    this.callback([{ isIntersecting: true, target, intersectionRect: { height: 400 } } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
  unobserve() {}
  disconnect() {}
}

const frame = (props: { height?: number; name?: string; reserve?: readonly [number, number] } = {}) => <PreviewFrame name="test/probe" file="probe.tsx" {...props} />
/** The stage's reserved height on a phone and from `sm` up (lib/preview.ts's stageBox). */
const reserved = (container: HTMLElement) => {
  const stage = container.querySelector<HTMLElement>('[data-preview-stage]')!
  return [stage.style.getPropertyValue('--stage-min'), stage.style.getPropertyValue('--stage-min-sm')]
}

describe('PreviewFrame', () => {
  // The first import of the live half transforms its whole tree; later ones hit the cache.
  beforeAll(() => import('./preview-live'), 60_000)
  beforeEach(() => vi.stubGlobal('fetch', fetchCode))
  afterEach(() => vi.unstubAllGlobals())

  it('is a shell until a reader nears it: an empty stage at its reserved height, no controls, and nothing live or fetched', () => {
    const { container } = render(frame({ height: 410 }))
    expect(reserved(container)).toEqual(['410px', '410px'])
    const stage = container.querySelector('[data-preview-stage]')!
    expect(stage).not.toHaveAttribute('data-live')
    // A screen reader that lands on the empty stage hears that the demo is on its way.
    expect(stage.parentElement).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByTestId('probe')).not.toBeInTheDocument()
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    // The code isn't in the page at all: it opens in the modal.
    expect(container.querySelector('.code-panel')).toBeNull()
    expect(fetchCode).not.toHaveBeenCalled()
  })

  it('loads the island and mounts the demo once the frame comes near the viewport', async () => {
    vi.stubGlobal('IntersectionObserver', SeesAll)
    const { container } = render(frame({ height: 410 }))
    expect(SeesAll.margin).toBe('200px 0px')
    expect(await screen.findByTestId('probe')).toBeInTheDocument()
    const island = screen.getByRole('toolbar', { name: 'probe.tsx: preview controls' })
    // Docked in its own example.
    expect(container).toContainElement(island)
    expect(container.querySelector('[data-preview-stage]')).toHaveAttribute('data-live')
    expect(container.querySelector('[data-preview-stage]')!.parentElement).not.toHaveAttribute('aria-busy')
    // The live stage takes the shell's height, so nothing moves.
    expect(reserved(container)).toEqual(['410px', '410px'])
  })

  it('reserves the height its demo measured where that is more than the page’s, before and after it mounts', async () => {
    const { container, unmount } = render(frame({ height: 320, reserve: [460, 300] }))
    // A phone gets the demo's 460; from `sm` up the page's 320 is already enough.
    expect(reserved(container)).toEqual(['460px', '320px'])
    expect(container.firstElementChild).toHaveAttribute('data-example', 'test/probe')
    expect(container.firstElementChild).toHaveAttribute('data-height', '320')
    unmount()
    vi.stubGlobal('IntersectionObserver', SeesAll)
    const live = render(frame({ height: 320, reserve: [460, 300] }))
    expect(await screen.findByTestId('probe')).toBeInTheDocument()
    expect(reserved(live.container)).toEqual(['460px', '320px'])
  })

  it('wakes on a mouse over it or a key, without waiting for the viewport', async () => {
    for (const wake of [
      (el: Element) => fireEvent.pointerOver(el, { pointerType: 'mouse' }),
      (el: Element) => fireEvent.keyDown(el, { key: 'x' }),
    ]) {
      const { container, unmount } = render(frame())
      expect(screen.queryByTestId('probe')).not.toBeInTheDocument()
      wake(container.firstElementChild!)
      expect(await screen.findByTestId('probe')).toBeInTheDocument()
      unmount()
    }
  })

  it('does not wake on a touch, which would only be a scroll', () => {
    const { container } = render(frame())
    fireEvent.pointerOver(container.firstElementChild!, { pointerType: 'touch' })
    fireEvent.touchStart(container.firstElementChild!)
    fireEvent.pointerDown(container.firstElementChild!, { pointerType: 'touch' })
    expect(screen.queryByTestId('probe')).not.toBeInTheDocument()
  })

  it('wakes at once where the browser has no IntersectionObserver', async () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    render(frame())
    expect(await screen.findByTestId('probe')).toBeInTheDocument()
  })

  it('opens the code in the large code modal from the island’s Code, fetching it then, and leaves the preview box as it was', async () => {
    vi.stubGlobal('IntersectionObserver', SeesAll)
    const user = userEvent.setup()
    const { container } = render(frame())
    await screen.findByTestId('probe')
    const stage = container.querySelector('[data-preview-stage]')!
    const before = stage.outerHTML
    expect(fetchCode).not.toHaveBeenCalled()
    // A pointer reaching the island's Code starts the fetch.
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Code' }), { pointerType: 'mouse' })
    expect(fetchCode).toHaveBeenCalledWith('/code/docs/test/probe.json')
    await user.click(screen.getByRole('button', { name: 'Code' }))
    const dialog = await screen.findByRole('dialog')
    await vi.waitFor(() => expect(dialog).toHaveTextContent('export default Probe'))
    // One section: no nav column, and a single file has no tree to show.
    expect(within(dialog).queryByRole('tablist', { name: 'The code' })).toBeNull()
    expect(within(dialog).queryByRole('tab', { name: 'Code' })).toBeNull()
    expect(within(dialog).queryByRole('button', { name: /file tree/ })).toBeNull()
    expect(stage.outerHTML).toBe(before)
    expect(screen.getByTestId('probe')).toBeVisible()
    await user.keyboard('{Escape}')
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Code' })).toHaveFocus())
  })

  it('ships no code in its server render', () => {
    vi.stubGlobal('window', undefined)
    const html = renderToString(frame())
    vi.unstubAllGlobals()
    expect(html).not.toContain('export default Probe')
  })

  it('says so in the modal when the code can’t be fetched, and fetches it again on Try again', async () => {
    vi.stubGlobal('IntersectionObserver', SeesAll)
    const user = userEvent.setup()
    render(frame({ name: 'test/down' }))
    await screen.findByTestId('probe')
    // A click with no pointer over the island first, so the first fetch is the modal's own.
    fireEvent.click(screen.getByRole('button', { name: 'Code' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The code couldn’t be loaded.')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await vi.waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('export default Probe'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps its shell when the live half fails to load', async () => {
    vi.resetModules()
    vi.doMock('./preview-live', () => {
      throw new Error('Failed to fetch dynamically imported module')
    })
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { PreviewFrame: Offline } = await import('./preview-frame')
    const { container } = render(<Offline name="test/probe" file="probe.tsx" />)
    fireEvent.keyDown(container.firstElementChild!, { key: 'x' })
    await vi.waitFor(() => expect(quiet).toHaveBeenCalled())
    expect(container.querySelector('[data-preview-stage]')).toBeInTheDocument()
    expect(screen.queryByTestId('probe')).not.toBeInTheDocument()
    quiet.mockRestore()
    vi.doUnmock('./preview-live')
    vi.resetModules()
  })

  it('keeps the live half, the island and every demo out of the page’s JavaScript: the frame imports them only when it wakes', () => {
    const source = readFileSync(join(process.cwd(), 'components/docs/preview-frame.tsx'), 'utf8')
    expect(source).not.toMatch(/^import [^']* from '(\.\/preview-live|@\/examples|@\/components\/showcase\/preview-island|@youj\/react\/components\/ui\/action-island)'/m)
    expect(source).toMatch(/import\('\.\/preview-live'\)/)
  })
})
