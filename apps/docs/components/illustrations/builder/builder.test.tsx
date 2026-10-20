import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core/lib/youj/provider'
import { builderQuery, IllustrationBuilder, STORAGE_KEY } from './builder'
import { generateCode } from '@youj/illustrations/builder'
import { saveFrame } from './export-panel'
import { CANVAS_HELP } from './help'
import { decodeScene, fromJson, sanitizeScene, type BuilderScene } from '@youj/illustrations/builder'
import { BuiltScene } from '@youj/illustrations/builder'
import { TEMPLATES } from '@youj/illustrations/builder'

const originalMatchMedia = window.matchMedia
const desk = TEMPLATES.find((t) => t.id === 'desk')!.scene
const empty = sanitizeScene({ name: 'Test', base: 'plinth', parts: [] })!

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
  Element.prototype.getAnimations = () => []
  // jsdom has no 2D canvas; the export's color probe then resolves nothing, which is all these tests need.
  HTMLCanvasElement.prototype.getContext = (() => null) as never
})
afterEach(() => {
  window.history.replaceState(null, '', '/')
  window.matchMedia = originalMatchMedia
  localStorage.clear()
  vi.restoreAllMocks()
})

const wait = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)))

/** A desktop, where the builder docks its panels; or a phone. */
function screenIs(wide: boolean) {
  window.matchMedia = (query: string) => ({ ...originalMatchMedia(query), matches: wide && query.includes('min-width: 1024px') })
}

function open(scene: BuilderScene | null, reduced: ReducedMotionSetting = 'always', wide = true) {
  screenIs(wide)
  window.history.replaceState(null, '', scene ? `/illustrations/build?${builderQuery(scene)}` : '/illustrations/build')
  const Wrap = ({ children }: { children: ReactNode }) => (
    <YoujProvider reducedMotion={reduced} timeScale={0.05}>
      {children}
    </YoujProvider>
  )
  return render(<IllustrationBuilder />, { wrapper: Wrap })
}

const layers = () => screen.getByRole('listbox', { name: 'Layers' })
const options = () => within(layers()).getAllByRole('option')
const canvas = () => screen.getByRole('application')
const field = (name: RegExp) => screen.getByRole('textbox', { name }) as HTMLInputElement
// The builder's own live region; the share button's announcer is a span.
const status = () => screen.getAllByRole('status').find((el) => el.tagName === 'DIV')!
const key = (el: Element, k: string, extra: Partial<KeyboardEventInit> = {}) => fireEvent.keyDown(el, { key: k, ...extra })

describe('the illustration builder', () => {
  it('leaves the first Tab to the skip link: nothing on arrival moves the focus starting point into the builder', () => {
    const scrolled = vi.spyOn(Element.prototype, 'scrollIntoView')
    const focused = vi.spyOn(HTMLElement.prototype, 'focus')
    open(desk)
    expect(scrolled).not.toHaveBeenCalled()
    expect(focused).not.toHaveBeenCalled()
  })

  it('groups the palette into shapes, prisms, lathes and utility, and adds a new part from it', () => {
    open(empty)
    const palette = screen.getByRole('toolbar', { name: 'Parts' })
    for (const name of ['Shapes', 'Prisms', 'Lathes', 'Utility']) expect(within(palette).getByRole('group', { name })).toBeInTheDocument()
    expect(within(within(palette).getByRole('group', { name: 'Utility' })).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Add screen', 'Add crate'])
    fireEvent.click(within(palette).getByRole('button', { name: 'Add pipe' }))
    expect(within(layers()).getByRole('option', { name: /Pipe/ })).toBeInTheDocument()
  })

  it('adds a part from the palette, and moves it from the keyboard on the canvas', () => {
    open(empty)
    expect(screen.getByRole('toolbar', { name: 'Parts' })).toBeInTheDocument()
    // One tab stop in the palette; pressing a part (Enter on the button) adds it in the middle of the floor.
    const palette = within(screen.getByRole('toolbar', { name: 'Parts' })).getAllByRole('button')
    expect(palette.filter((b) => b.tabIndex === 0)).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Add box' }))
    expect(options()).toHaveLength(1)
    expect(options()[0]).toHaveAttribute('aria-selected', 'true')
    expect(status()).toHaveTextContent('Box added at x 3, y 3, z 0.5.')

    // The canvas says how to work it, and the arrows move the selection.
    const c = canvas()
    expect(c).toHaveAttribute('aria-roledescription', 'canvas')
    expect(document.getElementById(c.getAttribute('aria-describedby')!)).toHaveTextContent(CANVAS_HELP)
    key(c, 'ArrowRight')
    key(c, 'ArrowDown', { shiftKey: true })
    key(c, 'PageUp')
    expect([field(/^x,/).value, field(/^y,/).value, field(/^z,/).value]).toEqual(['3.5', '5', '1'])
    expect(status()).toHaveTextContent('Box at x 3.5, y 5, z 1.')
    // A run of nudges is one step to undo.
    key(c, 'z', { metaKey: true })
    expect([field(/^x,/).value, field(/^y,/).value, field(/^z,/).value]).toEqual(['3', '3', '0.5'])
  })

  it('duplicates, deletes, undoes and redoes from the keyboard', () => {
    open(empty)
    fireEvent.click(screen.getByRole('button', { name: 'Add cylinder' }))
    const c = canvas()
    key(c, 'd', { metaKey: true })
    expect(options()).toHaveLength(2)
    // The copy is what's selected now.
    expect(options()[1]).toHaveAttribute('aria-selected', 'true')
    key(c, 'Delete')
    expect(options()).toHaveLength(1)
    key(c, 'z', { metaKey: true })
    expect(options()).toHaveLength(2)
    key(c, 'z', { metaKey: true, shiftKey: true })
    expect(options()).toHaveLength(1)
    key(c, 'a', { metaKey: true })
    key(c, 'Backspace')
    expect(screen.getByText('No parts yet. Drag one onto the floor, or press it.')).toBeInTheDocument()
  })

  it('chooses parts in the layers, which the properties and the canvas follow, and renames one with F2', () => {
    open(desk)
    const list = layers()
    list.focus()
    key(list, 'ArrowDown')
    expect(options()[0]).toHaveAttribute('aria-selected', 'true')
    expect(list).toHaveAttribute('aria-activedescendant', options()[0]!.id)
    expect(screen.getByRole('heading', { name: 'Left drawers' })).toBeInTheDocument()
    key(list, 'ArrowDown', { shiftKey: true })
    expect(options().filter((o) => o.getAttribute('aria-selected') === 'true')).toHaveLength(2)
    expect(screen.getByRole('heading', { name: '2 parts' })).toBeInTheDocument()
    // Space takes one back out; Enter goes to the canvas with what's chosen.
    key(list, ' ')
    expect(options().filter((o) => o.getAttribute('aria-selected') === 'true')).toHaveLength(1)
    key(list, 'Enter')
    expect(document.activeElement).toBe(canvas())

    list.focus()
    key(list, 'F2')
    const input = screen.getByRole('textbox', { name: 'Rename Left drawers' })
    fireEvent.change(input, { target: { value: 'Cabinet_!' } })
    key(input, 'Enter')
    expect(options()[0]).toHaveAccessibleName(/^Cabinet,/)
    expect(document.activeElement).toBe(layers())
  })

  it('writes the scene to the address and to this browser as it changes, and opens on what it kept', async () => {
    open(empty)
    fireEvent.click(screen.getByRole('button', { name: 'Add box' }))
    await wait(260)
    const params = new URLSearchParams(window.location.search)
    expect(params.get('name')).toBe('Test')
    expect(decodeScene(params.get('s')!, params.get('name'))!.parts).toHaveLength(1)
    const kept = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(decodeScene(kept.s, kept.name)!.parts).toHaveLength(1)
  })

  it('opens on the scene this browser kept when the link names none, and on the first template without either', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ s: '1!G!b_1_1_0_1_1_1_sn', name: 'Kept' }))
    const view = open(null)
    expect(options()).toHaveLength(1)
    view.unmount()
    localStorage.clear()
    open(null)
    expect(options()).toHaveLength(desk.parts.length)
  })

  it('keeps working when storage throws', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    open(null)
    fireEvent.click(screen.getByRole('button', { name: 'Add tile' }))
    await wait(260)
    expect(options()).toHaveLength(desk.parts.length + 1)
    expect(new URLSearchParams(window.location.search).get('s')).toBeTruthy()
  })

  it('previews the scene as it ships, drawn finished and still under reduced motion', () => {
    open(desk, 'always')
    fireEvent.click(screen.getByRole('button', { name: /^Preview/ }))
    expect(screen.queryByRole('application')).toBeNull()
    const scene = screen.getByRole('img', { name: 'Desk' })
    for (const g of scene.querySelectorAll('g')) expect((g as SVGGElement).style.opacity).not.toBe('0')
    expect(screen.getByRole('button', { name: 'Reduced motion' })).toHaveAttribute('aria-pressed', 'true')
    // P goes back to editing.
    key(scene, 'p')
    expect(canvas()).toBeInTheDocument()
  })

  it('on a narrow screen, shows the scene in preview with a note about the larger screen', () => {
    open(desk, 'always', false)
    expect(screen.getByRole('note')).toHaveTextContent('The builder is best on a larger screen')
    expect(screen.queryByRole('application')).toBeNull()
    expect(screen.getByRole('img', { name: 'Desk' })).toBeInTheDocument()
  })

  it('lets go of the window when it goes', () => {
    const added = vi.spyOn(window, 'addEventListener')
    const removed = vi.spyOn(window, 'removeEventListener')
    const view = open(empty)
    const keys = added.mock.calls.filter(([type]) => type === 'keydown').length
    view.unmount()
    expect(removed.mock.calls.filter(([type]) => type === 'keydown').length).toBeGreaterThanOrEqual(keys)
  })
})

describe('the export', () => {
  it('opens the code in a modal that copies the component and the JSON for the scene on the canvas', async () => {
    const writeText = vi.fn(async (_: string) => {})
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    open(desk)
    expect(screen.queryByRole('tab', { name: 'Export' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Get the code' }))
    const dialog = await screen.findByRole('dialog', { name: 'Desk' })
    expect(within(within(dialog).getByRole('tablist', { name: 'The code' })).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Component', 'Install', 'JSON'])
    // It opens on the component, each section's code with its own copy.
    expect(within(dialog).getByRole('group', { name: 'Desk as a component' })).toHaveTextContent('export function IllustrationDesk(props: IllustrationProps) {')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Copy Desk as a component' }))
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    const code = writeText.mock.calls[0]![0]
    expect(code).toContain('export function IllustrationDesk(props: IllustrationProps) {')
    expect(code).toBe(generateCode(desk, { link: `${window.location.origin}/illustrations/build?${builderQuery(desk)}` }))
    fireEvent.click(within(dialog).getByRole('tab', { name: 'JSON' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Copy Desk as JSON' }))
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(2))
    expect(fromJson(writeText.mock.calls[1]![0])).toEqual(desk)
    fireEvent.click(within(dialog).getByRole('tab', { name: 'Install' }))
    expect(within(dialog).getByRole('group', { name: 'Install command' })).toHaveTextContent('npx @youj/cli add illustration-kit iso-shapes')
  })

  it('saves the still frame as a standalone SVG named after the scene', async () => {
    const view = render(
      <YoujProvider reducedMotion="always">
        <div data-slot="illustration-stage">
          <div data-testid="still">
            <BuiltScene scene={desk} assemble={false} float={false} />
          </div>
        </div>
      </YoujProvider>,
    )
    let saved: Blob | undefined
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      saved = blob as Blob
      return 'blob:x'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clicked = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const name = await saveFrame(view.getByTestId('still'), desk, 'svg', 1, true)
    expect(name).toBe('youj-desk.svg')
    expect(clicked).toHaveBeenCalledTimes(1)
    const text = await saved!.text()
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
    expect(doc.querySelector('parsererror')).toBeNull()
    expect(doc.documentElement.querySelector('title')?.textContent).toBe('Desk')
    expect(text).not.toMatch(/style=|var\(|data-/)
  })
})
