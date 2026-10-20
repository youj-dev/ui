'use client'

import { useState } from 'react'
import { Button, SessionSignedOut, SessionTimeout } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function Account({ onSimulate }: { onSimulate: () => void }) {
  return (
    <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-5">
      <p className="text-ui-sm text-fg-muted">Current account</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-fg tabular-nums">£4,218.60</p>
      <p className="mt-3 text-ui-sm text-fg-muted">The timers here are shortened: 20 seconds idle, warned 10 seconds before. Real sessions use minutes.</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onSimulate}>
        Simulate idle
      </Button>
    </div>
  )
}

export default function SessionTimeoutDemo() {
  // Signing in again starts a new session: here, by remounting.
  const [session, setSession] = useState(0)
  return (
    <SessionTimeout
      key={session}
      timeout={20_000}
      warnBefore={10_000}
      channel="docs-session-timeout-demo"
      onExtend={() => wait(800)}
      signedOut={<SessionSignedOut className="min-h-[340px] w-full" onSignIn={() => setSession((n) => n + 1)} />}
    >
      {({ simulateIdle }) => <Account onSimulate={simulateIdle} />}
    </SessionTimeout>
  )
}
