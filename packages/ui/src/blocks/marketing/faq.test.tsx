import { forwardRef, type ComponentProps } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { graphite } from '@youj/core'
import { Faq, type FaqQuestion } from './faq'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const questions: FaqQuestion[] = [
  { id: 'shipping', topic: 'Orders', question: 'How long does shipping take?', answer: 'Three to five days, from our roastery in Leeds.' },
  { id: 'pause', topic: 'Subscriptions', question: 'Can I pause?', answer: 'Any time, for up to three months.' },
  { id: 'grind', topic: 'Coffee', question: 'Is the coffee ground?', answer: 'Whole bean by default.', keywords: ['espresso'] },
]

afterEach(() => window.history.replaceState(null, '', window.location.pathname))

describe('Faq', () => {
  test('a section named by its title: the answers grouped under their topics, the first one open', () => {
    reduced(<Faq />)
    expect(screen.getByRole('region', { name: 'Questions, answered' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Plans & billing',
      'Deploys',
      'Domains',
      'Data & security',
    ])
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(12)
    expect(screen.getByRole('button', { name: 'Is there really a free plan?' })).toHaveAttribute('aria-expanded', 'true')
    // One card for each width (CSS shows one): under the topics on a wide screen, after the answers on a narrow one.
    expect(screen.getAllByRole('link', { name: 'Contact support' }).map((a) => a.getAttribute('href'))).toEqual(['#contact', '#contact'])
  })

  test('your questions, copy, heading level and contact link drive it; cta={null} hides the way to a person', () => {
    const { unmount } = reduced(
      <Faq questions={questions} cta={{ label: 'Ask a roaster', href: '/help' }} copy={{ title: 'Before you order' }} headingLevel={3} />,
    )
    expect(screen.getByRole('heading', { level: 3, name: 'Before you order' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)).toEqual(['Orders', 'Subscriptions', 'Coffee'])
    expect(screen.getAllByRole('heading', { level: 5 }).map((h) => h.textContent)).toEqual([
      'How long does shipping take?',
      'Can I pause?',
      'Is the coffee ground?',
    ])
    expect(screen.getAllByRole('link', { name: 'Ask a roaster' })[0]).toHaveAttribute('href', '/help')
    unmount()
    reduced(<Faq questions={questions} cta={null} />)
    expect(screen.queryByRole('link', { name: /Contact|Ask/ })).not.toBeInTheDocument()
  })

  test('open answers are ids: uncontrolled, reported, and controlled', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { unmount } = reduced(<Faq questions={questions} defaultValue={[]} onValueChange={onValueChange} deepLinks={false} />)
    await user.click(screen.getByRole('button', { name: 'Can I pause?' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['pause'])
    expect(screen.getByRole('button', { name: 'Can I pause?' })).toHaveAttribute('aria-expanded', 'true')
    unmount()
    reduced(<Faq questions={questions} value={['grind']} onValueChange={onValueChange} />)
    expect(screen.getByRole('button', { name: 'Is the coffee ground?' })).toHaveAttribute('aria-expanded', 'true')
    await user.click(screen.getByRole('button', { name: 'How long does shipping take?' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['grind', 'shipping'])
    expect(screen.getByRole('button', { name: 'How long does shipping take?' })).toHaveAttribute('aria-expanded', 'false')
  })

  test('a topic narrows the answers to its own, and the topics count what each holds', async () => {
    const user = userEvent.setup()
    const onTopicChange = vi.fn()
    reduced(<Faq questions={questions} onTopicChange={onTopicChange} />)
    const topics = screen.getByRole('group', { name: 'Topics' })
    expect(
      within(topics)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['All questions3', 'Orders1', 'Subscriptions1', 'Coffee1'])
    await user.click(within(topics).getByRole('button', { name: /Coffee/ }))
    expect(onTopicChange).toHaveBeenCalledWith('Coffee')
    await waitFor(() => expect(screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)).toEqual(['Is the coffee ground?']))
  })

  test('the search filters as you type, marks its words, opens an answer that matched in its body, and Escape clears it', async () => {
    const user = userEvent.setup()
    const onQueryChange = vi.fn()
    reduced(<Faq questions={questions} defaultValue={[]} onQueryChange={onQueryChange} />)
    const field = screen.getByRole('searchbox', { name: 'Search questions' })
    await user.type(field, 'roastery')
    expect(onQueryChange).toHaveBeenLastCalledWith('roastery')
    await waitFor(() => expect(screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)).toEqual(['How long does shipping take?']))
    expect(screen.getByText('1 answer')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'How long does shipping take?' })).toHaveAttribute('aria-expanded', 'true')
    expect(document.querySelector('mark')).toHaveTextContent('roastery')
    // Keywords count too.
    await user.clear(field)
    await user.type(field, 'Espresso')
    await waitFor(() => expect(screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)).toEqual(['Is the coffee ground?']))
    await user.keyboard('{Escape}')
    expect(field).toHaveValue('')
    await waitFor(() => expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(3))
  })

  test('↓ in the search goes to the first question; no matches say so and offer a person', async () => {
    const user = userEvent.setup()
    reduced(<Faq questions={questions} />)
    const field = screen.getByRole('searchbox', { name: 'Search questions' })
    await user.type(field, 'pause')
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: 'Can I pause?' })).toHaveFocus()
    await user.clear(field)
    await user.type(field, 'refund')
    const empty = (await screen.findByText('No answers for “refund”')).parentElement!
    expect(within(empty).getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', '#contact')
  })

  test('deep links: arriving at #id opens that answer, and opening one writes its link', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', '#grind')
    reduced(<Faq questions={questions} defaultValue={[]} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Is the coffee ground?' })).toHaveAttribute('aria-expanded', 'true'))
    expect(document.getElementById('grind')).not.toBeNull()
    await user.click(screen.getByRole('button', { name: 'Can I pause?' }))
    expect(window.location.hash).toBe('#pause')
  })

  test('was this helpful: Yes thanks you, No hands you to a person, and both reach onFeedback', async () => {
    const user = userEvent.setup()
    const onFeedback = vi.fn(async () => {})
    reduced(<Faq questions={questions} defaultValue={['shipping', 'pause']} onFeedback={onFeedback} />)
    const [first, second] = screen.getAllByRole('group', { name: 'Was this helpful?' })
    await user.click(within(first!).getByRole('button', { name: 'Yes' }))
    expect(onFeedback).toHaveBeenCalledWith(questions[0], true)
    expect(await screen.findByText('Thanks for telling us.')).toBeInTheDocument()
    await user.click(within(second!).getByRole('button', { name: 'No' }))
    expect(onFeedback).toHaveBeenLastCalledWith(questions[1], false)
    expect(await screen.findByText('Sorry it didn’t help.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ask a person' })).toHaveAttribute('href', '#contact')
  })

  test('Copy link copies the answer’s deep link; deepLinks={false} leaves it out', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    const { unmount } = reduced(<Faq questions={questions} />)
    await user.click(screen.getByRole('button', { name: 'Copy link' }))
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}${window.location.pathname}#shipping`)
    unmount()
    reduced(<Faq questions={questions} deepLinks={false} />)
    expect(screen.queryByRole('button', { name: 'Copy link' })).not.toBeInTheDocument()
    writeText.mockRestore()
  })

  test('linkComponent renders the links; theme, embedded and rest props apply; search={false} drops the field', () => {
    const Link = forwardRef<HTMLAnchorElement, ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    reduced(<Faq questions={questions} linkComponent={Link} theme={graphite} embedded search={false} id="faq" />)
    for (const link of screen.getAllByRole('link', { name: 'Contact support' })) expect(link).toHaveAttribute('data-router')
    const section = screen.getByRole('region', { name: 'Questions, answered' })
    expect(section).toHaveAttribute('id', 'faq')
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })
})
