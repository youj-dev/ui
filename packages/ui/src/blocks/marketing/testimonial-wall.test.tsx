import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { TestimonialWall, type TestimonialWallQuote } from './testimonial-wall'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const moving = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="never">{ui}</YoujProvider>)
const TITLE = 'Teams don’t just use it. They tell people.'

const QUOTES: TestimonialWallQuote[] = [
  { id: 'a', quote: 'Deploys are boring now, in the best way.', highlight: 'boring now', author: { name: 'Ada Lovelace', role: 'Engineer', company: 'Analytical' }, rating: 5, source: 'G2' },
  { id: 'b', quote: 'Our bill went down.', author: { name: 'Grace Hopper', role: 'Admiral' }, metric: { value: '−31%', label: 'infra bill' }, href: '#grace' },
  { id: 'c', quote: 'Highlights that are not in the quote change nothing.', highlight: 'not here', author: { name: 'Alan Turing', role: 'Mathematician' } },
]

describe('TestimonialWall', () => {
  test('a labelled section: the heading, the rating beside it and every quote once in a named list', () => {
    reduced(<TestimonialWall />)
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: TITLE })).toBeInTheDocument()
    expect(screen.getByText('4.8 out of 5')).toBeInTheDocument()
    expect(screen.getByText('from 2,314 reviews')).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'What customers say' })).getAllByRole('listitem')).toHaveLength(16)
  })

  test('each card sets its highlight in full ink, its stars, its source, a figure and who said it', () => {
    reduced(<TestimonialWall quotes={QUOTES} />)
    const [first, second, third] = screen.getAllByRole('listitem')
    expect(within(first!).getByText('boring now').tagName).toBe('STRONG')
    expect(first).toHaveTextContent('“Deploys are boring now, in the best way.”')
    expect(within(first!).getByRole('img', { name: 'Rated 5 out of 5' })).toBeInTheDocument()
    expect(within(first!).getByText('G2')).toBeInTheDocument()
    expect(within(first!).getByText('Engineer, Analytical')).toBeInTheDocument()
    expect(within(second!).getByText('−31%')).toBeInTheDocument()
    expect(within(second!).getByRole('link', { name: 'Grace Hopper' })).toHaveAttribute('href', '#grace')
    expect(third).toHaveTextContent('“Highlights that are not in the quote change nothing.”')
    expect(within(third!).queryByRole('strong')).toBeNull()
  })

  test('moving, one button pauses the whole wall and plays it again; the repeats stay hidden from screen readers', async () => {
    const user = userEvent.setup()
    moving(<TestimonialWall quotes={QUOTES} />)
    expect(within(screen.getByRole('list', { name: 'What customers say' })).getAllByRole('listitem')).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: 'Pause the wall' }))
    expect(screen.getByRole('button', { name: 'Play the wall' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Play the wall' }))
    expect(screen.getByRole('button', { name: 'Pause the wall' })).toBeInTheDocument()
  })

  test('under reduced motion the wall stands still, folded, and Show all unfolds it', async () => {
    const user = userEvent.setup()
    reduced(<TestimonialWall />)
    expect(screen.queryByRole('button', { name: 'Pause the wall' })).not.toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: 'Show all' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(screen.getByRole('button', { name: 'Show fewer' })).toHaveAttribute('aria-expanded', 'true')
  })

  test('autoplay off stands still too, with motion allowed', () => {
    moving(<TestimonialWall autoplay={false} />)
    expect(screen.queryByRole('button', { name: 'Pause the wall' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show all' })).toBeInTheDocument()
  })

  test('loading shows skeletons in a status; no quotes says so', () => {
    const { unmount } = reduced(<TestimonialWall loading />)
    expect(screen.getByRole('status', { name: 'Loading reviews' })).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    unmount()
    reduced(<TestimonialWall quotes={[]} copy={{ empty: 'Nothing yet.' }} />)
    expect(screen.getByText('Nothing yet.')).toBeInTheDocument()
  })

  test('your rating, call to action and copy replace the demo; null hides them', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault())
    const { unmount } = reduced(
      <TestimonialWall quotes={QUOTES} rating={{ score: 4.2, count: 90 }} cta={{ label: 'All reviews', href: '#all', onClick }} copy={{ title: 'What cooks say' }} locale="de-DE" />,
    )
    expect(screen.getByRole('heading', { name: 'What cooks say' })).toBeInTheDocument()
    expect(screen.getByText('4,2 out of 5')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'All reviews' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    unmount()
    reduced(<TestimonialWall rating={null} cta={null} />)
    expect(screen.queryByText(/out of 5$/)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Read all reviews' })).not.toBeInTheDocument()
  })

  test('headingLevel and rest props apply; embedded and a theme', () => {
    reduced(<TestimonialWall embedded theme={brutal} headingLevel={3} id="love" />)
    const section = screen.getByRole('region', { name: TITLE })
    expect(section).toHaveAttribute('id', 'love')
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 3, name: TITLE })).toBeInTheDocument()
  })
})
