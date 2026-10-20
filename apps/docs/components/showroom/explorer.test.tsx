import { fireEvent, render, screen, within } from '@testing-library/react'
import { ShowroomCard, ShowroomExplorer, ShowroomGrid } from './explorer'
import type { ShowroomItem } from './thumb'

const ITEMS: ShowroomItem[] = [
  { id: 'fern', label: 'Fern', thumbs: { light: '/fern.webp', dark: '/fern.dark.webp' } },
  { id: 'moss', label: 'Moss' },
]

function explorer(onOpen = vi.fn(), current = 'fern') {
  render(
    <ShowroomExplorer title="Specimens" titleId="specimens-title" bar={<div data-testid="bar" />}>
      <ShowroomGrid
        id="specimens"
        label="2 specimens"
        items={ITEMS}
        renderItem={(item, i) => <ShowroomCard item={item} current={item.id === current} eager={i < 1} meta="plant" href={`?specimen=${item.id}`} onOpen={onOpen} />}
      />
    </ShowroomExplorer>,
  )
  return onOpen
}

const card = (name: RegExp) => within(screen.getByRole('list', { name: '2 specimens' })).getByRole('link', { name })

describe('the showroom explorer', () => {
  it('is a titled section holding its bar over a grid the page’s arrows leave alone', () => {
    explorer()
    const section = screen.getByRole('region', { name: 'Specimens' })
    expect(section).toContainElement(screen.getByTestId('bar'))
    const grid = screen.getByRole('list', { name: '2 specimens' })
    expect(grid).toHaveAttribute('data-showroom-grid')
    expect(within(grid).getAllByRole('listitem').map((li) => li.getAttribute('data-item'))).toEqual(['fern', 'moss'])
  })

  it('heads the grid with its title and count, a space between them in its name', () => {
    render(
      <ShowroomExplorer title="All specimens" titleId="all-specimens" count={2}>
        <div />
      </ShowroomExplorer>,
    )
    expect(screen.getByRole('heading', { level: 2 })).toHaveAccessibleName('All specimens 2')
  })

  it('names each card with its meta, marks the one on show, and links it by the address', () => {
    explorer()
    expect(card(/^Fern, plant, on stage$/)).toHaveAttribute('aria-current', 'true')
    expect(card(/^Moss, plant$/)).not.toHaveAttribute('aria-current')
    expect(card(/^Moss/)).toHaveAttribute('href', '?specimen=moss')
  })

  it('loads the first cards’ pictures at once and says when there is none', () => {
    explorer()
    const fern = card(/^Fern/).closest('.gallery-card')!
    expect([...fern.querySelectorAll('img')].map((i) => [i.getAttribute('src'), i.getAttribute('loading')])).toEqual([
      ['/fern.webp', 'eager'],
      ['/fern.dark.webp', 'eager'],
    ])
    expect(card(/^Moss/).closest('.gallery-card')).toHaveTextContent('No thumbnail')
  })

  it('opens a plain click’s item in place and leaves a modified one to the browser', () => {
    const onOpen = explorer()
    fireEvent.click(card(/^Moss/))
    fireEvent.click(card(/^Moss/), { metaKey: true })
    fireEvent.click(card(/^Moss/), { button: 1 })
    expect(onOpen.mock.calls).toEqual([['moss']])
  })
})
