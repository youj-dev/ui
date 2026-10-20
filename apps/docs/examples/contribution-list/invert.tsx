'use client'

import { CloudIcon, CpuIcon, DatabaseIcon, PackageIcon } from '@youj/icons'
import { ContributionList } from '@youj/react'

export default function ContributionListInvert() {
  return (
    <ContributionList
      className="w-full max-w-lg rounded-2xl border border-line bg-surface p-2"
      aria-label="October cost bridge"
      invert
      format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
      baseline={{ label: 'September bill', value: 18_420 }}
      items={[
        { icon: <CpuIcon />, label: 'Reserved instances', detail: 'Committed for a year from Oct 1', value: -3_150 },
        { icon: <DatabaseIcon />, label: 'Database growth', detail: 'Two read replicas added', value: 1_280 },
        { icon: <CloudIcon />, label: 'Egress', detail: 'Video exports doubled', value: 940 },
        { icon: <PackageIcon />, label: 'Retired staging', detail: 'Three idle clusters removed', value: -1_610 },
      ]}
      total={{ label: 'October forecast' }}
    />
  )
}
