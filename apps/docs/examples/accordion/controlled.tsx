'use client'

import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button } from '@youj/react'
import { ChevronsUpDownIcon } from '@youj/icons'

const ENVIRONMENTS = [
  {
    id: 'production',
    name: 'Production',
    variables: [
      ['DATABASE_URL', 'Encrypted'],
      ['STRIPE_SECRET_KEY', 'Encrypted'],
      ['NEXT_PUBLIC_SITE_URL', 'https://acme.com'],
    ],
  },
  {
    id: 'preview',
    name: 'Preview',
    variables: [
      ['DATABASE_URL', 'Encrypted'],
      ['NEXT_PUBLIC_SITE_URL', 'https://preview.acme.com'],
    ],
  },
  {
    id: 'development',
    name: 'Development',
    variables: [
      ['DATABASE_URL', 'postgres://localhost:5432/acme'],
      ['NEXT_PUBLIC_SITE_URL', 'http://localhost:3000'],
    ],
  },
]

export default function AccordionControlled() {
  // The open items are your state, so anything can change them: here, one button opens or closes them all.
  const [open, setOpen] = useState<string[]>(['production'])
  const allOpen = open.length === ENVIRONMENTS.length

  return (
    <div className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line py-2 ps-4 pe-2">
        <p className="text-ui font-medium text-fg">Environment variables</p>
        <Button variant="ghost" size="sm" onClick={() => setOpen(allOpen ? [] : ENVIRONMENTS.map((env) => env.id))}>
          <ChevronsUpDownIcon size={16} active={allOpen} />
          {allOpen ? 'Collapse all' : 'Expand all'}
        </Button>
      </div>
      <Accordion multiple value={open} onValueChange={setOpen} className="px-4">
        {ENVIRONMENTS.map((env) => (
          <AccordionItem key={env.id} value={env.id}>
            <AccordionTrigger>
              {env.name}
              <span className="ms-auto text-ui-sm font-normal text-fg-muted">{env.variables.length} variables</span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-1.5 font-mono text-ui-sm">
                {env.variables.map(([key, value]) => (
                  <li key={key} className="flex items-baseline justify-between gap-4">
                    <span className="text-fg">{key}</span>
                    <span className="min-w-0 truncate text-fg-muted">{value}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
