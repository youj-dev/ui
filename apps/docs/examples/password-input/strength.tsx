'use client'

import { PasswordStrength } from '@youj/react'

const SAMPLES = ['password', 'youj', 'youj42', 'Youj-42', 'Youj-42-motion!']

export default function PasswordInputStrength() {
  return (
    <dl className="grid w-full max-w-sm gap-4">
      {SAMPLES.map((sample) => (
        <div key={sample} className="grid gap-1.5">
          <dt className="font-mono text-ui-sm text-fg-muted">{sample}</dt>
          <dd>
            <PasswordStrength value={sample} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
