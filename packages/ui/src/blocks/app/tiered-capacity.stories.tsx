import type { Meta, StoryObj } from '@storybook/react-vite'
import { TieredCapacity } from './tiered-capacity'
import { fn } from 'storybook/test'
import { REGIONS } from './tiered-capacity/data'

const meta: Meta<typeof TieredCapacity> = {
  title: 'Blocks/App/Tiered Capacity',
  component: TieredCapacity,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card', preset: 'basalt', address: 'console.orbit.dev/storage/capacity' },
    docs: {
      description: {
        component:
          'Compare how full each region is, tier by tier, as a block of columns: a column climbs its dashed case as it fills, and the panel gives what is used, what is left and when it runs out. Storage, warehouse floors and parking levels read the same way.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof TieredCapacity>

export const Default: Story = { name: 'Storage capacity' }

/** Frankfurt past its ceiling: its column climbs out of its case, which turns danger. */
export const OverLimit: Story = {
  name: 'Over limit',
  args: { regions: REGIONS.map((r) => (r.id === 'fra' ? { ...r, used: { hot: 96, warm: 170, cold: 300 } } : r)) },
}

const pallets = (n: number) => `${new Intl.NumberFormat().format(n)} pallets`

/** Logistics: six warehouse floors, each stacked by how fast its pallets move. Floor 3 is nearly full. */
export const WarehouseFloors: Story = {
  name: 'Warehouse floors',
  args: {
    tiers: [
      { id: 'fast', label: 'Fast-moving', tone: 'chart-4' },
      { id: 'slow', label: 'Slow-moving', tone: 'chart-5' },
      { id: 'bulk', label: 'Bulk', tone: 'chart-2' },
    ],
    format: pallets,
    regions: [
      { id: 'f1', name: 'Floor 1 · Dock', provisioned: 1800, used: { fast: 520, slow: 640, bulk: 380 }, growth: 6 },
      { id: 'f2', name: 'Floor 2 · Pick', provisioned: 2200, used: { fast: 780, slow: 720, bulk: 410 }, growth: 9 },
      { id: 'f3', name: 'Floor 3 · Reserve', provisioned: 2400, used: { fast: 410, slow: 980, bulk: 940 }, growth: 11 },
      { id: 'f4', name: 'Floor 4 · Seasonal', provisioned: 1600, used: { fast: 120, slow: 340, bulk: 660 }, growth: 3 },
      { id: 'f5', name: 'Floor 5 · Returns', provisioned: 900, used: { fast: 90, slow: 240, bulk: 150 }, growth: 2 },
      { id: 'f6', name: 'Floor 6 · Overflow', provisioned: 1200, used: { fast: 60, slow: 180, bulk: 210 }, growth: 1.5 },
    ],
    copy: {
      title: 'Floor space',
      subtitle: (n: number) => `pallet positions · ${n} floors`,
      used: 'Occupied',
      ofProvisioned: (size: string) => `of ${size} racked`,
      table: 'Pallets by floor and speed',
      region: 'Floor',
      regions: 'Floors',
      provisioned: 'Racked',
      legend: 'Speeds',
      addStep: 200,
      addCapacity: 'Add racking',
      adding: 'Ordering',
      added: (size: string, name: string) => `Ordered ${size} of racking for ${name}`,
      rebalance: 'Re-slot',
      updated: 'Counted at 6:00 AM',
    },
  },
}

/** City: four parking levels, stacked by space type. Level 2 is over its ceiling, with cars waiting in the aisles. */
export const ParkingLevels: Story = {
  name: 'Parking levels',
  args: {
    tiers: [
      { id: 'ev', label: 'EV charging', tone: 'chart-1' },
      { id: 'compact', label: 'Compact', tone: 'chart-3' },
      { id: 'standard', label: 'Standard', tone: 'chart-2' },
    ],
    format: (n: number) => `${new Intl.NumberFormat().format(n)} spaces`,
    regions: [
      { id: 'p1', name: 'Level P1', provisioned: 220, used: { ev: 36, compact: 52, standard: 98 }, growth: 0.6 },
      { id: 'p2', name: 'Level P2', provisioned: 220, used: { ev: 44, compact: 61, standard: 124 }, growth: 0.9 },
      { id: 'p3', name: 'Level P3', provisioned: 240, used: { ev: 20, compact: 48, standard: 92 }, growth: 0.3 },
      { id: 'p4', name: 'Level P4 · Roof', provisioned: 160, used: { ev: 8, compact: 22, standard: 60 }, growth: 0.2 },
    ],
    copy: {
      title: 'Garage',
      subtitle: (n: number) => `Civic Center garage · ${n} levels`,
      used: 'Occupied',
      ofProvisioned: (size: string) => `of ${size}`,
      table: 'Occupied spaces by level and type',
      region: 'Level',
      regions: 'Levels',
      provisioned: 'Spaces',
      legend: 'Space types',
      addStep: 20,
      addCapacity: 'Open overflow lot',
      adding: 'Opening',
      added: (size: string, name: string) => `Opened ${size} beside ${name}`,
      rebalance: 'Redirect cars',
      updated: 'Gate counts, 1 min ago',
      allClear: 'Spaces available',
    },
  },
}

/** Skeletons hold the drawing's and the panel's place while the data loads. */
export const Loading: Story = { args: { loading: true } }

/** No regions yet: the empty message in the drawing's place. */
export const Empty: Story = { args: { regions: [] } }

/** The load failed: the message with Retry in the drawing's place. */
export const Error: Story = { args: { error: 'Couldn’t load capacity.', onRetry: fn() } }
