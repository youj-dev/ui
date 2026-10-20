'use client'

import { GlobeIcon, MegaphoneIcon, TagIcon, UsersIcon } from '@youj/icons'
import { ContributionList } from '@youj/react'

export default function ContributionListDemo() {
  return (
    <ContributionList
      className="w-full max-w-lg rounded-2xl border border-line bg-surface p-2"
      aria-label="What moves next week’s signups"
      baseline={{ label: 'A normal week', value: 1_840 }}
      items={[
        { icon: <MegaphoneIcon />, label: 'Launch post', detail: 'Goes out Tuesday to 48k subscribers', value: 310 },
        { icon: <UsersIcon />, label: 'Referral credit', detail: 'Doubled for the week', value: 145 },
        { icon: <GlobeIcon />, label: 'New region', detail: 'Checkout opens in Brazil on Thursday', value: 90 },
        { icon: <TagIcon />, label: 'Price change', detail: 'Starter goes from €9 to €12', value: -120 },
      ]}
      total={{ label: 'Expected next week', detail: 'Range 2,180 to 2,340' }}
    />
  )
}
