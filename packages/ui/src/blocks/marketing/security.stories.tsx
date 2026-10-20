import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MarketingSecurity } from './security'

const meta: Meta<typeof MarketingSecurity> = {
  title: 'Blocks/Marketing/Security and trust',
  component: MarketingSecurity,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Answer a security review in one place: live status with a strip of daily uptime, certifications with a report on request, data residency with a map, the practices behind it and the policy documents.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MarketingSecurity>

export const Default: Story = {}

/** A partial outage on the status. */
export const Degraded: Story = {
  args: { status: { state: 'degraded', checkedAt: Date.UTC(2026, 8, 29, 8, 55), uptime: 0.9982, href: '#status' } },
}

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="sr-only">Trust</h1>
      <MarketingSecurity {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { eyebrow: 'Trust', title: 'How Ledgerly keeps your books safe', description: 'The audits, the agreements and the places your numbers live.', certifications: 'Audits and agreements' },
    status: null,
    certifications: [
      { id: 'soc2', name: 'SOC 2 Type II', scope: 'Audited every year since 2024.', status: 'certified', issuer: 'Prescient', validThrough: Date.UTC(2027, 5, 30) },
      { id: 'iso', name: 'ISO 27001', scope: 'Certification in progress.', status: 'in-progress', issuer: 'Audit starts in March' },
    ],
    regions: [
      { id: 'uk', label: 'United Kingdom', location: 'London', lon: -0.1, lat: 51.5, stays: ['Ledgers and backups', 'Bank connection tokens'], global: ['Product analytics, anonymised'] },
      { id: 'de', label: 'Germany', location: 'Frankfurt', lon: 8.7, lat: 50.1, stays: ['Ledgers and backups', 'Bank connection tokens', 'Support access'] },
    ],
    practices: [{ title: 'Bank-grade encryption', description: 'Everything is encrypted at rest and in transit, with keys you can rotate.' }],
    policies: [{ id: 'dpa', title: 'Data processing agreement', description: 'Sign it online in a minute.', updated: Date.UTC(2026, 4, 2), kind: 'PDF', href: '/legal/dpa' }],
    onRequestReport: fn(),
    onRegionChange: fn(),
  },
}
