import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { RoutingFlow } from './routing-flow'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const lanes = () => within(screen.getByRole('group', { name: 'Requests by model' })).getAllByRole('listitem')
const figure = () => document.querySelector('[data-slot=stat-value]')!

describe('RoutingFlow', () => {
  test('leads with the blended price of the live policy, as a section with an h2', () => {
    reduced(<RoutingFlow />)
    expect(screen.getByRole('heading', { level: 2, name: 'Model router' })).toBeInTheDocument()
    expect(figure()).toHaveTextContent('$4.03')
    expect(screen.getByText('Blended cost · Same as live')).toBeInTheDocument()
    expect(screen.getByText('312 req/s · p95 1.20 s · 0.46% errors')).toBeInTheDocument()
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  test('the gateway fans out to a lane per model at its share of the traffic, and the routes say the same', () => {
    reduced(<RoutingFlow />)
    expect(screen.getByRole('group', { name: 'Requests by model' })).toHaveAccessibleDescription('Gateway to 4 lanes, 312/s in all.')
    expect(lanes().map((li) => li.getAttribute('aria-label'))).toEqual([
      'Kestrel 3 Pro: 47/s, 15%',
      'Orrery 2: 137/s, 44%',
      'Kestrel 3 Swift: 90/s, 29%',
      'Moth 8B: 37/s, 12%',
    ])
    const rows = within(screen.getByRole('table')).getAllByRole('row')
    expect(rows).toHaveLength(5)
    expect(rows[2]).toHaveTextContent('Orrery 2')
    expect(rows[2]).toHaveTextContent('44%')
    expect(rows[2]).toHaveTextContent('$4.10')
  })

  test('a strategy makes a draft: the split, the price and its change against live move, and Deploy makes it the next version', async () => {
    const user = userEvent.setup()
    const onDeploy = vi.fn()
    const onStrategyChange = vi.fn()
    reduced(<RoutingFlow onDeploy={onDeploy} onStrategyChange={onStrategyChange} />)
    expect(screen.getByRole('button', { name: 'Deploy policy' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Cost' }))
    expect(onStrategyChange).toHaveBeenCalledWith('cost')
    expect(figure()).toHaveTextContent('$2.48')
    expect(screen.getByText('Blended cost · Changed from live')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('Policy v14 · Unsaved changes')).toBeInTheDocument()
    expect(lanes()[2]).toHaveAttribute('aria-label', 'Kestrel 3 Swift: 150/s, 48%')
    await user.click(screen.getByRole('button', { name: 'Deploy policy' }))
    expect(onDeploy).toHaveBeenCalledWith({ version: 15, strategy: 'cost', fallback: { enabled: true, from: 'orrery', to: 'kestrel-pro' } })
    expect(await screen.findByText('Policy v15')).toBeInTheDocument()
    expect(screen.getByText('Blended cost · Same as live')).toBeInTheDocument()
  })

  test('the fallback rule is part of the draft, and Revert drops the draft', async () => {
    const user = userEvent.setup()
    reduced(<RoutingFlow />)
    await user.click(screen.getByRole('switch', { name: 'Fallback' }))
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Model whose failures are retried' })).toHaveAttribute('data-disabled')
    await user.click(screen.getByRole('button', { name: 'Revert' }))
    expect(screen.getByRole('switch', { name: 'Fallback' })).toBeChecked()
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  test('pointing at a route lights its lane', async () => {
    const user = userEvent.setup()
    reduced(<RoutingFlow />)
    await user.hover(within(screen.getByRole('table')).getAllByRole('row')[4]!)
    expect(lanes().map((li) => li.dataset.state)).toEqual(['inactive', 'inactive', 'inactive', 'active'])
  })

  test('your routes, split and words drive the content', () => {
    reduced(
      <RoutingFlow
        throughput={100}
        routes={[
          { id: 'a', name: 'Lumen 4', detail: 'Vela', tone: 'chart-5', cost: 10, time: { typical: 0.7, slow: 1.9 }, failRate: 0.003 },
          { id: 'b', name: 'Wren Mini', detail: 'Vela', tone: 'chart-2', cost: 1, time: { typical: 0.2, slow: 0.5 }, failRate: 0.004 },
        ]}
        shares={{ cost: { a: 1, b: 3 }, balanced: { a: 1, b: 1 }, quality: { a: 3, b: 1 } }}
        policy={{ version: 3, strategy: 'quality', fallback: { enabled: false, from: 'b', to: 'a' } }}
        copy={{ title: 'Router', currency: 'EUR' }}
        locale="de-DE"
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Router' })).toBeInTheDocument()
    expect(figure().textContent?.replace(/\s/g, ' ')).toContain('7,75 €')
    expect(lanes().map((li) => li.getAttribute('aria-label')?.replace(/\s/g, ' '))).toEqual(['Lumen 4: 75/s, 75 %', 'Wren Mini: 25/s, 25 %'])
    expect(screen.getByText('Policy v3')).toBeInTheDocument()
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<RoutingFlow embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Model router' })).toBeInTheDocument()
  })

  test('your strategies drive the switch, the draft and the deploy', async () => {
    const user = userEvent.setup()
    const onDeploy = vi.fn()
    reduced(
      <RoutingFlow
        strategies={[
          { id: 'cheap', label: 'Cheapest' },
          { id: 'safe', label: 'Safest' },
        ]}
        shares={{ cheap: { orrery: 1 }, safe: { 'kestrel-pro': 1 } }}
        policy={{ version: 2, strategy: 'safe', fallback: { enabled: false, from: 'orrery', to: 'moth' } }}
        onDeploy={onDeploy}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Balanced' })).not.toBeInTheDocument()
    expect(figure()).toHaveTextContent('$11.80')
    await user.click(screen.getByRole('button', { name: 'Cheapest' }))
    expect(figure()).toHaveTextContent('$4.10')
    await user.click(screen.getByRole('button', { name: 'Deploy policy' }))
    expect(onDeploy).toHaveBeenCalledWith({ version: 3, strategy: 'cheap', fallback: { enabled: false, from: 'orrery', to: 'moth' } })
  })

  test('formats and failWarnAt rewrite the figures and the warning', () => {
    reduced(
      <RoutingFlow
        formats={{ time: { minimumFractionDigits: 1, maximumFractionDigits: 1 }, rate: { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }, throughput: { style: 'unit', unit: 'kilometer' } }}
        failWarnAt={0.004}
        copy={{ timeUnit: 'h' }}
      />,
    )
    expect(screen.getByText(/^312 km req\/s · p95 1\.2 s · 0\.5% errors/)).toBeInTheDocument()
    const rows = within(screen.getByRole('table')).getAllByRole('row')
    expect(rows[1]).toHaveTextContent('0.9 / 2.3')
    expect(rows[1]!.querySelector('td:last-child')).toHaveClass('text-fg-muted')
    expect(rows[3]!.querySelector('td:last-child')).toHaveClass('text-warning-text')
    expect(rows[3]).toHaveTextContent('0.6%')
  })

  test('loading holds the figures, the flow and the table as skeletons', () => {
    reduced(<RoutingFlow loading />)
    expect(screen.getByText('Loading routes')).toBeInTheDocument()
    expect(document.querySelector('[data-slot=stat-value]')).toBeNull()
    expect(screen.queryByText(/req\/s/)).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Requests by model' })).not.toBeInTheDocument()
    expect(screen.queryByText('Orrery 2')).not.toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot=skeleton]').length).toBeGreaterThan(8)
    expect(screen.getByRole('button', { name: 'Deploy policy' })).toBeDisabled()
  })

  test('with no routes it shows the empty state and dashes', () => {
    reduced(<RoutingFlow routes={[]} />)
    expect(screen.getByText('No routes yet')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Requests by model' })).not.toBeInTheDocument()
    expect(document.querySelector('[data-slot=stat-value]')).toBeNull()
    expect(screen.queryByText('Policy v14')).not.toBeInTheDocument()
  })

  test('your empty node replaces the default message', () => {
    reduced(<RoutingFlow routes={[]} empty={<p>Add a processor</p>} />)
    expect(screen.getByText('Add a processor')).toBeInTheDocument()
    expect(screen.queryByText('No routes yet')).not.toBeInTheDocument()
  })

  test('an error shows its message and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<RoutingFlow error="Couldn’t reach the gateway." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t reach the gateway.')).toBeInTheDocument()
    expect(document.querySelector('[data-slot=stat-value]')).toBeNull()
    expect(screen.queryByText('$4.03')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
