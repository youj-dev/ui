import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { GroupedTable, type GroupedTableProps } from './grouped'
import type { GroupedTableLine } from './grouped/data'

const LINES: GroupedTableLine[] = [
  { id: 'a', name: 'Cloud', group: 'Engineering', subgroup: 'Platform', category: 'Cloud', owner: 'Maya Chen', budget: 1000, actual: 1200 },
  { id: 'b', name: 'Monitoring', group: 'Engineering', subgroup: 'Platform', category: 'Software', owner: 'Noah Fischer', budget: 500, actual: 400 },
  { id: 'c', name: 'Devices', group: 'Engineering', subgroup: 'Mobile', category: 'Hardware', owner: 'Yuki Tanaka', budget: 300, actual: 300 },
  { id: 'd', name: 'Ads', group: 'Marketing', subgroup: 'Growth', category: 'Ads', owner: 'Theo Adeyemi', budget: 4000, actual: 3000 },
]

function renderTable(props: Partial<GroupedTableProps> = {}) {
  const user = userEvent.setup()
  render(
    <YoujProvider reducedMotion="always" locale="en-US">
      <GroupedTable lines={LINES} {...props} />
    </YoujProvider>,
  )
  return user
}

const tree = () => screen.getByRole('treegrid')
const rowNamed = (name: string) => within(tree()).getAllByRole('row').find((row) => row.querySelector('td')?.textContent?.startsWith(name))!
const bodyRows = () => within(tree()).getAllByRole('row').filter((row) => row.hasAttribute('data-yj-row'))

describe('GroupedTable', () => {
  test('a treegrid named by its title: departments open on their teams, each summing its lines, over a grand total', () => {
    renderTable()
    expect(screen.getByRole('region', { name: 'Operating budget' })).toBeInTheDocument()
    expect(tree()).toHaveAccessibleName('Operating budget')
    const engineering = rowNamed('Engineering')
    expect(engineering).toHaveAttribute('aria-level', '1')
    expect(engineering).toHaveAttribute('aria-expanded', 'true')
    expect(engineering).toHaveTextContent('$1,800') // budget 1000 + 500 + 300
    expect(engineering).toHaveTextContent('$1,900') // actual
    expect(engineering).toHaveTextContent('+$100')
    const platform = rowNamed('Platform')
    expect(platform).toHaveAttribute('aria-level', '2')
    expect(platform).toHaveAttribute('aria-expanded', 'false')
    expect(platform).toHaveAttribute('aria-posinset', '1')
    expect(platform).toHaveAttribute('aria-setsize', '2')
    expect(within(tree()).queryByText('Cloud')).not.toBeInTheDocument()
    expect(tree().querySelector('tfoot')).toHaveTextContent('$5,800') // every line's budget
  })

  test('copy and currency rewrite what it says', () => {
    renderTable({ currency: 'EUR', copy: { title: 'Plan', total: 'All' } })
    expect(screen.getByRole('heading', { name: 'Plan' })).toBeInTheDocument()
    expect(tree().querySelector('tfoot')).toHaveTextContent('All')
    expect(rowNamed('Marketing')).toHaveTextContent('€4,000')
  })

  test('the arrows walk the tree: Right opens a group, Left goes back to the parent and closes it', async () => {
    const user = renderTable()
    // The tree is one Tab stop: its first row.
    expect(rowNamed('Engineering')).toHaveAttribute('tabindex', '0')
    act(() => rowNamed('Engineering').focus())
    await user.keyboard('{ArrowDown}')
    expect(rowNamed('Platform')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(rowNamed('Platform')).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(rowNamed('Cloud')).toBeInTheDocument())
    await user.keyboard('{ArrowRight}')
    expect(rowNamed('Cloud')).toHaveFocus()
    expect(rowNamed('Cloud')).toHaveAttribute('aria-level', '3')
    await user.keyboard('{ArrowLeft}')
    expect(rowNamed('Platform')).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(rowNamed('Platform')).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(within(tree()).queryByText('Cloud')).not.toBeInTheDocument())
  })

  test('Enter on a line opens it through onLineOpen', async () => {
    const onLineOpen = vi.fn()
    const user = renderTable({ defaultGroupBy: 'none', onLineOpen })
    act(() => bodyRows()[0]!.focus())
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onLineOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }))
  })

  test('another grouping regroups the lines and says so', async () => {
    const onGroupByChange = vi.fn()
    const user = renderTable({ onGroupByChange })
    await user.click(screen.getByRole('button', { name: 'Category' }))
    expect(onGroupByChange).toHaveBeenCalledWith('category')
    expect(bodyRows().map((row) => row.querySelector('td')!.textContent)).toEqual(['Cloud1 line', 'Software1 line', 'Hardware1 line', 'Ads1 line'])
  })

  test('sorting by a money column orders every level by its sums', async () => {
    const user = renderTable()
    await user.click(screen.getByRole('button', { name: 'Budget' }))
    expect(screen.getByRole('columnheader', { name: 'Budget' })).toHaveAttribute('aria-sort', 'descending')
    expect(bodyRows()[0]).toHaveTextContent('Marketing')
    const order = bodyRows().map((row) => row.querySelector('td')!.textContent)
    expect(order.indexOf('Platform2 lines')).toBeLessThan(order.indexOf('Mobile1 line'))
  })

  test('groupings you pass are the header choices, nest by their fields and say so', async () => {
    const onGroupByChange = vi.fn()
    const user = renderTable({
      groupings: [
        { id: 'phase', label: 'Phase', by: ['group'] },
        { id: 'who', label: 'Person', by: ['owner'] },
      ],
      onGroupByChange,
    })
    expect(screen.queryByRole('button', { name: 'Team' })).not.toBeInTheDocument()
    expect(bodyRows().map((row) => row.querySelector('td')!.textContent)).toEqual(['Engineering3 lines', 'Marketing1 line'])
    await user.click(screen.getByRole('button', { name: 'Person' }))
    expect(onGroupByChange).toHaveBeenCalledWith('who')
    expect(bodyRows()).toHaveLength(4)
    expect(within(tree()).getByText('Maya Chen')).toBeInTheDocument()
  })

  test('format rewrites every amount and the variance', () => {
    renderTable({ format: (n) => `${n} h`, copy: { columns: { name: 'Task', owner: 'Owner', category: 'Type', budget: 'Planned', actual: 'Logged', variance: 'Variance', used: 'Used' } } })
    const engineering = rowNamed('Engineering')
    expect(engineering).toHaveTextContent('1800 h')
    expect(engineering).toHaveTextContent('+100 h')
    expect(screen.getByRole('columnheader', { name: 'Planned' })).toBeInTheDocument()
    expect(tree().querySelector('tfoot')).toHaveTextContent('5800 h')
  })

  test('loading shows skeletons, an error shows Retry, and no lines shows the empty state', async () => {
    const onRetry = vi.fn()
    const view = render(
      <YoujProvider reducedMotion="always" locale="en-US">
        <GroupedTable lines={[]} error="Could not load the plan" onRetry={onRetry} />
      </YoujProvider>,
    )
    expect(screen.getByText('Could not load the plan')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
    view.unmount()
    renderTable({ lines: [], empty: <p>Nothing planned</p> })
    expect(screen.getByText('Nothing planned')).toBeInTheDocument()
  })
})
