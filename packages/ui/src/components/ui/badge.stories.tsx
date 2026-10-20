import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowUpRightIcon, CheckIcon, CircleDashedIcon, XIcon } from '@youj/icons'
import { Badge, BadgeDot } from './badge'

const meta: Meta<typeof Badge> = {
  title: 'UI/Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A 20px pill in 12px medium type. Soft by default: a 10% tint of the color with its "ink" (the color with a fifth of fg mixed back in) as text, which holds WCAG AA on the tint in both themes, where the raw status colors would not. Only `solid` spends the accent at full strength. Render it as a link with `render={<a href />}` to get hover and focus.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'solid', 'secondary', 'outline', 'success', 'warning', 'danger', 'neutral'] },
  },
  args: { children: 'Beta', variant: 'default' },
}
export default meta
type Story = StoryObj<typeof Badge>

const deployments = [
  { id: 'dpl_8f2k', branch: 'main', msg: 'Tighten cache headers', status: 'Ready', variant: 'success' as const, icon: CheckIcon },
  { id: 'dpl_7h1c', branch: 'feat/pricing', msg: 'New pricing page', status: 'Building', variant: 'default' as const, icon: CircleDashedIcon },
  { id: 'dpl_6a9x', branch: 'fix/og', msg: 'OG image for blog posts', status: 'Queued', variant: 'secondary' as const, icon: CircleDashedIcon },
  { id: 'dpl_5b0q', branch: 'chore/deps', msg: 'Bump the build image', status: 'Error', variant: 'danger' as const, icon: XIcon },
]

/** Status in a real list: the badge carries state, the row carries content. */
export const Hero: Story = {
  render: () => (
    <div className="w-full max-w-[520px] overflow-hidden rounded-xl border border-line bg-surface">
      {deployments.map((d, i) => (
        <div key={d.id} className={`flex items-center gap-4 px-4 py-3 ${i > 0 ? 'border-t border-line' : ''}`}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-ui font-medium text-fg">{d.msg}</p>
            <p className="font-mono text-ui-xs text-fg-muted">
              {d.branch} · {d.id}
            </p>
          </div>
          {d.branch === 'main' && <Badge variant="outline">Production</Badge>}
          <Badge variant={d.variant}>
            <d.icon />
            {d.status}
          </Badge>
        </div>
      ))}
    </div>
  ),
}

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Default</Badge>
      <Badge variant="solid">Solid</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Destructive</Badge>
      <Badge variant="neutral">Neutral</Badge>
    </div>
  ),
}

export const WithIconsAndLinks: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="success">
        <CheckIcon />
        Verified
      </Badge>
      <Badge variant="warning">Expires in 3 days</Badge>
      <Badge variant="outline" render={<a href="#changelog" />}>
        Changelog
        <ArrowUpRightIcon />
      </Badge>
      <Badge variant="secondary" className="tabular-nums">
        12
      </Badge>
    </div>
  ),
}

/** Label chips in colours of their own: `color` on a Badge tints it (a theme colour's name or any CSS colour), and `color` on a BadgeDot paints only the dot, for an outline chip with a coloured dot. */
export const CustomColors: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Badge color="chart-1">Frontend</Badge>
        <Badge color="chart-2">Backend</Badge>
        <Badge color="chart-3">Design</Badge>
        <Badge color="chart-4">Research</Badge>
        <Badge color="chart-5">Ops</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">
          <BadgeDot color="chart-1" />
          Frontend
        </Badge>
        <Badge variant="outline">
          <BadgeDot color="chart-3" />
          Design
        </Badge>
        <Badge variant="outline">
          <BadgeDot color="danger" />
          Bug
        </Badge>
      </div>
    </div>
  ),
}
