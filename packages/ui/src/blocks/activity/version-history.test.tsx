import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { VersionHistory, type VersionHistoryVersion } from './version-history'
import { diffBlocks, diffProperties, diffText, tokenize, wordCounts } from './version-history/diff'
import { countsOf } from './version-history/use-versions'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const NOW = new Date(2026, 9, 2, 10, 0).getTime()
const MIN = 60_000
const ANA = { id: 'ana', name: 'Ana Ruiz' }
const LEE = { id: 'lee', name: 'Lee Park' }

const versions = (): VersionHistoryVersion[] => [
  {
    id: 'r3',
    createdAt: NOW - 20 * MIN,
    authors: [ANA],
    doc: {
      title: 'Refund policy',
      blocks: [
        { id: 'a', text: 'Ask within 30 days and we refund in full.' },
        { id: 'b', text: 'Refunds take 5 to 10 days.' },
      ],
      properties: { Status: 'Published' },
    },
  },
  {
    id: 'r2',
    createdAt: NOW - 3 * 60 * MIN,
    authors: [LEE],
    name: 'Reviewed by finance',
    doc: { title: 'Refund policy', blocks: [{ id: 'a', text: 'Ask within 14 days and we refund in full.' }], properties: { Status: 'In review' } },
  },
  {
    id: 'r1',
    createdAt: NOW - 26 * 60 * MIN,
    authors: [LEE],
    auto: true,
    doc: { title: 'Refund policy', blocks: [{ id: 'a', text: 'Ask within 14 days.' }], properties: { Status: 'Draft' } },
  },
]
const setup = (props: Partial<React.ComponentProps<typeof VersionHistory>> = {}) =>
  reduced(<VersionHistory versions={versions()} now={NOW} user={ANA} {...props} />)
const list = () => screen.getByRole('listbox', { name: 'Versions' })
const preview = () => document.querySelector('[data-slot=version-preview]') as HTMLElement

describe('the diff', () => {
  test('words, spaces and marks are tokens', () => {
    expect(tokenize('Save 20%, now.')).toEqual(['Save', ' ', '20', '%', ',', ' ', 'now', '.'])
  })
  test('the shortest edit script, a replacement read as one', () => {
    expect(diffText('the old plan', 'a new plan')).toEqual([
      { op: 'delete', text: 'the old' },
      { op: 'insert', text: 'a new' },
      { op: 'equal', text: ' plan' },
    ])
    expect(diffText('Launch on October 21.', 'Launch on October 28, after QA.')).toEqual([
      { op: 'equal', text: 'Launch on October ' },
      { op: 'delete', text: '21' },
      { op: 'insert', text: '28, after QA' },
      { op: 'equal', text: '.' },
    ])
    expect(diffText('same', 'same')).toEqual([{ op: 'equal', text: 'same' }])
  })
  test('words added and removed are counted, not spaces or marks', () => {
    expect(wordCounts(diffText('Save 15% yearly', 'Save 20% every year, billed once'))).toEqual({ added: 5, removed: 2 })
  })
  test('blocks matched by id: new ones inserted, gone ones deleted where they stood', () => {
    const out = diffBlocks(
      [
        { id: 'a', text: 'one' },
        { id: 'b', text: 'two' },
        { id: 'c', text: 'three' },
      ],
      [
        { id: 'a', text: 'one!' },
        { id: 'c', text: 'three' },
        { id: 'd', text: 'four' },
      ],
    )
    expect(out.map((b) => [b.id, b.change])).toEqual([
      ['a', 'changed'],
      ['b', 'deleted'],
      ['c', null],
      ['d', 'inserted'],
    ])
  })
  test('properties that changed, appeared or went', () => {
    expect(diffProperties({ Status: 'Draft', Owner: 'Lee' }, { Status: 'Published', Price: '$9' })).toEqual([
      { key: 'Status', from: 'Draft', to: 'Published' },
      { key: 'Price', from: undefined, to: '$9' },
      { key: 'Owner', from: 'Lee', to: undefined },
    ])
  })
  test('each version’s words against the one before it', () => {
    expect(countsOf(versions()).get('r3')).toEqual({ added: 7, removed: 1 })
  })
})

describe('Version history block', () => {
  test('a listbox of versions by day, the newest shown with its changes marked', () => {
    setup()
    expect(screen.getByRole('heading', { level: 2, name: 'Version history' })).toBeInTheDocument()
    const options = within(list()).getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[0]).toHaveTextContent('Current')
    expect(within(list()).getByRole('group', { name: 'Today' })).toBeInTheDocument()
    expect(within(list()).getByRole('group', { name: 'Yesterday' })).toBeInTheDocument()
    // 30 replaced 14; a paragraph and a status were added or changed.
    expect(within(preview()).getByText('14', { selector: 'del' })).toBeInTheDocument()
    expect(within(preview()).getByText('30', { selector: 'ins' })).toBeInTheDocument()
    expect(within(preview()).getByText('Refunds take 5 to 10 days.', { selector: 'ins' })).toBeInTheDocument()
    expect(within(preview()).getByText('In review', { selector: 'del' })).toBeInTheDocument()
    expect(screen.getByText('3 changes')).toBeInTheDocument()
  })

  test('↑ ↓ in the list pick a version; the restore button wakes for an older one', async () => {
    const user = userEvent.setup()
    const onVersionChange = vi.fn()
    setup({ onVersionChange })
    expect(screen.getByRole('button', { name: 'Restore this version' })).toBeDisabled()
    list().focus()
    await user.keyboard('{ArrowDown}')
    expect(onVersionChange).toHaveBeenCalledWith('r2')
    expect(within(list()).getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')
    expect(list()).toHaveAttribute('aria-activedescendant', within(list()).getAllByRole('option')[1]!.id)
    expect(screen.getByRole('button', { name: 'Restore this version' })).toBeEnabled()
  })

  test('Show changes off shows the version as it read', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('switch', { name: 'Show changes' }))
    expect(preview().querySelector('ins, del')).toBeNull()
    expect(screen.getByText('No changes')).toBeInTheDocument()
  })

  test('Next change walks the changes, focused and announced', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: 'Next change' }))
    expect(screen.getAllByText('Change 1 of 3').length).toBeGreaterThan(0)
    expect(preview().querySelectorAll('[data-yj-change]')[0]).toHaveFocus()
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
    expect(preview().querySelectorAll('[data-yj-change]')[1]).toHaveFocus()
  })

  test('restore asks first, then the version lands on top as the current one', async () => {
    const user = userEvent.setup()
    const onRestore = vi.fn()
    setup({ onRestore, defaultVersion: 'r1' })
    await user.click(screen.getByRole('button', { name: 'Restore this version' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Restore this version?' })
    await user.click(within(dialog).getByRole('button', { name: 'Restore' }))
    expect(onRestore).toHaveBeenCalledWith('r1')
    const options = within(list()).getAllByRole('option')
    expect(options).toHaveLength(4)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[0]).toHaveTextContent(/Restored from/)
  })

  test('a restore the app refuses goes away, saying why', async () => {
    const user = userEvent.setup()
    setup({ defaultVersion: 'r2', onRestore: () => Promise.reject(new Error('Read-only.')) })
    await user.click(screen.getByRole('button', { name: 'Restore this version' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Restore' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Read-only.')
    expect(within(list()).getAllByRole('option')).toHaveLength(3)
  })

  test('a version can be named in place; Named only keeps the named ones', async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    setup({ onRename })
    await user.click(screen.getByRole('button', { name: 'Name this version' }))
    await user.type(screen.getByRole('textbox', { name: 'Name this version' }), 'Live{Enter}')
    expect(onRename).toHaveBeenCalledWith('r3', 'Live')
    await waitFor(() => expect(within(list()).getAllByRole('option')[0]).toHaveTextContent('Live'))
    await user.click(screen.getByRole('switch', { name: 'Named only' }))
    expect(within(list()).getAllByRole('option')).toHaveLength(2)
  })

  test('copy, the demo marker and the states', () => {
    const { unmount } = setup({ copy: { title: 'Article history' } })
    expect(screen.getByRole('heading', { name: 'Article history' })).toBeInTheDocument()
    unmount()
    const demo = reduced(<VersionHistory />)
    expect(screen.getByText('Demo data')).toHaveAttribute('data-slot', 'demo-marker')
    demo.unmount()
    reduced(<VersionHistory versions={[]} />)
    expect(screen.getByText('No versions yet')).toBeInTheDocument()
  })
})

describe('other worlds', () => {
  test('a menu’s dishes and prices are what the diff marks', () => {
    const CHEF = { id: 'chef', name: 'Lucia Ferraro' }
    reduced(
      <VersionHistory
        now={NOW}
        user={CHEF}
        copy={{ title: 'Menu history' }}
        versions={[
          {
            id: 'm2',
            createdAt: NOW - 90 * MIN,
            authors: [CHEF],
            name: 'Autumn menu',
            doc: { title: 'Dinner menu', blocks: [{ id: 'a', text: 'Wild mushroom risotto, $24.' }], properties: { Season: 'Autumn' } },
          },
          {
            id: 'm1',
            createdAt: NOW - 8 * 24 * 60 * MIN,
            authors: [CHEF],
            doc: { title: 'Dinner menu', blocks: [{ id: 'a', text: 'Grilled corn risotto, $22.' }], properties: { Season: 'Summer' } },
          },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Menu history' })).toBeInTheDocument()
    expect(within(list()).getByText('Autumn menu')).toBeInTheDocument()
    expect(preview()).toHaveTextContent('mushroom')
    expect(preview()).toHaveTextContent('Summer')
    expect(preview()).toHaveTextContent('Autumn')
  })
})
