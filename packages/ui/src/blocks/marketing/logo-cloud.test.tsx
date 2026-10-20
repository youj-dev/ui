import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { LogoCloud } from './logo-cloud'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
// A quick clock, so a trade comes round in a test's time.
const moving = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="never" timeScale={0.05}>{ui}</YoujProvider>)
const TITLE = 'Trusted by 40,000 teams, from two-person startups to the Fortune 500'
/** The names the picture shows, which screen readers don't get. */
const pictured = (root: HTMLElement) => [...root.querySelectorAll('[aria-hidden="true"] .text-lg')].map((el) => el.textContent)

// The suite's stub never scrolls anything into view; the cloud only trades while it's on screen.
const Unseen = globalThis.IntersectionObserver
beforeAll(() => {
  globalThis.IntersectionObserver = class {
    constructor(private cb: IntersectionObserverCallback) {}
    observe(target: Element) {
      this.cb([{ isIntersecting: true, intersectionRatio: 1, target } as IntersectionObserverEntry], this as never)
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  } as never
})
afterAll(() => {
  globalThis.IntersectionObserver = Unseen
})

describe('LogoCloud', () => {
  test('a section named by its line; screen readers get every customer once, as a list, not the picture', () => {
    const { container } = reduced(<LogoCloud />)
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument()
    const list = screen.getByRole('list', { name: 'Customers' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(16)
    expect(pictured(container)).toEqual(['Lumen', 'Northstar', 'Arcadia', 'Helix', 'Vertex', 'Orbital', 'Tandem', 'Mosaic'])
  })

  test('the grid trades a logo in place for the next customer not on show, never showing one twice', async () => {
    const { container } = moving(<LogoCloud />)
    await waitFor(() => expect(pictured(container)).toContain('Quanta'), { timeout: 3000 })
    await waitFor(() => expect(pictured(container)).toContain('Parallel'), { timeout: 3000 })
    const settled = pictured(container).slice(-8)
    expect(new Set(settled).size).toBe(settled.length)
  })

  test('one button pauses it and plays it again', async () => {
    const user = userEvent.setup()
    moving(<LogoCloud />)
    await user.click(screen.getByRole('button', { name: 'Pause the logos' }))
    expect(screen.getByRole('button', { name: 'Play the logos' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Play the logos' }))
    expect(screen.getByRole('button', { name: 'Pause the logos' })).toBeInTheDocument()
  })

  test('still under reduced motion, or with autoplay off, or with nothing to trade: no button', () => {
    const { unmount } = reduced(<LogoCloud />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    unmount()
    const second = moving(<LogoCloud autoplay={false} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    second.unmount()
    moving(<LogoCloud logos={[{ name: 'Fernhill' }, { name: 'Marlowe' }]} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('the marquee drifts behind the same list, with the same button; still, it wraps into a row', () => {
    const { container, unmount } = moving(<LogoCloud variant="marquee" />)
    expect(within(screen.getByRole('list', { name: 'Customers' })).getAllByRole('listitem')).toHaveLength(16)
    expect(screen.getByRole('button', { name: 'Pause the logos' })).toBeInTheDocument()
    expect(pictured(container)).toContain('Bluebird')
    unmount()
    const still = reduced(<LogoCloud variant="marquee" />)
    expect(pictured(still.container)).toHaveLength(16)
  })

  test('your logos, copy and heading level; embedded and a theme', () => {
    reduced(<LogoCloud logos={[{ name: 'Café Linden' }, { name: 'Bar Nord' }]} copy={{ title: 'Poured in 600 cafés' }} headingLevel={3} embedded theme={brutal} id="cafes" />)
    const section = screen.getByRole('region', { name: 'Poured in 600 cafés' })
    expect(section).toHaveAttribute('id', 'cafes')
    expect(section.className).not.toMatch(/py-14/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 3, name: 'Poured in 600 cafés' })).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Customers' })).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Café Linden', 'Bar Nord'])
  })
})
