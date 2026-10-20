import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ShipmentDetail } from './shipment-detail'
import { NOW, ROUTE, SHIPMENT } from './shipment-detail/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

beforeAll(() => {
  Element.prototype.scrollTo ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
})

describe('ShipmentDetail', () => {
  test('lays out the route, the vehicle, the agent’s case, the timeline and the record', () => {
    reduced(<ShipmentDetail />)
    expect(screen.getByRole('heading', { level: 1, name: 'Shipment LD-4821' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Harbor DC → Summit DC' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Vehicle readings' })).toBeInTheDocument()
    const route = screen.getByRole('list', { name: 'Route' })
    expect(within(route).getByText('Ridge Rd detour')).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Delivery risk · reroute via Ridge Rd' })).toHaveAttribute('data-status', 'pending')
    expect(screen.getByRole('region', { name: 'Shipment timeline' })).toHaveTextContent('Awaiting dispatcher approval')
    expect(screen.getByRole('region', { name: 'Details' })).toHaveTextContent('Pinecrest Grocers')
  })

  test('by default, a page of the app’s frame: the shared page header holds the title and the actions, with no main of its own', () => {
    const { container } = reduced(<ShipmentDetail />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    const header = container.querySelector('[data-slot=app-page-header]')!
    expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Shipment LD-4821' }))
    expect(header).toContainElement(screen.getAllByRole('button', { name: 'Approve reroute' })[0]!)
    expect(header).toContainElement(screen.getByRole('button', { name: /Call driver/ }))
  })

  test('standalone, it is a main with its own title row', () => {
    reduced(<ShipmentDetail embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Shipment LD-4821' })).toBeInTheDocument()
  })

  test('approving from the title row puts it on time, marks the detour and logs the decision', async () => {
    const user = userEvent.setup()
    reduced(<ShipmentDetail />)
    expect(screen.getByText('At risk')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Approve reroute' })[0]!)
    expect(screen.getByText('On time')).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Route' })).getByText('Ridge Rd · approved')).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Delivery risk · reroute via Ridge Rd' })).toHaveAttribute('data-status', 'approved')
    const timeline = screen.getByRole('region', { name: 'Shipment timeline' })
    expect(timeline).toHaveTextContent('Reroute via Ridge Rd approved')
    expect(timeline).not.toHaveTextContent('Awaiting dispatcher approval')
    // The title row's own approve is gone once it's decided.
    expect(screen.queryAllByRole('button', { name: 'Approve reroute' })).toHaveLength(0)
  })

  test('the timeline reads as of the demo’s 11:58, whatever the clock says', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2027, 0, 1, 9, 0))
    try {
      reduced(<ShipmentDetail />)
      const timeline = screen.getByRole('region', { name: 'Shipment timeline' })
      expect(within(timeline).getByRole('region', { name: 'Today' })).toHaveTextContent('Awaiting dispatcher approval')
      expect(timeline).toHaveTextContent('19 min. ago')
    } finally {
      vi.useRealTimers()
    }
  })

  test('dismissing keeps the plan and drops the detour; the documents are listed', async () => {
    const user = userEvent.setup()
    reduced(<ShipmentDetail />)
    const card = screen.getByRole('article', { name: 'Delivery risk · reroute via Ridge Rd' })
    await user.click(within(card).getByRole('button', { name: 'Dismiss' }))
    await waitFor(() => expect(within(screen.getByRole('list', { name: 'Route' })).queryByText('Ridge Rd detour')).toBeNull())
    expect(screen.getByRole('button', { name: 'Download Bill of lading' })).toBeInTheDocument()
  })

  test('takes your shipment, route, timeline and documents, and calls your handlers', async () => {
    const user = userEvent.setup()
    const onDecisionChange = vi.fn()
    const onDownloadDocument = vi.fn()
    reduced(
      <ShipmentDetail
        shipment={{ ...SHIPMENT, id: 'SH-77', customer: 'Northwind Foods', from: 'Lakeside', to: 'Hillcrest' }}
        route={{ ...ROUTE, road: 'Route 9', detour: { from: 1, to: 3, via: 'Mill Ln' } }}
        events={[{ id: 'x', type: 'pickup', title: 'Picked up at Lakeside', detail: 'Dock 2', time: NOW - 3_600_000 }]}
        documents={[{ id: 'inv', name: 'Invoice', detail: 'Net 30', status: 'filed' }]}
        onDecisionChange={onDecisionChange}
        onDownloadDocument={onDownloadDocument}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Shipment SH-77' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Lakeside → Hillcrest' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Shipment timeline' })).toHaveTextContent('Picked up at Lakeside')
    expect(screen.getByRole('region', { name: 'Details' })).toHaveTextContent('Northwind Foods')
    await user.click(screen.getByRole('button', { name: 'Download Invoice' }))
    expect(onDownloadDocument).toHaveBeenCalledWith(expect.objectContaining({ id: 'inv' }))
    const card = screen.getByRole('article', { name: 'Delivery risk · reroute via Mill Ln' })
    await user.click(within(card).getByRole('button', { name: 'Dismiss' }))
    expect(onDecisionChange).toHaveBeenCalledWith('dismissed')
  })

  test('the decision can be the app’s own', () => {
    reduced(<ShipmentDetail decision="approved" />)
    expect(screen.getByText('On time')).toBeInTheDocument()
  })
})
