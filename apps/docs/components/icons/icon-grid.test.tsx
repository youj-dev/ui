import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core/lib/youj/provider'
import { youjEntries, type Entry } from './catalog'
import { IconGrid } from './icon-grid'
import { DEFAULT_SETTINGS, ExplorerSettingsContext, type DisplaySettings } from './settings'

// jsdom lays nothing out: give the scroller a size that fits four cards a row, and a few rows.
const box = { width: 520, height: 600 }
const original = HTMLElement.prototype.getBoundingClientRect
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => box.width })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => box.width })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => box.height })
  HTMLElement.prototype.getBoundingClientRect = () => ({ ...box, top: 0, left: 0, right: box.width, bottom: box.height, x: 0, y: 0, toJSON: () => box }) as DOMRect
  // The virtualizer scrolls with scrollTo, which jsdom doesn't have.
  Element.prototype.scrollTo = () => {}
})
afterAll(() => {
  for (const key of ['clientWidth', 'offsetWidth', 'offsetHeight']) delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key]
  HTMLElement.prototype.getBoundingClientRect = original
})

const wait = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)))
const all = youjEntries({ bell: [['path', { d: 'M1 1' }, []]] }, {})
// Twelve icons, three of them state icons, four to a row.
const entries: Entry[] = [
  ...all.filter((e) => !e.states).slice(0, 9),
  ...all.filter((e) => e.states).slice(0, 3),
]

function setup({ settings = {}, reduced = 'never', selectedId = null }: { settings?: Partial<DisplaySettings>; reduced?: ReducedMotionSetting; selectedId?: string | null } = {}) {
  const handlers = { onSelect: vi.fn(), onActivate: vi.fn(), onCopy: vi.fn() }
  const Wrap = ({ children }: { children: ReactNode }) => (
    <YoujProvider reducedMotion={reduced} timeScale={0.05}>
      <ExplorerSettingsContext.Provider value={{ ...DEFAULT_SETTINGS, ...settings, waveAt: performance.now() }}>{children}</ExplorerSettingsContext.Provider>
    </YoujProvider>
  )
  const utils = render(<IconGrid entries={entries} selectedId={selectedId} label="Icons" empty={<p>None</p>} {...handlers} />, { wrapper: Wrap })
  const cells = () => screen.getAllByRole('gridcell')
  return { ...utils, ...handlers, cells }
}

describe('the icon grid', () => {
  it('is one tab stop: an ARIA grid of rows and cells', () => {
    const { cells } = setup()
    const grid = screen.getByRole('grid', { name: 'Icons' })
    expect(grid).toHaveAttribute('aria-rowcount', '3')
    expect(grid).toHaveAttribute('aria-colcount', '4')
    expect(cells().filter((c) => c.tabIndex === 0)).toHaveLength(1)
    expect(cells()[0]).toHaveAccessibleName(entries[0]!.name)
    // A state icon names its two states.
    const state = entries[9]!
    expect(cells()[9]).toHaveAccessibleName(new RegExp(`${state.name}, `))
  })

  it('moves and selects with the arrows, by column and by row', () => {
    const { cells, onSelect } = setup()
    cells()[0]!.focus()
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith(entries[1], 'keyboard')
    expect(document.activeElement).toBe(cells()[1])
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' })
    expect(onSelect).toHaveBeenLastCalledWith(entries[5], 'keyboard')
    fireEvent.keyDown(document.activeElement!, { key: 'Home' })
    expect(onSelect).toHaveBeenLastCalledWith(entries[4], 'keyboard')
    fireEvent.keyDown(document.activeElement!, { key: 'End' })
    expect(onSelect).toHaveBeenLastCalledWith(entries[7], 'keyboard')
    fireEvent.keyDown(document.activeElement!, { key: 'End', ctrlKey: true })
    expect(onSelect).toHaveBeenLastCalledWith(entries[11], 'keyboard')
    fireEvent.keyDown(document.activeElement!, { key: 'Home', metaKey: true })
    expect(onSelect).toHaveBeenLastCalledWith(entries[0], 'keyboard')
    expect(document.activeElement).toBe(cells()[0])
    // Up from the top row goes nowhere.
    onSelect.mockClear()
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' })
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('mirrors left and right under right-to-left reading', () => {
    const { cells, onSelect } = setup()
    screen.getByRole('grid').closest('div')!.parentElement!.setAttribute('dir', 'rtl')
    cells()[1]!.focus()
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' })
    expect(onSelect).toHaveBeenLastCalledWith(entries[2], 'keyboard')
  })

  it('opens with Enter and copies with ⌘C', () => {
    const { cells, onActivate, onCopy } = setup()
    cells()[2]!.focus()
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' })
    expect(onActivate).toHaveBeenCalledWith(entries[2])
    fireEvent.keyDown(document.activeElement!, { key: 'c', metaKey: true })
    expect(onCopy).toHaveBeenCalledWith(entries[2])
  })

  it('selects on click, and marks the selection', () => {
    const { cells, onSelect, rerender } = setup()
    fireEvent.click(cells()[3]!)
    expect(onSelect).toHaveBeenLastCalledWith(entries[3], 'pointer')
    rerender(<IconGrid entries={entries} selectedId={entries[3]!.id} label="Icons" empty={null} onSelect={onSelect} onActivate={vi.fn()} onCopy={vi.fn()} />)
    expect(cells()[3]).toHaveAttribute('aria-selected', 'true')
    expect(cells()[0]).toHaveAttribute('aria-selected', 'false')
  })

  it('draws static SVG until a tile is asked to move, then mounts the live icon', () => {
    const { cells } = setup()
    const tile = cells()[0]!
    // The snapshot is plain SVG; only the live icon carries data-icon.
    expect(tile.querySelector('[data-icon]')).toBeNull()
    fireEvent.pointerEnter(tile, { pointerType: 'mouse' })
    expect(tile.querySelector(`[data-icon="${entries[0]!.name}"]`)).not.toBeNull()
    // Its neighbors stay static.
    expect(cells()[1]!.querySelector('[data-icon]')).toBeNull()
  })

  it('ignores touch hover, so a tap selects without waking every tile it crosses', () => {
    const { cells } = setup()
    fireEvent.pointerEnter(cells()[0]!, { pointerType: 'touch' })
    expect(cells()[0]!.querySelector('[data-icon]')).toBeNull()
  })

  it('loops every tile in view in loop mode, starting them a column at a time', async () => {
    const { cells } = setup({ settings: { mode: 'loop' } })
    await wait(60)
    for (const cell of cells()) expect(cell.querySelector('[data-icon]')).not.toBeNull()
  })

  it('rests the loops on their snapshots while the grid scrolls, and starts them again once it settles', async () => {
    const { cells } = setup({ settings: { mode: 'loop' } })
    await wait(60)
    expect(cells()[0]!.querySelector('[data-icon]')).not.toBeNull()
    fireEvent.scroll(window)
    await wait(20)
    expect(cells()[0]!.querySelector('[data-icon]')).toBeNull()
    // The grid settles a beat after the last scroll event, then the wave starts again.
    await wait(300)
    await wait(60)
    for (const cell of cells()) expect(cell.querySelector('[data-icon]')).not.toBeNull()
  })

  it('turns state icons to their second state in a wave, and only them', async () => {
    const { cells } = setup({ settings: { mode: 'morph' } })
    await wait(400)
    const states = cells().slice(9).map((c) => c.querySelector('svg')!.getAttribute('data-state'))
    expect(states).toEqual(['active', 'active', 'active'])
    expect(cells()[0]!.querySelector('[data-icon]')).toBeNull()
  })

  it('turns them at once under reduced motion', async () => {
    const { cells } = setup({ settings: { mode: 'morph' }, reduced: 'always' })
    await wait(30)
    expect(cells().slice(9).every((c) => c.querySelector('svg')!.getAttribute('data-state') === 'active')).toBe(true)
  })

  it('shows the empty state when nothing matches', () => {
    render(<IconGrid entries={[]} selectedId={null} label="Icons" empty={<p>Nothing here</p>} onSelect={vi.fn()} onActivate={vi.fn()} onCopy={vi.fn()} />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).toBeNull()
  })
})
