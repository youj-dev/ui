import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core'
import { CalendarIcon, CheckCircleIcon, ClockIcon, GitMergeIcon, GitPullRequestIcon } from '@youj/icons'
import { Avatar, AvatarBadge, AvatarFallback } from './avatar'
import { Badge } from './badge'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card'

const meta: Meta<typeof HoverCardContent> = {
  title: 'UI/Overlays/Hover Card',
  component: HoverCardContent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI preview card: a preview of where a link goes, after resting on it (500ms) or focusing it. It grows out of the link with motion’s yj-pop and stays while the pointer travels onto it; it closes 250ms after the pointer leaves both. A visual enhancement only: the link is the accessible interface, and everything in the card is also at its destination. Reduced motion: instant.',
      },
    },
  },
  argTypes: {
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
  },
  args: { side: 'bottom' },
}
export default meta
type Story = StoryObj<typeof HoverCardContent>

const linkClass =
  'rounded-sm font-medium text-fg underline decoration-line-strong decoration-1 underline-offset-3 transition-[text-decoration-color] yj-duration-fast ease-standard hover:decoration-fg data-popup-open:decoration-fg focus-ring'

function PersonCard(args: Story['args']) {
  return (
    <HoverCard>
      <HoverCardTrigger href="#ada" className={linkClass}>
        @ada
      </HoverCardTrigger>
      <HoverCardContent {...args}>
        <div className="flex items-start gap-3">
          <Avatar size="lg">
            <AvatarFallback>AL</AvatarFallback>
            <AvatarBadge />
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="text-ui-lg font-semibold">Ada Lovelace</span>
            <span className="text-ui-sm text-fg-muted">@ada · Platform lead</span>
          </div>
        </div>
        <p className="text-ui text-fg-muted">Owns deploys, the edge runtime and anything that pages at 3am.</p>
        <div className="flex flex-col gap-1.5 text-ui-sm text-fg-muted">
          <span className="flex items-center gap-2">
            <ClockIcon className="size-3.5" /> 14:32 in London
          </span>
          <span className="flex items-center gap-2">
            <CalendarIcon className="size-3.5" /> Joined March 2021
          </span>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function PullRequestCard(args: Story['args']) {
  return (
    <HoverCard>
      <HoverCardTrigger href="#pr-1284" className={linkClass}>
        #1284
      </HoverCardTrigger>
      <HoverCardContent {...args} className="w-80">
        <div className="flex items-start gap-2.5">
          <GitMergeIcon className="mt-0.5 size-4 shrink-0 text-accent-text" />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-ui font-semibold">Stream search results from the edge</span>
            <span className="text-ui-sm text-fg-muted">acme/orion #1284 · merged 12 minutes ago</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">
            <GitPullRequestIcon /> feat/search
          </Badge>
          <Badge variant="secondary">+412 −96</Badge>
        </div>
        <div className="flex items-center gap-2 border-t border-line pt-3 text-ui-sm text-fg-muted">
          <CheckCircleIcon className="size-3.5 text-success" /> 14 checks passed
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function Activity(args: Story['args']) {
  return (
    <div className="flex w-[28rem] max-w-full flex-col gap-4 rounded-xl border border-line bg-surface p-5 shadow-xs">
      <div className="flex items-start gap-3">
        <Avatar size="sm">
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
        <p className="text-ui leading-6 text-fg-muted">
          <span className="font-medium text-fg">Grace Hopper</span> promoted the preview from{' '}
          <PullRequestCard {...args} /> to production. Thanks <PersonCard {...args} /> for the review.
        </p>
      </div>
      <span className="ps-9 text-ui-sm text-fg-muted">Production · 8 minutes ago</span>
    </div>
  )
}

/** An activity feed: rest on a mention or a pull request to preview it. Move onto the card and it stays. */
export const Hero: Story = {
  render: (args) => <Activity {...args} />,
}

/* A phone's version: the subtree is forced to touch (keeping the toolbar's
 * Speed and Motion settings) in a phone-wide column. */
const onTouch: Decorator = (Story, context) => (
  <YoujProvider
    device="touch"
    timeScale={Number(context.globals.timeScale ?? 1)}
    reducedMotion={(context.globals.reducedMotion as ReducedMotionSetting | undefined) ?? 'user'}
  >
    <div className="mx-auto flex w-full max-w-sm flex-col items-stretch gap-4">
      <Story />
    </div>
  </YoujProvider>
)

/**
 * On touch a tap on a link opens its card instead of leaving the page. A
 * second tap on the link follows it (and closes the card); a tap anywhere
 * else closes the card.
 */
export const Touch: Story = {
  decorators: [onTouch],
  parameters: { layout: 'padded' },
  render: (args) => <Activity {...args} />,
}
