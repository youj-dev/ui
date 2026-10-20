import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowUpRightIcon, GitBranchIcon, GitPullRequestIcon, InfoIcon, KanbanIcon, MessagesIcon, MoreHorizontalIcon } from '@youj/icons'
import { SpotlightGroup } from '@youj/motion'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Badge } from './badge'
import { Button } from './button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, type CardProps } from './card'
import { Progress, ProgressLabel, ProgressValue } from './progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

const meta: Meta<CardProps> = {
  title: 'UI/Layout/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'shadcn\'s card on youj surfaces: a hairline-bordered panel with a header (title, description, and an action slot beside them), content and a recessed footer. `lift` is for cards that are one big target: on hover or keyboard focus inside, the card rises 2px on the base token while its shadow deepens, and pressing sets it down on the instant token; reduced motion keeps the shadow and drops the travel. `spotlight` wears motion\'s Spotlight effect: a pointer-tracked light under the cursor and an edge glow where it passes the border (keyboard focus parks the light on the card). In a SpotlightGroup neighboring cards share one light. Reduced motion swaps it for a static accent border on hover and focus.',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['default', 'sm'] },
    lift: { control: 'boolean' },
    spotlight: { control: 'boolean' },
  },
  args: { size: 'default', lift: false, spotlight: false },
}
export default meta
type Story = StoryObj<CardProps>

function UsageCard(props: CardProps) {
  return (
    <Card className="w-full max-w-[420px]" {...props}>
      <CardHeader>
        <CardTitle>Usage this cycle</CardTitle>
        <CardDescription>Resets in 12 days, on October 1.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label="Usage options">
            <MoreHorizontalIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Progress value={7.4} max={10} getAriaValueText={(_, v) => `${v} of 10 GB`}>
          <ProgressLabel>Storage</ProgressLabel>
          <ProgressValue>{(_, v) => `${v} of 10 GB`}</ProgressValue>
        </Progress>
        <Progress value={812} max={1000} getAriaValueText={(_, v) => `${v} of 1,000 GB`}>
          <ProgressLabel>Bandwidth</ProgressLabel>
          <ProgressValue>{(_, v) => `${v} of 1,000 GB`}</ProgressValue>
        </Progress>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-ui-sm text-fg-muted">Pro plan · $20 / month</span>
        <Button size="sm">Upgrade</Button>
      </CardFooter>
    </Card>
  )
}

/** A usage card: header with an action, content, and a recessed footer. */
export const Hero: Story = {
  render: (args) => <UsageCard {...args} />,
}

const INTEGRATIONS = [
  { name: 'GitHub', icon: GitPullRequestIcon, description: 'Deploy every push and comment on pull requests.', connected: true },
  { name: 'Slack', icon: MessagesIcon, description: 'Post deploy and incident alerts to a channel.', connected: false },
  { name: 'Trello', icon: KanbanIcon, description: 'Link deployments to the cards they ship.', connected: false },
]

/**
 * `spotlight` in a SpotlightGroup: one light shared across the cards, so a neighbor's edge glows as the
 * cursor nears it. Tab through the buttons: the light parks on the focused card and glides between them.
 */
export const Spotlight: Story = {
  render: () => (
    <SpotlightGroup radius={240} className="grid w-full max-w-[780px] grid-cols-1 gap-3 sm:grid-cols-3">
      {INTEGRATIONS.map(({ name, icon: Icon, description, connected }) => (
        <Card key={name} spotlight size="sm">
          <CardHeader>
            <span aria-hidden className="mb-2 grid size-9 place-items-center rounded-lg border border-line bg-surface text-fg shadow-xs">
              <Icon className="size-4" />
            </span>
            <CardTitle className="flex items-center gap-2">
              {name}
              {connected && <Badge variant="success">Connected</Badge>}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Button variant={connected ? 'outline' : 'secondary'} size="sm" className="w-full">
              {connected ? 'Configure' : `Connect ${name}`}
            </Button>
          </CardContent>
        </Card>
      ))}
    </SpotlightGroup>
  ),
}

const PROJECTS = [
  { name: 'web', url: 'acme.com', branch: 'main', updated: '4m ago', status: 'Ready' },
  { name: 'docs', url: 'docs.acme.com', branch: 'main', updated: '2h ago', status: 'Ready' },
  { name: 'dashboard', url: 'app.acme.com', branch: 'release/2.4', updated: '1d ago', status: 'Building' },
]

/** `lift`: project cards that are one link each. Hover, or Tab to a card: it rises 2px and its shadow deepens; press to set it down. */
export const Lift: Story = {
  render: () => (
    <div className="grid w-full max-w-[780px] grid-cols-1 gap-3 sm:grid-cols-3">
      {PROJECTS.map((p) => (
        <Card key={p.name} lift size="sm">
          <CardHeader>
            <CardTitle>
              {/* A stretched link: the whole card is the target, the link is the one tab stop. */}
              <a href={`#${p.name}`} className="rounded-sm after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none">
                {p.name}
              </a>
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              {p.url}
              <ArrowUpRightIcon className="size-3" />
            </CardDescription>
            <CardAction>
              <Badge variant={p.status === 'Ready' ? 'success' : 'warning'}>{p.status}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
            <GitBranchIcon className="size-3.5" />
            <span className="font-mono">{p.branch}</span>
            <span aria-hidden>·</span>
            {p.updated}
          </CardContent>
        </Card>
      ))}
    </div>
  ),
}

/** Slots and sizes: header only, header + content, a long title that wraps, and the compact size. */
export const Slots: Story = {
  render: () => (
    <div className="grid w-full max-w-[780px] grid-cols-2 gap-3">
      <Card>
        <CardHeader>
          <CardTitle>Header only</CardTitle>
          <CardDescription>Title and description, nothing else.</CardDescription>
        </CardHeader>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Compact</CardTitle>
          <CardDescription>size="sm" tightens the spacing to 16px.</CardDescription>
        </CardHeader>
        <CardContent className="text-fg-muted">Content sits on the same inset as the header.</CardContent>
      </Card>
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>A long title that wraps onto a second line when the card is narrow, while the action stays put</CardTitle>
          <CardDescription>The action slot spans both header rows and aligns to the top.</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardFooter>
          <span className="text-ui-sm text-fg-muted">Footer: recessed, with its own inner radius.</span>
        </CardFooter>
      </Card>
    </div>
  ),
}

function PanelHead({ title, hint }: { title: string; hint: string }) {
  return (
    <CardHeader>
      <CardTitle>
        {title}
        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="icon-xs" aria-label={`About ${title.toLowerCase()}`} />}>
            <InfoIcon />
          </TooltipTrigger>
          <TooltipContent>{hint}</TooltipContent>
        </Tooltip>
      </CardTitle>
      <CardAction>
        <Button variant="outline" size="icon-xs" aria-label={`${title} options`}>
          <MoreHorizontalIcon />
        </Button>
      </CardAction>
    </CardHeader>
  )
}

const QUEUES = [
  { name: 'Preview builds', minutes: '1,284', share: '46%' },
  { name: 'Production', minutes: '812', share: '29%' },
  { name: 'Scheduled jobs', minutes: '503', share: '18%' },
  { name: 'Docs', minutes: '196', share: '7%' },
]

/**
 * `variant="panel"`: a slim header strip (the title in the theme's label face, an info tip, a menu button)
 * over the content on a raised surface inset in the shell. Here as two dashboard panels: build minutes and
 * where they went.
 */
export const Panel: Story = {
  render: () => (
    <TooltipProvider>
      <div className="grid w-full max-w-[780px] grid-cols-[3fr_2fr] items-start gap-3">
        <Card variant="panel">
          <PanelHead title="Build minutes" hint="Minutes billed this cycle, across every project." />
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-medium tracking-tight tabular-nums">2,795</span>
              <Badge variant="success">−8% vs last cycle</Badge>
            </div>
            <Progress value={2795} max={4000} getAriaValueText={(_, v) => `${v} of 4,000 minutes`}>
              <ProgressLabel>Included minutes</ProgressLabel>
              <ProgressValue>{() => '2,795 of 4,000'}</ProgressValue>
            </Progress>
            <div className="grid grid-cols-3 divide-x divide-line rounded-lg border border-line-subtle bg-band">
              {[
                ['Builds', '1,942'],
                ['Median', '1m 26s'],
                ['Cache hits', '71%'],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5 px-3 py-2">
                  <span className="text-ui-sm text-fg-muted">{label}</span>
                  <span className="font-medium tabular-nums">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card variant="panel">
          <PanelHead title="By queue" hint="Where this cycle's minutes went." />
          <CardContent className="py-2">
            <ul className="divide-y divide-dashed divide-line">
              {QUEUES.map((q) => (
                <li key={q.name} className="flex items-center gap-3 py-2.5">
                  <span className="flex-1">{q.name}</span>
                  <span className="font-medium tabular-nums">{q.minutes}</span>
                  <span className="w-9 text-end text-ui-sm text-fg-muted tabular-nums">{q.share}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  ),
}

/** Reduced motion: lift keeps its shadow and drops the travel; spotlight shows a static accent border on hover and focus. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <div className="grid w-full max-w-[780px] grid-cols-2 gap-3">
        <UsageCard lift />
        <UsageCard spotlight />
      </div>
    </YoujProvider>
  ),
}

export const Playground: Story = {
  render: (args) => <UsageCard {...args} />,
}
