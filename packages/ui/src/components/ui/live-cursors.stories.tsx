import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef, useState } from 'react'
import { LiveCursors, type LiveCursorPosition, type LiveCursorsProps, type LiveCursorUser, PresenceAvatars, useLiveCursorsInput } from './live-cursors'

/** A simulated collaborator: where they wander (a Lissajous loop, in fractions) and what they say. */
interface Walker extends Omit<LiveCursorUser, 'x' | 'y' | 'message'> {
  cx: number
  cy: number
  rx: number
  ry: number
  /** Loops per minute. */
  pace: number
  phase: number
  /** Seconds out of every 20 spent still, so idle fades show. */
  rest?: number
  lines?: string[]
}

/** Sparse updates, as a socket would send them: every `interval` ms, not every frame. */
function useWalkers(walkers: Walker[], interval = 140) {
  const [users, setUsers] = useState<LiveCursorUser[]>(() => walkers.map((w) => place(w, 0)))
  useEffect(() => {
    const start = performance.now()
    const id = setInterval(() => setUsers(walkers.map((w) => place(w, (performance.now() - start) / 1000))), interval)
    return () => clearInterval(id)
  }, [walkers, interval])
  return users
}

function place({ cx, cy, rx, ry, pace, phase, rest = 0, lines, ...user }: Walker, seconds: number): LiveCursorUser {
  const cycle = seconds % 20
  const moving = Math.max(0, Math.min(cycle, 20 - rest))
  const t = ((Math.floor(seconds / 20) * (20 - rest) + moving) * pace) / 60 + phase
  const angle = t * Math.PI * 2
  let message: string | undefined
  if (lines?.length) {
    // Each line is typed a letter at a time, held, then cleared.
    const slot = Math.floor(seconds / 7) % (lines.length + 1)
    const line = lines[slot]
    const into = seconds % 7
    if (line) message = into < 5 ? line.slice(0, Math.ceil((into / 2.5) * line.length)) : undefined
  }
  return { ...user, x: cx + rx * Math.sin(angle), y: cy + ry * Math.sin(angle * 2 + 0.6), message: message || undefined }
}

const dots = '[background-image:radial-gradient(var(--color-line)_1px,transparent_1px)] [background-size:16px_16px]'

const TEAM: Walker[] = [
  { id: 'ada', name: 'Ada', status: 'editing', cx: 0.3, cy: 0.4, rx: 0.2, ry: 0.22, pace: 5, phase: 0 },
  { id: 'joan', name: 'Joan', status: 'viewing', cx: 0.65, cy: 0.55, rx: 0.22, ry: 0.25, pace: 4, phase: 0.3, rest: 12 },
  { id: 'lin', name: 'Lin', status: 'editing', cx: 0.55, cy: 0.3, rx: 0.3, ry: 0.15, pace: 3, phase: 0.6 },
]

const meta: Meta<LiveCursorsProps> = {
  title: 'UI/Specialized/Live Cursors',
  component: LiveCursors,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Multiplayer presence for a collaborative surface. The app sends its own pointer from `useLiveCursorsInput` (fractions of the surface, throttled, `null` when it leaves) and feeds everyone else back in as `users`: no socket inside. Each cursor is an arrow and a name tag in the person’s color, picked from the theme’s chart palette by id so every screen agrees, with an optional chat bubble and selection rectangles. One loop springs every cursor between sparse updates and stops when they rest or scroll away; a cursor that hasn’t moved for `idleAfter` fades, and one whose person leaves shrinks away. PresenceAvatars lists who is here and follows a person’s cursor. The cursors are hidden from screen readers; joins and leaves are announced politely. Reduced motion: cursors jump to each update, with no fades.',
      },
    },
  },
  argTypes: {
    idleAfter: { control: { type: 'select' }, options: [0, 3000, 10000] },
    announce: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<LiveCursorsProps>

/** The local pointer goes out through useLiveCursorsInput and comes back 150 ms later as "Echo", springing between the throttled reports. */
function PlaygroundDemo(args: Omit<LiveCursorsProps, 'users'>) {
  const others = useWalkers(TEAM)
  const surface = useRef<HTMLDivElement>(null)
  const [echo, setEcho] = useState<LiveCursorPosition | null>(null)
  useLiveCursorsInput(surface, (position) => {
    setTimeout(() => setEcho(position), 150)
  })
  const users: LiveCursorUser[] = echo ? [...others, { id: 'echo', name: 'Echo (you, 150 ms late)', color: 'var(--color-accent)', ...echo }] : others
  return (
    <div className="flex w-[44rem] max-w-[calc(100vw-2rem)] flex-col gap-3">
      <PresenceAvatars users={users} className="self-end" />
      <LiveCursors {...args} ref={surface} users={users} className={`h-96 rounded-2xl border border-line bg-surface ${dots}`} />
    </div>
  )
}

export const Playground: Story = {
  name: 'Playground',
  args: { idleAfter: 3000 },
  render: (args) => <PlaygroundDemo {...args} />,
}

const DESIGNERS: Walker[] = [
  { id: 'mira', name: 'Mira Chen', status: 'editing', cx: 0.24, cy: 0.42, rx: 0.08, ry: 0.18, pace: 4, phase: 0, selection: [{ x: 0.06, y: 0.14, width: 0.32, height: 0.74 }] },
  { id: 'jonas', name: 'Jonas Weber', status: 'editing', cx: 0.63, cy: 0.3, rx: 0.12, ry: 0.06, pace: 5, phase: 0.2, selection: [{ x: 0.46, y: 0.14, width: 0.46, height: 0.3 }] },
  { id: 'priya', name: 'Priya Natarajan', status: 'viewing', cx: 0.6, cy: 0.72, rx: 0.22, ry: 0.1, pace: 3, phase: 0.5, rest: 10 },
  { id: 'tomas', name: 'Tomás Ruiz', status: 'viewing', cx: 0.78, cy: 0.6, rx: 0.1, ry: 0.2, pace: 2.5, phase: 0.8, lines: ['Love this header', 'Can we try 24px?'] },
]

function DesignFileDemo() {
  const users = useWalkers(DESIGNERS)
  const [following, setFollowing] = useState<string | null>(null)
  return (
    <div className="w-[52rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="flex flex-col">
          <span className="text-ui font-semibold text-fg">Checkout redesign</span>
          <span className="text-ui-sm text-fg-muted">Page 1 · Edited just now</span>
        </div>
        <PresenceAvatars users={users} following={following} onFollowingChange={setFollowing} size="sm" />
      </header>
      <LiveCursors users={users} following={following} className={`h-[26rem] bg-canvas ${dots}`}>
        <div className="absolute top-[14%] left-[6%] flex h-[74%] w-[32%] flex-col gap-2 rounded-xl border border-line bg-surface p-3 shadow-sm">
          <div className="h-3 w-1/2 rounded-full bg-band" />
          <div className="h-24 rounded-lg bg-accent-subtle" />
          <div className="h-3 w-3/4 rounded-full bg-band" />
          <div className="h-3 w-2/3 rounded-full bg-band" />
          <div className="mt-auto h-8 rounded-lg bg-accent" />
        </div>
        <div className="absolute top-[14%] left-[46%] flex h-[30%] w-[46%] items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-sm">
          <div className="size-12 rounded-full bg-band" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3 w-2/3 rounded-full bg-band" />
            <div className="h-3 w-1/2 rounded-full bg-band" />
          </div>
        </div>
        <div className="absolute top-[52%] left-[46%] h-[36%] w-[20%] rotate-2 rounded-md bg-warning-subtle p-3 text-ui-sm text-warning-text">Ship the new totals row?</div>
        <div className="absolute top-[52%] left-[70%] h-[36%] w-[22%] -rotate-1 rounded-md bg-success-subtle p-3 text-ui-sm text-success-text">Copy approved</div>
      </LiveCursors>
    </div>
  )
}

export const DesignFile: Story = {
  name: 'Design file with 4 collaborators',
  parameters: { docs: { description: { story: 'Four people in one file: two editing with their selections tinted, two viewing, one leaving a comment. Press an avatar to follow that person.' } } },
  render: () => <DesignFileDemo />,
}

const CHATTY: Walker[] = [
  { id: 'ada', name: 'Ada', cx: 0.3, cy: 0.35, rx: 0.06, ry: 0.08, pace: 2, phase: 0, lines: ['Moving the chart up', 'Done, take a look?'] },
  { id: 'lin', name: 'Lin', cx: 0.62, cy: 0.55, rx: 0.08, ry: 0.06, pace: 2.5, phase: 0.4, lines: ['Looks great', 'One nit: the legend wraps on small screens, can we stack it?'] },
]

function TypingBubblesDemo() {
  const users = useWalkers(CHATTY)
  return <LiveCursors users={users} className={`h-80 w-[40rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface ${dots}`} />
}

export const TypingBubbles: Story = {
  name: 'Typing bubbles',
  parameters: { docs: { description: { story: 'A message under the name: what someone is typing, letter by letter, or just said. It pops in under the tag and wraps at a readable width.' } } },
  render: () => <TypingBubblesDemo />,
}

const TRAVELERS: Walker[] = [
  { id: 'ada', name: 'Ada', status: 'editing', cx: 0.5, cy: 0.5, rx: 0.42, ry: 0.4, pace: 2, phase: 0 },
  { id: 'lin', name: 'Lin', status: 'viewing', cx: 0.2, cy: 0.2, rx: 0.1, ry: 0.1, pace: 3, phase: 0.2 },
]

function FollowAUserDemo() {
  const users = useWalkers(TRAVELERS)
  const [following, setFollowing] = useState<string | null>('ada')
  return (
    <div className="flex w-[40rem] max-w-[calc(100vw-2rem)] flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-ui-sm text-fg-muted">{following ? `Following ${users.find((u) => u.id === following)?.name}` : 'Press an avatar to follow'}</span>
        <PresenceAvatars users={users} following={following} onFollowingChange={setFollowing} />
      </div>
      <div tabIndex={0} role="region" aria-label="Board" className="h-80 overflow-auto yj-scrollbar rounded-2xl border border-line bg-canvas focus-ring">
        <LiveCursors users={users} following={following} className={`h-[1200px] w-full max-w-[1800px] ${dots}`} />
      </div>
    </div>
  )
}

export const FollowAUser: Story = {
  name: 'Follow a user',
  parameters: { docs: { description: { story: 'The board is larger than its view. Following Ada keeps her cursor in view as she moves; press her avatar again to stop.' } } },
  render: () => <FollowAUserDemo />,
}

export const ReducedMotion: Story = {
  name: 'Reduced motion',
  globals: { reducedMotion: 'always' },
  parameters: { docs: { description: { story: 'Motion is set to reduced for this story: each cursor jumps to its latest position, and cursors appear, go idle and leave without fading.' } } },
  args: { idleAfter: 3000 },
  render: (args) => <PlaygroundDemo {...args} />,
}
