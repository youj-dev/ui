'use client'

import { Banner, BannerTitle, Button, useSessionTimeout } from '@youj/react'

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

export default function SessionTimeoutHook() {
  // The clock without the dialog: draw the warning yourself, here as a banner over the page.
  const session = useSessionTimeout({ timeout: 20_000, warnBefore: 10_000, channel: false })
  return (
    <div className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface">
      {session.status === 'warning' && (
        <Banner variant="warning">
          <BannerTitle>
            <strong>Signing out in {clock(session.secondsLeft)}.</strong>
          </BannerTitle>
          <Button size="sm" onClick={() => void session.extend()}>
            Stay signed in
          </Button>
        </Banner>
      )}
      {session.status === 'signedOut' && (
        <Banner variant="inverse">
          <BannerTitle>You've been signed out.</BannerTitle>
          <Button size="sm" variant="outline" onClick={session.reset}>
            Sign in again
          </Button>
        </Banner>
      )}
      <div className="flex items-center justify-between gap-3 p-5">
        <p className="text-ui text-fg">
          Status: <span className="font-medium">{session.status}</span>
        </p>
        <Button variant="outline" size="sm" onClick={session.simulateIdle}>
          Simulate idle
        </Button>
      </div>
    </div>
  )
}
