import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DocComments, type DocCommentsDoc, type DocCommentsThread } from './doc-comments'
import { layoutRail, offsetIn, segments } from './doc-comments/layout'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

// jsdom has no layout: a selection's boxes are empty.
beforeAll(() => {
  Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect ??= () =>
    ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
})

const ADA = { id: 'ada', name: 'Ada Brennan', handle: 'ada' }
const LUCA = { id: 'luca', name: 'Luca Moretti', handle: 'luca' }
const NOW = Date.UTC(2026, 9, 2, 10, 0)
const DOC: DocCommentsDoc = {
  title: 'Onboarding email',
  blocks: [
    { id: 'h', type: 'heading', text: 'Welcome' },
    { id: 'p1', text: 'Invite a colleague, connect a carrier and import a manifest.' },
    { id: 'p2', text: 'Most teams are live within an hour.' },
  ],
}
const at = (block: string, phrase: string) => {
  const text = DOC.blocks.find((b) => b.id === block)!.text
  return { block, start: text.indexOf(phrase), end: text.indexOf(phrase) + phrase.length }
}
const threads = (): DocCommentsThread[] => [
  {
    id: 't1',
    anchor: at('p1', 'connect a carrier'),
    comments: [{ id: 'c1', author: LUCA, body: 'Link the carriers page?', createdAt: NOW - 60_000 * 50 }],
  },
  {
    id: 't2',
    anchor: at('p2', 'within an hour'),
    comments: [{ id: 'c2', author: ADA, body: 'Median is 42 minutes.', createdAt: NOW - 60_000 * 20 }],
  },
  {
    id: 't3',
    anchor: at('p1', 'import a manifest'),
    resolved: { by: ADA, at: NOW - 60_000 * 5 },
    comments: [{ id: 'c3', author: LUCA, body: 'CSV only for now.', createdAt: NOW - 60_000 * 30 }],
  },
]
const setup = (props: Partial<React.ComponentProps<typeof DocComments>> = {}) =>
  reduced(<DocComments doc={DOC} threads={threads()} people={[ADA, LUCA]} user={ADA} now={NOW} {...props} />)
const mark = (words: string) => screen.getByRole('button', { name: words })
const card = (threadId: string) => document.querySelector(`[data-yj-card="${threadId}"] [data-slot=doc-comment]`) as HTMLElement

describe('the rail layout', () => {
  const items = [
    { id: 'a', anchor: 0, height: 100 },
    { id: 'b', anchor: 40, height: 50 },
    { id: 'c', anchor: 300, height: 50 },
  ]
  test('each card at its anchor, or just under the one before', () => {
    expect([...layoutRail(items, null, 10).values()]).toEqual([0, 110, 300])
  })
  test('the active card sits on its anchor and pushes the one before it up, never above the top', () => {
    expect(
      layoutRail(
        [
          { id: 'a', anchor: 100, height: 50 },
          { id: 'b', anchor: 120, height: 50 },
        ],
        'b',
        10,
      ),
    ).toEqual(
      new Map([
        ['a', 60],
        ['b', 120],
      ]),
    )
    // No room above: laid out from the top down instead.
    expect([...layoutRail(items, 'b', 10).values()]).toEqual([0, 110, 300])
  })
})

describe('anchors', () => {
  test('a block cut at every anchor’s edges, overlaps knowing both threads', () => {
    expect(
      segments('abcdefgh', [
        { id: 'x', start: 2, end: 6 },
        { id: 'y', start: 4, end: 8 },
      ]),
    ).toEqual([
      { text: 'ab', start: 0, ids: [] },
      { text: 'cd', start: 2, ids: ['x'] },
      { text: 'ef', start: 4, ids: ['x', 'y'] },
      { text: 'gh', start: 6, ids: ['y'] },
    ])
    expect(segments('abc', [{ id: 'bad', start: 5, end: 9 }])).toEqual([{ text: 'abc', start: 0, ids: [] }])
  })
  test('a DOM position maps back to an offset in the block’s text', () => {
    const p = document.createElement('p')
    p.innerHTML = 'one <mark>two</mark> three'
    expect(offsetIn(p, p.querySelector('mark')!.firstChild!, 1)).toBe(5)
    expect(offsetIn(p, p.lastChild!, 3)).toBe(10)
  })
})

describe('Doc comments block', () => {
  test('the document with its highlights as buttons described by their comments, and the rail as a list', () => {
    setup()
    expect(screen.getByRole('heading', { level: 2, name: 'Onboarding email' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Welcome' })).toBeInTheDocument()
    expect(screen.getByText('2 open · 1 resolved')).toBeInTheDocument()
    expect(mark('connect a carrier')).toHaveAccessibleDescription('1 comment from Luca Moretti')
    const rail = screen.getByRole('list', { name: 'Comments' })
    expect(within(rail).getAllByRole('group', { name: /^Comment on/ })).toHaveLength(2)
    // Resolved threads leave the text.
    expect(screen.queryByRole('button', { name: 'import a manifest' })).not.toBeInTheDocument()
    expect(screen.queryByText('Demo data')).not.toBeInTheDocument()
  })

  test('pressing a highlight opens its thread; Esc lets go', async () => {
    const user = userEvent.setup()
    const onActiveThreadChange = vi.fn()
    setup({ onActiveThreadChange })
    await user.click(mark('within an hour'))
    expect(onActiveThreadChange).toHaveBeenLastCalledWith('t2')
    expect(mark('within an hour')).toHaveAttribute('data-active')
    expect(card('t2')).toHaveAttribute('data-active')
    // The open thread shows in full, with its reply row.
    expect(within(card('t2')).getByRole('button', { name: 'Resolve' })).toBeInTheDocument()
    expect(within(card('t1')).queryByRole('button', { name: 'Resolve' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(onActiveThreadChange).toHaveBeenLastCalledWith(null)
  })

  test('Enter on a highlight opens its thread and focuses it; Alt+↓ walks to the next', async () => {
    const user = userEvent.setup()
    setup()
    mark('connect a carrier').focus()
    await user.keyboard('{Enter}')
    expect(card('t1')).toHaveFocus()
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
    expect(card('t2')).toHaveFocus()
    expect(card('t2')).toHaveAttribute('data-active')
  })

  test('pointing at a card lights its words', async () => {
    const user = userEvent.setup()
    setup()
    await user.hover(card('t1'))
    expect(mark('connect a carrier')).toHaveAttribute('data-yj-linked')
  })

  test('Show resolved brings resolved threads back', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: 'Show resolved' }))
    expect(mark('import a manifest')).toHaveAttribute('data-yj-resolved')
    expect(within(screen.getByRole('list', { name: 'Comments' })).getAllByRole('group', { name: /^Comment on/ })).toHaveLength(3)
  })

  test('selected words take a new thread, posted with its anchor', async () => {
    const user = userEvent.setup()
    const onPost = vi.fn()
    setup({ onPost })
    const text = document.querySelector('[data-yj-block=p2]')!.firstChild!
    const range = document.createRange()
    range.setStart(text, 0)
    range.setEnd(text, 'Most teams'.length)
    act(() => {
      document.getSelection()!.removeAllRanges()
      document.getSelection()!.addRange(range)
      document.dispatchEvent(new Event('selectionchange'))
    })
    await user.click(screen.getByRole('button', { name: 'Comment' }))
    const field = screen.getByRole('textbox', { name: 'Comment on “Most teams”' })
    expect(field).toHaveFocus()
    await user.type(field, 'Which teams?')
    await user.keyboard('{Control>}{Enter}{/Control}')
    expect(onPost).toHaveBeenCalledWith({ threadId: null, body: 'Which teams?', mentions: [], anchor: { block: 'p2', start: 0, end: 10 } })
    expect(mark('Most teams')).toBeInTheDocument()
    expect(screen.getByText('3 open · 1 resolved')).toBeInTheDocument()
  })

  test('Ctrl+Alt+M comments on the selection; Esc drops the draft', async () => {
    setup()
    const text = document.querySelector('[data-yj-block=p1]')!.firstChild!
    const range = document.createRange()
    range.setStart(text, 0)
    range.setEnd(text, 'Invite'.length)
    act(() => {
      document.getSelection()!.removeAllRanges()
      document.getSelection()!.addRange(range)
      document.dispatchEvent(new Event('selectionchange'))
    })
    fireEvent.keyDown(screen.getByRole('region', { name: 'Onboarding email' }), { key: 'µ', code: 'KeyM', ctrlKey: true, altKey: true })
    expect(screen.getByRole('textbox', { name: 'Comment on “Invite”' })).toBeInTheDocument()
    expect(document.querySelector('[data-yj-draft]')).toHaveTextContent('Invite')
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Comment on “Invite”' }), { key: 'Escape' })
    expect(screen.queryByRole('textbox', { name: 'Comment on “Invite”' })).not.toBeInTheDocument()
  })

  test('replies and resolves go through the thread, optimistic', async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn()
    setup({ onResolve })
    await user.click(mark('within an hour'))
    await user.click(within(card('t2')).getByRole('button', { name: 'Resolve' }))
    expect(onResolve).toHaveBeenCalledWith('t2', true)
    await waitFor(() => expect(screen.queryByRole('button', { name: 'within an hour' })).not.toBeInTheDocument())
    expect(screen.getByText('1 open · 2 resolved')).toBeInTheDocument()
  })

  test('copy rewrites the strings; the demo is marked and its viewers show', () => {
    const { unmount } = setup({ copy: { showResolved: 'Include resolved', counts: (open: number) => `${open} to do` } })
    expect(screen.getByRole('button', { name: 'Include resolved' })).toBeInTheDocument()
    expect(screen.getByText('2 to do')).toBeInTheDocument()
    unmount()
    reduced(<DocComments />)
    expect(screen.getByText('Demo data')).toHaveAttribute('data-slot', 'demo-marker')
    expect(screen.getByRole('group', { name: /Viewing now/ })).toBeInTheDocument()
  })

  describe('the demo', () => {
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
    afterEach(() => vi.useRealTimers())
    test('someone comments further down, announced; nothing runs after unmount', async () => {
      const { unmount } = reduced(<DocComments />)
      await act(() => vi.advanceTimersByTimeAsync(7500))
      expect(screen.getByRole('button', { name: 'lead with the Team plan’s limits' })).toBeInTheDocument()
      expect(screen.getByText('New comment from Theo Lindqvist.')).toBeInTheDocument()
      unmount()
      await act(() => vi.advanceTimersByTimeAsync(10_000))
    })
  })
})

describe('other worlds', () => {
  test('a lease’s clauses and a lawyer’s thread drive the card', () => {
    const lease: DocCommentsDoc = { title: 'Lease agreement', blocks: [{ id: 'r', text: 'A late fee of 8% applies after five days.' }] }
    const NIKO = { id: 'niko', name: 'Nikolai Petrov', handle: 'nikolai' }
    reduced(
      <DocComments
        doc={lease}
        threads={[
          {
            id: 'l1',
            anchor: { block: 'r', start: 2, end: 16 },
            comments: [{ id: 'l1a', author: NIKO, body: 'State law caps this at 5%.', createdAt: NOW - 60_000 * 10 }],
          },
        ]}
        people={[NIKO]}
        user={NIKO}
        now={NOW}
        copy={{ comments: 'Review notes' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Lease agreement' })).toBeInTheDocument()
    expect(mark('late fee of 8%')).toHaveAccessibleDescription('1 comment from Nikolai Petrov')
    expect(screen.getByRole('list', { name: 'Review notes' })).toBeInTheDocument()
    expect(screen.queryByText('Onboarding email')).not.toBeInTheDocument()
  })
})
