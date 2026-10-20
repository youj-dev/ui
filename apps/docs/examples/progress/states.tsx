'use client'

import { Progress, ProgressLabel, ProgressValue } from '@youj/react'

export default function ProgressStates() {
  return (
    <div className="grid w-full max-w-lg gap-x-8 gap-y-6 sm:grid-cols-2">
      <Progress value={37}>
        <ProgressLabel>Build minutes</ProgressLabel>
        <ProgressValue />
      </Progress>
      <Progress value={100}>
        <ProgressLabel>Migration</ProgressLabel>
        <ProgressValue />
      </Progress>
      {/* A null value is indeterminate: a band sweeps the track until the work can be measured. */}
      <Progress value={null}>
        <ProgressLabel>Preparing the build</ProgressLabel>
      </Progress>
      {/* `format` shapes the value; the readout and the spoken text both add the total. */}
      <Progress
        value={7.4}
        max={10}
        format={{ style: 'unit', unit: 'gigabyte', maximumFractionDigits: 1 }}
        locale="en-US"
        getAriaValueText={(formatted) => `${formatted} of 10 GB`}
      >
        <ProgressLabel>Storage</ProgressLabel>
        <ProgressValue>{(formatted) => `${formatted} of 10 GB`}</ProgressValue>
      </Progress>
    </div>
  )
}
