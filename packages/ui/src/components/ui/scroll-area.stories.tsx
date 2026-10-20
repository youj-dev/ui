import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AlertTriangleIcon, GitCommitIcon, RocketIcon, UserPlusIcon } from '@youj/icons'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Badge } from './badge'
import { ScrollArea, type ScrollAreaProps } from './scroll-area'

const meta: Meta<ScrollAreaProps> = {
  title: 'UI/Layout/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI\'s scroll area: native scrolling (wheel, touch, and the keyboard once the viewport has focus) with thin overlay scrollbars that fade in while you hover or scroll and fade away on the slow token after. Edges with more to scroll fade out over 24px, driven straight by Base UI\'s overflow variables, so the fade grows with the scroll instead of switching on (`fade={false}` to opt out). The viewport is a tab stop only when it can scroll; its focus ring is drawn by the root so the edge fade never hides it. `orientation` picks the scrollbars: vertical, horizontal or both. The thumb is drawn in the same tokens as the kit\'s native bars (`yj-scrollbar` in ui.css) and widens from 6px to 8px under the pointer.',
      },
    },
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal', 'both'] },
    fade: { control: 'boolean' },
  },
  args: { orientation: 'vertical', fade: true },
}
export default meta
type Story = StoryObj<ScrollAreaProps>

const KINDS = [
  { icon: RocketIcon, verb: 'deployed', tone: 'text-success' },
  { icon: GitCommitIcon, verb: 'pushed to', tone: 'text-fg-muted' },
  { icon: UserPlusIcon, verb: 'invited a member to', tone: 'text-fg-muted' },
  { icon: AlertTriangleIcon, verb: 'failed a build of', tone: 'text-warning' },
]
const PEOPLE = ['Ada', 'Grace', 'Alan', 'Katherine', 'Linus', 'Margaret']
const PROJECTS = ['web', 'docs', 'dashboard', 'api']

const ACTIVITY = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  who: PEOPLE[i % PEOPLE.length]!,
  kind: KINDS[(i * 7) % KINDS.length]!,
  project: PROJECTS[(i * 3) % PROJECTS.length]!,
  when: `${(i + 1) * 7}m`,
}))

function ActivityItems() {
  return (
    <ul className="flex flex-col py-1">
      {ACTIVITY.map(({ id, who, kind, project, when }) => (
        <li key={id} className="flex items-center gap-3 px-4 py-2 text-ui">
          <kind.icon aria-hidden className={`size-4 shrink-0 ${kind.tone}`} />
          <span className="min-w-0 flex-1 truncate text-fg-muted">
            <span className="font-medium text-fg">{who}</span> {kind.verb} <span className="font-mono text-ui-sm text-fg">{project}</span>
          </span>
          <span className="shrink-0 text-ui-sm text-fg-muted tabular-nums">{when}</span>
        </li>
      ))}
    </ul>
  )
}

function ActivityCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="w-full max-w-[420px] rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-ui font-medium text-fg">{title}</p>
        <Badge variant="secondary" className="tabular-nums">
          {ACTIVITY.length}
        </Badge>
      </div>
      {children}
    </div>
  )
}

function Activity(props: Partial<ScrollAreaProps>) {
  return (
    <ActivityCard title="Activity">
      <ScrollArea className="h-80 rounded-b-xl" aria-label="Activity" {...props}>
        <ActivityItems />
      </ScrollArea>
    </ActivityCard>
  )
}

/** An activity feed in a fixed-height card. Scroll it: the bottom fade shrinks as you near the end, the top one grows as you leave the start. */
export const Hero: Story = {
  render: (args) => <Activity {...args} />,
}

const RELEASES = ['v2.4.0', 'v2.3.2', 'v2.3.1', 'v2.3.0', 'v2.2.4', 'v2.2.3', 'v2.2.0', 'v2.1.0', 'v2.0.0', 'v1.9.8']

/** Horizontal: a strip of releases. Shift + wheel, a trackpad, or focus it and use ← →. */
export const Horizontal: Story = {
  render: () => (
    <ScrollArea orientation="horizontal" className="w-full max-w-[480px] rounded-xl border border-line bg-surface" aria-label="Releases">
      <ul className="flex w-max gap-2 p-3">
        {RELEASES.map((r, i) => (
          <li key={r} className="flex w-32 shrink-0 flex-col gap-1 rounded-lg border border-line bg-surface px-3 py-2.5">
            <span className="font-mono text-ui-sm text-fg">{r}</span>
            <span className="text-ui-sm text-fg-muted">{i === 0 ? 'Latest' : `${i * 9} days ago`}</span>
          </li>
        ))}
      </ul>
    </ScrollArea>
  ),
}

const LOG = Array.from(
  { length: 30 },
  (_, i) =>
    `${String(12 + Math.floor(i / 6)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:0${i % 10}  ${i % 5 === 3 ? 'WARN ' : 'INFO '} request_id=req_${(8841 + i * 37).toString(16)} method=GET path=/api/v2/projects/web/deployments?limit=20&cursor=${(i * 991).toString(36)} status=200 duration=${12 + ((i * 13) % 90)}ms`,
)

/** Both axes: a build log wider and taller than its box. */
export const BothAxes: Story = {
  render: () => (
    <ScrollArea orientation="both" className="h-72 w-full max-w-[560px] rounded-xl border border-line bg-band" aria-label="Build log">
      <pre className="w-max p-4 font-mono text-ui-sm leading-6 text-fg-muted">{LOG.join('\n')}</pre>
    </ScrollArea>
  ),
}

/** Beside a plain native scroller with `yj-scrollbar`: the same thumb in the same tokens, thin, quiet until the pointer or focus is on it. On macOS with overlay scrollbars both appear only while scrolling. */
export const NativeScrollbar: Story = {
  render: () => (
    <div className="flex flex-wrap items-start justify-center gap-4">
      <Activity />
      <ActivityCard title="Native, yj-scrollbar">
        <div tabIndex={0} role="region" aria-label="Activity, native scroller" className="h-80 overflow-y-auto overscroll-contain rounded-b-xl yj-scrollbar focus-ring">
          <ActivityItems />
        </div>
      </ActivityCard>
    </div>
  ),
}

/** Reduced motion: scrollbars appear and leave at once; scrolling itself is untouched. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <Activity />
    </YoujProvider>
  ),
}
