'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Kbd,
  KbdGroup,
} from '@youj/react'
import { useYouj } from '@youj/core'
import { CopyIcon, EyeIcon, SearchIcon } from '@youj/icons'

const KEY = 'pk_demo_51N8fTq2eZvKYlo2C9w'

export default function InputGroupDemo() {
  const k = useYouj()
  const [copied, setCopied] = useState(false)
  const [shown, setShown] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  function copy() {
    void navigator.clipboard?.writeText(KEY).catch(() => {})
    setCopied(true)
    clearTimeout(timer.current)
    // The check holds for three deliberate steps, the same hold as a Button's onAction.
    timer.current = setTimeout(() => setCopied(false), k.ms('deliberate') * 3)
  }

  return (
    <FieldGroup className="w-full max-w-sm">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput aria-label="Search" placeholder="Search projects, people, docs…" />
        <InputGroupAddon align="inline-end">
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </InputGroupAddon>
      </InputGroup>
      <Field>
        <FieldLabel>Publishable key</FieldLabel>
        <InputGroup>
          <InputGroupInput readOnly defaultValue={KEY} className="font-mono text-ui-sm" />
          <InputGroupAddon align="inline-end">
            {/* CopyIcon is a state icon: `active` morphs it to a check. */}
            <InputGroupButton size="icon-xs" aria-label="Copy key" onClick={copy}>
              <CopyIcon active={copied} />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>Safe to ship in client code.</FieldDescription>
        <span role="status" className="sr-only">
          {copied ? 'Key copied' : ''}
        </span>
      </Field>
      <Field>
        <FieldLabel>Database password</FieldLabel>
        <InputGroup>
          <InputGroupInput type={shown ? 'text' : 'password'} defaultValue="correct-horse-battery" autoComplete="off" />
          <InputGroupAddon align="inline-end">
            {/* The name says what pressing does, and aria-pressed says whether it's on. */}
            <InputGroupButton size="icon-xs" aria-label="Show password" aria-pressed={shown} onClick={() => setShown((s) => !s)}>
              <EyeIcon active={shown} />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </FieldGroup>
  )
}
