'use client'

import { useState } from 'react'
import { Button, Field, FieldDescription, FieldLabel, Textarea } from '@youj/react'

const PASTED = `# Production
DATABASE_URL=postgres://web@db.internal.youj.io:5432/youj?sslmode=require
REDIS_URL=redis://cache.internal.youj.io:6379/0
SESSION_TTL=86400
LOG_LEVEL=info`

// A variable is a KEY=value line. Comments and blank lines don't count.
const countVariables = (text: string) => text.split('\n').filter((line) => /^\s*[A-Za-z_]\w*\s*=/.test(line)).length
const variables = (n: number) => (n === 1 ? '1 variable' : `${n} variables`)

export default function TextareaFixed() {
  const [env, setEnv] = useState(PASTED)
  const [imported, setImported] = useState(0)
  const count = countVariables(env)

  return (
    <form
      className="w-full max-w-md"
      onSubmit={(event) => {
        event.preventDefault()
        setImported(count)
      }}
    >
      <Field>
        <FieldLabel>Paste a .env file</FieldLabel>
        {/* A fixed six rows, and long values scroll sideways instead of wrapping onto the next line. */}
        <Textarea
          value={env}
          onChange={(event) => {
            setEnv(event.target.value)
            setImported(0)
          }}
          placeholder="KEY=value, one per line"
          rows={6}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          className="field-sizing-fixed font-mono text-ui-sm"
        />
        <FieldDescription>One KEY=value per line; long values scroll sideways. Keys that already exist in Production are overwritten.</FieldDescription>
      </Field>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p role="status" className="text-ui-sm text-fg-muted">
          {imported > 0 && `Imported ${variables(imported)}.`}
        </p>
        <Button type="submit" disabled={count === 0}>
          {count > 0 ? `Import ${variables(count)}` : 'Import'}
        </Button>
      </div>
    </form>
  )
}
