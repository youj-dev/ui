import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SearchResults } from './search-results'
import { parseSearch, toSearch } from './search-results/model'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const results = () => within(screen.getByRole('list', { name: 'Results' })).getAllByRole('article')
const summary = () => document.querySelector('p[role=status]')!

describe('Search block', () => {
  test('names its landmarks and shows the first page of ranked, highlighted results', () => {
    const { container } = reduced(<SearchResults embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Search' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Search Kestrel' })).toHaveValue('onboarding')
    expect(screen.getByRole('status', { name: 'Link to this search' })).toHaveTextContent('kestrel.so/search?q=onboarding')
    expect(results()).toHaveLength(8)
    expect(screen.getByRole('link', { name: 'Onboarding v3: invite the team' })).toHaveAttribute('href', '/projects/onboarding-v3')
    expect(container.querySelector('mark')).toHaveTextContent(/onboarding/i)
    expect(screen.getByText('Showing 8 of 16')).toBeInTheDocument()
  })

  test('a facet narrows the results, keeps its own counts, shows a chip and updates the URL', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    reduced(<SearchResults onSearchChange={onSearchChange} />)
    await user.click(screen.getByRole('checkbox', { name: /^People/ }))
    await waitFor(() => expect(results()).toHaveLength(4))
    expect(onSearchChange).toHaveBeenLastCalledWith('?q=onboarding&type=person')
    expect(screen.getByRole('checkbox', { name: /^Documents/ })).toHaveAccessibleName(/9/)
    expect(screen.getByRole('radio', { name: /^Past week/ })).toHaveAccessibleName(/3/)
    expect(screen.getByRole('button', { name: 'Remove filter Type: People' })).toBeInTheDocument()
  })

  test('removing the last chip restores the results and returns focus to the field', async () => {
    const user = userEvent.setup()
    reduced(<SearchResults initialSearch="?q=onboarding&owner=priya" />)
    expect(results()).toHaveLength(5)
    await user.click(screen.getByRole('button', { name: 'Remove filter Owner: Priya Raman' }))
    await waitFor(() => expect(screen.getByText('Showing 8 of 16')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Search Kestrel' })).toHaveFocus())
  })

  test('typing suggests; Enter searches what was typed, with a loading state, and records it as recent', async () => {
    const user = userEvent.setup()
    reduced(<SearchResults />)
    const field = screen.getByRole('combobox', { name: 'Search Kestrel' })
    expect(field).toHaveAttribute('aria-expanded', 'false')
    expect(field).not.toHaveAttribute('aria-controls')
    await user.clear(field)
    await user.type(field, 'desig')
    const list = await screen.findByRole('listbox')
    expect(field).toHaveAttribute('aria-expanded', 'true')
    expect(field).toHaveAttribute('aria-controls', list.id)
    expect(within(list).getByRole('option', { name: 'Search for “desig”' })).toHaveAttribute('aria-selected', 'true')
    expect(within(list).getByRole('option', { name: 'design review' })).toBeInTheDocument()
    expect(within(list).getByRole('option', { name: 'Design tokens 2.0' })).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(summary()).toHaveTextContent('Searching…')
    await waitFor(() => expect(summary()).toHaveTextContent(/\d results for “desig”/), { timeout: 3000 })
    await user.clear(field)
    expect(within(await screen.findByRole('listbox')).getByRole('option', { name: 'desig' })).toBeInTheDocument()
  })

  test('↓ walks from the field into the results, ↑ walks back, Enter opens', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    reduced(<SearchResults onOpen={onOpen} />)
    const field = screen.getByRole('combobox', { name: 'Search Kestrel' })
    field.focus()
    await user.keyboard('{Escape}{ArrowDown}')
    const links = within(screen.getByRole('list', { name: 'Results' })).getAllByRole('link')
    expect(links[0]).toHaveFocus()
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(links[2]).toHaveFocus()
    await user.keyboard('{End}')
    expect(links[7]).toHaveFocus()
    await user.keyboard('{Home}{ArrowUp}')
    expect(field).toHaveFocus()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'onboarding-v3' }))
  })

  test('load more appends the next page and focuses its first result', async () => {
    const user = userEvent.setup()
    reduced(<SearchResults />)
    await user.click(screen.getByRole('button', { name: 'Show 8 more' }))
    await waitFor(() => expect(results()).toHaveLength(16), { timeout: 3000 })
    expect(within(screen.getByRole('list', { name: 'Results' })).getAllByRole('link')[8]).toHaveFocus()
    expect(screen.getByText('That’s everything for this search.')).toBeInTheDocument()
  })

  test('no results offers the spelling fix', async () => {
    const user = userEvent.setup()
    reduced(<SearchResults initialSearch="?q=onbaording" />)
    expect(screen.getByText('No results for “onbaording”')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Did you mean “onboarding”?' }))
    await waitFor(() => expect(screen.getByText('Showing 8 of 16')).toBeInTheDocument(), { timeout: 3000 })
  })

  test('when filters hide everything, it says how many and clears them', async () => {
    const user = userEvent.setup()
    reduced(<SearchResults initialSearch="?q=onboarding&type=person&tag=rfc" />)
    expect(screen.getByText('The filters hide all 16 results. Loosen one, or clear them.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(results()).toHaveLength(8)
  })

  test('with no query it offers recent and popular searches', async () => {
    const user = userEvent.setup()
    reduced(<SearchResults initialSearch="" />)
    expect(screen.getByText('Search everything in Kestrel')).toBeInTheDocument()
    await user.click(within(screen.getByRole('list', { name: 'Recent searches' })).getByRole('button', { name: 'audit logs' }))
    await waitFor(() => expect(screen.getByRole('link', { name: /Enterprise audit logs/ })).toBeInTheDocument(), { timeout: 3000 })
  })

  test('/ focuses the field from anywhere on the page', async () => {
    const user = userEvent.setup()
    reduced(<SearchResults embedded={false} />)
    await user.click(screen.getByRole('heading', { level: 1 }))
    await user.keyboard('/')
    expect(screen.getByRole('combobox', { name: 'Search Kestrel' })).toHaveFocus()
  })

  test('the loading prop holds the skeleton', () => {
    reduced(<SearchResults loading />)
    expect(summary()).toHaveTextContent('Searching…')
    expect(screen.queryByRole('list', { name: 'Results' })).not.toBeInTheDocument()
  })

  test('the query string round-trips and drops values it does not know', () => {
    const state = parseSearch('?q=design+review&type=document,spaceship&owner=mara,nobody&updated=30d&tag=design&sort=recent&page=2')
    expect(state).toEqual({ q: 'design review', types: ['document'], owners: ['mara'], tags: ['design'], updated: '30d', sort: 'recent', page: 2 })
    expect(toSearch(state)).toBe('?q=design+review&type=document&owner=mara&updated=30d&tag=design&sort=recent&page=2')
    expect(parseSearch('?updated=forever&sort=random').updated).toBe('any')
  })

  test('by default, a page of the app’s frame: the shared page header holds the title and the address, with no top bar and without the / shortcut', async () => {
    const user = userEvent.setup()
    const { container } = reduced(<SearchResults />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Search' }))
    expect(header).toContainElement(screen.getByRole('status', { name: 'Link to this search' }))
    expect(screen.queryByText('Kestrel')).not.toBeInTheDocument()
    expect(container.querySelector('[data-yj-theme]')).toBeNull()
    await user.click(screen.getByRole('heading', { level: 1 }))
    await user.keyboard('/')
    expect(screen.getByRole('combobox', { name: 'Search Kestrel' })).not.toHaveFocus()
  })

  describe('with your data', () => {
    const people = {
      ada: { id: 'ada', name: 'Ada Lovelace', initials: 'AL', role: 'Analyst', team: 'Engines', location: 'London', utc: 0, email: 'ada@engine.co' },
    }
    const items = [
      { id: 'd1', type: 'document' as const, title: 'Engine notes', owner: 'ada', updated: 2, tags: ['math'], href: '/notes/engine', path: ['Notes'], excerpt: 'Bernoulli numbers on the engine.', minutes: 5 },
      { id: 'd2', type: 'document' as const, title: 'Loom patterns', owner: 'ada', updated: 20, tags: ['weaving'], href: '/notes/loom', path: ['Notes'], excerpt: 'Punched cards for the engine.', minutes: 3 },
    ]

    test('items, people, copy, brand and today drive the page', () => {
      reduced(
        <SearchResults
          items={items}
          people={people}
          popular={['engine']}
          defaultSearch="?q=engine"
          today={Date.UTC(2026, 0, 10, 12)}
          brand={{ name: 'Analytica' }}
          origin="analytica.app/find"
          copy={{ title: 'Find', updated: (when) => `Edited ${when}` }}
        />,
      )
      expect(screen.getByRole('heading', { level: 1, name: 'Find' })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: 'Search Analytica' })).toHaveValue('engine')
      expect(screen.getByRole('status', { name: 'Link to this search' })).toHaveTextContent('analytica.app/find?q=engine')
      expect(results()).toHaveLength(2)
      expect(screen.getByText('Edited 2 days ago')).toBeInTheDocument()
      expect(screen.getByText('Edited Dec 21')).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /Ada Lovelace/ })).toBeInTheDocument()
    })

    test('the search is controlled: a facet asks, the prop decides', async () => {
      const user = userEvent.setup()
      const onSearchChange = vi.fn()
      const { rerender } = reduced(<SearchResults items={items} people={people} search="?q=engine" onSearchChange={onSearchChange} />)
      await user.click(screen.getByRole('checkbox', { name: /^Documents/ }))
      expect(onSearchChange).toHaveBeenLastCalledWith('?q=engine&type=document')
      expect(screen.queryByRole('button', { name: /Remove filter/ })).not.toBeInTheDocument()
      rerender(
        <YoujProvider reducedMotion="always">
          <SearchResults items={items} people={people} search="?q=loom" onSearchChange={onSearchChange} />
        </YoujProvider>,
      )
      expect(screen.getByRole('combobox', { name: 'Search Kestrel' })).toHaveValue('loom')
      expect(results()).toHaveLength(1)
    })

    test('result links use your link component and href', () => {
      const Link = ({ href, ...props }: React.ComponentProps<'a'>) => <a href={`/app${href}`} data-router {...props} />
      reduced(<SearchResults items={items} people={people} defaultSearch="?q=loom" linkComponent={Link} />)
      const link = screen.getByRole('link', { name: 'Loom patterns' })
      expect(link).toHaveAttribute('href', '/app/notes/loom')
      expect(link).toHaveAttribute('data-router')
    })

    test('an error replaces the results and offers a retry; empty replaces no results', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      const { unmount } = reduced(<SearchResults items={items} people={people} defaultSearch="?q=engine" error="Index offline" onRetry={onRetry} />)
      expect(screen.getByText('Index offline').closest('[role=alert]')).toHaveTextContent('Search isn’t answering')
      await user.click(screen.getByRole('button', { name: 'Try again' }))
      expect(onRetry).toHaveBeenCalledOnce()
      unmount()
      reduced(<SearchResults items={items} people={people} defaultSearch="?q=zzz" empty={<p>Nothing here</p>} className="custom-root" data-testid="page" headingLevel={2} />)
      expect(screen.getByText('Nothing here')).toBeInTheDocument()
      expect(screen.getByTestId('page')).toHaveClass('custom-root')
      expect(screen.getByRole('heading', { level: 2, name: 'Search' })).toBeInTheDocument()
    })

    test('clearing recent searches reports it', async () => {
      const user = userEvent.setup()
      const onRecentChange = vi.fn()
      reduced(<SearchResults defaultSearch="" defaultRecent={['engine']} onRecentChange={onRecentChange} />)
      await user.click(screen.getByRole('combobox', { name: 'Search Kestrel' }))
      await user.click(await screen.findByRole('option', { name: /Clear recent searches/ }))
      expect(onRecentChange).toHaveBeenCalledWith([])
    })
  })
})
