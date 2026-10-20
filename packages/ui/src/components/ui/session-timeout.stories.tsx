import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Button } from './button'
import { SessionSignedOut, SessionTimeout, useSessionTimeout } from './session-timeout'

const meta: Meta<typeof SessionTimeout> = {
  title: 'UI/Overlays/Session Timeout',
  component: SessionTimeout,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Warns before an inactive session signs out, for banking, admin and health apps. After `timeout` without activity the dialog opens `warnBefore` early (2 minutes by default) with a live countdown, **Stay signed in** (an async `onExtend`) and **Sign out now**. When the time runs out `onTimeout` fires and the app is replaced by a signed-out page. The clock is timestamps, so a hidden tab is right the moment it returns, and tabs share one clock over a BroadcastChannel. The countdown is spoken at the start, each minute and at 30 and 15 seconds; Escape means stay signed in; reduced motion shows a static phrase instead of a ticking clock. The timers in these stories are shortened (20 s, warned 10 s early).',
      },
    },
  },
  argTypes: {
    timeout: { control: 'number' },
    warnBefore: { control: 'number' },
    throttle: { control: 'number' },
    channel: { control: 'text' },
  },
  args: { timeout: 20_000, warnBefore: 10_000, throttle: 1000, channel: false },
}
export default meta
type Story = StoryObj<typeof SessionTimeout>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function Account({ simulateIdle }: { simulateIdle: () => void }) {
  return (
    <div className="w-80 rounded-xl border border-line bg-surface p-5">
      <p className="text-ui-sm text-fg-muted">Current account</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-fg tabular-nums">£4,218.60</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={simulateIdle}>
        Simulate idle
      </Button>
    </div>
  )
}

function Session(args: Story['args']) {
  const [run, setRun] = useState(0)
  return (
    <SessionTimeout
      {...args}
      key={run}
      timeout={args?.timeout ?? 20_000}
      onExtend={() => wait(800)}
      signedOut={<SessionSignedOut className="min-h-[360px] w-full max-w-[480px]" onSignIn={() => setRun((n) => n + 1)} />}
    >
      {({ simulateIdle }) => <Account simulateIdle={simulateIdle} />}
    </SessionTimeout>
  )
}

/** Press Simulate idle to jump to the warning, or leave the page alone for 10 seconds. Stay signed in waits 800 ms, as a server round trip would. */
export const Playground: Story = {
  render: (args) => <Session {...args} />,
}

/** The signed-out page on its own: a warning band, the reason and a way back in. Focus lands on its heading. */
export const SignedOut: Story = {
  name: 'Signed out',
  render: () => <SessionSignedOut className="min-h-[360px] w-full max-w-[480px]" onSignIn={() => {}} />,
}

function BannerSession() {
  const session = useSessionTimeout({ timeout: 20_000, warnBefore: 10_000, channel: false })
  return (
    <div className="flex w-80 flex-col gap-3 rounded-xl border border-line bg-surface p-5 text-ui text-fg">
      <p>
        {session.status}
        {session.status === 'warning' ? `, ${session.secondsLeft} s left` : ''}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={session.simulateIdle}>
          Simulate idle
        </Button>
        <Button size="sm" onClick={() => void session.extend()}>
          Extend
        </Button>
        <Button size="sm" variant="ghost" onClick={session.reset}>
          Reset
        </Button>
      </div>
    </div>
  )
}

/** `useSessionTimeout` is the clock without the dialog, for an app that draws the warning itself. */
export const HookOnly: Story = {
  name: 'Hook only',
  render: () => <BannerSession />,
}

/** Reduced motion: the visible line is a static phrase that changes only when it is spoken (the start, each minute, 30 and 15 seconds). */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Session {...args} />
    </YoujProvider>
  ),
}
