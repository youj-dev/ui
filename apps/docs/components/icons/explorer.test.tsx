import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ComponentProps, ReactNode } from 'react'
import { icons } from '@youj/icons/components/youj/icons'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core/lib/youj/provider'
import { IconExplorer } from './explorer'

const box = { width: 900, height: 700 }
const original = HTMLElement.prototype.getBoundingClientRect
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => box.width })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => box.width })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => box.height })
  HTMLElement.prototype.getBoundingClientRect = () => ({ ...box, top: 0, left: 0, right: box.width, bottom: box.height, x: 0, y: 0, toJSON: () => box }) as DOMRect
  Element.prototype.scrollTo = () => {}
  // cmdk keeps the active row in view.
  Element.prototype.scrollIntoView = () => {}
  // Base UI's scroll area asks its viewport for running animations.
  Element.prototype.getAnimations = () => []
})
afterAll(() => {
  for (const key of ['clientWidth', 'offsetWidth', 'offsetHeight']) delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key]
  HTMLElement.prototype.getBoundingClientRect = original
})
afterEach(() => {
  window.history.replaceState(null, '', '/')
})

const wait = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)))

function open(url: string, reduced: ReducedMotionSetting = 'never', props: Partial<ComponentProps<typeof IconExplorer>> = {}) {
  window.history.replaceState(null, '', url)
  const Wrap = ({ children }: { children: ReactNode }) => (
    <YoujProvider reducedMotion={reduced} timeScale={0.05}>
      {children}
    </YoujProvider>
  )
  return render(<IconExplorer svgs={{}} descriptions={{ bell: 'Swings from its crown.' }} {...props} />, { wrapper: Wrap })
}

const grid = () => screen.getByRole('grid')

describe('the icons library', () => {
  it('shows every Youj icon by default, with no controls of its own and no heading', () => {
    open('/icons')
    expect(grid()).toHaveAccessibleName(`${icons.length} icons`)
    for (const control of [() => screen.queryByRole('searchbox'), () => screen.queryByRole('button', { name: 'Filter' }), () => screen.queryByRole('button', { name: 'Customize' }), () => screen.queryByRole('group', { name: 'Layout' })]) expect(control()).toBeNull()
    expect(screen.queryByRole('tab')).toBeNull()
    expect(screen.queryByRole('complementary')).toBeNull()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('still opens on a search a link describes', () => {
    open('/icons?q=delete')
    expect(within(grid()).getByRole('gridcell', { name: 'trash' })).toBeInTheDocument()
  })

  it('opens an old static-type link on every icon', () => {
    open('/icons?type=static')
    expect(grid()).toHaveAccessibleName(`${icons.length} icons`)
  })

  it('narrows to the categories and the type a link names', () => {
    const { unmount } = open('/icons?category=arrows,status')
    const some = icons.filter((Icon) => Icon.meta.category === 'arrows' || Icon.meta.category === 'status').length
    expect(grid()).toHaveAccessibleName(`${some} icons`)
    unmount()
    open('/icons?type=morph')
    const states = icons.filter((Icon) => Icon.meta.states).length
    expect(grid()).toHaveAccessibleName(`${states} state icons`)
  })

  it('tells the page above when a Youj icon is picked, and leaves the address alone', async () => {
    const onPick = vi.fn()
    open('/icons?icon=bell&chain=bell~bell-off', 'never', { onPick })
    fireEvent.click(within(grid()).getByRole('gridcell', { name: 'anchor' }))
    expect(onPick).toHaveBeenCalledWith('anchor')
    await wait(250)
    expect(window.location.search).toBe('?icon=bell&chain=bell~bell-off')
  })

  it('is part of the page: its grid scrolls with the window, not in a box of its own', () => {
    open('/icons')
    expect(grid().closest('.overflow-y-auto, .sticky')).toBeNull()
  })
})

describe('a card’s island', () => {
  const card = (name: string) => within(grid()).getByRole('gridcell', { name })
  /** Points at a card: its island is drawn the first time it's asked for. */
  const island = (name: string) => {
    fireEvent.pointerEnter(card(name), { pointerType: 'mouse' })
    return within(card(name)).getByRole('toolbar', { name: `${name}: actions` })
  }

  it('isn’t drawn until its card is pointed at or focused, and then holds the card’s actions', () => {
    open('/icons')
    expect(within(card('anchor')).queryByRole('toolbar')).toBeNull()
    expect(card('anchor')).not.toHaveAttribute('data-hot')
    const actions = island('anchor')
    expect(card('anchor')).toHaveAttribute('data-hot')
    expect(within(actions).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Copy React code', 'Get the code', 'Download'])
    // Its neighbours have none.
    expect(within(card('archive')).queryByRole('toolbar')).toBeNull()
    fireEvent.pointerLeave(card('anchor'))
    expect(card('anchor')).not.toHaveAttribute('data-hot')
  })

  it('copies the React code, and a press on it doesn’t select the card', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const onPick = vi.fn()
    open('/icons', 'never', { onPick })
    fireEvent.click(within(island('anchor')).getByRole('button', { name: 'Copy React code' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`import { AnchorIcon } from '@youj/icons'\n\n<AnchorIcon />`))
    expect(onPick).not.toHaveBeenCalled()
  })

  it('opens the large code modal on its icon', async () => {
    open('/icons')
    fireEvent.click(within(island('anchor')).getByRole('button', { name: 'Get the code' }))
    const dialog = await screen.findByRole('dialog', { name: 'anchor' })
    expect(within(dialog).getByRole('group', { name: 'React code' })).toHaveTextContent('<AnchorIcon />')
  })

  it('hands focus back to its card on Escape, and keeps its keys out of the grid’s arrows', () => {
    open('/icons')
    const copy = within(island('anchor')).getByRole('button', { name: 'Copy React code' })
    copy.focus()
    fireEvent.keyDown(copy, { key: 'ArrowDown' })
    expect(card('anchor')).toHaveAttribute('aria-selected', 'false')
    fireEvent.keyDown(copy, { key: 'Escape' })
    expect(document.activeElement).toBe(card('anchor'))
  })
})
