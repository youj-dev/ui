'use client'

import { Alert, AlertDescription, AlertTitle } from '@youj/react'

export default function AlertVariants() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <Alert variant="info">
        <AlertTitle>Scheduled maintenance on October 3</AlertTitle>
        <AlertDescription>The dashboard is read-only from 02:00 to 02:20 UTC. Deployments keep serving.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertTitle>youj.io is verified</AlertTitle>
        <AlertDescription>DNS records match. HTTPS certificates are issued automatically.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertDescription>Your API token “CI deploys” expires in 3 days.</AlertDescription>
      </Alert>
      <Alert variant="danger">
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>
          The card ending 4242 was declined. <a href="#billing">Update your payment method</a> to keep deploying.
        </AlertDescription>
      </Alert>
    </div>
  )
}
