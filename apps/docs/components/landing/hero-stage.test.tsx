import { act, fireEvent, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import type { MenuWave, Pillar } from '@/lib/nav'
import { Family } from './family'
import { HERO_PIN_QUERY } from './hero-score'
import { HeroStage } from './hero-stage'
import { TileElement } from './tile-element'

const pillar = (id: Pillar['id'], label: string, url: string): Pillar => ({ id, name: `Youj ${label}`, label, url, blurb: '', stat: label })
const PILLARS: Pillar[] = [
  pillar('ui', 'UI', '/docs/components'),
  pillar('motion', 'Motion', '/docs/motion'),
  pillar('loaders', 'Loaders', '/docs/loaders'),
  pillar('icons', 'Icons', '/docs/icons'),
  pillar('illustrations', 'Illustrations', '/docs/illustrations'),
  pillar('sound', 'Sound', '/docs/sound'),
  pillar('themes', 'Themes', '/docs/theming'),
  pillar('blocks', 'Blocks', '/screens'),
]
const WAVES: MenuWave[] = [
  { label: 'Tap', ms: 50, peaks: [100, 60, 30, 10] },
  { label: 'Success', ms: 309, peaks: [80, 40, 100, 50] },
]

/** Whether the view is wide and tall enough to pin the stage. */
function pinView(pinned: boolean) {
  const original = window.matchMedia
  window.matchMedia = ((query: string) => ({
    matches: pinned && query === HERO_PIN_QUERY,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  return () => {
    window.matchMedia = original
  }
}

/* The setup's IntersectionObserver never reports a view; here everything is on screen. */
class InView {
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.callback([{ isIntersecting: true, intersectionRatio: 1, target } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

async function renderHero(reducedMotion: 'always' | 'never' = 'never') {
  const view = render(
    <YoujProvider reducedMotion={reducedMotion}>
      <HeroStage
        waves={WAVES}
        copy={
          <>
            <h1>UI components, in motion.</h1>
            <a href="/docs/installation">Get started</a>
          </>
        }
        family={<Family pillars={PILLARS} element={(id) => <TileElement id={id} waves={WAVES} />} />}
      />
    </YoujProvider>,
  )
  await act(async () => {})
  return view
}

describe('the home hero', () => {
  let restore = () => {}
  const original = window.IntersectionObserver
  // The elements' code arrives in a chunk of its own once the page is idle (here, straight away).
  beforeAll(() => import('./hero-elements'))
  beforeEach(() => {
    window.IntersectionObserver = InView as unknown as typeof IntersectionObserver
  })
  afterEach(() => {
    restore()
    window.IntersectionObserver = original
  })

  it('reads as the copy, the release card as one image, then the family’s heading and its eight tiles, each a link to its part', async () => {
    restore = pinView(false)
    const { container } = await renderHero()
    const order = [...container.querySelectorAll('h1, [role=img], h2, [data-tile] a')].map((el) => (el.tagName === 'A' ? el.getAttribute('href') : el.tagName))
    expect(order).toEqual(['H1', 'DIV', 'H2', ...PILLARS.map((p) => p.url)])
    const card = screen.getByRole('img', { name: /A release going out, Checkout v2\.4 to production/ })
    // A picture, not controls: nothing in it takes focus.
    expect(card).toHaveAttribute('inert')
  })

  it('builds the card from the eight parts: each element once, on the release’s frame', async () => {
    restore = pinView(true)
    const { container } = await renderHero()
    const card = container.querySelector('.ho-card')!
    expect([...card.querySelectorAll('[data-el]')].map((el) => el.getAttribute('data-el')).sort()).toEqual(PILLARS.map((p) => p.id).sort())
    expect(card).toHaveTextContent('Checkout')
    await vi.waitFor(() => expect(card).toHaveTextContent('Build alerts'))
    expect(card).toHaveTextContent('v2.4 is live')
    expect(card).toHaveTextContent('Success · 309 ms')
    // Pinned, the tiles draw nothing of their own: the card's elements travel into them.
    expect(container.querySelector('.ho-family [data-el], .ho-family .ho-tile-frame')).toBeNull()
    expect(container.querySelectorAll('.ho-family')[0]).not.toHaveTextContent('Build alerts')
  })

  it('in the page’s flow, draws each tile’s element in the tile, the same one the card shows', async () => {
    restore = pinView(false)
    const { container } = await renderHero()
    const family = container.querySelector('.ho-family')!
    await vi.waitFor(() => expect(family).toHaveTextContent('Build alerts'))
    expect(family).toHaveTextContent('v2.4 is live')
    expect(family.querySelector('.ho-tile-frame')).not.toBeNull()
    expect(container.querySelector('.ho style')!.textContent).toBe('')
  })

  it('pinned, draws no scroll hint, and a rail with a tick for each part hidden from assistive technology', async () => {
    restore = pinView(true)
    const { container } = await renderHero()
    expect(container.querySelector('.ho-hint')).toBeNull()
    expect(container.querySelectorAll('.ho-rail-tick')).toHaveLength(8)
    expect(container.querySelector('.ho-rail')!.closest('[aria-hidden]')).not.toBeNull()
  })

  it('pinned, writes the score for the layout, and under reduced motion goes flat instead', async () => {
    restore = pinView(true)
    const pinned = await renderHero()
    expect(pinned.container.querySelector('.ho style')!.textContent).toContain('@keyframes ho-t-blocks')
    pinned.unmount()
    const flat = await renderHero('always')
    expect(flat.container.querySelector('.ho')).toHaveAttribute('data-flat')
    expect(flat.container.querySelector('.ho style')!.textContent).toBe('')
  })

  it('pinned, scrolls a keyboard user to the landed grid when they tab into it, and back to the top when they tab out', async () => {
    restore = pinView(true)
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const { container } = await renderHero()
    const tile = screen.getByRole('link', { name: /Motion/ })
    tile.matches = () => true
    fireEvent.focus(tile)
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: expect.any(Number), behavior: 'instant' }))
    container.querySelector<HTMLElement>('.ho')!.dataset.apart = ''
    const start = screen.getByRole('link', { name: 'Get started' })
    start.matches = () => true
    fireEvent.focus(start)
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' })
    scrollTo.mockRestore()
  })
})
