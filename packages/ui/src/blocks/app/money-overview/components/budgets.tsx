'use client'

import { useLocale } from '@youj/core'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Progress, ProgressValue } from '../../../../components/ui/progress'
import { cn } from '../../../../lib/utils'
import { BUDGETS } from '../data'
import { fmt, HIDDEN } from '../format'

export function Budgets({ hidden }: { hidden: boolean }) {
  const locale = useLocale()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budgets</CardTitle>
        <CardDescription>September · 4 days left</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {BUDGETS.map((b) => {
          const over = b.spent > b.limit
          return (
            <Progress
              key={b.id}
              value={Math.min(100, (b.spent / b.limit) * 100)}
              aria-label={`${b.label}: ${fmt(locale).format(b.spent)} of ${fmt(locale).format(b.limit)}${over ? ', over budget' : ''}`}
              className={cn(over && '[&_[data-slot=progress-indicator]]:bg-warning')}
            >
              <span className="text-ui text-fg">{b.label}</span>
              <ProgressValue className="flex items-center gap-1">
                {() => (
                  <span className={cn('contents', over && 'text-warning-text')}>
                    {hidden ? HIDDEN : `${fmt(locale).format(b.spent)} / ${fmt(locale).format(b.limit)}`}
                    {over && <span className="font-medium">· over</span>}
                  </span>
                )}
              </ProgressValue>
            </Progress>
          )
        })}
      </CardContent>
    </Card>
  )
}
