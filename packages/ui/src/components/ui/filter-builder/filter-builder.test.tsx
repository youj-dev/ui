import { act, useState, type ReactElement } from 'react'
import { render as renderPlain, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DEALS, DEAL_FIELDS, NESTED_FILTER } from './filter-builder.fixtures'
import { FilterBuilder } from './filter-builder'
import { describeFilter, matchFilter, type FilterGroup } from './filter-builder-model'

vi.mock('../toast', async (original) => ({ ...(await original<typeof import('../toast')>()), toast: vi.fn() }))
const { toast } = await import('../toast')

// Rows leave at once, so a removal is visible to the next query.
const render = (ui: ReactElement) => renderPlain(ui, { wrapper: ({ children }) => <YoujProvider reducedMotion="always">{children}</YoujProvider> })

const rule = (name: string) => screen.getByRole('group', { name })
/** A rule's token by what it is: "Field", "Operator" or "Value". */
const token = (row: HTMLElement, kind: string) => within(row).getByRole('button', { name: new RegExp(`^${kind}(:|$)`) })
const options = (name: string) =>
  within(screen.getByRole('listbox', { name }))
    .getAllByRole('option')
    .map((o) => o.textContent)
const apply = () => screen.getByRole('button', { name: 'Apply' })
const ONE_RULE: FilterGroup = { type: 'group', combinator: 'and', children: [{ type: 'rule', field: 'name', operator: 'contains', value: 'a' }] }

beforeEach(() => vi.mocked(toast).mockClear())

describe('FilterBuilder', () => {
  test('an empty builder is a named group with Add filter and Add group', () => {
    render(<FilterBuilder fields={DEAL_FIELDS} />)
    const root = screen.getByRole('group', { name: 'Filter' })
    expect(within(root).getByText('No rules yet')).toBeInTheDocument()
    expect(within(root).getByRole('button', { name: 'Add filter' })).toBeInTheDocument()
    expect(within(root).getByRole('button', { name: 'Add group' })).toBeInTheDocument()
  })

  test('a rule reads as tokens that say what they are and hold', () => {
    render(<FilterBuilder fields={DEAL_FIELDS} defaultValue={NESTED_FILTER} />)
    const first = screen.getAllByRole('group', { name: 'Rule 1' })[0]!
    expect(token(first, 'Field')).toHaveAccessibleName('Field: Stage')
    expect(token(first, 'Operator')).toHaveAccessibleName('Operator: is not')
    expect(token(first, 'Value')).toHaveAccessibleName('Value: Lost')
    // The first row starts with Where; the next with the group's and/or.
    expect(screen.getByRole('button', { name: 'Combine rules with: and' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Combine rules with: or' })).toBeInTheDocument()
    expect(screen.getAllByText('Where')).toHaveLength(2)
  })

  test('Add filter opens the new rule’s field menu; picking a field goes on to its value', async () => {
    const user = userEvent.setup()
    render(<FilterBuilder fields={DEAL_FIELDS} />)
    await user.click(screen.getByRole('button', { name: 'Add filter' }))
    await waitFor(() => expect(screen.getByRole('listbox', { name: 'Field' })).toHaveFocus())
    expect(options('Field')).toEqual(DEAL_FIELDS.map((f) => f.label))
    await user.click(screen.getByRole('option', { name: 'Amount' }))
    const value = screen.getByRole('spinbutton', { name: 'Value' })
    await waitFor(() => expect(value).toHaveFocus())
    await user.type(value, '5000{Enter}')
    await waitFor(() => expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument())
    expect(token(rule('Rule 1'), 'Value')).toHaveAccessibleName('Value: 5,000')
    await waitFor(() => expect(token(rule('Rule 1'), 'Value')).toHaveFocus())
  })

  test('offers the operators and value editor that suit the field’s type', async () => {
    const user = userEvent.setup()
    render(<FilterBuilder fields={DEAL_FIELDS} defaultValue={ONE_RULE} />)
    const row = rule('Rule 1')
    const pick = async (kind: string, option: string) => {
      await user.click(token(row, kind))
      await user.click(screen.getByRole('option', { name: option }))
    }
    // Text: contains, and a text field.
    await user.click(token(row, 'Operator'))
    expect(options('Operator')).toEqual(['is', 'is not', 'contains', 'starts with', 'is empty', 'is not empty'])
    await user.keyboard('{Escape}')

    await pick('Field', 'Amount')
    await user.keyboard('{Escape}')
    await pick('Operator', 'is between')
    expect(screen.getByRole('spinbutton', { name: 'From' })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'To' })).toBeInTheDocument()
    await user.keyboard('{Escape}')

    await pick('Field', 'Stage')
    expect(options('Value')).toEqual(['Lead', 'Qualified', 'Proposal', 'Won', 'Lost'])
    await user.click(screen.getByRole('option', { name: 'Won' }))
    expect(token(row, 'Value')).toHaveAccessibleName('Value: Won')

    await pick('Field', 'Close date')
    await user.keyboard('{Escape}')
    await pick('Operator', 'is in the last')
    expect(screen.getByRole('spinbutton', { name: 'Value' })).toBeInTheDocument()
    expect(screen.getByText('days')).toBeInTheDocument()
    await user.keyboard('{Escape}')

    await pick('Field', 'Starred')
    await user.click(token(row, 'Operator'))
    expect(options('Operator')).toEqual(['is yes', 'is no'])
    await user.keyboard('{Escape}')
    expect(within(row).queryByRole('button', { name: /^Value/ })).not.toBeInTheDocument()

    await pick('Field', 'Tags')
    const list = screen.getByRole('listbox', { name: 'Value' })
    expect(list).toHaveAttribute('aria-multiselectable', 'true')
    await user.click(within(list).getByRole('option', { name: 'Enterprise' }))
    await user.click(within(list).getByRole('option', { name: 'Partner' }))
    expect(within(list).getByRole('option', { name: 'Partner' })).toHaveAttribute('aria-selected', 'true')
    expect(token(row, 'Value')).toHaveAccessibleName('Value: Enterprise, Partner')
  })

  test('a long list opens with a field that narrows it', async () => {
    const user = userEvent.setup()
    const many = [...DEAL_FIELDS, { id: 'region', label: 'Region', type: 'text' as const }, { id: 'source', label: 'Source', type: 'text' as const }]
    render(<FilterBuilder fields={many} />)
    await user.click(screen.getByRole('button', { name: 'Add filter' }))
    const search = screen.getByRole('combobox', { name: 'Field' })
    await waitFor(() => expect(search).toHaveFocus())
    await user.type(search, 'so')
    expect(options('Field')).toEqual(['Source'])
    await user.keyboard('{Enter}')
    expect(token(rule('Rule 1'), 'Field')).toHaveAccessibleName('Field: Source')
  })

  test('changing the operator to one without a value removes the value token', async () => {
    const user = userEvent.setup()
    render(<FilterBuilder fields={DEAL_FIELDS} defaultValue={ONE_RULE} />)
    const row = rule('Rule 1')
    await user.click(token(row, 'Operator'))
    await user.click(screen.getByRole('option', { name: 'is empty' }))
    expect(within(row).queryByRole('button', { name: /^Value/ })).not.toBeInTheDocument()
  })

  test('groups nest to maxDepth and no further', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<FilterBuilder fields={DEAL_FIELDS} />)
    await user.click(screen.getByRole('button', { name: 'Add group' }))
    await user.keyboard('{Escape}')
    const inner = screen.getByRole('group', { name: 'Group 1' })
    expect(within(inner).getByRole('group', { name: 'Rule 1' })).toBeInTheDocument()
    // Depth 2 is the default: the inner group offers rules only.
    expect(within(inner).queryByRole('button', { name: 'Add group' })).not.toBeInTheDocument()
    rerender(<FilterBuilder fields={DEAL_FIELDS} maxDepth={3} />)
    await user.click(within(screen.getByRole('group', { name: 'Group 1' })).getByRole('button', { name: 'Add group' }))
    await user.keyboard('{Escape}')
    const deepest = within(screen.getByRole('group', { name: 'Group 1' })).getByRole('group', { name: 'Group 2' })
    expect(within(deepest).queryByRole('button', { name: 'Add group' })).not.toBeInTheDocument()
  })

  test('maxDepth 1 has no Add group at all', () => {
    render(<FilterBuilder fields={DEAL_FIELDS} maxDepth={1} />)
    expect(screen.queryByRole('button', { name: 'Add group' })).not.toBeInTheDocument()
  })

  test('the and/or token switches how its group combines', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<FilterBuilder fields={DEAL_FIELDS} defaultValue={NESTED_FILTER} onValueChange={onValueChange} />)
    const inner = screen.getByRole('group', { name: 'Group 2' })
    await user.click(within(inner).getByRole('button', { name: 'Combine rules with: or' }))
    expect(within(inner).getByRole('button', { name: 'Combine rules with: and' })).toBeInTheDocument()
    expect(inner).toHaveAttribute('data-yj-combinator', 'and')
    await user.click(apply())
    expect((onValueChange.mock.lastCall![0] as FilterGroup).children[1]).toMatchObject({ combinator: 'and' })
  })

  test('edits are a draft until Apply: the hint shows, then Apply reports the filter', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<FilterBuilder fields={DEAL_FIELDS} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Add filter' }))
    await waitFor(() => expect(screen.getByRole('listbox', { name: 'Field' })).toHaveFocus())
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Value' })).toHaveFocus())
    await user.keyboard('renew{Enter}')
    expect(onValueChange).not.toHaveBeenCalled()
    expect(document.querySelector('[data-slot=filter-builder-hint]')).toHaveTextContent('Changes not applied')
    await user.click(apply())
    expect(onValueChange).toHaveBeenCalledTimes(1)
    const applied = onValueChange.mock.lastCall![0] as FilterGroup
    expect(applied.children[0]).toMatchObject({ type: 'rule', field: 'name', operator: 'is', value: 'renew' })
    expect(document.querySelector('[data-slot=filter-builder-hint]')).toHaveTextContent('')
  })

  test('Reset throws the draft away and returns to the applied filter', async () => {
    const user = userEvent.setup()
    render(<FilterBuilder fields={DEAL_FIELDS} defaultValue={NESTED_FILTER} />)
    await user.click(screen.getAllByRole('button', { name: 'Remove Rule 1' })[0]!)
    expect(screen.getAllByRole('group', { name: /^Rule/ })).toHaveLength(2)
    expect(document.querySelector('[data-slot=filter-builder-hint]')).toHaveTextContent('Changes not applied')
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getAllByRole('group', { name: /^Rule/ })).toHaveLength(3)
    expect(document.querySelector('[data-slot=filter-builder-hint]')).toHaveTextContent('')
  })

  test('a controlled value that changes outside starts the draft again', async () => {
    const { rerender } = render(<FilterBuilder fields={DEAL_FIELDS} value={NESTED_FILTER} />)
    expect(screen.getByRole('group', { name: 'Group 2' })).toBeInTheDocument()
    rerender(<FilterBuilder fields={DEAL_FIELDS} value={{ type: 'group', combinator: 'or', children: [] }} />)
    await waitFor(() => expect(screen.queryByRole('group', { name: 'Group 2' })).not.toBeInTheDocument())
    expect(screen.getByText('No rules yet')).toBeInTheDocument()
  })

  test('a rule without its value is flagged once it has been left, and Apply refuses it and focuses it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<FilterBuilder fields={DEAL_FIELDS} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Add filter' }))
    await user.keyboard('{Escape}')
    await waitFor(() => expect(token(rule('Rule 1'), 'Field')).toHaveFocus())
    const value = token(rule('Rule 1'), 'Value')
    // Not flagged while it is new.
    expect(value).not.toHaveAttribute('aria-invalid')
    await user.click(apply())
    expect(onValueChange).not.toHaveBeenCalled()
    expect(value).toHaveAttribute('aria-invalid', 'true')
    expect(value).toHaveAccessibleDescription('Choose a value')
    expect(value).toHaveFocus()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Value' })).toHaveFocus())
    await user.keyboard('x{Enter}')
    expect(token(rule('Rule 1'), 'Value')).not.toHaveAttribute('aria-invalid')
    await user.click(apply())
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  test('remove focuses the next row, else the previous, else Add filter', async () => {
    const user = userEvent.setup()
    const three: FilterGroup = {
      type: 'group',
      combinator: 'and',
      children: ['Ada', 'Grace', 'Linus'].map((value) => ({ type: 'rule', field: 'owner', operator: 'is', value })),
    }
    render(<FilterBuilder fields={DEAL_FIELDS} defaultValue={three} />)
    await user.click(screen.getByRole('button', { name: 'Remove Rule 2' }))
    await waitFor(() => expect(token(rule('Rule 2'), 'Field')).toHaveFocus())
    expect(token(rule('Rule 2'), 'Value')).toHaveAccessibleName('Value: Linus')
    await user.click(screen.getByRole('button', { name: 'Remove Rule 2' }))
    await waitFor(() => expect(token(rule('Rule 1'), 'Field')).toHaveFocus())
    await user.click(screen.getByRole('button', { name: 'Remove Rule 1' }))
    expect(screen.getByRole('button', { name: 'Add filter' })).toHaveFocus()
  })

  test('Delete or Backspace on a token removes its rule, and the toast’s Undo puts it back', async () => {
    const user = userEvent.setup()
    render(<FilterBuilder fields={DEAL_FIELDS} defaultValue={NESTED_FILTER} />)
    const outer = () => screen.getAllByRole('group', { name: 'Rule 1' })[0]!
    token(outer(), 'Operator').focus()
    await user.keyboard('{Delete}')
    expect(screen.getAllByRole('group', { name: /^Rule/ })).toHaveLength(2)
    expect(toast).toHaveBeenCalledWith('Removed Rule 1', expect.objectContaining({ action: expect.objectContaining({ label: 'Undo' }) }))
    act(() => vi.mocked(toast).mock.lastCall![1]!.action!.onClick())
    expect(screen.getAllByRole('group', { name: /^Rule/ })).toHaveLength(3)
    expect(token(outer(), 'Field')).toHaveAccessibleName('Field: Stage')
    await waitFor(() => expect(token(outer(), 'Field')).toHaveFocus())
    expect(document.querySelector('[data-slot=filter-builder-hint]')).toHaveTextContent('')
    await user.keyboard('{Backspace}')
    expect(screen.getAllByRole('group', { name: /^Rule/ })).toHaveLength(2)
  })

  test('a group’s menu duplicates it, ungroups it or removes it', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<FilterBuilder fields={DEAL_FIELDS} defaultValue={NESTED_FILTER} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Group 2 actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Duplicate Group 2' }))
    expect(screen.getAllByRole('group', { name: /^Group \d$/ })).toHaveLength(2)
    expect(within(screen.getByRole('group', { name: 'Group 3' })).getAllByRole('group', { name: /^Rule/ })).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Group 3 actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Ungroup' }))
    expect(screen.queryByRole('group', { name: 'Group 3' })).not.toBeInTheDocument()
    await user.click(apply())
    const applied = onValueChange.mock.lastCall![0] as FilterGroup
    expect(applied.children.map((c) => c.type)).toEqual(['rule', 'group', 'rule', 'rule'])
    await user.click(screen.getByRole('button', { name: 'Group 2 actions' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Remove Group 2' }))
    expect(screen.queryByRole('group', { name: /^Group/ })).not.toBeInTheDocument()
  })

  test('announces additions, removals, Apply and Reset', async () => {
    const user = userEvent.setup()
    render(<FilterBuilder fields={DEAL_FIELDS} />)
    const live = () =>
      screen
        .getAllByRole('status')
        .map((s) => s.textContent)
        .join('|')
    await user.click(screen.getByRole('button', { name: 'Add filter' }))
    expect(live()).toContain('Added Rule 1')
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Remove Rule 1' }))
    expect(live()).toContain('Removed Rule 1')
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(live()).toContain('Changes discarded')
    await user.click(apply())
    expect(live()).toContain('Filter applied')
  })

  test('the summary writes the applied filter as a sentence and switches to chips', async () => {
    const user = userEvent.setup()
    render(<FilterBuilder fields={DEAL_FIELDS} defaultValue={NESTED_FILTER} />)
    const summary = screen.getByRole('group', { name: 'Summary' })
    expect(within(summary).getByText('Stage is not Lost and (Owner is Ada or Amount > 100000)')).toBeInTheDocument()
    await user.click(within(summary).getByRole('button', { name: 'Show as chips' }))
    const chips = within(summary).getByRole('list', { name: 'Summary' })
    expect([...chips.querySelectorAll('[data-slot=filter-builder-chip]')].map((c) => c.textContent)).toEqual([
      'Stage is not Lost',
      '(Owner is Ada or Amount > 100000)',
    ])
    await user.click(within(summary).getByRole('button', { name: 'Show as sentence' }))
    expect(within(summary).getByText(/^Stage is not Lost and/)).toBeInTheDocument()
  })

  test('the summary follows the applied filter, not the draft, and can be left out', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<FilterBuilder fields={DEAL_FIELDS} />)
    expect(within(screen.getByRole('group', { name: 'Summary' })).getByText('No filter applied')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add filter' }))
    await user.click(screen.getByRole('option', { name: 'Starred' }))
    expect(screen.getByText('No filter applied')).toBeInTheDocument()
    await user.click(apply())
    expect(screen.getByText('Starred is yes')).toBeInTheDocument()
    rerender(<FilterBuilder fields={DEAL_FIELDS} summary={false} />)
    expect(screen.queryByRole('group', { name: 'Summary' })).not.toBeInTheDocument()
  })

  test('wired to a list, the applied filter narrows the rows', async () => {
    const user = userEvent.setup()
    function Deals() {
      const [filter, setFilter] = useState<FilterGroup>({ type: 'group', combinator: 'and', children: [] })
      return (
        <>
          <FilterBuilder fields={DEAL_FIELDS} value={filter} onValueChange={setFilter} summary={false} />
          <output>{DEALS.filter((deal) => matchFilter(deal, filter)).length} deals</output>
        </>
      )
    }
    render(<Deals />)
    expect(screen.getByText('6 deals')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add filter' }))
    await user.click(screen.getByRole('option', { name: 'Owner' }))
    await user.click(screen.getByRole('option', { name: 'Ada' }))
    expect(screen.getByText('6 deals')).toBeInTheDocument()
    await user.click(apply())
    expect(screen.getByText('2 deals')).toBeInTheDocument()
  })

  test('is operable from the keyboard alone', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<FilterBuilder fields={DEAL_FIELDS} onValueChange={onValueChange} summary={false} />)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Add filter' })).toHaveFocus()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('listbox', { name: 'Field' })).toHaveFocus())
    // A letter jumps to Owner; Enter picks it and opens its values.
    await user.keyboard('o{Enter}')
    await waitFor(() => expect(screen.getByRole('listbox', { name: 'Value' })).toHaveFocus())
    await user.keyboard('{ArrowDown}{Enter}')
    expect(token(rule('Rule 1'), 'Value')).toHaveAccessibleName('Value: Grace')
    await waitFor(() => expect(token(rule('Rule 1'), 'Value')).toHaveFocus())
    // ArrowDown on a token opens it too.
    await user.keyboard('{Shift>}{Tab}{/Shift}{ArrowDown}')
    await waitFor(() => expect(screen.getByRole('listbox', { name: 'Operator' })).toHaveFocus())
    await user.keyboard('{Escape}')
    await waitFor(() => expect(token(rule('Rule 1'), 'Operator')).toHaveFocus())
    await user.keyboard('{Tab}{Tab}{Tab}{Tab}{Tab}')
    expect(screen.getByRole('button', { name: 'Reset' })).toHaveFocus()
    await user.keyboard('{Tab}{Enter}')
    expect(onValueChange).toHaveBeenCalledWith(expect.objectContaining({ children: [expect.objectContaining({ field: 'owner', value: 'Grace' })] }))
  })

  test('the words come from the provider’s labels', () => {
    render(
      <YoujProvider labels={{ filterAddRule: 'Regel hinzufügen', filterApply: 'Anwenden', filterOpContains: 'enthält', filterWhere: 'Wo' }}>
        <FilterBuilder fields={DEAL_FIELDS} defaultValue={ONE_RULE} />
      </YoujProvider>,
    )
    expect(screen.getByRole('button', { name: 'Regel hinzufügen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anwenden' })).toBeInTheDocument()
    expect(screen.getByText('Wo')).toBeInTheDocument()
    expect(screen.getByText('Deal enthält a')).toBeInTheDocument()
  })

  test('disabled stops every control', () => {
    render(<FilterBuilder fields={DEAL_FIELDS} defaultValue={NESTED_FILTER} disabled />)
    const root = screen.getByRole('group', { name: 'Filter' })
    for (const control of within(root).getAllByRole('button')) {
      expect(
        control.hasAttribute('disabled') || control.hasAttribute('data-disabled') || control.getAttribute('aria-disabled') === 'true',
        control.outerHTML.slice(0, 120),
      ).toBe(true)
    }
  })

  test('describeFilter and the summary agree', () => {
    render(<FilterBuilder fields={DEAL_FIELDS} defaultValue={NESTED_FILTER} />)
    expect(screen.getByText(describeFilter(NESTED_FILTER, DEAL_FIELDS))).toBeInTheDocument()
  })
})
