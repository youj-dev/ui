'use client'

import { MoreHorizontalIcon } from '@youj/icons'
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@youj/react'

const USAGE = [
  { label: 'Bandwidth', value: 812, max: 1000, unit: 'GB' },
  { label: 'Build minutes', value: 2140, max: 6000, unit: 'min' },
  { label: 'Storage', value: 7.4, max: 10, unit: 'GB' },
]

const amount = (value: number, max: number, unit: string) => `${value.toLocaleString('en-US')} of ${max.toLocaleString('en-US')} ${unit}`

export default function CardDemo() {
  return (
    <Card className="w-full max-w-md">
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
        {USAGE.map(({ label, value, max, unit }) => (
          <Progress key={label} value={value} max={max} getAriaValueText={() => amount(value, max, unit)}>
            <ProgressLabel>{label}</ProgressLabel>
            <ProgressValue>{() => amount(value, max, unit)}</ProgressValue>
          </Progress>
        ))}
      </CardContent>
      <CardFooter className="justify-between gap-4">
        <span className="text-ui-sm text-fg-muted">Pro plan · $20 per month</span>
        <Button size="sm">Upgrade</Button>
      </CardFooter>
    </Card>
  )
}
