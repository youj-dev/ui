'use client'

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@youj/react'

export default function AlertDemo() {
  return (
    <div className="flex w-full max-w-xl flex-col">
      {/* The gap is the alert's own margin, so it collapses away with the alert. */}
      <Alert variant="warning" dismissible className="mb-4">
        <AlertTitle>You’ve used 82% of this month’s bandwidth</AlertTitle>
        <AlertDescription>
          At 100% we keep serving traffic and bill overage at $0.15 per GB. Raise the limit or upgrade to avoid surprises.
        </AlertDescription>
        <AlertAction>
          <Button size="sm">Upgrade to Pro</Button>
          <Button size="sm" variant="ghost">
            Set a spend limit
          </Button>
        </AlertAction>
      </Alert>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Hobby plan</CardTitle>
          <CardDescription>1 concurrent build · community support</CardDescription>
          <CardAction>
            <Badge variant="secondary">Current</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Progress value={82} getAriaValueText={() => '82 of 100 GB'}>
            <ProgressLabel>Bandwidth</ProgressLabel>
            <ProgressValue>{() => '82 of 100 GB'}</ProgressValue>
          </Progress>
        </CardContent>
      </Card>
    </div>
  )
}
