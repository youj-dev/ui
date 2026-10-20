'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { BanknoteIcon, BriefcaseIcon, CircleUserIcon } from '@youj/icons'
import { Input, PropertyList, PropertyListItem, PropertyMoney, PropertyPerson, PropertyText } from '@youj/react'

type Key = 'deal' | 'value'

export default function EditableProperties() {
  const [values, setValues] = useState({ deal: 'Inference platform expansion', value: '324000' })
  const [editing, setEditing] = useState<Key | null>(null)
  const rows = useRef<Partial<Record<Key, HTMLDivElement | null>>>({})
  const done = (key: Key) => {
    setEditing(null)
    // Back to the row's edit button once it is rendered again.
    requestAnimationFrame(() => rows.current[key]?.querySelector('button')?.focus())
  }

  // Enter keeps the edit, Escape drops it; either way focus returns to the row's edit button.
  const field = (key: Key, label: string) => (
    <Input
      autoFocus
      aria-label={label}
      defaultValue={values[key]}
      inputMode={key === 'value' ? 'numeric' : undefined}
      className="h-control-sm"
      onBlur={() => setEditing(null)}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') setValues((v) => ({ ...v, [key]: event.currentTarget.value }))
        if (event.key === 'Enter' || event.key === 'Escape') done(key)
      }}
    />
  )

  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-overlay p-5 shadow-sm">
      <PropertyList>
        <PropertyListItem icon={<CircleUserIcon />} label="Owner">
          <PropertyPerson name="Noor Haddad" />
        </PropertyListItem>
        <PropertyListItem ref={(el) => void (rows.current.deal = el)} icon={<BriefcaseIcon />} label="Deal" onEdit={editing ? undefined : () => setEditing('deal')}>
          {editing === 'deal' ? field('deal', 'Deal') : <PropertyText>{values.deal}</PropertyText>}
        </PropertyListItem>
        <PropertyListItem ref={(el) => void (rows.current.value = el)} icon={<BanknoteIcon />} label="Value" onEdit={editing ? undefined : () => setEditing('value')}>
          {editing === 'value' ? field('value', 'Value') : <PropertyMoney value={Number(values.value) || 0} />}
        </PropertyListItem>
      </PropertyList>
    </div>
  )
}
