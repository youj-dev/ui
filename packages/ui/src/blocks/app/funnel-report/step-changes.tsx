'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { DiffBar } from '../../../components/ui/diff-bar'
import type { FunnelReportCopy } from './copy'
import type { Step } from './data'

const PERCENT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 0 }

/** Each step's conversion against the eight weeks before: the side that did better lights up. */
function StepChanges({ steps, copy }: { steps: Step[]; copy: FunnelReportCopy }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{copy.stepsTitle}</CardTitle>
        <CardDescription>{copy.stepsDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-4" aria-label={copy.stepsList}>
          {steps.slice(1).map((step) => (
            <li key={step.id}>
              <DiffBar
                a={step.previousRate}
                b={step.rate}
                max={1}
                label={step.name}
                names={[copy.previousPeriod, copy.thisPeriod]}
                format={PERCENT}
                tone="chart-1"
                segments={10}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export { StepChanges }
