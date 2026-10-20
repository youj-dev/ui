'use client'

import { ChoiceCard, ChoiceCardGroup, FieldLegend, FieldSet } from '@youj/react'
import { EyeIcon, ShieldIcon, SquarePenIcon, WalletIcon } from '@youj/icons'

const ACCESS = [
  { value: 'manage', icon: <ShieldIcon />, title: 'Manage', description: 'Members, billing and every project' },
  { value: 'build', icon: <SquarePenIcon />, title: 'Build', description: 'Create, edit and publish projects' },
  { value: 'review', icon: <EyeIcon />, title: 'Review', description: 'Comment on and approve changes' },
  { value: 'billing', icon: <WalletIcon />, title: 'Billing', description: 'Invoices and payment methods only' },
]

export default function ChoiceCardDemo() {
  return (
    <FieldSet className="w-full max-w-lg">
      <FieldLegend variant="label">Access level</FieldLegend>
      <ChoiceCardGroup defaultValue="build" name="access" columns={2}>
        {ACCESS.map((access) => (
          <ChoiceCard key={access.value} {...access} />
        ))}
      </ChoiceCardGroup>
    </FieldSet>
  )
}
