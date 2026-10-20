import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core/lib/youj/provider'
import { TooltipProvider } from '@youj/react'
import type { ShowroomItem } from './thumb'
import { ViewfinderBar, ViewfinderStrip, type ViewfinderOrientation } from './viewfinder'

const ITEMS: ShowroomItem[] = [
  { id: 'a', label: 'Alpha', thumbs: { light: '/a.webp', dark: null } },
  { id: 'b', label: 'Bravo' },
  { id: 'c', label: 'Charlie', thumbs: { light: null, dark: '/c.dark.webp' } },
]

/** The bar as an area wires it: it owns the selection, the bar only asks for changes. */
function Bar({ items = ITEMS, start = 'a', onSelect, orientation }: { items?: ShowroomItem[]; start?: string; onSelect?: (id: string) => void; orientation?: ViewfinderOrientation }) {
  const [current, setCurrent] = useState(start)
  const at = items.findIndex((i) => i.id === current)
  const n = items.length
  const select = (id: string) => {
    onSelect?.(id)
    setCurrent(id)
  }
  const props = {
    label: 'Specimens',
    noun: 'specimen',
    items,
    current,
    prev: n > 1 ? items[(at - 1 + n) % n] : undefined,
    next: n > 1 ? items[(at + 1) % n] : undefined,
    onSelect: select,
  }
  return orientation ? <ViewfinderStrip {...props} orientation={orientation} /> : <ViewfinderBar {...props} />
}

function open(props: Parameters<typeof Bar>[0] = {}, reduced: ReducedMotionSetting = 'always') {
  return render(
    <YoujProvider reducedMotion={reduced} timeScale={0.05}>
      <TooltipProvider>
        <Bar {...props} />
      </TooltipProvider>
    </YoujProvider>,
  )
}

const strip = () => screen.getByRole('listbox', { name: 'Specimens' })
const option = (name: string) => within(strip()).getByRole('option', { name })

afterEach(() => {
  document.documentElement.removeAttribute('dir')
  vi.restoreAllMocks()
})

describe('the viewfinder', () => {
  it('lists any area’s items under its own name, the selected one the only tab stop, with copies for the wrap hidden', () => {
    open({ start: 'b' })
    expect(within(strip()).getAllByRole('option').map((o) => [o.getAttribute('aria-label'), o.getAttribute('aria-selected'), o.getAttribute('tabindex')])).toEqual([
      ['Alpha', 'false', '-1'],
      ['Bravo', 'true', '0'],
      ['Charlie', 'false', '-1'],
    ])
    expect(strip().querySelectorAll('[data-id][aria-hidden="true"]')).toHaveLength(ITEMS.length * 2)
    expect(document.querySelector('[data-showroom-strip]')).toContainElement(strip())
  })

  it('draws each item’s picture in both schemes, falling back on the other, and nothing for an item without one', () => {
    open()
    expect([...option('Alpha').querySelectorAll('img')].map((i) => i.getAttribute('src'))).toEqual(['/a.webp', '/a.webp'])
    expect([...option('Charlie').querySelectorAll('img')].map((i) => i.getAttribute('src'))).toEqual(['/c.dark.webp', '/c.dark.webp'])
    expect(option('Bravo').querySelector('img')).toBeNull()
  })

  it('asks for a change and leaves the selection to its owner: a click, Previous and Next, the arrows, Home and End', () => {
    const onSelect = vi.fn()
    open({ onSelect })
    fireEvent.click(option('Charlie'))
    fireEvent.click(screen.getByRole('button', { name: 'Next: Alpha' }))
    fireEvent.click(screen.getByRole('button', { name: 'Previous: Charlie' }))
    fireEvent.keyDown(option('Charlie'), { key: 'ArrowRight' })
    fireEvent.keyDown(option('Alpha'), { key: 'End' })
    fireEvent.keyDown(option('Charlie'), { key: 'Home' })
    expect(onSelect.mock.calls.map(([id]) => id)).toEqual(['c', 'a', 'c', 'a', 'c', 'a'])
  })

  it('doesn’t ask again for the item already on show, nor take a modified arrow', () => {
    const onSelect = vi.fn()
    open({ onSelect })
    fireEvent.click(option('Alpha'))
    fireEvent.keyDown(option('Alpha'), { key: 'Home' })
    fireEvent.keyDown(option('Alpha'), { key: 'ArrowRight', metaKey: true })
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('mirrors its arrows right to left', () => {
    document.documentElement.dir = 'rtl'
    const onSelect = vi.fn()
    open({ onSelect })
    fireEvent.keyDown(option('Alpha'), { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenCalledWith('c')
  })

  it('disables Previous and Next when there’s nowhere to step', () => {
    open({ items: [ITEMS[0]!] })
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('springs to a new item, jumps under reduced motion, and lets go of its frame on unmount', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 3)
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const { unmount } = open({}, 'never')
    expect(raf).not.toHaveBeenCalled()
    fireEvent.click(option('Bravo'))
    expect(raf).toHaveBeenCalledTimes(1)
    unmount()
    expect(cancel).toHaveBeenCalledWith(3)
    raf.mockClear()
    open({}, 'always')
    fireEvent.click(option('Bravo'))
    expect(raf).not.toHaveBeenCalled()
  })
})

describe('the viewfinder as an island', () => {
  it('is the row, a horizontal listbox between Previous and Next, in a pill of its own with larger squares', () => {
    const onSelect = vi.fn()
    open({ orientation: 'island', onSelect })
    expect(strip()).toHaveAttribute('aria-orientation', 'horizontal')
    const pill = document.querySelector('[data-showroom-strip]')!
    expect(pill).toHaveAttribute('data-orientation', 'island')
    expect(pill).toHaveAttribute('data-slot', 'action-island')
    expect(pill).toHaveClass('[--strip-thumb:2.75rem]')
    expect(option('Alpha')).toHaveClass('size-(--thumb)')
    fireEvent.keyDown(option('Alpha'), { key: 'ArrowRight' })
    fireEvent.keyDown(option('Bravo'), { key: 'ArrowDown' })
    expect(onSelect.mock.calls).toEqual([['b']])
    fireEvent.click(screen.getByRole('button', { name: 'Next: Charlie' }))
    expect(onSelect).toHaveBeenLastCalledWith('c')
  })
})

describe('the viewfinder as a column', () => {
  it('is a vertical listbox between Up and Down, its tiles the thumbnails’ own 4:3 rather than cropped squares', () => {
    open({ orientation: 'vertical' })
    expect(strip()).toHaveAttribute('aria-orientation', 'vertical')
    expect(document.querySelector('[data-showroom-strip]')).toHaveAttribute('data-orientation', 'vertical')
    expect(option('Alpha')).toHaveClass('aspect-[4/3]')
    expect(option('Alpha').querySelector('img')).not.toHaveClass('scale-[1.2]')
    expect(screen.getByRole('button', { name: 'Previous: Charlie' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next: Bravo' })).toBeInTheDocument()
  })

  it('steps with ↑ and ↓ (and still ← and →), round from the ends, with Home and End', () => {
    const onSelect = vi.fn()
    open({ orientation: 'vertical', onSelect })
    fireEvent.keyDown(option('Alpha'), { key: 'ArrowDown' })
    fireEvent.keyDown(option('Bravo'), { key: 'ArrowUp' })
    fireEvent.keyDown(option('Alpha'), { key: 'ArrowUp' })
    fireEvent.keyDown(option('Charlie'), { key: 'ArrowRight' })
    fireEvent.keyDown(option('Alpha'), { key: 'End' })
    expect(onSelect.mock.calls.map(([id]) => id)).toEqual(['b', 'a', 'c', 'a', 'c'])
  })

  it('leaves ↑ and ↓ to the page in a row', () => {
    const onSelect = vi.fn()
    open({ orientation: 'horizontal', onSelect })
    fireEvent.keyDown(option('Alpha'), { key: 'ArrowDown' })
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('springs along its height to a new item, and jumps under reduced motion', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 4)
    open({ orientation: 'vertical' }, 'never')
    fireEvent.click(option('Charlie'))
    expect(raf).toHaveBeenCalledTimes(1)
    raf.mockClear()
    open({ orientation: 'vertical' }, 'always')
    fireEvent.click(within(screen.getAllByRole('listbox', { name: 'Specimens' })[1]!).getByRole('option', { name: 'Charlie' }))
    expect(raf).not.toHaveBeenCalled()
  })
})
