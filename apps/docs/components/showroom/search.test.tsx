import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createRef } from 'react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { TooltipProvider } from '@youj/react'
import { listScroll, ShowroomSearch, type SearchEntry, type ShowroomSearchHandle, type ShowroomSearchProps } from './search'

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
  Element.prototype.getAnimations = () => []
})

const ENTRIES: SearchEntry[] = [
  { item: { id: 'fern', label: 'Fern' }, meta: 'Plants · Study 01', tags: ['frond', 'shade'], category: 'plants' },
  { item: { id: 'moss', label: 'Moss' }, meta: 'Plants · Study 02', tags: ['carpet'], category: 'plants' },
  { item: { id: 'quartz', label: 'Quartz' }, meta: 'Minerals · Study 03', tags: ['crystal'], category: 'minerals' },
]
const CATEGORIES = [
  { id: 'plants', name: 'Plants' },
  { id: 'minerals', name: 'Minerals' },
]
/** The area's ranking, as simple as can be: a name or a tag holding the query. */
const find = (q: string) => ENTRIES.filter((e) => !q || `${e.item.label} ${e.tags!.join(' ')}`.toLowerCase().includes(q.toLowerCase())).map((e) => e.item.id)

function open(props: Partial<ShowroomSearchProps> = {}) {
  const onSelect = vi.fn()
  const ref = createRef<ShowroomSearchHandle>()
  render(
    <YoujProvider reducedMotion="always">
      <TooltipProvider>
        <div data-showroom-dock="">
          <ShowroomSearch ref={ref} placement="island" noun="specimen" plural="specimens" entries={ENTRIES} find={find} categories={CATEGORIES} current="moss" onSelect={onSelect} {...props} />
        </div>
        <input aria-label="Elsewhere" />
      </TooltipProvider>
    </YoujProvider>,
  )
  return { onSelect, ref }
}

const trigger = () => screen.getByRole('button', { name: 'Search specimens' })
const field = () => screen.getByRole('combobox', { name: 'Search specimens' })
const options = () => within(screen.getByRole('listbox')).getAllByRole('option')
const slash = () => act(() => void document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true })))

describe('the showroom’s search', () => {
  it('opens from its button or `/`, the field focused and the item on show active, marked on stage', async () => {
    open()
    expect(trigger()).toHaveAttribute('aria-keyshortcuts', '/')
    slash()
    await waitFor(() => expect(field()).toHaveFocus())
    expect(options().map((o) => o.textContent)).toEqual([expect.stringContaining('Fern'), expect.stringContaining('Moss'), expect.stringContaining('Quartz')])
    const moss = options()[1]!
    expect(moss).toHaveAttribute('aria-selected', 'true')
    expect(moss).toHaveTextContent('On stage')
    expect(moss).toHaveTextContent('Plants · Study 02')
    expect(field()).toHaveAttribute('aria-activedescendant', moss.id)
    expect(screen.getByText('3 specimens')).toBeInTheDocument()
  })

  it('opens without moving the page: the field takes the focus where it is, and only the list scrolls to the item on show', async () => {
    const pageScroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    open()
    fireEvent.click(trigger())
    await waitFor(() => expect(field()).toHaveFocus())
    await act(() => new Promise((r) => requestAnimationFrame(r)))
    expect(focus.mock.calls.find((_, i) => focus.mock.contexts[i] === field())?.[0]).toEqual({ preventScroll: true })
    expect(pageScroll).not.toHaveBeenCalled()
    pageScroll.mockRestore()
    focus.mockRestore()
  })

  it('scrolls the list just enough to show its active row, or puts it in the middle as it opens', () => {
    const list = { clientHeight: 300, scrollTop: 0 } as HTMLElement
    const row = (offsetTop: number) => ({ offsetTop, offsetHeight: 76 }) as HTMLElement
    expect(listScroll(list, row(1000), true)).toBe(1000 - (300 - 76) / 2)
    expect(listScroll(list, row(8), true)).toBe(0)
    // In view: it stays; under the view: up to the row's foot; over it: down to its head.
    expect(listScroll(list, row(100), false)).toBe(0)
    expect(listScroll(list, row(400), false)).toBe(400 + 76 + 8 - 300)
    expect(listScroll({ ...list, scrollTop: 500 } as HTMLElement, row(400), false)).toBe(392)
  })

  it('leaves `/` to a field that has the focus', () => {
    open()
    screen.getByRole('textbox', { name: 'Elsewhere' }).focus()
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Elsewhere' }), { key: '/' })
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it('filters as it’s typed by the area’s own ranking, the first match active, and counts what’s left', async () => {
    open()
    fireEvent.click(trigger())
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'crystal' } })
    expect(options()).toHaveLength(1)
    expect(options()[0]).toHaveTextContent('Quartz')
    expect(options()[0]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('1 of 3')).toBeInTheDocument()
  })

  it('moves with ↑ and ↓, round from the ends, and Enter puts the active one on stage and closes', async () => {
    const { onSelect } = open()
    fireEvent.click(trigger())
    const input = await screen.findByRole('combobox')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(options()[2]).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(options()[0]).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(options()[2]).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('quartz')
    await waitFor(() => expect(screen.queryByRole('combobox')).toBeNull())
  })

  it('puts a row on stage with a click, and doesn’t ask again for the one already there', async () => {
    const { onSelect } = open()
    fireEvent.click(trigger())
    await screen.findByRole('combobox')
    fireEvent.click(options()[1]!)
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.click(trigger())
    await screen.findByRole('combobox')
    fireEvent.click(options()[0]!)
    expect(onSelect).toHaveBeenCalledWith('fern')
  })

  it('closes on Escape and gives the focus back to its button', async () => {
    open()
    fireEvent.click(trigger())
    const input = await screen.findByRole('combobox')
    await waitFor(() => expect(input).toHaveFocus())
    fireEvent.keyDown(input, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('combobox')).toBeNull())
    await waitFor(() => expect(trigger()).toHaveFocus())
  })

  it('narrows to any number of categories, counting each for the search, and clears back to everything', async () => {
    open()
    fireEvent.click(trigger())
    await screen.findByRole('combobox')
    const chips = screen.getByRole('group', { name: 'Categories' })
    const plants = within(chips).getByRole('button', { name: /Plants/ })
    expect(plants).toHaveTextContent('Plants2')
    fireEvent.click(plants)
    expect(plants).toHaveAttribute('aria-pressed', 'true')
    expect(options().map((o) => o.textContent)).toEqual([expect.stringContaining('Fern'), expect.stringContaining('Moss')])
    fireEvent.click(within(chips).getByRole('button', { name: /Minerals/ }))
    expect(options()).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'Clear the search' }))
    expect(plants).toHaveAttribute('aria-pressed', 'false')
  })

  it('says when nothing matches, and offers to clear', async () => {
    open()
    fireEvent.click(trigger())
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'zzz' } })
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByText('No specimens match “zzz”')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear the search' }).at(-1)!)
    expect(options()).toHaveLength(3)
  })

  it('opens on a search or a category asked for elsewhere (a tag, a category in the placard)', async () => {
    const { ref } = open()
    act(() => ref.current!.open({ q: 'frond' }))
    expect(await screen.findByRole('combobox')).toHaveValue('frond')
    expect(options()).toHaveLength(1)
    act(() => ref.current!.open({ categories: ['minerals'] }))
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue(''))
    expect(options().map((o) => o.textContent)).toEqual([expect.stringContaining('Quartz')])
  })
})
