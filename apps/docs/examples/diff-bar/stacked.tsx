'use client'

import { Alert, AlertTitle, DiffBar } from '@youj/react'

export default function DiffBarStacked() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
      <DiffBar
        layout="stacked"
        label="Increase for next year"
        names={['Allowed', 'Quoted']}
        a={18_000}
        b={31_500}
        better="lower"
        segments={0}
        format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
        by="$13,500"
      />
      <Alert variant="danger">
        <AlertTitle>The quote is $13,500 over the allowance. Push back before the notice date.</AlertTitle>
      </Alert>
    </div>
  )
}
