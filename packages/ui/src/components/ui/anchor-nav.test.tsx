import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { AnchorNav } from './anchor-nav'

const items = [
  { id: 'intro', label: 'Intro' },
  { id: 'setup', label: 'Setup' },
  { id: 'usage', label: 'Usage' },
]

/* jsdom lays nothing out: place each section at a page offset and derive its
 * viewport top from window.scrollY. */
const pageTop: Record<string, number> = { intro: 0, setup: 600, usage: 1200 }
let scrollY = 0
function scroll(y: number) {
  scrollY = y
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
}

beforeEach(() => {
  scrollY = 0
  Object.defineProperty(window, 'scrollY', { get: () => scrollY, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: 500, configurable: true })
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2400, configurable: true })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const top = (pageTop[this.id] ?? 0) - scrollY
    return { top, bottom: top + 100, left: 0, right: 100, width: 100, height: 100, x: 0, y: top, toJSON() {} } as DOMRect
  })
})
afterEach(() => vi.restoreAllMocks())

function Page({ reduced }: { reduced?: boolean }) {
  return (
    <YoujProvider reducedMotion={reduced ? 'always' : 'never'}>
      <AnchorNav items={items} />
      {items.map((item) => (
        <section key={item.id} id={item.id}>
          {item.label}
        </section>
      ))}
    </YoujProvider>
  )
}

const link = (name: string) => screen.getByRole('link', { name })

describe('AnchorNav', () => {
  test('a named nav whose first section is current at the top', () => {
    render(<Page />)
    expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument()
    expect(link('Intro')).toHaveAttribute('aria-current', 'location')
    expect(link('Setup')).toHaveAttribute('href', '#setup')
  })

  test('follows the scroll: the last section above the reading line (offset + a quarter of the view) is current', async () => {
    render(<Page />)
    // Setup's top at 600 - 470 = 130px, above the line at 16 + 500 / 4 = 141px.
    scroll(470)
    await waitFor(() => expect(link('Setup')).toHaveAttribute('aria-current', 'location'))
    expect(link('Intro')).not.toHaveAttribute('aria-current')
    // At 450 it is at 150px, still below the line.
    scroll(450)
    await waitFor(() => expect(link('Intro')).toHaveAttribute('aria-current', 'location'))
  })

  test('at the bottom of the page the last section is current, even if its top has not reached the line', async () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1400, configurable: true })
    render(<Page />)
    scroll(900)
    await waitFor(() => expect(link('Usage')).toHaveAttribute('aria-current', 'location'))
  })

  test('choosing a link scrolls smoothly to it, marks it at once, focuses the section and sets the hash', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<Page />)
    await user.click(link('Usage'))
    expect(scrollTo).toHaveBeenCalledWith({ top: 1200 - 16, behavior: 'smooth' })
    expect(link('Usage')).toHaveAttribute('aria-current', 'location')
    expect(document.getElementById('usage')).toHaveFocus()
    expect(document.getElementById('usage')).toHaveAttribute('tabindex', '-1')
    expect(window.location.hash).toBe('#usage')

    // Scroll events on the way don't move the mark back through Setup.
    scroll(600)
    await new Promise((r) => requestAnimationFrame(r))
    expect(link('Usage')).toHaveAttribute('aria-current', 'location')
  })

  test('keyboard: Tab to a link and Enter jumps there', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<Page />)
    await user.tab()
    await user.tab()
    expect(link('Setup')).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(scrollTo).toHaveBeenCalled()
    expect(document.getElementById('setup')).toHaveFocus()
  })

  test('reduced motion jumps instantly', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<Page reduced />)
    await user.click(link('Setup'))
    expect(scrollTo).toHaveBeenCalledWith({ top: 600 - 16, behavior: 'auto' })
  })

  test('cleans up its listeners on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<Page />)
    unmount()
    expect(remove.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining(['scroll', 'scrollend', 'wheel', 'touchstart', 'resize']))
  })
})
