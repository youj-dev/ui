import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { DispatchBoard } from './dispatch-board'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

beforeAll(() => {
  Element.prototype.scrollTo ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
})

const stat = (label: string) => screen.getByRole('group', { name: label })
const queue = () => screen.getByRole('region', { name: 'Dispatch queue' })
const card = (id: string) => within(queue()).getAllByRole('listitem').find((li) => li.textContent?.includes(id))!

describe('DispatchBoard', () => {
  test('heads the board with its KPIs, the queue, the map, the drivers and the agent', () => {
    reduced(<DispatchBoard embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Dispatch' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Today' })).toBeInTheDocument()
    expect(within(card('LD-4821')).getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('group', { name: 'Route of LD-4821' })).toBeInTheDocument()
    expect(screen.getByText('Proposed: LD-4821 → Summit DC', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Driver timeline' })).toBeInTheDocument()
    expect(within(stat('Awaiting you')).getByText('Agent proposals')).toBeInTheDocument()
  })

  test('approving the reroute brings the load back on time, drops the proposed route and counts down', async () => {
    const user = userEvent.setup()
    reduced(<DispatchBoard />)
    const onMap = screen.getByRole('article', { name: 'Reroute via Ridge Rd' })
    await user.click(within(onMap).getByRole('button', { name: 'Approve' }))
    expect(onMap).toHaveAttribute('data-status', 'approved')
    expect(screen.queryByText('Proposed: LD-4821', { exact: false })).toBeNull()
    expect(card('LD-4821')).toHaveTextContent('On time')
    expect(stat('Awaiting you')).toHaveTextContent(/^Awaiting you2/)
    // The agent's own card for it is decided too, and undoing it there puts the proposal back.
    const agent = screen.getByRole('article', { name: 'Reroute LD-4821 via Ridge Rd' })
    expect(agent).toHaveAttribute('data-status', 'approved')
    await user.click(await within(agent).findByRole('button', { name: 'Undo' }))
    expect(onMap).toHaveAttribute('data-status', 'pending')
  })

  test('Review on a proposal draws its load on the map, and the queue filters to unassigned', async () => {
    const user = userEvent.setup()
    reduced(<DispatchBoard />)
    const assign = screen.getByRole('article', { name: 'Assign LD-4957 to Felix Brandt' })
    await user.click(within(assign).getByRole('button', { name: 'Review' }))
    expect(screen.getByRole('group', { name: 'Route of LD-4957' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Unassigned 1' }))
    expect(within(queue()).getAllByRole('listitem')).toHaveLength(1)
    expect(within(card('LD-4957')).getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(assign).getByRole('button', { name: 'Approve' }))
    expect(within(queue()).queryByText('LD-4957')).toBeNull()
  })

  test('the map shows every truck on the road, or only the ones running late', async () => {
    const user = userEvent.setup()
    reduced(<DispatchBoard />)
    const map = screen.getByRole('group', { name: 'Route of LD-4821' })
    const trucks = () => [...map.querySelectorAll('[data-slot=route-map-marker]')].map((el) => el.getAttribute('aria-label')).filter((name) => name?.includes(', Stop'))
    expect(trucks()).toHaveLength(3)
    await user.click(within(map).getByRole('button', { name: 'Running late 2' }))
    expect(trucks()).toEqual([expect.stringContaining('LD-4930 · Bluefin Supply')])
  })

  test('by default, a page of the app’s frame: the shared page header names the board and offers New load, with no main of its own', () => {
    const { container } = reduced(<DispatchBoard />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Dispatch board' }))
    expect(header).toContainElement(screen.getByRole('button', { name: /New load/ }))
    expect(screen.getByRole('region', { name: 'Dispatch queue' })).toBeInTheDocument()
  })

  test('standalone, its title row offers New load', () => {
    reduced(<DispatchBoard embedded={false} />)
    expect(screen.getByRole('button', { name: /New load/ })).toBeInTheDocument()
  })
})
