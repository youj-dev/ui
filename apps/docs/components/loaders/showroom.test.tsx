import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core/lib/youj/provider'
import type { ComponentDoc } from '@/lib/props'
import { contextFor, contextLabel } from './context-copy'
import { loaderCategories, loaderEntries } from './entries'
import { FLAGSHIP } from './query'
import { LoaderShowroom } from './showroom'
import { stageFit } from './stage'

const box = { width: 900, height: 700 }
const original = HTMLElement.prototype.getBoundingClientRect
const scrollIntoView = vi.fn()
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => box.width })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => box.height })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => box.width })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => box.height })
  HTMLElement.prototype.getBoundingClientRect = () => ({ ...box, top: 0, left: 0, right: box.width, bottom: box.height, x: 0, y: 0, toJSON: () => box }) as DOMRect
  Element.prototype.scrollTo = () => {}
  window.scrollTo = () => {}
  Element.prototype.scrollIntoView = scrollIntoView
  Element.prototype.getAnimations = () => []
  // jsdom draws no canvas: a live loader is skipped, everything around it runs.
  HTMLCanvasElement.prototype.getContext = (() => null) as never
})
afterAll(() => {
  for (const key of ['clientWidth', 'clientHeight', 'offsetWidth', 'offsetHeight']) delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key]
  HTMLElement.prototype.getBoundingClientRect = original
})
beforeEach(() => scrollIntoView.mockClear())
afterEach(() => {
  window.history.replaceState(null, '', '/')
  document.documentElement.removeAttribute('data-loader-link')
  vi.unstubAllGlobals()
})

/** The props every loader takes, as the server reads them for Use it. */
const PROPS: ComponentDoc = {
  name: 'LoaderProps',
  file: 'packages/loaders/src/components/youj/loaders/kit.tsx',
  props: [{ name: 'size', type: 'LoaderSize', values: ['sm', 'md', 'lg'], required: false, default: '`md`', description: 'The drawing’s height.' }],
}

const entries = loaderEntries()
const categories = loaderCategories()
const n = entries.length
const byId = (id: string) => entries.find((e) => e.id === id)!
const wait = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)))

function open(url: string, reduced: ReducedMotionSetting = 'always') {
  window.history.replaceState(null, '', url)
  const Wrap = ({ children }: { children: ReactNode }) => (
    <YoujProvider reducedMotion={reduced} timeScale={0.05}>
      {children}
    </YoujProvider>
  )
  return render(<LoaderShowroom loaders={entries} categories={categories} props={PROPS} />, { wrapper: Wrap })
}

/** The name of the loader on stage: the hero's heading. */
const onStage = () => document.getElementById('loader-name')?.textContent
const hero = () => screen.getByRole('region', { name: onStage() })
const stage = () => document.querySelector<HTMLElement>('[data-slot=loader-stage]')!
/** What `find` returns once it's there. */
const present = <T,>(find: () => T | null) =>
  vi.waitFor(() => {
    const found = find()
    if (!found) throw new Error('not yet')
    return found
  })
/** The live loader on the stage, once its chunk is in. */
const staged = (id: string) => present(() => stage().querySelector<HTMLElement>(`[data-slot=stage-loader] [data-yj-loader="${id}"]`))
const strip = () => screen.getByRole('listbox', { name: 'Loaders' })
const openSearch = async () => {
  act(() => void document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true })))
  return (await screen.findByRole('combobox', { name: 'Search loaders' })) as HTMLInputElement
}
const results = () => within(screen.getByRole('listbox', { name: /^\d+ loaders?$/ })).queryAllByRole('option')
const codeDialog = async (name: string) => {
  fireEvent.click(within(hero()).getByRole('button', { name: 'Use it' }))
  return screen.findByRole('dialog', { name }, { timeout: 5000 })
}
const toolbar = (name: string) => screen.getByRole('toolbar', { name: `${name}: view` })

// Each test draws the whole page: on a busy machine that runs past the default 5s.
describe('the loaders page', { timeout: 30_000 }, () => {
  it('puts the flagship on stage, on its own, with every loader in the strip and as a card under the hero once the page is idle', async () => {
    open('/loaders')
    const flagship = byId(FLAGSHIP)
    expect(onStage()).toBe(flagship.title)
    expect(screen.getByText(`${flagship.title}, ${entries.indexOf(flagship) + 1} of ${n}`)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Context' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(strip()).getAllByRole('option')).toHaveLength(n)
    expect(within(strip()).getByRole('option', { name: flagship.title })).toHaveAttribute('aria-selected', 'true')
    // The cards wait for the page to be idle; the heading is there from the start.
    expect(screen.getByRole('heading', { name: new RegExp(`^All loaders\\s*${n}$`) })).toBeInTheDocument()
    const grid = await screen.findByRole('list', { name: `${n} loaders` })
    expect(within(grid).getAllByRole('link')).toHaveLength(n)
    expect(within(grid).getByRole('link', { current: true })).toHaveAccessibleName(`${flagship.title}, Geometry, on stage`)
    await staged(FLAGSHIP)
  })

  it('opens the loader a link names (what ⌘K links to), and drops one the registry doesn’t know', async () => {
    const { unmount } = open('/loaders?id=tittle&q=old&category=depth')
    expect(onStage()).toBe('Tittle')
    await staged('tittle')
    await wait(250)
    // The search lives in its island now: only the loader stays in the address.
    expect(window.location.search).toBe('?id=tittle')
    unmount()
    document.documentElement.setAttribute('data-loader-link', '')
    open('/loaders?id=nope')
    expect(onStage()).toBe(byId(FLAGSHIP).title)
    // The words held back for a link to another loader show again once the address is read.
    expect(document.documentElement).not.toHaveAttribute('data-loader-link')
    await wait(250)
    expect(window.location.search).toBe('')
  })

  it('steps round every loader with ← and →, and with Previous and Next, the address following', async () => {
    const last = entries.at(-1)!
    open(`/loaders?id=${last.id}`)
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(onStage()).toBe(entries[0]!.title)
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' })
    expect(onStage()).toBe(last.title)
    fireEvent.click(screen.getByRole('button', { name: `Previous: ${entries.at(-2)!.title}` }))
    expect(onStage()).toBe(entries.at(-2)!.title)
    await wait(250)
    expect(window.location.search).toBe(`?id=${entries.at(-2)!.id}`)
    // A field keeps its arrows.
    fireEvent.keyDown(await openSearch(), { key: 'ArrowRight' })
    expect(onStage()).toBe(entries.at(-2)!.title)
  })

  it('finds a loader by a tag or what it shows, and Enter puts it on stage; the chips narrow it to any categories', async () => {
    open('/loaders')
    const field = await openSearch()
    fireEvent.change(field, { target: { value: 'ridgeline' } })
    expect(results()[0]).toHaveTextContent('Sustain')
    expect(results()[0]).toHaveTextContent('Signal · LoaderSustain')
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(onStage()).toBe('Sustain')
    await wait(250)
    expect(window.location.search).toBe('?id=sustain')
    await vi.waitFor(() => expect(screen.queryByRole('combobox', { name: 'Search loaders' })).toBeNull())

    // It opens again on what was searched last; cleared, every loader is there to narrow.
    expect(await openSearch()).toHaveValue('ridgeline')
    fireEvent.click(screen.getByRole('button', { name: 'Clear the search' }))
    expect(results()).toHaveLength(n)
    const chips = within(screen.getByRole('group', { name: 'Categories' })).getAllByRole('button')
    expect(chips.map((c) => c.textContent!.replace(/\d+$/, ''))).toEqual(categories.map((c) => c.title))
    const count = (id: string) => entries.filter((e) => e.category === id).length
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Signal\\s*${count('signal')}$`) }))
    expect(results()).toHaveLength(count('signal'))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Glyph\\s*${count('glyph')}$`) }))
    expect(results()).toHaveLength(count('signal') + count('glyph'))
  })

  it('keeps its tags for the search, not the placard, and opens the search narrowed to its category', async () => {
    open('/loaders?id=sustain')
    expect(byId('sustain').tags).toContain('spectrum')
    expect(within(hero()).queryByRole('list', { name: 'Tags' })).toBeNull()
    expect(within(hero()).queryByRole('button', { name: /^Search “/ })).toBeNull()
    // A tag still finds it.
    fireEvent.change(await openSearch(), { target: { value: 'spectrum' } })
    expect(results().some((r) => r.textContent?.startsWith('Sustain'))).toBe(true)
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Search loaders' }), { key: 'Escape' })
    await vi.waitFor(() => expect(screen.queryByRole('combobox', { name: 'Search loaders' })).toBeNull())
    fireEvent.click(within(hero()).getByRole('button', { name: 'Signal: search the category' }))
    expect(await screen.findByRole('combobox', { name: 'Search loaders' })).toHaveValue('')
    expect(within(screen.getByRole('group', { name: 'Categories' })).getByRole('button', { name: /^Signal/ })).toHaveAttribute('aria-pressed', 'true')
    expect(results()).toHaveLength(entries.filter((e) => e.category === 'signal').length)
  })

  it('heads its panel with what it is and its docs a link away, and copies the loader as tuned from Copy code', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    open('/loaders?id=tittle')
    const header = screen.getByRole('heading', { level: 2, name: 'Tittle' }).closest('header')!
    expect(header).toHaveTextContent('LoaderTittle')
    expect(within(header).getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs/loaders')
    // Nothing to install in the panel: that's the code modal's.
    expect(within(hero()).queryByRole('group', { name: 'Package install command' })).toBeNull()
    fireEvent.click(within(hero()).getByRole('button', { name: 'Copy code' }))
    await vi.waitFor(() =>
      // Past a line's length, a prop a line, as Prettier writes it.
      expect(writeText).toHaveBeenCalledWith(
        `import { LoaderTittle } from '@youj/loaders/tittle'\n\n<LoaderTittle\n  size={200}\n  label={['Loading…', 'Syncing changes', 'Almost there…']}\n  showLabel\n  labelEffect="scramble"\n/>`,
      ),
    )
    Reflect.deleteProperty(navigator, 'clipboard')
  })

  it('writes the code with what the panel sets, in the large code modal, and gives focus back', async () => {
    open('/loaders?id=tittle')
    const size = within(hero())
      .getAllByRole('slider', { hidden: true })
      .find((s) => s.getAttribute('aria-label') === 'Size')!
    fireEvent.keyDown(size, { key: 'Home' })
    const dialog = await codeDialog('Tittle')
    expect(within(within(dialog).getByRole('tablist', { name: 'The code' })).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Use it', 'Props', 'Source'])
    // Use it, from the package: 1 the install, in the reader's package manager (npm until they choose), 2 the code, as the page sets it
    // (it opens with its label shown, scrambling through three lines).
    expect(within(dialog).getByRole('group', { name: 'Package install command' })).toHaveTextContent('npm i @youj/loaders')
    expect(within(dialog).getByRole('group', { name: 'Usage' })).toHaveTextContent(`<LoaderTittle size="sm" label={['Loading…', 'Syncing changes', 'Almost there…']} showLabel labelEffect="scramble" />`)
    // Copied in: the CLI's command, and the code from where it writes the loader.
    fireEvent.click(within(within(dialog).getByRole('group', { name: 'Take it as' })).getByRole('button', { name: 'Copy in' }))
    expect(within(dialog).getByRole('group', { name: 'Copy-in command' })).toHaveTextContent('npx youj add loader-tittle')
    expect(within(dialog).getByRole('group', { name: 'The copied component' })).toHaveTextContent("from '@/components/youj/loaders/depth/tittle'")
    fireEvent.click(within(dialog).getByRole('tab', { name: 'Props' }))
    const props = within(dialog).getByRole('table', { name: 'LoaderProps props' })
    expect(within(props).getByRole('rowheader', { name: 'size' })).toBeInTheDocument()
    // A default written as code is shown as the code it is.
    expect(props).toHaveTextContent('LoaderSize')
    expect(props).not.toHaveTextContent('`md`')
    fireEvent.keyDown(document.activeElement ?? dialog, { key: 'Escape' })
    await vi.waitFor(() => expect(screen.queryByRole('dialog', { name: 'Tittle' })).toBeNull())
    expect(within(hero()).getByRole('button', { name: 'Use it' })).toHaveFocus()
  })

  it('sets the label: its first line in place, every line in an editor laid over the panel, where it sits and how it moves, on the stage and in the code', async () => {
    open('/loaders?id=tittle')
    const segments = (name: string) => within(within(hero()).getByRole('group', { name })).getAllByRole('button')
    const effect = () => within(hero()).getByRole('combobox', { name: 'Effect' })
    const first = within(hero()).getByRole('textbox', { name: 'Label text' })
    const show = within(hero()).getByRole('switch', { name: 'Show the label' })
    expect(first).toHaveValue('Loading…')
    expect(show).toBeChecked()
    expect(segments('Position').map((b) => b.textContent)).toEqual(['Bottom', 'Top', 'Start', 'End'])
    // No loop count: several labels simply take turns.
    expect(within(hero()).queryByRole('group', { name: 'Each label shows for' })).toBeNull()
    // The first line, typed in place: the others keep their turns.
    fireEvent.change(first, { target: { value: 'Saving…' } })
    expect(screen.getByRole('group', { name: 'Status' })).toHaveTextContent('Says “Saving…” then 2 more')
    // Every line, in the editor over the panel (the field's end says how many more there are).
    fireEvent.click(within(hero()).getByRole('button', { name: 'Every label: 3, one a line' }))
    const editor = await screen.findByRole('textbox', { name: 'Label text, one a line' })
    expect(editor).toHaveValue('Saving…\nSyncing changes\nAlmost there…')
    await vi.waitFor(() => expect(editor).toHaveFocus())
    fireEvent.change(editor, { target: { value: 'Syncing' } })
    fireEvent.keyDown(editor, { key: 'Escape' })
    await vi.waitFor(() => expect(screen.queryByRole('textbox', { name: 'Label text, one a line' })).toBeNull())
    // One label: the field's end adds more.
    expect(within(hero()).getByRole('button', { name: 'Add labels that take turns' })).toBeInTheDocument()
    fireEvent.click(show)
    for (const b of segments('Position')) expect(b).toBeDisabled()
    expect(effect()).toBeDisabled()
    fireEvent.click(show)
    fireEvent.click(within(hero()).getByRole('button', { name: 'Add labels that take turns' }))
    fireEvent.change(await screen.findByRole('textbox', { name: 'Label text, one a line' }), { target: { value: 'Loading\n  \nGenerating results' } })
    // The stage holds both in one cell, the blank line dropped; its readout says the first and how many follow.
    const art = await staged('tittle')
    await vi.waitFor(() => expect(art.querySelectorAll('.yj-anim__label > .yj-anim__text')).toHaveLength(2))
    expect(screen.getByRole('group', { name: 'Status' })).toHaveTextContent('Says “Loading” then 1 more')
    expect(screen.getByRole('group', { name: 'Status' })).toHaveTextContent('Still · reduced motion')
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Label text, one a line' }), { key: 'Escape' })
    await vi.waitFor(() => expect(screen.queryByRole('textbox', { name: 'Label text, one a line' })).toBeNull())
    const dialog = await codeDialog('Tittle')
    expect(dialog).toHaveTextContent(`<LoaderTittle size={200} label={['Loading', 'Generating results']} showLabel labelEffect="scramble" />`)
  })

  it('sets the label’s type over or under the drawing: capitals, a face and a size, on the stage and in the code', async () => {
    open('/loaders?id=tittle')
    const caps = within(hero()).getByRole('button', { name: 'Capitals' })
    const font = within(hero()).getByRole('combobox', { name: 'Font' })
    const size = () => within(hero()).getAllByRole('slider', { hidden: true }).find((s) => s.getAttribute('aria-label') === 'Font size')!
    expect(caps).toHaveAttribute('aria-pressed', 'false')
    const art = await staged('tittle')
    fireEvent.click(caps)
    await vi.waitFor(() => expect(art.style.getPropertyValue('--yj-label-case')).toBe('uppercase'))
    const user = userEvent.setup()
    await user.click(font)
    await user.click(await screen.findByRole('option', { name: 'Mono' }))
    await vi.waitFor(() => expect(art.style.getPropertyValue('--yj-label-font')).toBe('var(--font-mono)'))
    fireEvent.keyDown(size(), { key: 'End' })
    await vi.waitFor(() => expect(art.style.getPropertyValue('--yj-label-size')).toBe('24px'))
    const dialog = await codeDialog('Tittle')
    expect(dialog).toHaveTextContent('className="[--yj-label-case:uppercase] [--yj-label-font:var(--font-mono)] [--yj-label-size:24px]"')
    fireEvent.keyDown(document.activeElement ?? dialog, { key: 'Escape' })
    await vi.waitFor(() => expect(screen.queryByRole('dialog', { name: 'Tittle' })).toBeNull())
    // Beside the drawing a label takes the line's own type: the three give way, and the code leaves them out.
    fireEvent.click(within(within(hero()).getByRole('group', { name: 'Position' })).getByRole('button', { name: 'End' }))
    expect(caps).toBeDisabled()
    expect(font).toBeDisabled()
    await vi.waitFor(() => expect(art.style.getPropertyValue('--yj-label-case')).toBe(''))
    expect(await codeDialog('Tittle')).not.toHaveTextContent('--yj-label')
  })

  it('draws the loader on the stage at the size set, which the code says too', async () => {
    open('/loaders?id=tittle')
    const art = await staged('tittle')
    expect(art.style.getPropertyValue('--yj-anim-size')).toBe('200px')
    const size = within(hero())
      .getAllByRole('slider', { hidden: true })
      .find((s) => s.getAttribute('aria-label') === 'Size')!
    fireEvent.keyDown(size, { key: 'Home' })
    await vi.waitFor(() => expect(art.style.getPropertyValue('--yj-anim-size')).toBe('24px'))
    fireEvent.keyDown(size, { key: 'End' })
    await vi.waitFor(() => expect(art.style.getPropertyValue('--yj-anim-size')).toBe('360px'))
    expect(within(hero()).getByText('360 px')).toBeInTheDocument()
    // Speed, slower to faster, as the times it plays at.
    const speed = within(hero())
      .getAllByRole('slider', { hidden: true })
      .find((s) => s.getAttribute('aria-label') === 'Speed')!
    expect(speed.getAttribute('aria-valuetext')).toMatch(/^1×, \d+\.\d seconds a loop$/)
    fireEvent.keyDown(speed, { key: 'End' })
    expect(speed.getAttribute('aria-valuetext')).toMatch(/^2×/)
    expect(await codeDialog('Tittle')).toHaveTextContent('speed={2}')
  })

  it('inks the stage, the thumbnails and the code in the colors picked', async () => {
    open('/loaders?id=tittle')
    fireEvent.click(within(hero()).getByRole('button', { name: 'Primary color: Default' }))
    fireEvent.click(await screen.findByRole('radio', { name: /^Accent/ }))
    const art = await staged('tittle')
    await vi.waitFor(() => expect(art.style.getPropertyValue('--yj-anim-ink')).toBe('var(--color-accent)'))
    fireEvent.click(within(hero()).getByRole('button', { name: 'Secondary color: Default' }))
    fireEvent.click(await screen.findByRole('radio', { name: /^Success/ }))
    await vi.waitFor(() => expect(art.style.getPropertyValue('--yj-anim-accent')).toBe('var(--color-success)'))
    const dialog = await codeDialog('Tittle')
    expect(dialog).toHaveTextContent('color="var(--color-accent)"')
    expect(dialog).toHaveTextContent('accentColor="var(--color-success)"')
  })

  it('draws a loader in its two colors until Theme is picked, and writes colors="theme" into the code only then', async () => {
    open('/loaders?id=gantry')
    const color = within(hero()).getByLabelText('Color', { selector: '[role]' })
    expect(within(color).getByRole('button', { name: 'Mono' })).toHaveAttribute('aria-pressed', 'true')
    expect(await codeDialog('Gantry')).not.toHaveTextContent('colors=')
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Gantry' }), { key: 'Escape' })
    fireEvent.click(within(color).getByRole('button', { name: 'Theme' }))
    expect(await codeDialog('Gantry')).toHaveTextContent('colors="theme"')
  })

  it('sets the loader in the screen it would hold still from In context, and on its own again from Raw, saying which', async () => {
    open('/loaders?id=mesh')
    expect(screen.getByRole('button', { name: 'Context' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Raw' }))
    expect(screen.getByRole('button', { name: 'Raw' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Context' }))
    expect(screen.getByRole('button', { name: 'Context' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(stage()).getByText(contextLabel('Mesh', contextFor(byId('mesh'))))).toBeInTheDocument()
    expect(within(stage()).getByText('Mesh in an upload’s processing card: Converting housing.step.')).toBeInTheDocument()
    // The screen comes with its chunk, its file and how far along it is; the loader keeps its size in it.
    expect(await within(stage()).findByText('housing.step')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Raw' }))
    expect(within(stage()).getByText('Mesh, on its own.')).toBeInTheDocument()
  })

  it('plays the stage at 1×, 2× and ½× in turn, holds a frame and replays from its toolbar, and reads it all out', async () => {
    open('/loaders?id=tittle', 'never')
    const status = () => screen.getByRole('group', { name: 'Status' })
    const bar = () => toolbar('Tittle')
    await staged('tittle')
    await vi.waitFor(() => expect(status()).toHaveTextContent(/Playing · \d+\.\d s a loop/))
    // The playback leads the toolbar, ahead of the view.
    expect([...bar().querySelectorAll('button')].map((b) => b.getAttribute('aria-label')).slice(0, 4)).toEqual(['Replay from the top', 'Hold this frame', 'Playback 1×: show it at 2×', 'Show it on dark'])
    fireEvent.click(within(bar()).getByRole('button', { name: 'Playback 1×: show it at 2×' }))
    expect(status()).toHaveTextContent('· 2×')
    fireEvent.click(within(bar()).getByRole('button', { name: 'Playback 2×: show it at ½×' }))
    fireEvent.click(within(bar()).getByRole('button', { name: 'Playback ½×: show it at 1×' }))
    expect(within(bar()).getByRole('button', { name: 'Playback 1×: show it at 2×' })).toBeInTheDocument()
    fireEvent.click(within(bar()).getByRole('button', { name: 'Hold this frame' }))
    expect(status()).toHaveTextContent('Held on this frame')
    expect((await staged('tittle')).hasAttribute('data-paused')).toBe(true)
    fireEvent.click(within(bar()).getByRole('button', { name: 'Replay from the top' }))
    expect(within(bar()).getByRole('button', { name: 'Hold this frame' })).toHaveAttribute('aria-pressed', 'false')
    // The stage's own reduced motion: its still frame.
    fireEvent.click(within(bar()).getByRole('button', { name: 'Reduced motion' }))
    expect(status()).toHaveTextContent('Still · reduced motion')
    expect(within(bar()).getByRole('button', { name: 'Replay from the top' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('under reduced motion the stage draws the loader’s still frame and nothing on it is a status of its own', async () => {
    open('/loaders?id=tittle', 'always')
    const art = await staged('tittle')
    expect(art.querySelector('svg')).not.toBeNull()
    expect(art.querySelector('canvas')).toBeNull()
    expect(screen.getByRole('button', { name: 'Reduced motion' })).toHaveAttribute('aria-pressed', 'true')
    // The stage is a picture: the hero names it.
    expect(screen.queryAllByRole('status').filter((el) => el.hasAttribute('data-yj-loader'))).toEqual([])
  })

  it('draws each thumbnail as its still frame, held (never on the ticker), and only once it comes near', async () => {
    const seen: Element[] = []
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private readonly report: IntersectionObserverCallback) {}
        observe(el: Element) {
          seen.push(el)
          // Only the strip's Tittle is near.
          if (el.closest('[role=option][data-id="tittle"]')) queueMicrotask(() => this.report([{ target: el, isIntersecting: true } as IntersectionObserverEntry], this as never))
        }
        unobserve() {}
        disconnect() {}
      },
    )
    open('/loaders?id=tittle', 'never')
    const option = within(strip()).getByRole('option', { name: 'Tittle' })
    const thumb = await present(() => option.querySelector<HTMLElement>('[data-yj-loader="tittle"]'))
    expect(thumb).toHaveAttribute('data-paused')
    expect(thumb).toHaveAttribute('aria-hidden', 'true')
    // The rest of the strip waits for its turn: every picture it draws (only the tiles near its view draw one) is watched first.
    expect(within(strip()).getByRole('option', { name: 'Drop' }).querySelector('[data-yj-loader]')).toBeNull()
    // The strip only mounts the window of tiles near its frame (the showroom kit's windowing), never all three copies.
    expect(seen.length).toBeGreaterThan(1)
    expect(seen.length).toBeLessThan(n * 3)
  })
})

describe('the stage’s size', () => {
  it('holds most of the room’s height at most, in 4px steps, narrower for a wide loader or one with its label beside it', () => {
    expect(stageFit({ w: 900, h: 620 }, 1, false)).toBe(456)
    expect(stageFit({ w: 900, h: 620 }, 2, false)).toBe(376)
    expect(stageFit({ w: 900, h: 620 }, 1, true)).toBe(448)
    expect(stageFit({ w: 340, h: 280 }, 1, true)).toBe(168)
    // Never under a readable 24px.
    expect(stageFit({ w: 30, h: 30 }, 1, false)).toBe(24)
  })
})
