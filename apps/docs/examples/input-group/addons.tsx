'use client'

import type { ReactNode } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@youj/react'
import { AtSignIcon, GlobeIcon, SearchIcon } from '@youj/icons'

export default function InputGroupAddons() {
  return (
    <div className="@container w-full max-w-xl">
      <div className="grid gap-x-6 gap-y-5 @md:grid-cols-2">
        <Specimen label="prefix text · end icon">
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>https://</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput aria-label="Domain" placeholder="youj.io" className="ps-0.5" />
            <InputGroupAddon align="inline-end">
              <GlobeIcon />
            </InputGroupAddon>
          </InputGroup>
        </Specimen>
        <Specimen label="prefix · suffix">
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>$</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput aria-label="Monthly budget" defaultValue="2,400" inputMode="decimal" className="tabular-nums" />
            <InputGroupAddon align="inline-end">
              <InputGroupText>USD / month</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </Specimen>
        <Specimen label="invalid">
          <InputGroup>
            <InputGroupAddon>
              <AtSignIcon />
            </InputGroupAddon>
            <InputGroupInput aria-label="Handle" defaultValue="priya raman" aria-invalid />
          </InputGroup>
        </Specimen>
        <Specimen label="disabled">
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput aria-label="Search logs" placeholder="Search is paused during maintenance" disabled />
          </InputGroup>
        </Specimen>
      </div>
    </div>
  )
}

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-ui-xs text-fg-muted">{label}</p>
      {children}
    </div>
  )
}
