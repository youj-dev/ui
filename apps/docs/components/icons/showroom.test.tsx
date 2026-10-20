import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core/lib/youj/provider'
import { IconsShowroom } from './showroom'

const box = { width: 900, height: 700 }
const original = HTMLElement.prototype.getBoundingClientRect
const originalMatchMedia = window.matchMedia
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => box.width })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => box.width })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => box.height })
  HTMLElement.prototype.getBoundingClientRect = () => ({ ...box, top: 0, left: 0, right: box.width, bottom: box.height, x: 0, y: 0, toJSON: () => box }) as DOMRect
  Element.prototype.scrollTo = () => {}
  Element.prototype.scrollIntoView = () => {}
  Element.prototype.getAnimations = () => []
})
afterAll(() => {
  for (const key of ['clientWidth', 'offsetWidth', 'offsetHeight']) delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key]
  HTMLElement.prototype.getBoundingClientRect = original
})
afterEach(() => {
  window.history.replaceState(null, '', '/')
  window.matchMedia = originalMatchMedia
})

/** A wide screen: the column stands beside the stage (else the strip is a row under it). */
function wide() {
  window.matchMedia = (query: string) => ({ ...originalMatchMedia(query), matches: query.includes('min-width: 64rem') || query.includes('min-width: 40rem') })
}

function open(url: string, reduced: ReducedMotionSetting = 'always') {
  window.history.replaceState(null, '', url)
  const Wrap = ({ children }: { children: ReactNode }) => (
    <YoujProvider reducedMotion={reduced} timeScale={0.05}>
      {children}
    </YoujProvider>
  )
  return render(<IconsShowroom svgs={{}} descriptions={{ bell: 'Swings from its crown.' }} />, { wrapper: Wrap })
}

const onStage = () => document.getElementById('icon-name')?.textContent
const column = () => screen.getByRole('listbox', { name: 'Icons' })
/** The toggle at the column's head (the toolbar has its own, hidden by CSS from lg). */
const morphToggle = () => within(column().parentElement!).getByRole('button', { name: /^Chain/ })

describe('the icons page', () => {
  it('has one h1, the hero’s, and puts the icon the address names on stage', () => {
    open('/icons?icon=bell')
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Icons'])
    expect(onStage()).toBe('bell')
    expect(screen.getByText('Swings from its crown.')).toBeInTheDocument()
  })

  it('puts an icon picked from the column on stage and names it in the address', () => {
    wide()
    open('/icons?icon=bell')
    expect(within(column()).getByRole('option', { name: 'bell' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(within(column()).getByRole('option', { name: 'anchor' }))
    expect(onStage()).toBe('anchor')
    expect(window.location.search).toBe('?icon=anchor')
    expect(within(column()).getByRole('option', { name: 'anchor' })).toHaveAttribute('aria-selected', 'true')
  })

  describe('the column from the keyboard', () => {
    const tiles = () => within(column()).getAllByRole('option')
    const key = (name: string, k: string) => fireEvent.keyDown(within(column()).getByRole('option', { name }), { key: k })

    it('is one tab stop, on the icon on stage', () => {
      wide()
      open('/icons?icon=bell')
      const stops = tiles().filter((t) => t.tabIndex === 0)
      expect(stops.map((t) => t.dataset.id)).toEqual(['bell'])
    })

    it('moves by one with the sideways arrows and by a row of four with the vertical ones, focus following', () => {
      wide()
      open('/icons?icon=bell')
      const at = (i: number) => tiles()[i]!
      const i = tiles().findIndex((t) => t.dataset.id === 'bell')
      key('bell', 'ArrowRight')
      expect(document.activeElement).toBe(at(i + 1))
      expect(at(i + 1).tabIndex).toBe(0)
      expect(at(i).tabIndex).toBe(-1)
      key(at(i + 1).getAttribute('aria-label')!, 'ArrowDown')
      expect(document.activeElement).toBe(at(i + 5))
      key(at(i + 5).getAttribute('aria-label')!, 'ArrowUp')
      key(at(i + 1).getAttribute('aria-label')!, 'ArrowLeft')
      expect(document.activeElement).toBe(at(i))
      // Moving doesn't select: the icon on stage stays.
      expect(onStage()).toBe('bell')
    })

    it('goes to the first and last with Home and End', () => {
      wide()
      open('/icons?icon=bell')
      key('bell', 'End')
      expect(document.activeElement).toBe(tiles().at(-1))
      key(tiles().at(-1)!.getAttribute('aria-label')!, 'Home')
      expect(document.activeElement).toBe(tiles()[0])
    })

    it('mirrors the sideways arrows right to left', () => {
      wide()
      document.documentElement.dir = 'rtl'
      try {
        open('/icons?icon=bell')
        const i = tiles().findIndex((t) => t.dataset.id === 'bell')
        key('bell', 'ArrowLeft')
        expect(document.activeElement).toBe(tiles()[i + 1])
      } finally {
        document.documentElement.dir = ''
      }
    })

    it('leaves the page arrows alone while the column owns them, and picks with Enter on the focused tile', () => {
      wide()
      open('/icons?icon=bell')
      key('bell', 'ArrowRight')
      expect(onStage()).toBe('bell')
      const focused = document.activeElement as HTMLElement
      fireEvent.click(focused)
      expect(onStage()).toBe(focused.dataset.id)
    })

    it('keeps the Chain button’s name when the chain grows', () => {
      wide()
      open('/icons?icon=bell')
      fireEvent.click(morphToggle())
      expect(within(column().parentElement!).getByRole('button', { name: 'Chain' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('says what the Chain does in a tooltip, keeping its name', async () => {
      wide()
      open('/icons?icon=bell')
      await userEvent.hover(morphToggle())
      expect(await screen.findByText('Morph through up to 10 icons in a row')).toBeInTheDocument()
      expect(morphToggle()).toHaveAccessibleName('Chain')
    })
  })

  it('puts an icon picked from the library grid under the hero on stage', async () => {
    open('/icons?icon=bell')
    fireEvent.click(await screen.findByRole('gridcell', { name: 'anchor' }))
    expect(onStage()).toBe('anchor')
    expect(window.location.search).toBe('?icon=anchor')
  })

  /** The chain's icons in order, as the panel's list has them. */
  const chain = () => [...document.querySelectorAll<HTMLElement>('[data-sortable-item]')].map((li) => li.dataset.sortableItem)
  const chip = (n: number, name: string) => screen.getByRole('button', { name: `${n}. ${name}` })

  it('builds a chain: toggle on makes the icon on stage 1, each pick adds one, a tap on the stage steps', () => {
    wide()
    open('/icons?icon=bell')
    expect(screen.getByRole('group', { name: 'Trigger' })).toBeInTheDocument()
    fireEvent.click(morphToggle())
    expect(morphToggle()).toHaveAttribute('aria-pressed', 'true')
    expect(onStage()).toBe('Chain')
    expect(window.location.search).toBe('?icon=bell&chain=bell')
    expect(within(column()).getByRole('option', { name: 'bell, morph 1' })).toBeInTheDocument()
    // The panel swaps Motion for Transition.
    expect(screen.queryByRole('group', { name: 'Trigger' })).toBeNull()
    expect(screen.getByRole('combobox', { name: 'Transition' })).toBeInTheDocument()

    fireEvent.click(within(column()).getByRole('option', { name: 'anchor' }))
    fireEvent.click(within(column()).getByRole('option', { name: 'archive' }))
    expect(chain()).toEqual(['bell', 'anchor', 'archive'])
    expect(window.location.search).toBe('?icon=bell&chain=bell~anchor~archive')
    expect(screen.getByText('3 icons')).toBeInTheDocument()
    expect(screen.getByText('Chain · 1 of 3')).toBeInTheDocument()
    // At rest (reduced motion) a tap steps without animation.
    fireEvent.click(screen.getByRole('button', { name: 'Next step: anchor' }))
    expect(screen.getByText('Chain · 2 of 3')).toBeInTheDocument()
    expect(chip(2, 'anchor')).toHaveAttribute('aria-current', 'step')
  })

  it('takes an icon out from the column or its chip, and numbers close up', () => {
    wide()
    open('/icons?icon=bell&chain=bell~anchor~archive')
    fireEvent.click(within(column()).getByRole('option', { name: 'anchor, morph 2' }))
    expect(chain()).toEqual(['bell', 'archive'])
    expect(within(column()).getByRole('option', { name: 'archive, morph 2' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove bell' }))
    expect(chain()).toEqual(['archive'])
    expect(window.location.search).toBe('?icon=bell&chain=archive')
    expect(onStage()).toBe('Chain')
    expect(screen.getByText('Chain · pick another')).toBeInTheDocument()
  })

  it('inserts after a chosen chip, and the empty space under the rows, or Escape on a row, puts the line back at the end', () => {
    wide()
    open('/icons?icon=bell&chain=bell~anchor~archive')
    fireEvent.click(chip(1, 'bell'))
    expect(document.querySelector('[data-caret]')?.closest('[data-sortable-item]')).toHaveAttribute('data-sortable-item', 'anchor')
    fireEvent.click(within(column()).getByRole('option', { name: 'arrow-up' }))
    fireEvent.click(within(column()).getByRole('option', { name: 'arrow-down' }))
    expect(chain()).toEqual(['bell', 'arrow-up', 'arrow-down', 'anchor', 'archive'])
    fireEvent.click(document.querySelector('[data-slot=chain-end]')!)
    expect(document.querySelector('[data-caret]')).toBeNull()
    fireEvent.click(chip(2, 'arrow-up'))
    expect(document.querySelector('[data-caret]')).not.toBeNull()
    fireEvent.keyDown(chip(2, 'arrow-up'), { key: 'Escape' })
    expect(document.querySelector('[data-caret]')).toBeNull()
    fireEvent.click(within(column()).getByRole('option', { name: 'arrow-left' }))
    expect(chain()).toEqual(['bell', 'arrow-up', 'arrow-down', 'anchor', 'archive', 'arrow-left'])
  })

  it('reorders from the keyboard as the data table’s column list does, keeping the playing icon lit', () => {
    wide()
    open('/icons?icon=bell&chain=bell~anchor~archive')
    const handle = screen.getByRole('button', { name: 'Reorder bell' })
    handle.focus()
    fireEvent.keyDown(handle, { key: ' ' })
    fireEvent.keyDown(handle, { key: 'ArrowDown' })
    fireEvent.keyDown(handle, { key: ' ' })
    expect(chain()).toEqual(['anchor', 'bell', 'archive'])
    expect(window.location.search).toBe('?icon=bell&chain=anchor~bell~archive')
    expect(chip(2, 'bell')).toHaveAttribute('aria-current', 'step')
  })

  it('clears the whole chain from its header, Chain staying on with its empty slots', () => {
    wide()
    open('/icons?icon=bell&chain=bell~anchor~archive')
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(chain()).toEqual([])
    expect(screen.getByRole('button', { name: 'Clear' })).toHaveAttribute('data-disabled')
    expect(morphToggle()).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelectorAll('[data-slot=chain-slot]')).toHaveLength(2)
    expect(window.location.search).toBe('?icon=bell')
    fireEvent.click(within(column()).getByRole('option', { name: 'anchor' }))
    expect(chain()).toEqual(['anchor'])
  })

  it('mirrors the chain on the library grid while Chain is on: numbered cards, and a click adds or removes like a column tap, without scrolling up', async () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    wide()
    open('/icons?icon=bell&chain=activity~anchor')
    const card = (name: string) => screen.findByRole('gridcell', { name })
    expect(await card('anchor, morph 2')).toHaveAttribute('aria-selected', 'true')
    expect(await card('activity, morph 1')).toBeInTheDocument()
    // The insertion point is respected: after chip 1.
    fireEvent.click(chip(1, 'activity'))
    fireEvent.click(await card('archive'))
    expect(chain()).toEqual(['activity', 'archive', 'anchor'])
    expect(await card('archive, morph 2')).toBeInTheDocument()
    fireEvent.click(await card('archive, morph 2'))
    expect(chain()).toEqual(['activity', 'anchor'])
    expect(scrollIntoView).not.toHaveBeenCalled()
    expect(onStage()).toBe('Chain')
    // Off, the grid is the library again.
    fireEvent.click(morphToggle())
    expect(screen.queryByRole('gridcell', { name: /morph \d/ })).toBeNull()
    fireEvent.click(await card('archive'))
    expect(onStage()).toBe('archive')
  })

  it('says the demo’s cap in the panel, not in the card, and the code has none', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    wide()
    open('/icons?icon=bell&chain=bell~anchor')
    const note = screen.getByText('Capped at 10 in this demo. Your code can chain as many as you like.')
    expect(note.closest('section[aria-label="Chain"]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce())
    expect(writeText.mock.calls[0]![0]).not.toMatch(/\b10\b/)
  })

  it('has an island at the stage’s top center: pause and play the loop, clear the chain', () => {
    wide()
    open('/icons?icon=bell&chain=bell~anchor~archive')
    const tools = screen.getByRole('toolbar', { name: 'Chain' })
    expect(tools.closest('[data-slot=showroom-dock]')).toBeNull()
    fireEvent.click(within(tools).getByRole('button', { name: 'Pause' }))
    expect(within(tools).getByRole('button', { name: 'Play' })).toBeInTheDocument()
    fireEvent.click(within(tools).getByRole('button', { name: 'Play' }))
    expect(within(tools).getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    fireEvent.click(within(tools).getByRole('button', { name: 'Clear' }))
    expect(chain()).toEqual([])
  })

  it('puts the island and the card under the plate on a phone', () => {
    open('/icons?icon=bell&chain=bell~anchor')
    const tools = screen.getByRole('toolbar', { name: 'Chain' })
    expect(tools.nextElementSibling).toHaveAttribute('aria-label', 'Chain')
    expect(tools.nextElementSibling?.tagName).toBe('SECTION')
  })

  it('holds the chain at ten, and says so', () => {
    wide()
    const ten = ['accessibility', 'activity', 'alarm-clock', 'anchor', 'archive', 'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right', 'aperture']
    open(`/icons?chain=${ten.join('~')}`)
    expect(chain()).toEqual(ten)
    fireEvent.click(within(column()).getByRole('option', { name: 'bell' }))
    expect(chain()).toEqual(ten)
    expect(screen.getByText(/^Capped at 10 in this demo\./)).toBeInTheDocument()
    expect(window.location.search).toBe(`?chain=${ten.join('~')}`)
  })

  it('opens on the chain a link names, and copies code that steps through it with IconSwap', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    open('/icons?icon=bell&chain=bell~anchor~archive')
    expect(onStage()).toBe('Chain')
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce())
    const code = writeText.mock.calls[0]![0] as string
    expect(code).toContain('const icons = [BellIcon, AnchorIcon, ArchiveIcon]')
    expect(code).toContain('<IconSwap key={step} from={icons[step]} to={icons[(step + 1) % icons.length]} transition="morph" active={active} />')
  })

  it('drops a morph name it doesn’t know, and puts the toggle in the stage’s toolbar where the column is hidden', () => {
    open('/icons?chain=nope')
    expect(onStage()).toBe('bell')
    expect(window.location.search).toBe('')
    expect(within(screen.getByRole('toolbar', { name: 'bell: view' })).getByRole('button', { name: 'Chain' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('listbox', { name: 'Icons' })).toBeInTheDocument()
  })
})
