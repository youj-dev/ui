import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Blog, type BlogPost } from './blog'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

beforeAll(() => {
  window.scrollTo = () => {}
})

describe('blog block', () => {
  test('the index filters by category and opens an article', async () => {
    const user = userEvent.setup()
    reduced(<Blog />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Field Notes' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'In praise of slow interfaces' })).toBeInTheDocument()

    const filters = screen.getByRole('group', { name: 'Filter by category' })
    await user.click(within(filters).getByRole('button', { name: 'Type' }))
    expect(within(filters).getByRole('button', { name: 'Type' })).toHaveAttribute('aria-pressed', 'true')
    const latest = screen.getByRole('region', { name: 'Latest notes' })
    expect(within(latest).getAllByRole('article')).toHaveLength(1)
    // One named link per post: the cover's link is a pointer-only duplicate.
    expect(within(latest).getAllByRole('link').map((l) => l.textContent)).toEqual(['Variable serifs, set small'])

    await user.click(within(latest).getByRole('link', { name: 'Variable serifs, set small' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Variable serifs, set small' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Reading progress' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Next read' })).toBeInTheDocument()
  })

  test('an article offers a way back and a table of contents', async () => {
    const user = userEvent.setup()
    reduced(<Blog defaultPostId="slow-interfaces" />)
    expect(screen.getByRole('heading', { level: 1, name: 'In praise of slow interfaces' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'All notes' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Field Notes' })).toBeInTheDocument()
  })
})

const POSTS: BlogPost[] = [
  { id: 'a', title: 'First loaf', dek: 'On flour.', category: 'Bread', author: 'Inès Laurent', date: 'Aug 1', minutes: 4, image: 'https://example.com/a.jpg', sections: [{ id: 'flour', heading: 'Flour', body: ['Strong.'] }] },
  { id: 'b', title: 'Second loaf', dek: 'On water.', category: 'Pastry', author: 'Ravi Mehta', date: 'Aug 2', minutes: 6 },
]

describe('blog block with your data', () => {
  test('your posts, brand and copy drive the index; categories come from the posts', () => {
    reduced(<Blog posts={POSTS} brand={{ name: 'Crumb' }} copy={{ latest: 'From the oven', minRead: (n) => `${n} min` }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Crumb' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'First loaf' }).querySelector('img')).toHaveAttribute('src', 'https://example.com/a.jpg')
    const filters = screen.getByRole('group', { name: 'Filter by category' })
    expect(within(filters).getAllByRole('button').map((b) => b.textContent)).toEqual(['All', 'Bread', 'Pastry'])
    expect(screen.getByRole('region', { name: 'From the oven' })).toHaveTextContent('6 min')
  })

  test('controlled: opening a post is reported; the open post follows postId and shows its sections', async () => {
    const user = userEvent.setup()
    const onPostIdChange = vi.fn()
    const { rerender } = reduced(<Blog posts={POSTS} postId={undefined} onPostIdChange={onPostIdChange} />)
    await user.click(screen.getByRole('link', { name: 'Second loaf' }))
    expect(onPostIdChange).toHaveBeenCalledWith('b')
    rerender(
      <YoujProvider reducedMotion="always">
        <Blog posts={POSTS} postId="a" onPostIdChange={onPostIdChange} />
      </YoujProvider>,
    )
    expect(await screen.findByRole('heading', { level: 1, name: 'First loaf' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Flour' })).toBeInTheDocument()
  })

  test('getHref and linkComponent give each post a real route', () => {
    const RouterLink = (props: React.ComponentProps<'a'>) => <a data-router="" {...props} />
    reduced(<Blog posts={POSTS} getHref={(p) => `/blog/${p.id}`} linkComponent={RouterLink} />)
    const link = screen.getByRole('link', { name: 'Second loaf' })
    expect(link).toHaveAttribute('href', '/blog/b')
    expect(link).toHaveAttribute('data-router')
  })

  test('no posts shows the empty state; loading shows placeholders', () => {
    const { unmount } = reduced(<Blog posts={[]} copy={{ empty: 'Nothing baked yet.' }} />)
    expect(screen.getByText('Nothing baked yet.')).toBeInTheDocument()
    unmount()
    reduced(<Blog loading />)
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true')
  })
})
