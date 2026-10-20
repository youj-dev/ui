import { forwardRef } from 'react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { HeroEditorial } from './hero-editorial'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const TITLE = /^Deploy on\s*Fridays\.\s*Sleep anyway\.$/

function allInView() {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe = (el: Element) => this.cb([{ isIntersecting: true, target: el, intersectionRatio: 1 } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
      unobserve() {}
      disconnect() {}
    },
  )
}

describe('HeroEditorial', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  test('names the section by one fixed h1, with the byline, both calls to action and three figures', () => {
    reduced(<HeroEditorial />)
    const title = screen.getByRole('heading', { level: 1, name: TITLE })
    expect(screen.getByRole('region', { name: title.textContent!.length ? TITLE : '' })).toBeInTheDocument()
    expect(screen.getByText('Iris Calder')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start deploying free' })).toHaveAttribute('href', '#signup')
    expect(screen.getByRole('link', { name: /Read the deploy report/ })).toHaveAttribute('href', '#report')
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['median rollback', 'on the edge by default', 'uptime, last 12 months'])
  })

  test('with motion the middle word cycles, but assistive tech keeps reading the same headline; unmounting stops it', () => {
    vi.useFakeTimers()
    allInView()
    const setInterval = vi.spyOn(globalThis, 'setInterval')
    const clearInterval = vi.spyOn(globalThis, 'clearInterval')
    const { container, unmount } = render(
      <YoujProvider reducedMotion="never">
        <HeroEditorial />
      </YoujProvider>,
    )
    const picture = () => container.querySelector('h1 [aria-hidden="true"].italic')!.textContent
    expect(picture()).toContain('Fridays.')
    act(() => vi.advanceTimersByTime(4_000))
    expect(picture()).toContain('holidays.')
    expect(screen.getByRole('heading', { level: 1, name: TITLE })).toBeInTheDocument()
    // The cycle's interval (every five deliberate steps); unmounting clears it.
    const at = setInterval.mock.calls.map((call) => call[1]).lastIndexOf(2_800)
    const cycle = setInterval.mock.results[at]!.value
    unmount()
    expect(clearInterval).toHaveBeenCalledWith(cycle)
  })

  test('under reduced motion the first word stays and nothing ticks', () => {
    vi.useFakeTimers()
    allInView()
    const { container } = reduced(<HeroEditorial />)
    act(() => vi.advanceTimersByTime(10_000))
    expect(container.querySelector('h1 [aria-hidden="true"].italic')).toHaveTextContent('Fridays.')
  })

  test('embedded, the title is an h2 and the host lays it out; a theme wraps it in a ThemeScope', () => {
    const { container } = reduced(<HeroEditorial embedded theme={brutal} />)
    expect(screen.getByRole('heading', { level: 2, name: TITLE })).toBeInTheDocument()
    expect(container.querySelector('section')).not.toHaveClass('bg-canvas')
    expect(container.querySelector('[data-yj-theme] > section')).toBeInTheDocument()
  })

  test('copy, words, figures and calls to action replace the demo, through linkComponent', async () => {
    const user = userEvent.setup()
    const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const { container } = reduced(
      <HeroEditorial
        id="cover"
        copy={{ headlineLead: 'Close the books on', headlineTail: 'Go home early.', author: 'Maya Ortiz', publication: 'Ledgerly Review', lede: ['Month end used to take a week.'] }}
        words={['Tuesday.', 'payday.']}
        figures={[{ value: 98, unit: '%', label: 'auto-matched' }]}
        primaryCta={{ label: 'Open an account', href: '/signup', onClick }}
        secondaryCta={null}
        stories={[]}
        linkComponent={RouterLink}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: /^Close the books on\s*Tuesday\.\s*Go home early\.$/ })).toBeInTheDocument()
    expect(container.querySelector('section')).toHaveAttribute('id', 'cover')
    expect(screen.getByText('Maya Ortiz')).toBeInTheDocument()
    expect(screen.getByText('Ledgerly Review')).toBeInTheDocument()
    expect(screen.getByText('Month end used to take a week.')).toBeInTheDocument()
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['auto-matched'])
    expect(screen.getAllByRole('link')).toHaveLength(1)
    await user.click(screen.getByRole('link', { name: 'Open an account' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: 'Open an account' })).toHaveAttribute('data-router')
  })
  test('the contents is a named navigation of numbered links with reading times, and fires onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
    reduced(
      <HeroEditorial
        stories={[
          { kicker: 'Infrastructure', title: 'Rollbacks, explained', href: '/rollbacks', minutes: 4, onClick },
          { kicker: 'Culture', title: 'Fridays', href: '/fridays' },
        ]}
      />,
    )
    const nav = screen.getByRole('navigation', { name: 'In this issue' })
    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveTextContent('01')
    expect(links[0]).toHaveTextContent('Rollbacks, explained')
    expect(links[0]).toHaveTextContent('4 min read')
    expect(links[1]).not.toHaveTextContent('min read')
    await user.click(links[0]!)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('the demo contents lists three pieces; stories={[]} removes it', () => {
    const { unmount } = reduced(<HeroEditorial />)
    expect(within(screen.getByRole('navigation', { name: 'In this issue' })).getAllByRole('link')).toHaveLength(3)
    unmount()
    reduced(<HeroEditorial stories={[]} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  test('media sits under the headline, hidden from assistive tech; copy rewrites the contents strings', () => {
    reduced(<HeroEditorial media={<img src="/cover.png" alt="" data-testid="cover" />} copy={{ inThisIssue: 'Inside', readTime: (m) => `${m} Min.` }} />)
    expect(screen.getByTestId('cover').parentElement).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('navigation', { name: 'Inside' })).toHaveTextContent('4 Min.')
  })
})
