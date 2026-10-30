import { forwardRef } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { brutal } from '@youj/core'
import { MarketingSecurity } from './security'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const TITLE = 'Your data, your region, your auditors’ questions answered'

describe('Security', () => {
  test('is a labelled section whose sub-sections are headed one level below', () => {
    reduced(<MarketingSecurity />)
    expect(screen.getByRole('region', { name: TITLE })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Certifications', 'Data residency', 'How we protect it', 'Policies and documents'])
    expect(screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)).toEqual(['SOC 2 Type II', 'ISO 27001', 'GDPR', 'HIPAA', 'PCI DSS', 'FedRAMP Moderate'])
  })

  test('the status states its health, the uptime, when it was checked and links to the status page', () => {
    reduced(<MarketingSecurity />)
    expect(screen.getByText('All systems operational')).toBeInTheDocument()
    expect(screen.getByText('99.99% uptime over the last 90 days')).toBeInTheDocument()
    expect(screen.getByText('Checked 2 minutes ago')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View the status page' })).toHaveAttribute('href', '#status')
  })

  test('a degraded status says so', () => {
    reduced(<MarketingSecurity status={{ state: 'degraded', checkedAt: Date.UTC(2026, 8, 29, 8, 0), uptime: 0.998, href: '/status' }} />)
    expect(screen.getByText('Some systems degraded')).toBeInTheDocument()
    expect(screen.getByText('Checked 1 hour ago')).toBeInTheDocument()
  })

  test('certifications say whether they are held, who audited them and when they renew; only held ones can be requested', () => {
    reduced(<MarketingSecurity />)
    const soc2 = screen.getByRole('heading', { name: 'SOC 2 Type II' }).closest('li')!
    expect(within(soc2).getByText('Certified')).toBeInTheDocument()
    expect(within(soc2).getByText(/Audited by Schellman/).closest('p')).toHaveTextContent('Valid through Mar 2027')
    expect(within(soc2).getByRole('button', { name: 'Request the report, SOC 2 Type II' })).toBeInTheDocument()
    const pci = screen.getByRole('heading', { name: 'PCI DSS' }).closest('li')!
    expect(within(pci).getByText('In progress')).toBeInTheDocument()
    expect(within(pci).queryByRole('button')).not.toBeInTheDocument()
  })

  test('requesting a report runs onRequestReport and then marks it requested', async () => {
    const user = userEvent.setup()
    const onRequestReport = vi.fn(() => Promise.resolve())
    reduced(<MarketingSecurity onRequestReport={onRequestReport} />)
    await user.click(screen.getByRole('button', { name: 'Request the report, ISO 27001' }))
    expect(onRequestReport).toHaveBeenCalledWith(expect.objectContaining({ id: 'iso27001' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Request the report, ISO 27001' })).not.toBeInTheDocument(), { timeout: 3000 })
    expect(screen.getAllByText('Requested').length).toBeGreaterThan(0)
  })

  test('picking a region changes what stays and what is processed elsewhere, and follows the map', async () => {
    const user = userEvent.setup()
    const onRegionChange = vi.fn()
    reduced(<MarketingSecurity onRegionChange={onRegionChange} />)
    expect(screen.getByText('Stays in Virginia and Oregon')).toBeInTheDocument()
    await user.click(within(screen.getByRole('group', { name: 'Region' })).getByRole('button', { name: 'Asia Pacific' }))
    expect(onRegionChange).toHaveBeenCalledWith('apac')
    expect(screen.getByText('Stays in Tokyo and Sydney')).toBeInTheDocument()
    expect(screen.getByText('Request logs and traces, for 30 days, to our US region')).toBeInTheDocument()
    expect(screen.queryByText('Support access, by EU staff only')).not.toBeInTheDocument()
  })

  test('a controlled region shows its details', () => {
    reduced(<MarketingSecurity region="eu" />)
    expect(screen.getByText('Stays in Frankfurt and Dublin')).toBeInTheDocument()
    expect(screen.getByText('Support access, by EU staff only')).toBeInTheDocument()
  })

  test('each policy is one link named with its format, dated in the locale, through linkComponent', () => {
    const RouterLink = forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>((props, ref) => <a ref={ref} data-router="" {...props} />)
    reduced(<MarketingSecurity linkComponent={RouterLink} locale="de-DE" />)
    const link = screen.getByRole('link', { name: /^Security whitepaper / })
    expect(link).toHaveAttribute('href', '#whitepaper')
    expect(link).toHaveAttribute('data-router')
    expect(link).toHaveTextContent('Updated 12.08.2026')
  })

  test('any part can be left out with an empty list or null', () => {
    reduced(<MarketingSecurity status={null} certifications={[]} regions={[]} practices={[]} policies={[]} />)
    expect(screen.queryByText('All systems operational')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 4 })).not.toBeInTheDocument()
  })

  test('copy rewrites the strings; headingLevel and rest props apply; embedded and theme', () => {
    reduced(<MarketingSecurity embedded theme={brutal} headingLevel={1} id="trust" copy={{ title: 'Trust', certifications: 'Audits' }} />)
    const section = screen.getByRole('region', { name: 'Trust' })
    expect(section).toHaveAttribute('id', 'trust')
    expect(section.className).not.toMatch(/py-20/)
    expect(section.closest('[data-yj-theme]')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Trust' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Audits' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'SOC 2 Type II' })).toBeInTheDocument()
  })
})
