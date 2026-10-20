import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ScoreOverview } from './score-overview'

const meta: Meta<typeof ScoreOverview> = {
  title: 'Blocks/App/Score Overview',
  component: ScoreOverview,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Where anything audited stands: a ring of ticks lit up to the score with its letter grade, the score and how it moved, then open findings, resolved, assets and the median fix time. Tabs show open findings by severity over 30 days as a stacked chart, the findings worst first, and the assets they sit on. Security, food safety and accessibility read the same way. Scan now sweeps the ring and counts the assets scanned in the foot; Export report sits beside it.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof ScoreOverview>

/** A fictional company’s last 30 days: a B at 77, up 13, with 13 findings open. */
export const Default: Story = { name: 'Security posture' }

/** A scan the app is running: the sweep circles the ring and the foot counts the assets. */
export const Scanning: Story = { args: { scanning: true, scanned: 7 } }

/** The findings tab, worst first. */
export const Findings: Story = { args: { defaultTab: 'findings' } }

/** Other data: a smaller estate in German, a D that slipped, and the actions in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    score: 52,
    scoreChange: -8,
    now: '2026-10-13T09:00:00Z',
    lastScanAt: '2026-10-13T06:00:00Z',
    stats: { open: 6, urgent: 1, resolved: 3, assets: 9, newAssets: 0, fixDays: 5.5 },
    trend: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.UTC(2026, 8, 14 + i)).toISOString().slice(0, 10),
      counts: {
        critical: i > 20 ? 1 : 0,
        high: 1 + (i > 12 ? 1 : 0),
        medium: 2,
        low: 1 + (i % 9 === 0 ? 1 : 0),
      },
    })),
    findings: [
      { id: 'k1', title: 'Datenbank öffentlich erreichbar', severity: 'critical', asset: 'kunden-db', openedAt: '2026-10-12T21:00:00Z' },
      { id: 'k2', title: 'Kein MFA für Admins', severity: 'high', asset: 'sso', openedAt: '2026-10-10T08:00:00Z' },
      { id: 'k3', title: 'Veraltetes TLS', severity: 'high', asset: 'webshop', openedAt: '2026-10-08T12:00:00Z' },
      { id: 'k4', title: 'Schlüssel ohne Rotation', severity: 'medium', asset: 'zahlungen', openedAt: '2026-10-01T12:00:00Z' },
      { id: 'k5', title: 'Logs nur 7 Tage', severity: 'medium', asset: 'webshop', openedAt: '2026-09-28T12:00:00Z' },
      { id: 'k6', title: 'Fehlendes Owner-Tag', severity: 'low', asset: 'test-vm', openedAt: '2026-09-20T12:00:00Z' },
    ],
    assets: [
      { id: 'b1', name: 'kunden-db', kind: 'Datenbank', findings: { critical: 1, high: 0, medium: 0, low: 0 } },
      { id: 'b2', name: 'webshop', kind: 'Dienst', findings: { critical: 0, high: 1, medium: 1, low: 0 } },
      { id: 'b3', name: 'sso', kind: 'Identität', findings: { critical: 0, high: 1, medium: 0, low: 0 } },
    ],
    copy: {
      title: 'Sicherheitsübersicht',
      subtitle: 'Letzte 30 Tage',
      scan: 'Jetzt prüfen',
      scanning: 'Prüft',
      scanned: 'Geprüft',
      score: 'Sicherheitswert',
      versus: 'ggü. vor 30 Tagen',
      open: 'Offen',
      urgentCount: (n: string) => `${n} kritisch`,
      resolved: 'Behoben',
      inPeriod: 'in 30 Tagen',
      assets: 'Systeme',
      newAssets: (n: string) => `+${n} neu`,
      fixTime: 'Behebung',
      median: 'Median',
      trend: 'Verlauf',
      findings: 'Befunde',
      assetsTab: 'Systeme',
      lastScan: (age: string, total: string) => `Geprüft ${age} · ${total} Systeme`,
      scanningCaption: (done: string, total: string) => `Prüfung · ${done} / ${total} Systeme`,
      scanningAll: (total: string) => `Prüft ${total} Systeme`,
      export: 'Bericht exportieren',
    },
    severities: [
      { id: 'critical', label: 'Kritisch', short: 'Krit', tone: 'danger' },
      { id: 'high', label: 'Hoch', short: 'Hoch', tone: 'warning' },
      { id: 'medium', label: 'Mittel', short: 'Mit', tone: 'muted' },
      { id: 'low', label: 'Niedrig', short: 'Nie', tone: 'subtle' },
    ],
    onScan: fn(),
    onOpenFinding: fn(),
    onExport: fn(),
  },
}

/** Nothing open: the lists say so in the same room. */
export const AllClear: Story = {
  name: 'All clear',
  args: {
    score: 96,
    scoreChange: 4,
    defaultTab: 'findings',
    findings: [],
    assets: [],
    stats: { open: 0, urgent: 0, resolved: 13, assets: 26, newAssets: 0, fixDays: 1.8 },
  },
}

/** A wave around a line from `from` to `to`, a reading a day for 30 days, so the counts read as real. */
const series = (from: number, to: number, swing: number, phase: number) =>
  Array.from({ length: 30 }, (_, i) => Math.max(0, Math.round(from + ((to - from) * i) / 29 + swing * Math.sin(i / 3.2 + phase))))

/** Thirty days of open counts for four severities, ending on `today`. */
function days(ids: [string, string, string, string], from: [number, number, number, number], today: [number, number, number, number]) {
  const lines = ids.map((_, k) => series(from[k]!, today[k]!, k === 0 ? 0.4 : 0.8, k * 1.3))
  return Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.UTC(2026, 8, 14 + i)).toISOString().slice(0, 10),
    counts: Object.fromEntries(ids.map((id, k) => [id, i === 29 ? today[k]! : lines[k]![i]!])),
  }))
}

/** Restaurants: a city's kitchens scored by inspection; an 82 (a B) with two critical violations, both at the food truck and the prep kitchen. */
export const FoodSafetyInspection: Story = {
  name: 'Food safety inspection',
  args: {
    score: 82,
    scoreChange: 6,
    scoreHistory: [74, 74, 75, 74, 76, 76, 77, 77, 78, 77, 78, 79, 79, 80, 79, 80, 80, 81, 80, 81, 81, 82, 81, 82, 82, 81, 82, 82, 82, 82],
    grades: [
      { from: 0, label: 'F', tone: 'danger' },
      { from: 60, label: 'C', tone: 'warning' },
      { from: 75, label: 'B', tone: 'success' },
      { from: 90, label: 'A', tone: 'success' },
    ],
    severities: [
      { id: 'critical', label: 'Critical', short: 'Crit', tone: 'danger' },
      { id: 'major', label: 'Major', short: 'Maj', tone: 'warning' },
      { id: 'minor', label: 'Minor', short: 'Min', tone: 'muted' },
      { id: 'note', label: 'Note', short: 'Note', tone: 'subtle' },
    ],
    stats: { open: 11, urgent: 2, resolved: 17, assets: 8, newAssets: 1, fixDays: 1.5 },
    trend: days(['critical', 'major', 'minor', 'note'], [4, 6, 5, 4], [2, 4, 3, 2]),
    now: '2026-10-13T16:00:00Z',
    lastScanAt: '2026-10-12T22:30:00Z',
    findings: [
      { id: 'v1', title: 'Walk-in cooler holding at 48°F', severity: 'critical', asset: 'Food truck', openedAt: '2026-10-13T09:10:00Z' },
      { id: 'v2', title: 'Raw chicken stored above produce', severity: 'critical', asset: 'Prep kitchen', openedAt: '2026-10-12T14:00:00Z' },
      { id: 'v3', title: 'No sanitizer in the dish station', severity: 'major', asset: 'Main kitchen', openedAt: '2026-10-11T11:30:00Z' },
      { id: 'v4', title: 'Handwash sink blocked by crates', severity: 'major', asset: 'Bakery', openedAt: '2026-10-10T08:45:00Z' },
      { id: 'v5', title: 'Cooked rice cooled too slowly', severity: 'major', asset: 'Catering hub', openedAt: '2026-10-09T17:00:00Z' },
      { id: 'v6', title: 'Pest log missing two weeks', severity: 'major', asset: 'Main kitchen', openedAt: '2026-10-07T10:00:00Z' },
      { id: 'v7', title: 'Allergen sign faded', severity: 'minor', asset: 'Counter cafe', openedAt: '2026-10-06T13:00:00Z' },
      { id: 'v8', title: 'Torn gasket on the reach-in', severity: 'minor', asset: 'Prep kitchen', openedAt: '2026-10-04T09:20:00Z' },
      { id: 'v9', title: 'Dented cans on the shelf', severity: 'minor', asset: 'Bakery', openedAt: '2026-10-02T15:10:00Z' },
      { id: 'v10', title: 'Thermometer needs recalibrating', severity: 'note', asset: 'Counter cafe', openedAt: '2026-09-30T12:00:00Z' },
      { id: 'v11', title: 'Cleaning checklist unsigned', severity: 'note', asset: 'Food truck', openedAt: '2026-09-27T16:40:00Z' },
    ],
    assets: [
      { id: 'k1', name: 'Food truck', kind: 'Mobile', findings: { critical: 1, major: 0, minor: 0, note: 1 } },
      { id: 'k2', name: 'Prep kitchen', kind: 'Commissary', findings: { critical: 1, major: 0, minor: 1, note: 0 } },
      { id: 'k3', name: 'Main kitchen', kind: 'Dine-in', findings: { critical: 0, major: 2, minor: 0, note: 0 } },
      { id: 'k4', name: 'Bakery', kind: 'Retail', findings: { critical: 0, major: 1, minor: 1, note: 0 } },
      { id: 'k5', name: 'Catering hub', kind: 'Catering', findings: { critical: 0, major: 1, minor: 0, note: 0 } },
      { id: 'k6', name: 'Counter cafe', kind: 'Retail', findings: { critical: 0, major: 0, minor: 1, note: 1 } },
    ],
    copy: {
      title: 'Food safety inspection',
      scan: 'Inspect now',
      scanning: 'Inspecting',
      scanned: 'Inspected',
      score: 'Inspection score',
      resolved: 'Corrected',
      assets: 'Kitchens',
      newAssets: (n: string) => `+${n} new`,
      findings: 'Violations',
      assetsTab: 'Kitchens',
      chartTitle: 'Open violations by severity, last 30 days',
      chartSummary: (from: string, to: string) => `Open violations went from ${from} to ${to} over the period.`,
      openFinding: (title: string, asset: string, age: string) => `${title} at ${asset}, open ${age}`,
      assetFindings: (name: string, counts: string) => `${name}: ${counts}`,
      noFindings: 'No open violations',
      noFindingsHint: 'Every violation from the last inspection is corrected.',
      noAssets: 'No kitchens with violations',
      noTrend: 'No inspections yet',
      noTrendHint: 'The trend starts after the first inspection.',
      scanningCaption: (done: string, total: string) => `Inspecting · ${done} / ${total} kitchens`,
      scanningAll: (total: string) => `Inspecting ${total} kitchens`,
      lastScan: (age: string, total: string) => `Inspected ${age} · ${total} kitchens`,
      announceScanned: 'Inspection finished',
    },
    onScan: fn(),
    onOpenFinding: fn(),
    onExport: fn(),
  },
}

/** Web: a site's pages audited for accessibility; a C at 71 with two blockers on checkout and sign-in. */
export const AccessibilityAudit: Story = {
  name: 'Accessibility audit',
  args: {
    score: 71,
    scoreChange: 9,
    scoreHistory: [58, 59, 59, 60, 61, 61, 62, 62, 63, 64, 64, 65, 65, 66, 66, 67, 67, 68, 68, 68, 69, 69, 70, 70, 70, 71, 71, 71, 71, 71],
    grades: [
      { from: 0, label: 'F', tone: 'danger' },
      { from: 50, label: 'D', tone: 'warning' },
      { from: 65, label: 'C', tone: 'warning' },
      { from: 80, label: 'B', tone: 'success' },
      { from: 92, label: 'A', tone: 'success' },
    ],
    severities: [
      { id: 'blocker', label: 'Blocker', short: 'Block', tone: 'danger' },
      { id: 'serious', label: 'Serious', short: 'Seri', tone: 'warning' },
      { id: 'moderate', label: 'Moderate', short: 'Mod', tone: 'muted' },
      { id: 'minor', label: 'Minor', short: 'Min', tone: 'subtle' },
    ],
    stats: { open: 14, urgent: 2, resolved: 31, assets: 48, newAssets: 5, fixDays: 3.2 },
    trend: days(['blocker', 'serious', 'moderate', 'minor'], [5, 9, 8, 6], [2, 4, 4, 4]),
    now: '2026-10-13T14:00:00Z',
    lastScanAt: '2026-10-13T06:00:00Z',
    findings: [
      { id: 'a1', title: 'Card number field has no label', severity: 'blocker', asset: '/checkout', openedAt: '2026-10-13T06:00:00Z' },
      { id: 'a2', title: 'Sign-in error is not announced', severity: 'blocker', asset: '/sign-in', openedAt: '2026-10-11T06:00:00Z' },
      { id: 'a3', title: 'Menu traps keyboard focus', severity: 'serious', asset: '/pricing', openedAt: '2026-10-10T06:00:00Z' },
      { id: 'a4', title: 'Video has no captions', severity: 'serious', asset: '/product', openedAt: '2026-10-08T06:00:00Z' },
      { id: 'a5', title: 'Disabled buttons fail contrast', severity: 'serious', asset: '/pricing', openedAt: '2026-10-07T06:00:00Z' },
      { id: 'a6', title: 'Icon links lack names', severity: 'serious', asset: '/footer', openedAt: '2026-10-05T06:00:00Z' },
      { id: 'a7', title: 'Heading levels skip from 2 to 4', severity: 'moderate', asset: '/blog', openedAt: '2026-10-04T06:00:00Z' },
      { id: 'a8', title: 'Carousel autoplays with no pause', severity: 'moderate', asset: '/home', openedAt: '2026-10-02T06:00:00Z' },
      { id: 'a9', title: 'Table lacks header cells', severity: 'moderate', asset: '/compare', openedAt: '2026-09-30T06:00:00Z' },
      { id: 'a10', title: 'Tap targets under 24 pixels', severity: 'moderate', asset: '/footer', openedAt: '2026-09-28T06:00:00Z' },
      { id: 'a11', title: 'Link text reads "click here"', severity: 'minor', asset: '/blog', openedAt: '2026-09-26T06:00:00Z' },
      { id: 'a12', title: 'Decorative image has alt text', severity: 'minor', asset: '/home', openedAt: '2026-09-24T06:00:00Z' },
      { id: 'a13', title: 'Duplicate page titles', severity: 'minor', asset: '/docs', openedAt: '2026-09-21T06:00:00Z' },
      { id: 'a14', title: 'Language attribute missing', severity: 'minor', asset: '/docs', openedAt: '2026-09-19T06:00:00Z' },
    ],
    assets: [
      { id: 'p1', name: '/checkout', kind: 'Flow', findings: { blocker: 1, serious: 0, moderate: 0, minor: 0 } },
      { id: 'p2', name: '/sign-in', kind: 'Flow', findings: { blocker: 1, serious: 0, moderate: 0, minor: 0 } },
      { id: 'p3', name: '/pricing', kind: 'Marketing', findings: { blocker: 0, serious: 2, moderate: 0, minor: 0 } },
      { id: 'p4', name: '/footer', kind: 'Shared', findings: { blocker: 0, serious: 1, moderate: 1, minor: 0 } },
      { id: 'p5', name: '/blog', kind: 'Content', findings: { blocker: 0, serious: 0, moderate: 1, minor: 1 } },
      { id: 'p6', name: '/docs', kind: 'Content', findings: { blocker: 0, serious: 0, moderate: 0, minor: 2 } },
      { id: 'p7', name: '/home', kind: 'Marketing', findings: { blocker: 0, serious: 0, moderate: 1, minor: 1 } },
      { id: 'p8', name: '/product', kind: 'Marketing', findings: { blocker: 0, serious: 1, moderate: 0, minor: 0 } },
      { id: 'p9', name: '/compare', kind: 'Content', findings: { blocker: 0, serious: 0, moderate: 1, minor: 0 } },
    ],
    copy: {
      title: 'Accessibility audit',
      scan: 'Run audit',
      scanning: 'Auditing',
      scanned: 'Audited',
      score: 'Accessibility score',
      urgentCount: (n: string) => `${n} blockers`,
      resolved: 'Fixed',
      assets: 'Pages',
      findings: 'Issues',
      assetsTab: 'Pages',
      chartTitle: 'Open issues by severity, last 30 days',
      chartSummary: (from: string, to: string) => `Open issues went from ${from} to ${to} over the period.`,
      openFinding: (title: string, asset: string, age: string) => `${title} on ${asset}, open ${age}`,
      noFindings: 'No open issues',
      noFindingsHint: 'Every issue from the last audit is fixed.',
      noAssets: 'No pages with issues',
      noTrend: 'No audits yet',
      noTrendHint: 'The trend starts after the first audit.',
      scanningCaption: (done: string, total: string) => `Auditing · ${done} / ${total} pages`,
      scanningAll: (total: string) => `Auditing ${total} pages`,
      lastScan: (age: string, total: string) => `Audited ${age} · ${total} pages`,
      announceScanned: 'Audit finished',
    },
    onScan: fn(),
    onOpenFinding: fn(),
    onExport: fn(),
  },
}

/** Skeletons hold the score, the figures and the panels while the data loads. */
export const Loading: Story = { args: { loading: true } }

/** The load failed: the figures show a dash and the message with Retry sits over the panels. */
export const Error: Story = { args: { error: 'Couldn’t load the overview.', onRetry: fn() } }

/** Drawn as its own page, with the title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
