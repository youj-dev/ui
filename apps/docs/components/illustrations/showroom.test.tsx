import userEvent from '@testing-library/user-event'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { illustrationCategories, illustrations } from '@youj/illustrations'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core/lib/youj/provider'
import { contextFor, contextLabel } from './context-copy'
import { FLAGSHIP } from './query'
import { IllustrationShowroom } from './showroom'

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
})
afterAll(() => {
  for (const key of ['clientWidth', 'clientHeight', 'offsetWidth', 'offsetHeight']) delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key]
  HTMLElement.prototype.getBoundingClientRect = original
})
beforeEach(() => scrollIntoView.mockClear())
afterEach(() => {
  window.history.replaceState(null, '', '/')
  document.documentElement.removeAttribute('data-scene-link')
})

const wait = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)))

function open(url: string, reduced: ReducedMotionSetting = 'always') {
  window.history.replaceState(null, '', url)
  const Wrap = ({ children }: { children: ReactNode }) => (
    <YoujProvider reducedMotion={reduced} timeScale={0.05}>
      {children}
    </YoujProvider>
  )
  return render(
    <IllustrationShowroom
      details={{ coffee: { component: 'IllustrationCoffee', description: 'A cup of coffee on its saucer, steam rising off it.' } }}
      blocks={[{ href: '/cards/app-empty-states', title: 'Empty states', group: 'App' }]}
      props={{ name: 'IllustrationProps', file: 'packages/illustrations/src/index.ts', props: [{ name: 'scene', type: 'IllustrationId', required: true, description: 'Which scene.' }] }}
    />,
    { wrapper: Wrap },
  )
}

const n = illustrations.length
const name = (id: string) => illustrations.find((s) => s.id === id)!.name
/** The name of the scene on stage: the hero's heading. */
const onStage = () => document.getElementById('illustration-name')?.textContent
const hero = () => screen.getByRole('region', { name: onStage() })
const stage = () => document.querySelector<HTMLElement>('[data-slot=illustration-stage]')!
const strip = () => screen.getByRole('listbox', { name: 'Scenes' })
const contextButton = () => screen.getByRole('button', { name: 'Context' })
const rawButton = () => screen.getByRole('button', { name: 'Raw' })
/** The search's field, opened with `/`. */
const openSearch = async () => {
  act(() => void document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true })))
  return (await screen.findByRole('combobox', { name: 'Search scenes' })) as HTMLInputElement
}
const results = () => within(screen.getByRole('listbox', { name: /^\d+ scenes?$/ })).queryAllByRole('option')

// Each test draws the whole page: on a busy machine that runs past the default 5s, and one timeout leaves the next test a torn-down page.
describe('the illustrations page', { timeout: 30_000 }, () => {
  it('puts the flagship on stage, in context, when the address names none, with every scene in the strip and nothing under it', () => {
    open('/illustrations')
    expect(onStage()).toBe(name(FLAGSHIP))
    expect(screen.getByText(`${name(FLAGSHIP)}, ${illustrations.findIndex((s) => s.id === FLAGSHIP) + 1} of ${n}`)).toBeInTheDocument()
    // In context by default: the scene set in a screen, which says so; Raw is the scene alone.
    expect(contextButton()).toHaveAttribute('aria-pressed', 'true')
    expect(rawButton()).toHaveAttribute('aria-pressed', 'false')
    expect(within(stage()).queryByRole('img', { name: name(FLAGSHIP) })).toBeNull()
    expect(within(strip()).getAllByRole('option')).toHaveLength(n)
    expect(within(strip()).getByRole('option', { name: name(FLAGSHIP) })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('grid')).toBeNull()
  })

  it('opens the scene a link names, keeping only what the address holds, and drops a scene the registry doesn’t know', async () => {
    const { unmount } = open('/illustrations?q=cafe&scene=coffee&strip=column')
    expect(onStage()).toBe('Coffee')
    await wait(250)
    expect(window.location.search).toBe('?scene=coffee&strip=column')
    unmount()
    document.documentElement.setAttribute('data-scene-link', '')
    open('/illustrations?scene=nope')
    expect(onStage()).toBe(name(FLAGSHIP))
    // The words held back for a link to another scene show again once the address is read.
    expect(document.documentElement).not.toHaveAttribute('data-scene-link')
    await wait(250)
    expect(window.location.search).toBe('')
  })

  it('sets the scene in the screen it would live in from In context, saying which, and alone again from Raw', () => {
    open('/illustrations?scene=coffee')
    expect(contextButton()).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(rawButton())
    expect(within(stage()).getByRole('img', { name: 'Coffee' })).toBeInTheDocument()
    fireEvent.click(contextButton())
    expect(contextButton()).toHaveAttribute('aria-pressed', 'true')
    expect(rawButton()).toHaveAttribute('aria-pressed', 'false')
    expect(within(stage()).getByText(contextLabel('Coffee', contextFor({ id: 'coffee', category: 'food' })))).toBeInTheDocument()
    // A picture of a screen, its scene named by the stage's words rather than by itself.
    expect(within(stage()).queryByRole('img', { name: 'Coffee' })).toBeNull()
    fireEvent.click(rawButton())
    expect(within(stage()).getByRole('img', { name: 'Coffee' })).toBeInTheDocument()
    expect(within(stage()).queryByText(/Coffee in/)).toBeNull()
  })

  it('draws the stage gray until the panel’s Colour row says Theme, and in a hue picked there, as CSS on the stage alone', async () => {
    open('/illustrations?scene=coffee')
    const plate = document.querySelector('[data-slot=illustration-stage]') as HTMLElement
    expect(plate).not.toHaveAttribute('data-yj-colors')
    expect(screen.queryByLabelText('Hue 1: pick a color')).toBeNull()
    // Youj draws in ink whatever the Colour row says; a mood brings its colours.
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox', { name: /^Preset:/ }))
    await user.click(await screen.findByRole('option', { name: /Meadow/ }))
    const mono = screen.getByText('Mono').closest('button')!
    fireEvent.click(within(mono.parentElement!).getByText('Theme').closest('button')!)
    expect(plate).toHaveAttribute('data-yj-colors')
    fireEvent.change(screen.getByLabelText('Hue 1: pick a color'), { target: { value: '#ff0000' } })
    expect(plate.style.getPropertyValue('--kg-c1')).toBe('#ff0000')
    fireEvent.click(screen.getByRole('button', { name: 'Theme’s' }))
    expect(plate.style.getPropertyValue('--kg-c1')).toBe('')
  })

  it('steps round every scene with ← and →, and with Previous and Next, the address following', async () => {
    const last = illustrations.at(-1)!
    open(`/illustrations?scene=${last.id}`)
    fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    expect(onStage()).toBe(illustrations[0]!.name)
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' })
    expect(onStage()).toBe(last.name)
    fireEvent.click(screen.getByRole('button', { name: `Previous: ${illustrations.at(-2)!.name}` }))
    expect(onStage()).toBe(illustrations.at(-2)!.name)
    await wait(250)
    expect(window.location.search).toBe(`?scene=${illustrations.at(-2)!.id}`)
    // A field keeps its arrows.
    fireEvent.keyDown(await openSearch(), { key: 'ArrowRight' })
    expect(onStage()).toBe(illustrations.at(-2)!.name)
  })

  it('puts a scene from the strip on stage', () => {
    open('/illustrations')
    fireEvent.click(within(strip()).getByRole('option', { name: 'Coffee' }))
    expect(onStage()).toBe('Coffee')
    expect(within(strip()).getByRole('option', { name: 'Coffee' })).toHaveAttribute('aria-selected', 'true')
  })

  it('finds a scene by name, tag or what it shows, and Enter puts it on stage, the strip and the address following', async () => {
    open('/illustrations')
    const field = await openSearch()
    fireEvent.change(field, { target: { value: '404' } })
    expect(results()[0]).toHaveTextContent('Not found')
    expect(results()[0]).toHaveTextContent('Lifecycle · IllustrationNotFound')
    expect(field).toHaveAttribute('aria-activedescendant', results()[0]!.id)
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(onStage()).toBe('Not found')
    expect(within(strip()).getByRole('option', { name: 'Not found' })).toHaveAttribute('aria-selected', 'true')
    await wait(250)
    expect(window.location.search).toBe('?scene=not-found')
    // What was searched isn't the address's.
    await vi.waitFor(() => expect(screen.queryByRole('combobox', { name: 'Search scenes' })).toBeNull())
  })

  it('narrows to any number of categories, every one in the registry’s order with its count', async () => {
    open('/illustrations')
    await openSearch()
    const chips = within(screen.getByRole('group', { name: 'Categories' })).getAllByRole('button')
    expect(chips.map((c) => c.textContent!.replace(/\d+$/, ''))).toEqual(illustrationCategories.map((c) => c.name))
    const data = illustrations.filter((s) => s.category === 'data').length
    const finance = illustrations.filter((s) => s.category === 'finance').length
    expect(chips[0]).toHaveTextContent(new RegExp(`${data}$`))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Data\\s*${data}$`) }))
    expect(results()).toHaveLength(data)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Finance\\s*${finance}$`) }))
    expect(results()).toHaveLength(data + finance)
    fireEvent.click(screen.getByRole('button', { name: 'Clear the search' }))
    expect(results()).toHaveLength(n)
  })

  it('names the scene in its panel, with its docs and the builder a link away, its tags left to the search and its category opening the search on it', async () => {
    open('/illustrations?scene=coffee')
    const header = screen.getByRole('heading', { level: 2, name: 'Coffee' }).closest('header')!
    expect(within(header).getByText('A cup of coffee on its saucer, steam rising off it.')).toBeInTheDocument()
    expect(within(header).getByText('IllustrationCoffee')).toBeInTheDocument()
    expect(within(header).getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs/illustrations')
    expect(within(header).getByRole('link', { name: 'Builder' })).toHaveAttribute('href', '/illustrations/build')
    // No tags in the panel; a tag still finds it.
    expect(within(header).queryByRole('list', { name: 'Tags' })).toBeNull()
    expect(illustrations.find((s) => s.id === 'coffee')!.tags).toContain('cafe')
    fireEvent.change(await openSearch(), { target: { value: 'cafe' } })
    expect(results()[0]).toHaveTextContent('Coffee')
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Search scenes' }), { key: 'Escape' })
    await vi.waitFor(() => expect(screen.queryByRole('combobox', { name: 'Search scenes' })).toBeNull())
    fireEvent.click(within(hero()).getByRole('button', { name: 'Food: search the category' }))
    expect(await screen.findByRole('combobox', { name: 'Search scenes' })).toHaveValue('')
    expect(within(screen.getByRole('group', { name: 'Categories' })).getByRole('button', { name: /^Food/ })).toHaveAttribute('aria-pressed', 'true')
    expect(results()).toHaveLength(illustrations.filter((s) => s.category === 'food').length)
  })

  it('keeps its code out of the panel: Use it opens the large modal (the usage, the install, the downloads, the props), and focus comes back', async () => {
    open('/illustrations?scene=coffee')
    // Nothing folds open in the panel: no install field, no props table.
    expect(within(hero()).queryByRole('group', { name: 'Package install command' })).toBeNull()
    expect(screen.queryByRole('table', { name: 'IllustrationProps props' })).toBeNull()
    const use = within(hero()).getByRole('button', { name: 'Use it' })
    fireEvent.click(use)
    const dialog = await screen.findByRole('dialog', { name: 'Coffee' }, { timeout: 5000 })
    expect(within(within(dialog).getByRole('tablist', { name: 'The code' })).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Use it', 'Download', 'Props', 'In a block', 'Source'])
    // Use it, from the package: the install, then the scene by id or as its own component.
    expect(within(dialog).getByRole('group', { name: 'Package install command' })).toHaveTextContent('npm i @youj/illustrations')
    expect(within(dialog).getByRole('group', { name: 'By id' })).toHaveTextContent('<Illustration scene="coffee" />')
    fireEvent.click(within(dialog).getByRole('tab', { name: 'The component' }))
    expect(within(dialog).getByRole('group', { name: 'The component' })).toHaveTextContent('<IllustrationCoffee />')
    // Copied in: the CLI's command, and the component from where it writes it.
    fireEvent.click(within(within(dialog).getByRole('group', { name: 'Take it as' })).getByRole('button', { name: 'Copy in' }))
    expect(within(dialog).getByRole('group', { name: 'Copy-in command' })).toHaveTextContent('npx youj add illustration-coffee')
    expect(within(dialog).getByRole('group', { name: 'The copied component' })).toHaveTextContent("from '@/components/youj/graphics/illustrations/scenes/coffee'")
    fireEvent.click(within(dialog).getByRole('tab', { name: 'Download' }))
    expect(within(dialog).getByRole('button', { name: 'Download youj-coffee.svg' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Download youj-coffee@2x.png' })).toBeInTheDocument()
    expect(within(within(dialog).getByRole('group', { name: 'Background' })).getByRole('button', { name: 'Transparent' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(within(dialog).getByRole('tab', { name: 'Props' }))
    expect(within(dialog).getByRole('table', { name: 'IllustrationProps props' })).toBeInTheDocument()
    fireEvent.keyDown(document.activeElement ?? dialog, { key: 'Escape' })
    await vi.waitFor(() => expect(screen.queryByRole('dialog', { name: 'Coffee' })).toBeNull())
    expect(use).toHaveFocus()
  })

  it('copies the scene by id, with its import, from Copy code', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    open('/illustrations?scene=coffee')
    fireEvent.click(within(hero()).getByRole('button', { name: 'Copy code' }))
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith("import { Illustration } from '@youj/illustrations'\n\n<Illustration scene=\"coffee\" />"))
    Reflect.deleteProperty(navigator, 'clipboard')
  })

  it('prints the scene’s motion on the stage: floating, apart while its toolbar holds it so, and still under reduced motion', async () => {
    open('/illustrations?scene=coffee', 'never')
    const motion = () => screen.getByRole('group', { name: 'Motion' })
    const toolbar = () => screen.getByRole('toolbar', { name: 'Coffee: view' })
    // It assembles as it arrives, then floats.
    await vi.waitFor(() => expect(motion()).toHaveTextContent('Floating'))
    fireEvent.click(within(toolbar()).getByRole('button', { name: 'Take it apart' }))
    expect(motion()).toHaveTextContent('Apart')
    expect(within(toolbar()).getByRole('button', { name: 'Take it apart' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(within(toolbar()).getByRole('button', { name: 'Reduced motion' }))
    expect(motion()).toHaveTextContent('Still')
    // The toolbar keeps a disabled button in its roving focus: it says so rather than leaving the row.
    expect(within(toolbar()).getByRole('button', { name: 'Replay the assemble' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('under reduced motion the stage draws the scene finished and still, in its screen once the screen has come', async () => {
    open('/illustrations?scene=deploy', 'always')
    fireEvent.click(contextButton())
    const drawing = await vi.waitFor(() => stage().querySelector<SVGSVGElement>('[data-slot=hero-scene] svg')!)
    expect(drawing.querySelectorAll('g').length).toBeGreaterThan(0)
    for (const g of drawing.querySelectorAll('g')) expect((g as SVGGElement).style.opacity).not.toBe('0')
    expect(within(stage()).getByText('Ready for launch')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reduced motion' })).toHaveAttribute('aria-pressed', 'true')
  })
})
