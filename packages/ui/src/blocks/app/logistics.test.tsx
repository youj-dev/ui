import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Logistics } from './logistics'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

beforeAll(() => {
  Element.prototype.scrollTo ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
})

describe('Logistics', () => {
  test('heads the page and opens on the fleet, with the dispatch and the shipment a tab away', () => {
    reduced(<Logistics />)
    expect(screen.getByRole('heading', { level: 1, name: 'Logistics' })).toBeInTheDocument()
    const tabs = screen.getByRole('tablist', { name: 'View' })
    expect(within(tabs).getByRole('tab', { name: 'Fleet' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { level: 2, name: 'Fleet' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Fleet map' })).toBeInTheDocument()
  })

  test('switches views and calls onViewChange', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    reduced(<Logistics onViewChange={onViewChange} />)
    await user.click(screen.getByRole('tab', { name: /Dispatch/ }))
    expect(onViewChange).toHaveBeenCalledWith('dispatch')
    expect(screen.getByRole('region', { name: 'Dispatch queue' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Dispatch agent' })).toBeInTheDocument()
  })

  test('opens the at-risk load from Dispatch as its shipment, and one decision shows in both', async () => {
    const user = userEvent.setup()
    reduced(<Logistics defaultView="dispatch" />)
    await user.click(screen.getByRole('button', { name: /Open shipment/ }))
    expect(screen.getByRole('tab', { name: 'Shipment LD-4821' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { level: 2, name: 'Harbor DC → Summit DC' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Approve reroute' }))
    expect(screen.getByRole('region', { name: 'Harbor DC → Summit DC' })).toHaveTextContent('On time')
    await user.click(screen.getByRole('tab', { name: /Dispatch/ }))
    expect(screen.getByRole('article', { name: 'Reroute via Ridge Rd' })).toHaveAttribute('data-status', 'approved')
  })

  test('draws its own page when not embedded', () => {
    reduced(<Logistics embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
