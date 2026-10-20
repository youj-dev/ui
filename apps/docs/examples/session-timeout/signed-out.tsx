'use client'

import { SessionSignedOut } from '@youj/react'

export default function SessionTimeoutSignedOut() {
  return (
    <SessionSignedOut
      className="min-h-[340px] w-full"
      title="Your session has ended"
      description="For your safety we close your NHS account after 15 minutes of inactivity. Nothing you entered was saved."
      signInLabel="Sign in to your account"
      onSignIn={() => {}}
    />
  )
}
