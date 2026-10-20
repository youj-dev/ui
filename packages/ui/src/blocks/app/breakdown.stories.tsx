import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Breakdown, type BreakdownItem } from './breakdown'

const meta: Meta<typeof Breakdown> = {
  title: 'Blocks/App/Breakdown',
  component: Breakdown,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'How a total splits: a ring beside a ranked bar list, the long tail folded into Other. Press a part to zoom the ring into it and see its own parts; the breadcrumb or Escape goes back up.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Breakdown>

export const Default: Story = {}

/** Opened on Europe: nine countries, the smallest four folded into Other. */
export const DrilledIn: Story = { name: 'Drilled in', args: { defaultPath: ['eu'] } }

export const Loading: Story = { args: { loading: true } }

export const LoadError: Story = { name: 'Error', args: { error: "The breakdown couldn't be loaded.", onRetry: fn() } }

export const Empty: Story = { args: { items: [] } }

/* Storage by team and project, in terabytes, with each project a last-level part the app opens. */
const STORAGE: BreakdownItem[] = [
  {
    id: 'ml',
    label: 'Machine learning',
    value: 8.42,
    previous: 7.1,
    children: [
      { id: 'checkpoints', label: 'Model checkpoints', value: 5.9, previous: 4.8 },
      { id: 'datasets', label: 'Training datasets', value: 2.1, previous: 1.95 },
      { id: 'eval', label: 'Eval runs', value: 0.42, previous: 0.35 },
    ],
  },
  {
    id: 'media',
    label: 'Media',
    value: 3.96,
    previous: 3.88,
    children: [
      { id: 'video', label: 'Video masters', value: 3.1, previous: 3.05 },
      { id: 'images', label: 'Image library', value: 0.86, previous: 0.83 },
    ],
  },
  { id: 'logs', label: 'Logs', value: 1.24, previous: 1.61 },
  { id: 'backups', label: 'Backups', value: 0.98, previous: 0.96 },
]

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    items: STORAGE,
    format: { style: 'unit', unit: 'terabyte', unitDisplay: 'short', maximumFractionDigits: 1 },
    copy: { title: 'Storage by team', description: 'Object storage this month', all: 'All teams', total: 'Stored' },
    onPathChange: fn(),
    onItemSelect: fn(),
  },
}

/* A freelancer's September in hours, by project and then by task. */
const HOURS: BreakdownItem[] = [
  {
    id: 'harbor',
    label: 'Harbor Coffee site',
    value: 46,
    previous: 38,
    children: [
      { id: 'harbor-build', label: 'Build', value: 28, previous: 22 },
      { id: 'harbor-design', label: 'Design', value: 12, previous: 12 },
      { id: 'harbor-meetings', label: 'Meetings', value: 6, previous: 4 },
    ],
  },
  {
    id: 'fernwood',
    label: 'Fernwood Books app',
    value: 38,
    previous: 41,
    children: [
      { id: 'fernwood-build', label: 'Build', value: 24, previous: 27 },
      { id: 'fernwood-testing', label: 'Testing', value: 9, previous: 8 },
      { id: 'fernwood-meetings', label: 'Meetings', value: 5, previous: 6 },
    ],
  },
  { id: 'admin', label: 'Invoicing & admin', value: 14, previous: 16 },
  { id: 'learning', label: 'Learning', value: 11, previous: 6 },
  { id: 'pitching', label: 'Pitching', value: 9, previous: 12 },
  { id: 'volunteering', label: 'Library volunteering', value: 6, previous: 6 },
]

export const TimeByProject: Story = {
  name: 'Time by project',
  args: {
    items: HOURS,
    format: { style: 'unit', unit: 'hour', unitDisplay: 'short', maximumFractionDigits: 0 },
    top: 4,
    copy: {
      title: 'Time by project',
      description: 'September, in hours',
      all: 'All projects',
      total: 'Logged',
      empty: 'No hours logged yet',
      emptyDescription: 'Projects appear once you log time.',
    },
  },
}

/* A household's electricity in kilowatt-hours, by appliance and then by use. */
const ENERGY: BreakdownItem[] = [
  {
    id: 'heating',
    label: 'Heat pump',
    value: 214,
    previous: 188,
    children: [
      { id: 'heating-living', label: 'Living areas', value: 128, previous: 112 },
      { id: 'heating-bedrooms', label: 'Bedrooms', value: 86, previous: 76 },
    ],
  },
  { id: 'water', label: 'Water heater', value: 118, previous: 121 },
  { id: 'ev', label: 'Car charger', value: 96, previous: 84 },
  { id: 'kitchen', label: 'Kitchen', value: 74, previous: 77 },
  { id: 'laundry', label: 'Washer & dryer', value: 41, previous: 45 },
  { id: 'lights', label: 'Lighting', value: 28, previous: 31 },
  { id: 'standby', label: 'Standby', value: 19, previous: 22 },
]

export const EnergyByAppliance: Story = {
  name: 'Energy by appliance',
  args: {
    items: ENERGY,
    format: { maximumFractionDigits: 0 },
    top: 4,
    copy: {
      title: 'Energy by appliance',
      description: 'October so far, in kWh',
      all: 'Whole home',
      total: 'kWh used',
      empty: 'No readings yet',
      emptyDescription: 'Appliances appear once the meter reports.',
    },
  },
}

export const Standalone: Story = { args: { embedded: false } }
