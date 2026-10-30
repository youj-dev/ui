import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ScoreOverview } from './score-overview'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const stat = (name: string) => screen.getByRole('group', { name })

describe('ScoreOverview', () => {
  test('leads with the score as a meter with its grade, as a section with an h2', () => {
    reduced(<ScoreOverview />)
    expect(screen.getByRole('heading', { level: 2, name: 'Security overview' })).toBeInTheDocument()
    const ring = screen.getByRole('meter', { name: 'Security score' })
    expect(ring).toHaveAttribute('aria-valuetext', '77 of 100, grade B')
    expect(stat('Open')).toHaveTextContent('2 critical')
    expect(stat('Resolved')).toHaveTextContent('in 30 days')
    expect(stat('Assets')).toHaveTextContent('+2 new')
    expect(stat('Fix time')).toHaveTextContent('median')
    expect(screen.getByText('Scanned 2h ago · 26 assets')).toBeInTheDocument()
  })

  test('the tabs show the trend, the findings worst first and the assets, in one height', async () => {
    const user = userEvent.setup()
    const onOpenFinding = vi.fn()
    reduced(<ScoreOverview onOpenFinding={onOpenFinding} />)
    expect(screen.getByRole('figure', { name: 'Open findings by severity, last 30 days' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /Findings/ }))
    const findings = within(screen.getByRole('list', { name: 'Findings' })).getAllByRole('button')
    expect(findings).toHaveLength(13)
    expect(findings[0]).toHaveAccessibleName(/, Critical: Admin key older than 400 days on svc-billing, open 30 hours$/)
    expect(findings[12]).toHaveAccessibleName(/, Low: /)
    await user.click(findings[1]!)
    expect(onOpenFinding).toHaveBeenCalledWith(expect.objectContaining({ id: 'f1' }))
    await user.click(screen.getByRole('tab', { name: /Assets/ }))
    const assets = within(screen.getByRole('list', { name: 'Assets' })).getAllByRole('listitem')
    expect(assets).toHaveLength(6)
    expect(assets[0]).toHaveTextContent('invoices-archive: 1 Critical, 1 Medium')
  })

  test('Scan now awaits onScan: the ring sweeps, the foot counts, then it says it finished', async () => {
    const user = userEvent.setup()
    let finish = () => {}
    const onScan = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
    render(
      <YoujProvider reducedMotion="never">
        <ScoreOverview onScan={onScan} />
      </YoujProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Scan now' }))
    expect(onScan).toHaveBeenCalledOnce()
    expect(screen.getByRole('meter', { name: 'Security score' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Scanning 26 assets')).toBeInTheDocument()
    await act(async () => finish())
    expect(screen.getByRole('meter', { name: 'Security score' })).not.toHaveAttribute('aria-busy')
    expect(screen.getByText('Scan finished')).toBeInTheDocument()
  })

  test('a scan the app runs shows its progress', () => {
    reduced(<ScoreOverview scanning scanned={7} />)
    expect(screen.getByText('Scanning · 7 / 26 assets')).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Security score' })).toHaveAttribute('aria-busy', 'true')
  })

  test('your data and words drive the content, and Export awaits onExport', async () => {
    const user = userEvent.setup()
    const onExport = vi.fn()
    const onTabChange = vi.fn()
    reduced(
      <ScoreOverview
        score={52}
        scoreChange={-8}
        now="2026-10-13T09:00:00Z"
        stats={{ open: 1, urgent: 0, resolved: 3, assets: 9, newAssets: 0, fixDays: 5 }}
        trend={[]}
        findings={[{ id: 'x', title: 'Kein MFA', severity: 'high', asset: 'sso', openedAt: '2026-10-10T09:00:00Z' }]}
        assets={[]}
        copy={{ title: 'Sicherheit', open: 'Offen', findings: 'Befunde', export: 'Exportieren' }}
        onExport={onExport}
        onTabChange={onTabChange}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Sicherheit' })).toBeInTheDocument()
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '52 of 100, grade D')
    expect(screen.getByText('No scans yet')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /Befunde/ }))
    expect(onTabChange).toHaveBeenCalledWith('findings')
    expect(screen.getByRole('button', { name: /, High: Kein MFA on sso, open 3 days$/ })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /Assets/ }))
    expect(screen.getByText('No assets at risk')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Exportieren' }))
    expect(onExport).toHaveBeenCalledOnce()
  })

  test('your severities drive the chips, the sort, the asset counts and the chart key', async () => {
    const user = userEvent.setup()
    reduced(
      <ScoreOverview
        severities={[
          { id: 'blocker', label: 'Blocker', short: 'Block', tone: 'danger' },
          { id: 'minor', label: 'Minor', short: 'Min', tone: 'subtle' },
        ]}
        stats={{ open: 2, urgent: 1, resolved: 4, assets: 3, newAssets: 1, fixDays: 2 }}
        trend={[
          { date: '2026-10-12', counts: { blocker: 2, minor: 1 } },
          { date: '2026-10-13', counts: { blocker: 1, minor: 1 } },
        ]}
        findings={[
          { id: 'm', title: 'Heading skips a level', severity: 'minor', asset: '/blog', openedAt: '2026-10-01T09:00:00Z' },
          { id: 'b', title: 'Field has no label', severity: 'blocker', asset: '/checkout', openedAt: '2026-10-12T09:00:00Z' },
        ]}
        assets={[{ id: 'p', name: '/checkout', kind: 'Flow', findings: { blocker: 1, minor: 0 } }]}
        now="2026-10-13T09:00:00Z"
        defaultTab="findings"
      />,
    )
    const rows = within(screen.getByRole('list', { name: 'Findings' })).getAllByRole('button')
    expect(rows[0]).toHaveAccessibleName(/, Blocker: Field has no label on \/checkout, open 24 hours$/)
    expect(rows[0]).toHaveTextContent('Block')
    expect(rows[1]).toHaveTextContent('Min')
    await user.click(screen.getByRole('tab', { name: /Assets/ }))
    expect(within(screen.getByRole('list', { name: 'Assets' })).getAllByRole('listitem')[0]).toHaveTextContent('/checkout: 1 Blocker')
    await user.click(screen.getByRole('tab', { name: 'Trend' }))
    expect(screen.getByRole('figure', { name: 'Open findings by severity, last 30 days' })).toBeInTheDocument()
  })

  test('a stat names the urgent count with your words', () => {
    reduced(
      <ScoreOverview
        stats={{ open: 11, urgent: 2, resolved: 17, assets: 8, newAssets: 1, fixDays: 1.5 }}
        copy={{ urgentCount: (n: string) => `${n} critical violations`, open: 'Open', assets: 'Kitchens' }}
      />,
    )
    expect(stat('Open')).toHaveTextContent('2 critical violations')
    expect(stat('Kitchens')).toHaveTextContent('+1 new')
  })

  test('an error dashes the figures, shows its message and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<ScoreOverview error="Couldn’t load the overview." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the overview.')).toBeInTheDocument()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
    expect(stat('Open')).toHaveTextContent('—')
    expect(screen.queryByText('Scanned 2h ago · 26 assets')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Scan now' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the score, the figures and the panels as skeletons', () => {
    reduced(<ScoreOverview loading />)
    expect(screen.getByText('Loading the overview')).toBeInTheDocument()
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
    expect(stat('Open').querySelector('[data-slot=skeleton]')).not.toBeNull()
    expect(document.querySelectorAll('[data-slot=skeleton]').length).toBeGreaterThan(4)
    expect(screen.queryByText('Scanned 2h ago · 26 assets')).not.toBeInTheDocument()
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<ScoreOverview embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Security overview' })).toBeInTheDocument()
  })
})
