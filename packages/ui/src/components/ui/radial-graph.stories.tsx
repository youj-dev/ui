import type { Meta, StoryObj } from '@storybook/react-vite'
import { RadialGraph, type RadialGraphNode } from './radial-graph'

/** A made-up service account and what it can reach: three kinds of things, two of them hit and three exposed. */
const NODES: RadialGraphNode[] = [
  { id: 'vault', label: 'secrets-vault', tone: 'chart-3', ring: 'solid', state: 'Hit', detail: 'Read with the leaked token' },
  { id: 'queue', label: 'jobs-queue', tone: 'chart-1' },
  { id: 'bucket', label: 'exports-bucket', tone: 'chart-5', ring: 'solid', state: 'Hit', detail: 'Listed twice in a minute' },
  { id: 'db', label: 'orders-db', tone: 'chart-1' },
  { id: 'cache', label: 'session-cache', tone: 'chart-5' },
  { id: 'api', label: 'billing-api', via: 'vault', tone: 'chart-3', ring: 'dashed', state: 'Exposed', detail: 'Its key is in the vault' },
  { id: 'ci', label: 'ci-runner', via: 'vault', tone: 'chart-1' },
  { id: 'worker', label: 'report-worker', via: 'queue', tone: 'chart-1' },
  { id: 'archive', label: 'cold-archive', via: 'bucket', tone: 'chart-5', ring: 'dashed', state: 'Exposed', detail: 'Same bucket policy' },
  { id: 'cdn', label: 'assets-cdn', via: 'bucket', tone: 'chart-5' },
  { id: 'replica', label: 'orders-replica', via: 'db', tone: 'chart-1', ring: 'dashed', state: 'Exposed', detail: 'Replicates from orders-db' },
  { id: 'warehouse', label: 'warehouse', via: 'db', tone: 'chart-1' },
]

const meta: Meta<typeof RadialGraph> = {
  title: 'UI/Data/Radial Graph',
  component: RadialGraph,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'What one thing reaches, in rings by how many hops away: each branch a wedge, each dot in its kind’s color, and a solid or dashed ring with a matching link for a node’s state, so a path shows at a glance. Focus or hover a node for its label, state and detail; it lights its path from the center. One tab stop: Left and Right walk a ring, Down follows a link out, Up goes back in. `hops` folds the outer rings into the nodes they hang from. Nodes travel out from the center as it scrolls into view. Reduced motion: drawn in place.',
      },
    },
  },
  args: { center: { id: 'svc', label: 'svc-reports', short: 'SR' }, nodes: NODES, label: 'What svc-reports can reach' },
  argTypes: { center: { control: false }, nodes: { control: false }, hops: { control: { type: 'range', min: 1, max: 2 } } },
  decorators: [
    (Story) => (
      <div className="w-104 max-w-full">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof RadialGraph>

export const Default: Story = {}

/** One ring: the outer nodes folded into the ones they hang from. */
export const OneHop: Story = { name: 'One hop', args: { hops: 1 } }

/** A person and the people they work with, in your own tones, without ring captions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    center: { id: 'me', label: 'Noor Haddad', tone: 'chart-2' },
    nodes: [
      { id: 'a', label: 'Design', tone: 'chart-4' },
      { id: 'b', label: 'Research', tone: 'chart-4' },
      { id: 'c', label: 'Platform', tone: 'chart-5' },
      { id: 'a1', label: 'Brand', via: 'a', tone: 'chart-4' },
      { id: 'a2', label: 'Motion', via: 'a', tone: 'chart-4', ring: 'solid', ringTone: 'accent', state: 'New this week' },
      { id: 'c1', label: 'Infra', via: 'c', tone: 'chart-5' },
    ],
    ringLabels: false,
    label: 'Teams around Noor',
  },
}

/** Nothing linked yet. */
export const Empty: Story = { args: { nodes: [] } }
