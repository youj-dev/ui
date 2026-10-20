import type { Meta, StoryObj } from '@storybook/react-vite'
import { Switchover } from './switchover'

const meta: Meta<typeof Switchover> = {
  title: 'Blocks/App/Switchover',
  component: Switchover,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card', preset: 'basalt', address: 'home.lumenpower.app/backup' },
    docs: {
      description: {
        component:
          'Watch a primary source hand over to its backup: it sags and fails its checks, the load moves step by step onto the backup, and you switch back once the primary is steady, with every step on a timeline. A home riding through a power cut, a database failing over, an uplink falling back to mobile.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof Switchover>

/** Steady, as the block renders when added: the grid carries the home. Simulate outage runs the switchover. */
export const Default: Story = { name: 'Home power cut' }

/** The outage runs by itself once the card is on screen (`autoPlay`), from the grid to the battery and solar. */
export const Outage: Story = { args: { autoPlay: true } }

/** Opens mid-switchover, the grid out and the load split evenly, and carries on from there. */
export const MidSwitchover: Story = { name: 'Mid switchover', args: { start: 6 } }

/** The grid is back: Switch back walks the load home. */
export const ReadyToSwitchBack: Story = { name: 'Ready to switch back', args: { start: 10 } }

/** A database failing over: throughput instead of power, no drawing, and every word is the cluster's. */
export const DatabaseFailover: Story = {
  name: 'Database failover',
  args: {
    primary: { id: 'db-eu-1', detail: 'PostgreSQL 16 · primary' },
    backup: { id: 'db-eu-2', detail: 'Streaming replica · 2 ms behind' },
    illustration: null,
    load: 240,
    format: { power: { minimumFractionDigits: 0, maximumFractionDigits: 0 } },
    copy: {
      title: 'Database failover',
      subtitle: (site: string) => `${site} · primary with a streaming replica`,
      site: 'orders-cluster',
      more: 'More cluster actions',
      openSettings: 'Failover settings',
      status: {
        steady: (p: string) => `${p} serving writes`,
        degraded: (p: string) => `${p} lagging`,
        switching: 'Failing over',
        backup: (s: string) => `${s} serving writes`,
        ready: (p: string) => `${p} healthy · ready to fail back`,
        switchingBack: 'Failing back',
      },
      split: 'Queries',
      loadSplit: (primary: string, backup: string) => `${primary} / ${backup} k qps`,
      signal: 'Primary',
      signalValue: (v: string) => `${v}k qps`,
      reserve: 'Replica in sync',
      health: { healthy: 'Online', degraded: 'Lagging', down: 'Down' },
      unit: 'k qps',
      ofLoad: 'of traffic',
      carries: (id: string, kw: string) => `${id} carries ${kw}k qps of the traffic`,
      checks: 'Health checks',
      checksLabel: (id: string, failed: number) =>
        failed ? `${id}: ${failed} of the last health checks failed` : `${id}: all recent health checks passing`,
      stages: { detect: 'Detect', transfer: 'Promote', backup: 'On replica', return: 'Fail back' },
      empty: 'No events yet. Simulate a failure to test the failover.',
      events: {
        degraded: '{p} throughput sagging to 221k\u00a0qps, under the 228k floor',
        check1: '{p} health check failed · 214k\u00a0qps · 1\u00a0of\u00a03',
        check2: '{p} health check failed · replication stalled · 2\u00a0of\u00a03',
        unhealthy: '{p} marked down · failover starts',
        shift75: '{p} 180k\u00a0qps · {s} 60k\u00a0qps',
        shift50: '{p} 120k\u00a0qps · {s} 120k\u00a0qps',
        shift25: '{p} 60k\u00a0qps · {s} 180k\u00a0qps',
        switched: 'All 240k\u00a0qps on {s} · promoted to primary',
        reserve: '{s} in sync at 88% · about 4\u00a0min of log buffered at this rate',
        recovered: '{p} healthy at 240k\u00a0qps · ready to fail back',
        back25: 'Failing back · {p} 60k\u00a0qps · {s} 180k\u00a0qps',
        back50: '{p} 120k\u00a0qps · {s} 120k\u00a0qps',
        back75: '{p} 180k\u00a0qps · {s} 60k\u00a0qps',
        restored: 'Fail back complete · {p} serves writes, {s} replicating',
      },
      started: '{p} failure simulated',
      rule: 'Checked every 10 s · fails over after 3 failures',
      simulate: 'Simulate failure',
      switchBack: 'Fail back',
      switchingBack: 'Failing back…',
      switchedBack: 'On primary',
    },
  },
}

/** A branch office's fiber falling back to a cellular link: megabits, one decimal, no drawing. */
export const NetworkUplink: Story = {
  name: 'Network uplink',
  args: {
    primary: { id: 'Fiber', detail: 'Metro fiber · 1 Gbps link' },
    backup: { id: 'LTE', detail: '5G router · up to 600 Mbps' },
    illustration: null,
    load: 240,
    format: { power: { minimumFractionDigits: 0, maximumFractionDigits: 0 } },
    copy: {
      title: 'Uplink failover',
      subtitle: (site: string) => `${site} · fiber with cellular backup`,
      site: 'Lisbon office',
      more: 'More uplink actions',
      openSettings: 'Uplink settings',
      status: {
        steady: (p: string) => `${p} carrying traffic`,
        degraded: (p: string) => `${p} dropping packets`,
        switching: 'Rerouting',
        backup: (s: string) => `${s} carrying traffic`,
        ready: (p: string) => `${p} back · ready to switch`,
        switchingBack: 'Switching back',
      },
      split: 'Traffic',
      loadSplit: (primary: string, backup: string) => `${primary} / ${backup} Mbps`,
      signal: 'Fiber',
      signalValue: (v: string) => `${v} Mbps`,
      reserve: 'LTE data left',
      health: { healthy: 'Up', degraded: 'Lossy', down: 'Down' },
      unit: 'Mbps',
      ofLoad: 'of traffic',
      carries: (id: string, kw: string) => `${id} carries ${kw} Mbps of the traffic`,
      checks: 'Pings',
      checksLabel: (id: string, failed: number) => (failed ? `${id}: ${failed} of the last pings failed` : `${id}: all recent pings answered`),
      failedOf: (n: number) => `${n} of 3 lost`,
      passing: 'Answered',
      stages: { detect: 'Detect', transfer: 'Reroute', backup: 'On LTE', return: 'Switch back' },
      empty: 'No events yet. Simulate an outage to test the fallback.',
      events: {
        degraded: '{p} link speed sagging to 221\u00a0Mbps, under the 228\u00a0Mbps floor',
        check1: '{p} ping lost · 214\u00a0Mbps · 1\u00a0of\u00a03',
        check2: '{p} ping lost · 12% packet loss · 2\u00a0of\u00a03',
        unhealthy: '{p} marked down · rerouting starts',
        shift75: '{p} 180\u00a0Mbps · {s} 60\u00a0Mbps',
        shift50: '{p} 120\u00a0Mbps · {s} 120\u00a0Mbps',
        shift25: '{p} 60\u00a0Mbps · {s} 180\u00a0Mbps',
        switched: 'All 240\u00a0Mbps on {s} · VoIP and VPN reconnected',
        reserve: '{s} data at 88% · about 9\u00a0days left at this rate',
        recovered: '{p} steady at 240\u00a0Mbps · ready to switch back',
        back25: 'Switching back · {p} 60\u00a0Mbps · {s} 180\u00a0Mbps',
        back50: '{p} 120\u00a0Mbps · {s} 120\u00a0Mbps',
        back75: '{p} 180\u00a0Mbps · {s} 60\u00a0Mbps',
        restored: 'Switch back complete · {p} carries traffic, {s} on standby',
      },
      started: '{p} outage simulated',
      rule: 'Pinged every 10 s · reroutes after 3 losses',
      simulate: 'Simulate outage',
      switchBack: 'Switch back',
      switchingBack: 'Switching back…',
      switchedBack: 'On fiber',
    },
  },
}

/** Drawn as its own page, with the card's title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
