import { useState, type ReactNode } from 'react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Mock } from 'vitest'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CodeExportDialog, type CodeExportSection } from './code-export-dialog'

/* The site's code modal: a nav of sections beside them where the dialog has
 * the room, a row of tabs over them where it doesn't, following the dialog's
 * own width as it changes. */

/** Every ResizeObserver made, with what it watches, so a test can resize the dialog. */
const observers: { callback: () => void; targets: Element[]; disconnect: Mock<() => void> }[] = []

beforeEach(() => {
  observers.length = 0
  vi.stubGlobal(
    'ResizeObserver',
    class {
      private entry: (typeof observers)[number]
      constructor(callback: () => void) {
        this.entry = { callback, targets: [], disconnect: vi.fn<() => void>() }
        observers.push(this.entry)
      }
      observe(target: Element) {
        this.entry.targets.push(target)
      }
      unobserve() {}
      disconnect() {
        this.entry.disconnect()
      }
    },
  )
})

afterEach(() => vi.unstubAllGlobals())

const sections = (last: 'c' | 'd' = 'c', extra?: ReactNode): CodeExportSection[] => [
  { value: 'a', label: 'Alpha', icon: <svg />, description: 'The first part.', content: <div>{extra ?? 'alpha'}</div> },
  { value: 'b', label: 'Beta', icon: <svg />, content: 'beta' },
  last === 'c' ? { value: 'c', label: 'Gamma', icon: <svg />, content: 'gamma' } : { value: 'd', label: 'Delta', icon: <svg />, content: 'delta' },
]

/** The last section is Gamma or Delta: swapped from inside the first section, or set from outside. */
function Harness({ last: set }: { last?: 'c' | 'd' }) {
  const [own, setLast] = useState<'c' | 'd'>('c')
  const last = set ?? own
  return (
    <YoujProvider reducedMotion="always">
      <CodeExportDialog
        trigger={<button type="button">Code</button>}
        title="Your thing"
        description="As code, in parts."
        navLabel="The code"
        sections={sections(
          last,
          <button type="button" onClick={() => setLast((l) => (l === 'c' ? 'd' : 'c'))}>
            Swap
          </button>,
        )}
      />
    </YoujProvider>
  )
}

async function open() {
  const user = userEvent.setup()
  render(<Harness />)
  await user.click(screen.getByRole('button', { name: 'Code' }))
  const dialog = await screen.findByRole('dialog', { name: 'Your thing' })
  return { user, dialog }
}

/** Gives the dialog's body a width, as a layout would, and tells its observer. */
function resize(dialog: HTMLElement, width: number) {
  const root = within(dialog).getByRole('tablist').closest('[data-slot=tabs]')!.parentElement!
  Object.defineProperty(root, 'offsetWidth', { configurable: true, get: () => width })
  act(() => observers.filter((o) => o.targets.includes(root)).forEach((o) => o.callback()))
  return root
}

test('opens on its first section: a named, described dialog, each section a panel under its own heading', async () => {
  const { dialog } = await open()
  expect(dialog).toHaveAccessibleDescription('As code, in parts.')
  const nav = within(dialog).getByRole('tablist', { name: 'The code' })
  expect(within(nav).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Alpha', 'Beta', 'Gamma'])
  const panel = within(dialog).getByRole('tabpanel', { name: 'Alpha' })
  expect(within(panel).getByRole('heading', { level: 2, name: 'Alpha' })).toBeInTheDocument()
  expect(panel).toHaveTextContent('The first part.')
})

test('with room the nav stands beside the sections (up and down); narrow, it is a row of tabs (left and right), following the dialog as it resizes', async () => {
  const { user, dialog } = await open()
  const nav = () => within(dialog).getByRole('tablist', { name: 'The code' })
  expect(nav()).toHaveAttribute('aria-orientation', 'vertical')
  await user.click(within(dialog).getByRole('tab', { name: 'Alpha' }))
  await user.keyboard('{ArrowDown}')
  expect(within(dialog).getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true')

  resize(dialog, 390)
  // A tab list is horizontal unless it says otherwise.
  expect(nav()).not.toHaveAttribute('aria-orientation', 'vertical')
  // The tab names the section there, so its heading is for assistive technology alone.
  expect(within(dialog).getByRole('heading', { level: 2, name: 'Beta' })).toHaveClass('sr-only')
  await user.click(within(dialog).getByRole('tab', { name: 'Beta' }))
  await user.keyboard('{ArrowRight}')
  expect(within(dialog).getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true')

  resize(dialog, 1000)
  expect(nav()).toHaveAttribute('aria-orientation', 'vertical')
  expect(within(dialog).getByRole('heading', { level: 2, name: 'Gamma' })).not.toHaveClass('sr-only')
})

test('a choice inside a section can change the set: that section stays open, the same element keeps focus', async () => {
  const { user, dialog } = await open()
  const swap = within(dialog).getByRole('button', { name: 'Swap' })
  await user.click(swap)
  expect(within(within(dialog).getByRole('tablist')).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Alpha', 'Beta', 'Delta'])
  expect(within(dialog).getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true')
  expect(swap).toBeInTheDocument()
  expect(swap).toHaveFocus()
})

test('a section that goes while it is open gives way to the first', async () => {
  const user = userEvent.setup()
  const view = render(<Harness last="c" />)
  await user.click(screen.getByRole('button', { name: 'Code' }))
  const dialog = await screen.findByRole('dialog', { name: 'Your thing' })
  await user.click(within(dialog).getByRole('tab', { name: 'Gamma' }))
  expect(within(dialog).getByRole('tabpanel', { name: 'Gamma' })).toHaveTextContent('gamma')
  view.rerender(<Harness last="d" />)
  expect(within(dialog).getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true')
  expect(within(dialog).getByRole('tabpanel', { name: 'Alpha' })).toBeInTheDocument()
})

test('lets go of the dialog’s size when it closes', async () => {
  const { user, dialog } = await open()
  const root = resize(dialog, 1000)
  const watching = observers.filter((o) => o.targets.includes(root))
  expect(watching).toHaveLength(1)
  await user.keyboard('{Escape}')
  await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(watching[0]!.disconnect).toHaveBeenCalled()
})
