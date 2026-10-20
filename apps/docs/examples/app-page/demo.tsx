'use client'

import { AppPage, Button, Stat, StatDelta, StatGroup, StatValue } from '@youj/react'
import { DownloadIcon, PlusIcon } from '@youj/icons'

const FIGURES = [
  { label: 'Requests', value: 4_820_000, previous: 4_610_000 },
  { label: 'Replicas', value: 9, previous: 8 },
  { label: 'Open incidents', value: 2, previous: 3, invert: true },
]

export default function AppPageDemo() {
  return (
    <AppPage
      title="Capacity"
      description="Forecast demand against what you have provisioned."
      width="fill"
      className="w-full"
      actions={
        <>
          <Button variant="outline">
            <DownloadIcon size={16} /> Export
          </Button>
          <Button>
            <PlusIcon size={16} /> Request quota
          </Button>
        </>
      }
    >
      <StatGroup aria-label="This week" className="grid-cols-1 @xl:grid-cols-3">
        {FIGURES.map((f) => (
          <Stat key={f.label} label={f.label}>
            <StatValue value={f.value} from={f.value} />
            <StatDelta value={(f.value - f.previous) / f.previous} invert={f.invert}>
              vs. last week
            </StatDelta>
          </Stat>
        ))}
      </StatGroup>
    </AppPage>
  )
}
