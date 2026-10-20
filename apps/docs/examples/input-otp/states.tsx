'use client'

import { InputOTP, type OTPStatus } from '@youj/react'

const STATES: { label: string; value: string; status?: OTPStatus; disabled?: boolean }[] = [
  { label: 'Verifying', value: '424242', status: 'verifying' },
  { label: 'Success', value: '424242', status: 'success' },
  { label: 'Error', value: '123456', status: 'error' },
  { label: 'Disabled', value: '42', disabled: true },
]

export default function InputOTPStates() {
  return (
    <dl className="grid gap-5">
      {STATES.map((state) => (
        <div key={state.label} className="grid gap-1.5">
          <dt className="text-ui-sm text-fg-muted">{state.label}</dt>
          <dd>
            <InputOTP aria-label={`${state.label} code`} defaultValue={state.value} status={state.status} disabled={state.disabled} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
