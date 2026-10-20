import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { AuditLog } from './audit-log'
import type { AuditEvent } from './audit-log/data'

const meta: Meta<typeof AuditLog> = {
  title: 'Blocks/App/Audit log',
  component: AuditLog,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card', preset: 'graphite', address: 'app.northwind.io/settings/audit' },
    docs: {
      description: {
        component:
          'See who changed what in your workspace with a searchable audit log.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AuditLog>

export const Default: Story = { name: 'Workspace audit' }

/** Inside a settings page: a section with an h2, laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  // The host app's content area, full-bleed: the page fills it.
  render: (args) => (
    <main className="min-h-dvh w-full bg-canvas p-6">
      <AuditLog {...args} />
    </main>
  ),
}

/** A clinic's access log: its own events, people and words. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    actors: {
      ana: { id: 'usr_ana', name: 'Dr. Ana Souza', email: 'ana@lumen.health', kind: 'user' },
      ravi: { id: 'usr_ravi', name: 'Ravi Patel', email: 'ravi@lumen.health', kind: 'user' },
      sync: { id: 'key_sync', name: 'lab-sync', email: 'API key · lab', kind: 'api-key' },
    },
    events: [
      { id: 'acc_01', time: '2026-09-30T09:12:00Z', actor: 'ana', action: 'chart.viewed', category: 'records', summary: 'Opened chart for patient 4471', target: 'chart_4471', ip: '10.4.0.12', location: 'Recife, BR', userAgent: 'Edge 141 · Windows', result: 'success' },
      { id: 'acc_02', time: '2026-09-30T08:40:00Z', actor: 'sync', action: 'results.imported', category: 'records', summary: 'Imported 18 lab results', target: 'lab_batch_92', ip: '34.95.10.2', location: 'sa-east-1', userAgent: 'lab-sync/2.1', result: 'success' },
      { id: 'acc_03', time: '2026-09-30T07:55:00Z', actor: 'ravi', action: 'chart.exported', category: 'records', summary: 'Tried to export chart 3902', target: 'chart_3902', ip: '10.4.0.31', location: 'Recife, BR', userAgent: 'Safari 19 · macOS', result: 'denied' },
      { id: 'acc_04', time: '2026-09-29T18:03:00Z', actor: 'ana', action: 'auth.login', category: 'auth', summary: 'Signed in with a security key', target: 'ana@lumen.health', ip: '10.4.0.12', location: 'Recife, BR', userAgent: 'Edge 141 · Windows', result: 'success' },
    ],
    copy: {
      title: 'Access log',
      summary: (events, flagged) => `${events} accesses this week · ${flagged} blocked`,
      retention: 'Kept for 7 years',
    },
    categories: [
      { id: 'records', label: 'Records' },
      { id: 'auth', label: 'Sign-in' },
    ],
    onOpen: fn(),
    onRetry: fn(),
  },
}

const ev = (id: string, time: string, actor: string, action: string, category: string, summary: string, target: string, ip: string, location: string, userAgent: string, result: string): AuditEvent => ({
  id,
  time,
  actor,
  action,
  category,
  summary,
  target,
  ip,
  location,
  userAgent,
  result,
})

/** Health: who opened which chart, with an allowed, blocked or break-glass access, and the review those need. */
export const ClinicRecordsAccess: Story = {
  name: 'Clinic records access',
  args: {
    actors: {
      ana: { id: 'usr_ana', name: 'Dr. Ana Souza', email: 'ana@lumen.health', kind: 'user' },
      ravi: { id: 'usr_ravi', name: 'Ravi Patel', email: 'ravi@lumen.health', kind: 'user' },
      ines: { id: 'usr_ines', name: 'Ines Duarte', email: 'ines@lumen.health', kind: 'user' },
      sync: { id: 'key_sync', name: 'lab-sync', email: 'API key · lab', kind: 'api-key' },
    },
    results: [
      { id: 'allowed', label: 'Allowed', tone: 'success' },
      { id: 'blocked', label: 'Blocked', tone: 'warning', flagged: true },
      { id: 'break-glass', label: 'Override', tone: 'danger', flagged: true },
    ],
    categories: [
      { id: 'charts', label: 'Charts', tone: 'accent' },
      { id: 'orders', label: 'Orders' },
      { id: 'prescriptions', label: 'Meds', tone: 'neutral' },
      { id: 'auth', label: 'Sign-in' },
    ],
    events: [
      ev('acc_11', '2026-09-30T09:12:00Z', 'ana', 'chart.viewed', 'charts', 'Opened the chart of patient 4471', 'chart_4471', '10.4.0.12', 'Recife, BR', 'Edge 141 · Windows', 'allowed'),
      ev('acc_12', '2026-09-30T08:40:00Z', 'sync', 'results.imported', 'orders', 'Imported 18 lab results', 'lab_batch_92', '34.95.10.2', 'sa-east-1', 'lab-sync/2.1', 'allowed'),
      ev('acc_13', '2026-09-30T07:55:00Z', 'ravi', 'chart.exported', 'charts', 'Tried to export the chart of patient 3902', 'chart_3902', '10.4.0.31', 'Recife, BR', 'Safari 19 · macOS', 'blocked'),
      ev('acc_14', '2026-09-29T22:18:00Z', 'ines', 'chart.viewed', 'charts', 'Opened a chart outside her ward in an emergency', 'chart_5120', '10.4.0.44', 'Recife, BR', 'Chrome 141 · Android', 'break-glass'),
      ev('acc_15', '2026-09-29T18:03:00Z', 'ana', 'auth.login', 'auth', 'Signed in with a security key', 'ana@lumen.health', '10.4.0.12', 'Recife, BR', 'Edge 141 · Windows', 'allowed'),
      ev('acc_16', '2026-09-29T16:47:00Z', 'ana', 'prescription.signed', 'prescriptions', 'Signed a prescription for patient 4471', 'rx_88213', '10.4.0.12', 'Recife, BR', 'Edge 141 · Windows', 'allowed'),
      ev('acc_17', '2026-09-29T15:10:00Z', 'ravi', 'prescription.signed', 'prescriptions', 'Tried to sign a controlled prescription', 'rx_88190', '10.4.0.31', 'Recife, BR', 'Safari 19 · macOS', 'blocked'),
      ev('acc_18', '2026-09-29T11:26:00Z', 'ines', 'results.viewed', 'orders', 'Opened the lab results of patient 2210', 'order_7731', '10.4.0.44', 'Recife, BR', 'Chrome 141 · Android', 'allowed'),
    ],
    copy: {
      title: 'Records access',
      summary: (events, flagged) => `${events} accesses this week · ${flagged} to review`,
      retention: 'Kept for 7 years',
      noun: 'accesses',
      tableLabel: 'Records access events',
      searchPlaceholder: 'Search accesses, staff, IPs…',
      exportFilename: 'records-access',
      emptyTitle: 'No accesses yet',
      emptyDescription: 'Every chart opened and every order signed shows up here.',
    },
  },
}

/** Files: sharing, downloads and permission changes in a team drive, with virus-blocked uploads. */
export const SharedDrive: Story = {
  name: 'Shared drive',
  args: {
    actors: {
      mei: { id: 'usr_mei', name: 'Mei Tanaka', email: 'mei@studio.example', kind: 'user' },
      tomas: { id: 'usr_tomas', name: 'Tomás Reyes', email: 'tomas@studio.example', kind: 'user' },
      guest: { id: 'usr_guest', name: 'Guest link', email: 'Anyone with the link', kind: 'system' },
      backup: { id: 'key_backup', name: 'nightly-backup', email: 'API key · backup', kind: 'api-key' },
    },
    results: [
      { id: 'ok', label: 'Done', tone: 'success' },
      { id: 'quarantined', label: 'Held', tone: 'danger', flagged: true },
      { id: 'expired', label: 'Expired', tone: 'neutral', flagged: true },
    ],
    categories: [
      { id: 'sharing', label: 'Sharing', tone: 'accent' },
      { id: 'downloads', label: 'Downloads' },
      { id: 'permissions', label: 'Access', tone: 'neutral' },
      { id: 'uploads', label: 'Uploads' },
    ],
    events: [
      ev('drv_01', '2026-09-30T10:05:00Z', 'mei', 'file.shared', 'sharing', 'Shared “Brand guidelines v4.pdf” with the agency', 'Brand guidelines v4.pdf', '84.17.42.101', 'Berlin, DE', 'Chrome 141 · macOS', 'ok'),
      ev('drv_02', '2026-09-30T09:48:00Z', 'guest', 'link.opened', 'sharing', 'Opened a link that expired yesterday', 'Q3 pitch deck.key', '203.0.113.24', 'Lisbon, PT', 'Safari 19 · iOS', 'expired'),
      ev('drv_03', '2026-09-30T09:20:00Z', 'tomas', 'file.uploaded', 'uploads', 'Uploaded “invoice-scan.zip”, held for a scan', 'invoice-scan.zip', '192.0.2.200', 'Madrid, ES', 'Firefox 143 · Windows', 'quarantined'),
      ev('drv_04', '2026-09-30T08:31:00Z', 'mei', 'folder.permissions', 'permissions', 'Made Contracts view-only for the team', 'Contracts', '84.17.42.101', 'Berlin, DE', 'Chrome 141 · macOS', 'ok'),
      ev('drv_05', '2026-09-29T23:00:00Z', 'backup', 'drive.backed_up', 'downloads', 'Backed up 2,418 files', 'Team drive', '34.120.8.66', 'eu-west-1', 'nightly-backup/1.4', 'ok'),
      ev('drv_06', '2026-09-29T16:42:00Z', 'tomas', 'file.downloaded', 'downloads', 'Downloaded a folder of 64 raw photos', 'Shoot 0929', '192.0.2.200', 'Madrid, ES', 'Firefox 143 · Windows', 'ok'),
      ev('drv_07', '2026-09-29T14:15:00Z', 'mei', 'file.shared', 'sharing', 'Shared “Moodboard” with a client by link', 'Moodboard', '84.17.42.101', 'Berlin, DE', 'Chrome 141 · macOS', 'ok'),
    ],
    copy: {
      title: 'Drive activity',
      summary: (events, flagged) => `${events} actions in the last 2 days · ${flagged} to look at`,
      retention: 'Kept for 90 days',
      noun: 'actions',
      tableLabel: 'Drive activity',
      searchPlaceholder: 'Search files, people, IPs…',
      exportFilename: 'drive-activity',
      emptyTitle: 'No activity yet',
      emptyDescription: 'Shares, uploads and permission changes show up here.',
    },
  },
}
