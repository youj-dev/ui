'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock, LockOpen } from 'lucide-react'
import { IconSwap } from '@youj/icons'
import { Field, FieldDescription, FieldLabel, InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@youj/react'

export default function IconSwapLucide() {
  const [shown, setShown] = useState(false)

  return (
    <Field className="w-full max-w-sm">
      <FieldLabel>Deploy hook secret</FieldLabel>
      <InputGroup>
        <InputGroupAddon>
          {/* Decorative: the button below carries the state. */}
          <IconSwap from={Lock} to={LockOpen} active={shown} transition="morph" size={16} />
        </InputGroupAddon>
        <InputGroupInput readOnly type={shown ? 'text' : 'password'} defaultValue="whsec_demo_notreal0" className="font-mono text-ui-sm" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Show secret" aria-pressed={shown} onClick={() => setShown((s) => !s)}>
            <IconSwap from={Eye} to={EyeOff} active={shown} transition="morph" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldDescription>Signs every payload sent to your deploy hook. Keep it server-side.</FieldDescription>
    </Field>
  )
}
