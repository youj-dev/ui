'use client'

import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@youj/react'
import { InfoIcon, MoreHorizontalIcon } from '@youj/icons'

const QUEUES = [
  { name: 'Preview builds', minutes: '1,284', share: '46%' },
  { name: 'Production', minutes: '812', share: '29%' },
  { name: 'Scheduled jobs', minutes: '503', share: '18%' },
  { name: 'Docs', minutes: '196', share: '7%' },
]

export default function CardPanel() {
  return (
    <TooltipProvider>
      <Card variant="panel" className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            Build minutes
            <Tooltip>
              <TooltipTrigger render={<Button variant="ghost" size="icon-xs" aria-label="About build minutes" />}>
                <InfoIcon />
              </TooltipTrigger>
              <TooltipContent>Minutes billed this cycle, by queue.</TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardAction>
            <Button variant="outline" size="icon-xs" aria-label="Build minutes options">
              <MoreHorizontalIcon />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-medium tracking-tight tabular-nums">2,795</span>
            <Badge variant="success">−8% vs last cycle</Badge>
          </div>
          <ul className="divide-y divide-dashed divide-line">
            {QUEUES.map((queue) => (
              <li key={queue.name} className="flex items-center gap-3 py-2">
                <span className="flex-1">{queue.name}</span>
                <span className="font-medium tabular-nums">{queue.minutes}</span>
                <span className="w-9 text-end text-ui-sm text-fg-muted tabular-nums">{queue.share}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
