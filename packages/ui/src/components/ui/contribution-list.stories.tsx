import type { Meta, StoryObj } from '@storybook/react-vite'
import { CloudIcon, CpuIcon, DatabaseIcon, GlobeIcon, MegaphoneIcon, PackageIcon, TagIcon, UsersIcon } from '@youj/icons'
import { ContributionList, type ContributionListProps } from './contribution-list'

const meta: Meta<ContributionListProps> = {
  title: 'UI/Data/Contribution List',
  component: ContributionList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A waterfall told as a list: the `baseline` row, each thing that moved the figure as a signed step (`items`: an icon, a label, a line of `detail`, +n or −n), and the `total` row, highlighted. The total is the baseline plus the steps, computed, so the list always adds up (`runningTotals` gives the same numbers). Beside each value a thin mark on one scale shows the step as a bar from where the figure was to where it went, in the good ink for a rise (`invert` for costs); the bars grow in order as the list scrolls into view. The marks hide below 28rem. Reduced motion: drawn at once.',
      },
    },
  },
  argTypes: { invert: { control: 'boolean' }, marks: { control: 'boolean' } },
}
export default meta
type Story = StoryObj<ContributionListProps>

const panel = 'w-[min(30rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-2'

/** Why next week's signups differ from a normal week: each driver and how many it adds or takes away. */
export const SignupForecast: Story = {
  name: 'Signup forecast',
  args: {
    baseline: { label: 'A normal week', value: 1_840 },
    items: [
      { icon: <MegaphoneIcon />, label: 'Launch post', detail: 'Goes out Tuesday to 48k subscribers', value: 310 },
      { icon: <UsersIcon />, label: 'Referral credit', detail: 'Doubled for the week', value: 145 },
      { icon: <GlobeIcon />, label: 'New region', detail: 'Checkout opens in Brazil on Thursday', value: 90 },
      { icon: <TagIcon />, label: 'Price change', detail: 'Starter goes from €9 to €12', value: -120 },
    ],
    total: { label: 'Expected next week', detail: 'Range 2,180 to 2,340' },
  },
  render: (args) => <ContributionList {...args} className={panel} aria-label="What moves next week’s signups" />,
}

/** A monthly bill where a fall is good news: `invert` lights the savings. */
export const CostBridge: Story = {
  name: 'Cost bridge',
  args: {
    baseline: { label: 'September bill', value: 18_420 },
    items: [
      { icon: <CpuIcon />, label: 'Reserved instances', detail: 'Committed for a year from Oct 1', value: -3_150 },
      { icon: <DatabaseIcon />, label: 'Database growth', detail: 'Two read replicas added', value: 1_280 },
      { icon: <CloudIcon />, label: 'Egress', detail: 'Video exports doubled', value: 940 },
      { icon: <PackageIcon />, label: 'Retired staging', detail: 'Three idle clusters removed', value: -1_610 },
    ],
    total: { label: 'October forecast' },
    format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
    invert: true,
  },
  render: (args) => <ContributionList {...args} className={panel} aria-label="October cost bridge" />,
}

/** Without the marks: just the figures, for a narrow side panel. */
export const Plain: Story = {
  args: { ...SignupForecast.args, marks: false } as ContributionListProps,
  render: (args) => <ContributionList {...args} className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-2" />,
}
