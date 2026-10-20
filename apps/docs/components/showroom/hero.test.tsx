import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { RootProvider } from 'fumadocs-ui/provider/base'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { TooltipProvider } from '@youj/react'
import { IslandButton } from '@/components/explorer/island'
import { PanelActions, PanelLink, PanelRow, PanelSection, ShowroomHero, StageReadout, type ShowroomHeroProps } from './hero'

function hero(props: Partial<ShowroomHeroProps> = {}) {
  const all: ShowroomHeroProps = {
    eyebrow: 'Specimens lab',
    itemKey: 'fern',
    name: 'Fern',
    nameId: 'specimen-name',
    announce: 'Fern, 2 of 9',
    stage: <svg data-testid="drawing" />,
    scheme: 'light',
    onSchemeChange: vi.fn(),
    reduced: false,
    onReducedChange: vi.fn(),
    toolbarLabel: 'Fern: view',
    ...props,
  }
  render(
    <RootProvider theme={{ defaultTheme: 'light', enableSystem: false }} search={{ enabled: false }}>
      <YoujProvider reducedMotion="always">
        <TooltipProvider>
          <ShowroomHero {...all} />
        </TooltipProvider>
      </YoujProvider>
    </RootProvider>,
  )
  return all
}

const plate = () => document.querySelector<HTMLElement>('[data-scheme]')!
const toolbarNames = () => [...screen.getByRole('toolbar', { name: 'Fern: view' }).querySelectorAll('button')].map((b) => b.getAttribute('aria-label'))

beforeEach(() => localStorage.clear())

describe('the showroom hero', () => {
  it('heads the panel with what it is: the area and its links, the item’s name (labelling the section), its byline and its details', () => {
    hero({ links: <PanelLink href="/docs/specimens">Docs</PanelLink>, byline: ['Pteridophyta', 'Study 04'], meta: <p>Fronds · spores</p> })
    expect(screen.getByRole('heading', { level: 1, name: 'Specimens lab' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs/specimens')
    const name = screen.getByRole('heading', { level: 2, name: 'Fern' })
    expect(name).toHaveAttribute('id', 'specimen-name')
    expect(name).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('region', { name: 'Fern' })).toContainElement(name)
    expect(screen.getByText('Fern, 2 of 9')).toHaveAttribute('aria-live', 'polite')
    expect(name.closest('header')).toHaveTextContent('Pteridophyta·Study 04')
    expect(screen.getByText('Fronds · spores')).toBeInTheDocument()
  })

  it('shows a short description whole, and lays a long one out in full over the panel from More, never pushing the page', async () => {
    hero({ description: 'A frond unrolls.' })
    expect(screen.getByText('A frond unrolls.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'More' })).toBeNull()
    cleanup()
    // jsdom lays nothing out: a paragraph taller than its box is one cut short.
    const tall = vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(120)
    const box = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100)
    hero({ description: 'A frond unrolls from a fiddlehead, its spores ripen under its leaflets, and it keeps the shade.' })
    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    const whole = await screen.findByRole('dialog', { name: 'The whole description' })
    expect(whole).toHaveTextContent('its spores ripen under its leaflets')
    fireEvent.click(within(whole).getByRole('button', { name: 'Less' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'The whole description' })).toBeNull())
    tall.mockRestore()
    box.mockRestore()
  })

  it('puts any content on the stage, in the scheme it’s given, with what it’s doing printed beside its toolbar', () => {
    hero({ scheme: 'dark', readout: <StageReadout label="Readout" value="33.3 rpm" state="Playing" live /> })
    expect(plate()).toContainElement(screen.getByTestId('drawing'))
    expect(plate()).toHaveAttribute('data-scheme', 'dark')
    // A stage of its own in the scheme it's given: the stage's own page colour, whatever the site's mode.
    expect(plate()).toHaveClass('site-stage')
    expect(plate()).toHaveAttribute('data-theme', 'dark')
    const readout = screen.getByRole('group', { name: 'Readout' })
    expect(readout).toHaveTextContent('33.3 rpm')
    expect(readout).toHaveTextContent('Playing')
    // Never announced: it can change many times a second.
    expect(readout.closest('[aria-live]')).toBeNull()
  })

  it('holds a readout’s place while it loads', () => {
    render(<StageReadout label="Readout" value={undefined} loading />)
    expect(screen.getByRole('group', { name: 'Readout' })).toHaveTextContent('—Loading')
  })

  it('asks its owner to switch the scheme and reduced motion, and says which is on', () => {
    const props = hero({ scheme: 'dark', reduced: true })
    fireEvent.click(screen.getByRole('button', { name: 'Show it on light' }))
    expect(props.onSchemeChange).toHaveBeenCalledWith('light')
    const reduced = screen.getByRole('button', { name: 'Reduced motion' })
    expect(reduced).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(reduced)
    expect(props.onReducedChange).toHaveBeenCalledWith(false)
  })

  it('puts the area’s playback first on the stage’s toolbar, then the view, its own tool before Fullscreen', () => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true })
    hero({ transport: <IslandButton label="Replay">↻</IslandButton>, tool: <IslandButton label="In context">▣</IslandButton> })
    expect(plate()).toContainElement(screen.getByRole('toolbar', { name: 'Fern: view' }))
    expect(toolbarNames()).toEqual(['Replay', 'Show it on dark', 'Reduced motion', 'In context', 'Fullscreen'])
    Reflect.deleteProperty(document, 'fullscreenEnabled')
  })

  it('switches the stage between Raw and In context: the toolbar’s first keys from sm, under the plate beside the readout on a phone', () => {
    const onViewChange = vi.fn()
    hero({ view: 'raw', onViewChange, readout: <StageReadout label="Readout" value="Playing" />, transport: <IslandButton label="Replay">↻</IslandButton> })
    // A phone (jsdom's matchMedia matches nothing): under the plate, with the readout, out of the toolbar.
    const views = screen.getByRole('toolbar', { name: 'View' })
    expect(plate()).not.toContainElement(views)
    expect(views.parentElement).toContainElement(screen.getByRole('group', { name: 'Readout' }))
    expect(within(views).getByRole('button', { name: 'Raw' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(within(views).getByRole('button', { name: 'Context' }))
    expect(onViewChange).toHaveBeenCalledWith('context')
    cleanup()
    const real = window.matchMedia
    const roomy = vi.spyOn(window, 'matchMedia').mockImplementation((query) => (query === '(min-width: 40rem)' ? ({ ...real(query), matches: true } as MediaQueryList) : real(query)))
    hero({ view: 'context', onViewChange, transport: <IslandButton label="Replay">↻</IslandButton> })
    // From sm: a control of its own on the paper, at the top's middle, apart from the toolbar.
    const bar = screen.getByRole('toolbar', { name: 'Fern: view' })
    const group = screen.getByRole('toolbar', { name: 'View' })
    expect(plate()).toContainElement(group)
    expect(bar).not.toContainElement(group)
    expect(toolbarNames()[0]).toBe('Replay')
    expect(within(group).getByRole('button', { name: 'Context' })).toHaveAttribute('aria-pressed', 'true')
    roomy.mockRestore()
  })

  it('draws no view switch for an area without a context', () => {
    hero()
    expect(screen.queryByRole('toolbar', { name: 'View' })).toBeNull()
  })

  it('rings the stage while a frame on it has focus', async () => {
    hero({ stage: <iframe title="Fern, live" /> })
    expect(plate()).not.toHaveAttribute('data-frame-focus')
    // Focus going into a frame blurs the page's window, the frame its active element.
    Object.defineProperty(document, 'activeElement', { configurable: true, get: () => screen.getByTitle('Fern, live') })
    act(() => void window.dispatchEvent(new Event('blur')))
    await act(() => new Promise((r) => setTimeout(r, 5)))
    expect(plate()).toHaveAttribute('data-frame-focus')
    Reflect.deleteProperty(document, 'activeElement')
    act(() => void window.dispatchEvent(new Event('focus')))
    await act(() => new Promise((r) => setTimeout(r, 5)))
    expect(plate()).not.toHaveAttribute('data-frame-focus')
  })

  it('ends the panel with its controls, then its actions, in reading and focus order', () => {
    const onUse = vi.fn()
    hero({
      links: <PanelLink href="/docs/specimens">Docs</PanelLink>,
      children: (
        <PanelSection id="specimen-tune" title="Tune">
          <PanelRow label="Size" value="64 px">
            <input aria-label="Size" />
          </PanelRow>
        </PanelSection>
      ),
      actions: <PanelActions onUse={onUse} />,
    })
    const tune = screen.getByRole('region', { name: 'Tune' })
    expect(tune).toHaveTextContent('Size64 px')
    const use = screen.getByRole('button', { name: 'Use it' })
    const focusable = [...document.querySelectorAll<HTMLElement>('a[href], button, input')]
    expect(focusable.indexOf(screen.getByRole('link', { name: 'Docs' }))).toBeLessThan(focusable.indexOf(screen.getByRole('textbox', { name: 'Size' })))
    expect(focusable.indexOf(screen.getByRole('textbox', { name: 'Size' }))).toBeLessThan(focusable.indexOf(use))
    // One action, the panel's width: copying the code is the stage's.
    expect(use).toHaveClass('w-full')
    expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull()
    fireEvent.click(use)
    expect(onUse).toHaveBeenCalledWith(use)
  })

  it('copies the code from the stage’s toolbar, the icon saying Copied, then resting', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    hero({ copy: '<Fern />', actions: <PanelActions onUse={vi.fn()} /> })
    const bar = screen.getByRole('toolbar', { name: 'Fern: view' })
    fireEvent.click(within(bar).getByRole('button', { name: 'Copy code' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('<Fern />'))
    expect(await within(bar).findByRole('button', { name: 'Copied' })).toBeInTheDocument()
    expect(screen.getByText('Code copied')).toHaveAttribute('aria-live', 'polite')
    await act(() => vi.advanceTimersByTimeAsync(1700))
    expect(within(bar).getByRole('button', { name: 'Copy code' })).toBeInTheDocument()
    vi.useRealTimers()
    Reflect.deleteProperty(navigator, 'clipboard')
  })

  it('puts what can be pressed in the toolbar’s end group, beside Copy code, apart from the view’s controls', () => {
    hero({ copy: '<Fern />', keys: <IslandButton label="Keys">⌨</IslandButton> })
    expect(toolbarNames().slice(-2)).toEqual(['Keys', 'Copy code'])
  })
})

describe('the hero’s viewfinder', () => {
  afterEach(() => vi.restoreAllMocks())
  const viewfinder = (orientation: string) => <div data-testid={`viewfinder-${orientation}`} />

  it('runs it as a row under the stage on a narrow screen', () => {
    hero({ viewfinder })
    expect(screen.getByTestId('viewfinder-horizontal')).toBeInTheDocument()
    expect(screen.queryByTestId('viewfinder-vertical')).toBeNull()
  })

  it('stands it in a column beside the stage from lg', () => {
    const real = window.matchMedia
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => (query === '(min-width: 64rem)' ? ({ ...real(query), matches: true } as MediaQueryList) : real(query)))
    hero({ viewfinder })
    expect(screen.getByTestId('viewfinder-vertical')).toBeInTheDocument()
    expect(screen.queryByTestId('viewfinder-horizontal')).toBeNull()
  })

  it('floats it as an island on the stage from lg, the stage keeping the full width, and a row under it on a narrow screen', () => {
    const real = window.matchMedia
    const wide = vi.spyOn(window, 'matchMedia').mockImplementation((query) => (query === '(min-width: 64rem)' ? ({ ...real(query), matches: true } as MediaQueryList) : real(query)))
    hero({ viewfinder, presentation: 'island' })
    expect(screen.getByTestId('viewfinder-island')).toBeInTheDocument()
    expect(screen.queryByTestId('viewfinder-vertical')).toBeNull()
    expect(screen.queryByTestId('viewfinder-horizontal')).toBeNull()
    cleanup()
    wide.mockRestore()
    hero({ viewfinder, presentation: 'island' })
    expect(screen.getByTestId('viewfinder-horizontal')).toBeInTheDocument()
    expect(screen.queryByTestId('viewfinder-island')).toBeNull()
  })

  it('draws none for a bar, which the area keeps in its explorer', () => {
    hero({ viewfinder, presentation: 'bar' })
    expect(screen.queryByTestId(/^viewfinder-/)).toBeNull()
  })
})
