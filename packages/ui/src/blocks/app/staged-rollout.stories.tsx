import type { Meta, StoryObj } from '@storybook/react-vite'
import { StagedRollout } from './staged-rollout'

const meta: Meta<typeof StagedRollout> = {
  title: 'Blocks/App/Staged Rollout',
  component: StagedRollout,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Roll something out in stages and watch what it does: the share of an audience per environment, how many that exposes and a watched rate against its guardrail, with a kill switch. Feature flags, price tests and firmware waves read the same.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof StagedRollout>

/** Feature flags per environment: the share of users with each on, and the error rate against its guardrail. */
export const Default: Story = { name: 'Feature flags' }

/** A flag failing its guardrail, in beta: the error rate reads in the warning tone. */
export const Guardrail: Story = { name: 'Failing its guardrail', args: { defaultItem: 'inbox-summaries' } }

/** Staging, where most flags are already on for everyone. */
export const Staging: Story = { args: { defaultEnvironment: 'staging' } }

/** Commerce: price variants shown to a share of visitors per region, with the refund rate against its guardrail. Monthly at $29 is over it. */
export const PriceTest: Story = {
  name: 'Price test',
  args: {
    guardrail: 0.03,
    defaultItem: 'monthly-29',
    environments: [
      { id: 'us', label: 'US', audience: 612_000 },
      { id: 'eu', label: 'EU', audience: 388_000 },
      { id: 'apac', label: 'APAC', audience: 214_000 },
    ],
    stages: [
      { value: 5, label: 'Pilot' },
      { value: 10, label: '10%' },
      { value: 25, label: '25%' },
      { value: 50, label: '50%' },
      { value: 100, label: 'Winner' },
    ],
    items: [
      { key: 'annual-20', name: 'Annual, 20% off', rollout: { us: 25, eu: 10, apac: 5 }, rate: 0.018 },
      { key: 'monthly-19', name: 'Monthly at $19', rollout: { us: 50, eu: 25, apac: 10 }, rate: 0.012 },
      { key: 'monthly-29', name: 'Monthly at $29', rollout: { us: 50, eu: 25, apac: 10 }, rate: 0.034 },
      { key: 'bundle-pro', name: 'Pro bundle at $49', rollout: { us: 10, eu: 5, apac: 0 }, rate: 0.021 },
      { key: 'trial-14', name: '14-day trial', rollout: { us: 100, eu: 100, apac: 50 }, rate: 0.009 },
    ],
    copy: {
      title: 'Price test',
      more: 'More test actions',
      copyKey: 'Copy variant key',
      auditLog: 'View change history',
      environment: 'Region',
      ruler: 'Shown to',
      status: { off: 'Paused', rolling: 'Testing', live: 'Winner', stopped: 'Stopped' },
      exposed: 'Visitors in test',
      rate: 'Refund rate',
      guardrail: (limit: string) => `stop above ${limit}`,
      items: 'Price variants',
      itemCount: (count: number, rolling: number) => `${count} variants · ${rolling} testing`,
      select: (name: string) => `${name}, show its split`,
      stop: 'Stop test',
      stopped: (name: string) => `${name} stopped: back to 0% of visitors`,
      restore: (share: string) => `Resume at ${share}`,
      apply: 'Save split',
      applying: 'Saving…',
      applied: 'Saved',
    },
  },
}

/** Devices: a firmware build waved out to rings of devices, with the crash rate per 1,000 devices against its guardrail. Version 4.2.1 is over it. */
export const FirmwareWave: Story = {
  name: 'Firmware wave',
  args: {
    guardrail: 0.005,
    defaultItem: 'fw-4.2.1',
    environments: [
      { id: 'beta', label: 'Beta', audience: 1_800 },
      { id: 'early', label: 'Early', audience: 24_000 },
      { id: 'all', label: 'Everyone', audience: 412_000 },
    ],
    stages: [
      { value: 1, label: 'Canary' },
      { value: 5, label: 'Pilot' },
      { value: 25, label: '25%' },
      { value: 50, label: '50%' },
      { value: 100, label: 'Fleet' },
    ],
    items: [
      { key: 'fw-4.1.9', name: 'Thermostat 4.1.9', rollout: { beta: 100, early: 100, all: 100 }, rate: 0.0011 },
      { key: 'fw-4.2.0', name: 'Thermostat 4.2.0', rollout: { beta: 100, early: 50, all: 5 }, rate: 0.0031 },
      { key: 'fw-4.2.1', name: 'Thermostat 4.2.1', rollout: { beta: 50, early: 5, all: 0 }, rate: 0.0072 },
      { key: 'hub-2.8.0', name: 'Hub 2.8.0', rollout: { beta: 100, early: 25, all: 1 }, rate: 0.0008 },
      { key: 'sensor-1.3.4', name: 'Door sensor 1.3.4', rollout: { beta: 100, early: 100, all: 50 }, rate: 0.0019 },
    ],
    format: {
      rate: (ratio: number) => `${Math.round(ratio * 10_000) / 10} per 1,000`,
      audience: (count: number) => (count >= 1000 ? `${Math.round(count / 100) / 10}K` : String(count)),
    },
    copy: {
      title: 'Firmware wave',
      more: 'More wave actions',
      copyKey: 'Copy build key',
      auditLog: 'View wave history',
      environment: 'Ring',
      ruler: 'Updated devices',
      status: { off: 'Held', rolling: 'Updating', live: 'All devices', stopped: 'Halted' },
      exposed: 'Devices updated',
      rate: 'Crash rate',
      guardrail: (limit: string) => `halt above ${limit}`,
      items: 'Builds',
      itemCount: (count: number, rolling: number) => `${count} builds · ${rolling} updating`,
      select: (name: string) => `${name}, show its wave`,
      stop: 'Halt wave',
      stopped: (name: string) => `${name} halted: updates rolled back to 0%`,
      restore: (share: string) => `Resume at ${share}`,
      apply: 'Apply wave',
      applying: 'Applying…',
      applied: 'Applied',
    },
  },
}
