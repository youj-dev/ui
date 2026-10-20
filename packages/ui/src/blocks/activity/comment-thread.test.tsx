import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CommentThread, type CommentThreadItem, type CommentThreadPerson } from './comment-thread'
import { mentionIds, parse, parseInline, peopleByHandle, plainText } from './comment-thread/markdown'
import { matchPeople, mentionAt } from './comment-thread/mentions'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const ADA: CommentThreadPerson = { id: 'ada', name: 'Ada Brennan', handle: 'ada' }
const LUCA: CommentThreadPerson = { id: 'luca', name: 'Luca Moretti', handle: 'luca' }
const SAM: CommentThreadPerson = { id: 'sam', name: 'Sam Okoye', handle: 'sam' }
const PEOPLE = [ADA, LUCA, SAM]
const NOW = Date.UTC(2026, 9, 2, 10, 0)
const MIN = 60_000

const threads = (): CommentThreadItem[] => [
  {
    id: 't1',
    comments: [
      { id: 'c1', author: LUCA, body: 'Export times out above **50k** rows.', createdAt: NOW - 90 * MIN, reactions: [{ emoji: '👀', by: ['sam'] }] },
      { id: 'c2', author: ADA, body: 'The planner skips the index. @sam can you look?', createdAt: NOW - 60 * MIN },
    ],
  },
  {
    id: 't2',
    resolved: { by: SAM, at: NOW - 5 * MIN },
    comments: [{ id: 'c3', author: SAM, body: 'Logos are in the drive.', createdAt: NOW - 30 * MIN }],
  },
]

const setup = (props: Partial<React.ComponentProps<typeof CommentThread>> = {}) =>
  reduced(<CommentThread threads={threads()} people={PEOPLE} user={ADA} now={NOW} {...props} />)
const comment = (id: string) => document.getElementById(`comment-${id}`)!
const composer = () => screen.getByRole('textbox', { name: 'New comment' })
const send = '{Control>}{Enter}{/Control}'

describe('markdown-lite', () => {
  test('bold, italic, strike, code and safe links; anything else stays text', () => {
    expect(parseInline('**b** _i_ ~~s~~ `c`').map((n) => n.type)).toEqual(['strong', 'text', 'em', 'text', 'del', 'text', 'code'])
    expect(parseInline('[docs](https://youj.dev/docs)')).toEqual([
      { type: 'link', href: 'https://youj.dev/docs', children: [{ type: 'text', text: 'docs' }] },
    ])
    // A link to anything but http(s) or mailto keeps its words and loses its target.
    expect(parseInline('[bad](javascript:alert(1))')).toEqual([{ type: 'text', text: 'bad)' }])
    expect(parseInline('see https://example.com/a.')).toEqual([
      { type: 'text', text: 'see ' },
      { type: 'link', href: 'https://example.com/a', children: [{ type: 'text', text: 'https://example.com/a' }] },
      { type: 'text', text: '.' },
    ])
    expect(parseInline('<img src=x onerror=alert(1)>')).toEqual([{ type: 'text', text: '<img src=x onerror=alert(1)>' }])
  })

  test('snake_case, maths and email addresses stay text; a mention needs a boundary', () => {
    expect(parseInline('snake_case_name and 2*3*4')).toEqual([{ type: 'text', text: 'snake_case_name and 2*3*4' }])
    expect(parseInline('mail ada@youj.dev')).toEqual([{ type: 'text', text: 'mail ada@youj.dev' }])
    expect(parseInline('(@ada.)')).toEqual([
      { type: 'text', text: '(' },
      { type: 'mention', handle: 'ada' },
      { type: 'text', text: '.)' },
    ])
  })

  test('paragraphs, line breaks, lists and quotes', () => {
    const blocks = parse('One\ntwo\n\n- a\n- b\n1. first\n> quoted')
    expect(blocks.map((b) => b.type)).toEqual(['p', 'list', 'list', 'quote'])
    expect(blocks[0]).toMatchObject({ children: [{ text: 'One' }, { type: 'break' }, { text: 'two' }] })
    expect(blocks[1]).toMatchObject({ ordered: false, items: [[{ text: 'a' }], [{ text: 'b' }]] })
    expect(blocks[2]).toMatchObject({ ordered: true })
  })

  test('plain text and the people mentioned', () => {
    const people = peopleByHandle(PEOPLE)
    expect(plainText('Hi @sam, **look**', people)).toBe('Hi @Sam Okoye, look')
    expect(mentionIds('@sam and @luca and @sam and @nobody', people)).toEqual(['sam', 'luca'])
  })
})

describe('mentions', () => {
  test('the @ at the caret, never inside a word', () => {
    expect(mentionAt('Hi @sa', 6)).toEqual({ start: 3, query: 'sa' })
    expect(mentionAt('@', 1)).toEqual({ start: 0, query: '' })
    expect(mentionAt('ada@you', 7)).toBeNull()
    expect(mentionAt('Hi @sam done', 12)).toBeNull()
  })

  test('handles first, then names, then the rest; participants lead', () => {
    expect(matchPeople(PEOPLE, 'mo').map((p) => p.id)).toEqual(['luca'])
    expect(matchPeople(PEOPLE, 'o').map((p) => p.id)).toEqual(['sam', 'luca'])
    expect(matchPeople(PEOPLE, '', ['sam']).map((p) => p.id)).toEqual(['sam', 'ada', 'luca'])
  })
})

describe('Comment thread block', () => {
  test('a section named by its h2, with its threads, count and a resolved thread folded to one line', () => {
    setup({ subject: 'Ticket #12' })
    expect(screen.getByRole('region', { name: 'Discussion' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Discussion' })).toBeInTheDocument()
    expect(screen.getByText('Ticket #12 · 3 comments')).toBeInTheDocument()
    expect(within(comment('c1')).getByText('50k').tagName).toBe('STRONG')
    expect(within(comment('c2')).getByText('@Sam Okoye')).toHaveAttribute('data-slot', 'mention')
    const folded = screen.getByRole('button', { name: /Resolved by Sam Okoye/ })
    expect(folded).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById('comment-c3')).toBeNull()
    expect(screen.queryByText('Demo data')).not.toBeInTheDocument()
  })

  test('a comment shows at once while it sends, with its mentions, then settles', async () => {
    const user = userEvent.setup()
    let resolve!: (saved: { id: string }) => void
    const onPost = vi.fn(() => new Promise<{ id: string }>((r) => (resolve = r)))
    setup({ onPost })
    await user.type(composer(), 'Shipping it, @luca {Escape}thanks')
    await user.keyboard(send)
    expect(onPost).toHaveBeenCalledWith({ threadId: null, body: 'Shipping it, @luca thanks', mentions: ['luca'] })
    expect(composer()).toHaveValue('')
    expect(screen.getByText('Sending…')).toBeInTheDocument()
    expect(screen.getByText('4 comments')).toBeInTheDocument()
    await act(async () => resolve({ id: 'saved-1' }))
    expect(screen.queryByText('Sending…')).not.toBeInTheDocument()
    expect(screen.getByText('Comment sent.')).toBeInTheDocument()
  })

  test('a post that fails stays, saying why, with Retry and Discard', async () => {
    const user = userEvent.setup()
    const onPost = vi.fn().mockRejectedValueOnce(new Error('You’re offline.')).mockResolvedValueOnce(undefined)
    setup({ onPost })
    await user.type(composer(), 'Hello')
    await user.keyboard(send)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Couldn’t send. You’re offline.')
    await user.click(within(alert).getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(onPost).toHaveBeenCalledTimes(2)
  })

  test('Discard takes a failed comment away', async () => {
    const user = userEvent.setup()
    setup({ onPost: () => Promise.reject(new Error('Nope.')) })
    await user.type(composer(), 'Never mind')
    await user.keyboard(send)
    await user.click(within(await screen.findByRole('alert')).getByRole('button', { name: 'Discard' }))
    expect(screen.queryByText('Never mind')).not.toBeInTheDocument()
  })

  test('typing @ opens a listbox the field drives; Enter inserts the handle', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(composer(), 'cc @lu')
    const list = screen.getByRole('listbox', { name: 'People' })
    expect(within(list).getAllByRole('option')).toHaveLength(1)
    expect(composer()).toHaveAttribute('aria-controls', list.id)
    expect(composer()).toHaveAttribute('aria-activedescendant', within(list).getByRole('option', { selected: true }).id)
    expect(screen.getByText('1 person found. Up and down to choose, Enter to insert.')).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(composer()).toHaveValue('cc @luca ')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(composer()).not.toHaveAttribute('aria-activedescendant')
  })

  test('↓ moves through the people and Esc closes the list without sending', async () => {
    const user = userEvent.setup()
    const onPost = vi.fn()
    setup({ onPost })
    await user.type(composer(), '@')
    const options = within(screen.getByRole('listbox')).getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowDown}')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(onPost).not.toHaveBeenCalled()
  })

  test('a reaction toggles on and off and is reported', async () => {
    const user = userEvent.setup()
    const onReact = vi.fn()
    setup({ onReact })
    const eyes = within(comment('c1')).getByRole('button', { name: /^Eyes, 1/ })
    expect(eyes).toHaveAttribute('aria-pressed', 'false')
    await user.click(eyes)
    expect(onReact).toHaveBeenLastCalledWith('c1', '👀', true)
    expect(within(comment('c1')).getByRole('button', { name: /^Eyes, 2: you and Sam Okoye/ })).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(comment('c1')).getByRole('button', { name: /^Eyes, 2/ }))
    expect(onReact).toHaveBeenLastCalledWith('c1', '👀', false)
  })

  test('a reaction the app rejects is taken back, with the reason', async () => {
    const user = userEvent.setup()
    setup({ onReact: () => Promise.reject(new Error('Reactions are off here.')) })
    await user.click(within(comment('c1')).getByRole('button', { name: /^Eyes, 1/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Reactions are off here.')
    expect(within(comment('c1')).getByRole('button', { name: /^Eyes, 1/ })).toHaveAttribute('aria-pressed', 'false')
  })

  test('the palette adds a new emoji', async () => {
    const user = userEvent.setup()
    const onReact = vi.fn()
    setup({ onReact })
    await user.click(within(comment('c2')).getAllByRole('button', { name: 'Add reaction' })[0]!)
    await user.click(await screen.findByRole('button', { name: 'Rocket' }))
    expect(onReact).toHaveBeenCalledWith('c2', '🚀', true)
    expect(within(comment('c2')).getByRole('button', { name: /^Rocket, 1: you/ })).toBeInTheDocument()
  })

  test('your own comment edits in place and is marked edited', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    setup({ onEdit })
    expect(within(comment('c1')).getByRole('button', { name: 'More' })).toBeInTheDocument()
    await user.click(within(comment('c2')).getByRole('button', { name: 'More' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))
    const field = screen.getByRole('textbox', { name: 'Edit comment' })
    expect(field).toHaveValue('The planner skips the index. @sam can you look?')
    await user.clear(field)
    await user.type(field, 'Index fixed.')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onEdit).toHaveBeenCalledWith('c2', 'Index fixed.')
    expect(within(comment('c2')).getByText('Index fixed.')).toBeInTheDocument()
    expect(within(comment('c2')).getByText('edited')).toBeInTheDocument()
    await waitFor(() => expect(comment('c2')).toHaveFocus())
  })

  test('only your own comments can be edited or deleted', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(within(comment('c1')).getByRole('button', { name: 'More' }))
    expect(await screen.findByRole('menuitem', { name: 'Copy link' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument()
  })

  test('↑ in the empty composer edits your last comment; Esc cancels', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(composer())
    await user.keyboard('{ArrowUp}')
    const field = screen.getByRole('textbox', { name: 'Edit comment' })
    expect(field).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('textbox', { name: 'Edit comment' })).not.toBeInTheDocument()
  })

  test('delete asks first, then the comment goes', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    setup({ onDelete })
    await user.click(within(comment('c2')).getByRole('button', { name: 'More' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete this comment?' })
    await user.click(within(dialog).getByRole('button', { name: 'Delete comment' }))
    expect(onDelete).toHaveBeenCalledWith('c2')
    await waitFor(() => expect(document.getElementById('comment-c2')).toBeNull())
    expect(screen.getByText('Comment deleted.')).toBeInTheDocument()
  })

  test('resolving folds a thread to one line; opening it shows Reopen', async () => {
    const user = userEvent.setup()
    const onResolve = vi.fn()
    setup({ onResolve })
    const thread = comment('c1').closest('[data-slot=thread]') as HTMLElement
    await user.click(within(thread).getByRole('button', { name: 'Resolve' }))
    expect(onResolve).toHaveBeenCalledWith('t1', true)
    const summary = await screen.findByRole('button', { name: /Resolved by Ada Brennan/ })
    await waitFor(() => expect(document.getElementById('comment-c1')).toBeNull())
    expect(screen.getByText('Thread resolved.')).toBeInTheDocument()
    await user.click(summary)
    await user.click(await within(thread).findByRole('button', { name: 'Reopen' }))
    expect(onResolve).toHaveBeenLastCalledWith('t1', false)
  })

  test('replies past three fold behind "N more replies"; a reply to someone starts with their handle', async () => {
    const user = userEvent.setup()
    const long: CommentThreadItem = {
      id: 'long',
      comments: ['r0', 'r1', 'r2', 'r3', 'r4'].map((id, i) => ({
        id,
        author: i % 2 ? LUCA : SAM,
        body: `Note ${i}`,
        createdAt: NOW - (10 - i) * MIN,
      })),
    }
    reduced(<CommentThread threads={[long]} people={PEOPLE} user={ADA} now={NOW} />)
    expect(document.getElementById('comment-r1')).toBeNull()
    expect(document.getElementById('comment-r3')).not.toBeNull()
    await user.click(screen.getByRole('button', { name: /2 more replies/ }))
    expect(document.getElementById('comment-r1')).not.toBeNull()
    await user.click(within(comment('r3')).getByRole('button', { name: 'Reply' }))
    expect(screen.getByRole('textbox', { name: 'Reply' })).toHaveValue('@luca ')
  })

  test('copy rewrites the strings; the demo is marked, your data isn’t', () => {
    const { unmount } = setup({ copy: { title: 'Notes', newPlaceholder: 'Add a note…' } })
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument()
    expect(composer()).toHaveAttribute('placeholder', 'Add a note…')
    unmount()
    reduced(<CommentThread />)
    expect(screen.getByText('Demo data')).toHaveAttribute('data-slot', 'demo-marker')
    expect(screen.getByText('annual column')).toBeInTheDocument()
  })

  test('loading, error with Retry, and empty', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { rerender } = setup({ loading: true })
    expect(screen.getByRole('status', { name: 'Loading comments…' })).toBeInTheDocument()
    rerender(
      <YoujProvider reducedMotion="always">
        <CommentThread threads={[]} people={PEOPLE} user={ADA} now={NOW} error="The server is down." onRetry={onRetry} />
      </YoujProvider>,
    )
    expect(screen.getByText('The server is down.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
    rerender(
      <YoujProvider reducedMotion="always">
        <CommentThread threads={[]} people={PEOPLE} user={ADA} now={NOW} />
      </YoujProvider>,
    )
    expect(screen.getByText('No comments yet')).toBeInTheDocument()
  })

  test('your new threads replace what settled; a comment in flight stays', async () => {
    const user = userEvent.setup()
    let resolve!: () => void
    const onPost = vi.fn(() => new Promise<void>((r) => (resolve = r)))
    const { rerender } = setup({ onPost })
    await user.type(composer(), 'In flight')
    await user.keyboard(send)
    const next = threads().slice(0, 1)
    rerender(
      <YoujProvider reducedMotion="always">
        <CommentThread threads={next} people={PEOPLE} user={ADA} now={NOW} onPost={onPost} />
      </YoujProvider>,
    )
    expect(screen.getByText('In flight')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Resolved by/ })).not.toBeInTheDocument()
    await act(async () => resolve())
  })

  describe('the demo', () => {
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
    afterEach(() => vi.useRealTimers())

    test('someone types, then replies, announced; nothing runs after unmount', async () => {
      const { unmount } = reduced(<CommentThread />)
      await act(() => vi.advanceTimersByTimeAsync(6500))
      expect(screen.getByText('Mara is typing…')).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(4000))
      expect(document.getElementById('comment-live-1')).not.toBeNull()
      expect(screen.getByText('New reply from Mara Okafor.')).toBeInTheDocument()
      unmount()
      await act(() => vi.advanceTimersByTimeAsync(10_000))
    })
  })
})

describe('other worlds', () => {
  test('a code review’s people, words and copy drive the card', () => {
    const NOOR: CommentThreadPerson = { id: 'noor', name: 'Noor Haddad', handle: 'noor' }
    const KAI: CommentThreadPerson = { id: 'kai', name: 'Kai Brandt', handle: 'kai' }
    reduced(
      <CommentThread
        subject="PR #482 · Stream CSV exports"
        threads={[{ id: 'p', comments: [{ id: 'p1', author: NOOR, body: 'Batch the `flush()` by 500, @kai?', createdAt: NOW - 20 * MIN }] }]}
        people={[NOOR, KAI]}
        user={KAI}
        now={NOW}
        copy={{ title: 'Review', send: 'Comment on change' }}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Review' })).toBeInTheDocument()
    expect(screen.getByText(/PR #482 · Stream CSV exports/)).toBeInTheDocument()
    expect(comment('p1')).toHaveTextContent('Noor Haddad')
    expect(screen.queryByText('Luca Moretti')).not.toBeInTheDocument()
  })
})
