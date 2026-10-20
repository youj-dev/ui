import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnchorProvider, type TOCItemType } from 'fumadocs-core/toc'
import { YoujProvider } from '@youj/core'
import { TocPopover } from './toc'

const items: TOCItemType[] = [
  { title: 'Installation', url: '#installation', depth: 2 },
  { title: 'Async search', url: '#async-search', depth: 3 },
  { title: 'Props', url: '#props', depth: 2 },
]

/** A page as the docs render it: headings that link to themselves, the last folded in a Reference. */
function Page() {
  return (
    <AnchorProvider toc={items}>
      <header>
        <TocPopover items={items} />
      </header>
      <h2 id="installation">
        <a href="#installation">Installation</a>
      </h2>
      <h3 id="async-search">
        <a href="#async-search">Async search</a>
      </h3>
      <details>
        <summary>Reference</summary>
        <h2 id="props">
          <a href="#props">Props</a>
        </h2>
      </details>
    </AnchorProvider>
  )
}

afterEach(() => {
  window.location.hash = ''
})

describe('TocPopover on touch', () => {
  it('is a bottom sheet, not a popover under the finger: the same list, in a drawer named On this page', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider device="touch">
        <Page />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'On this page' }))
    const dialog = await screen.findByRole('dialog', { name: 'On this page' })
    expect(dialog).toHaveAttribute('data-slot', 'drawer-content')
    expect(within(dialog).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['#installation', '#async-search', '#props'])
    // Rows are thumb-sized (the touch variant is CSS; jsdom can only see the class).
    expect(within(dialog).getByRole('link', { name: 'Installation' }).className).toContain('touch:min-h-12')

    await user.click(within(dialog).getByRole('link', { name: 'Async search' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(window.location.hash).toBe('#async-search')
  })
})

describe('TocPopover', () => {
  it('lists the sections in a dialog named On this page, and Escape hands focus back to the trigger', async () => {
    const user = userEvent.setup()
    render(<Page />)
    const trigger = screen.getByRole('button', { name: 'On this page' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    const dialog = await screen.findByRole('dialog', { name: 'On this page' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const links = within(dialog).getAllByRole('link')
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Installation', '#installation'],
      ['Async search', '#async-search'],
      ['Props', '#props'],
    ])
    await waitFor(() => expect(links[0]).toHaveFocus())

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  it('following a section closes it and lands focus on that heading, not back at the top', async () => {
    const user = userEvent.setup()
    render(<Page />)
    await user.click(screen.getByRole('button', { name: 'On this page' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('link', { name: 'Async search' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(window.location.hash).toBe('#async-search')
    await waitFor(() => expect(document.getElementById('async-search')!.querySelector('a')).toHaveFocus())
  })

  it('opens a folded Reference on the way to a heading inside it', async () => {
    const user = userEvent.setup()
    render(<Page />)
    const fold = document.querySelector('details')!
    expect(fold.open).toBe(false)

    await user.click(screen.getByRole('button', { name: 'On this page' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('link', { name: 'Props' }))

    expect(fold.open).toBe(true)
    await waitFor(() => expect(document.getElementById('props')!.querySelector('a')).toHaveFocus())
  })

  it('works from the keyboard alone', async () => {
    const user = userEvent.setup()
    render(<Page />)
    await user.tab()
    expect(screen.getByRole('button', { name: 'On this page' })).toHaveFocus()
    await user.keyboard('{Enter}')
    const dialog = await screen.findByRole('dialog', { name: 'On this page' })
    await waitFor(() => expect(within(dialog).getByRole('link', { name: 'Installation' })).toHaveFocus())
    await user.tab()
    expect(within(dialog).getByRole('link', { name: 'Async search' })).toHaveFocus()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(document.getElementById('async-search')!.querySelector('a')).toHaveFocus())
  })

  it('closes when its trigger goes away, as it does where the rail takes over', async () => {
    // Every observer, with what it watches, so the test can resize just the trigger.
    const observers: { callback: ResizeObserverCallback; targets: Element[] }[] = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        entry: { callback: ResizeObserverCallback; targets: Element[] }
        constructor(callback: ResizeObserverCallback) {
          this.entry = { callback, targets: [] }
          observers.push(this.entry)
        }
        observe(target: Element) {
          this.entry.targets.push(target)
        }
        unobserve() {}
        disconnect() {}
      },
    )
    const user = userEvent.setup()
    render(<Page />)
    const trigger = screen.getByRole('button', { name: 'On this page' })
    await user.click(trigger)
    await screen.findByRole('dialog')

    // The rail's breakpoint hides the trigger: it has no offset parent any more.
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(null)
    const watching = observers.filter((o) => o.targets.includes(trigger))
    expect(watching.length).toBeGreaterThan(0)
    act(() => watching.forEach((o) => o.callback([{ target: trigger } as unknown as ResizeObserverEntry], {} as ResizeObserver)))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('leaves nothing behind when the page goes while it is open', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Page />)
    await user.click(screen.getByRole('button', { name: 'On this page' }))
    await screen.findByRole('dialog')
    unmount()
    expect(document.querySelector('[role=dialog]')).toBeNull()
  })
})
