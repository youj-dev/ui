'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldLabel, PasswordInput, PasswordStrength } from '@youj/react'

// A length-only policy for passphrases: every five characters earns a step.
const scoreLength = (password: string) => Math.min(4, Math.floor(password.length / 5))

export default function PasswordInputCustomScorer() {
  const [value, setValue] = useState('correct horse battery staple')

  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>Passphrase</FieldLabel>
      <PasswordInput autoComplete="new-password" value={value} onValueChange={setValue} placeholder="four random words" />
      <PasswordStrength value={value} scorer={scoreLength} labels={['Too short', 'Short', 'Okay', 'Long', 'Passphrase']} />
      <FieldDescription>Four or more words beat any symbol.</FieldDescription>
    </Field>
  )
}
