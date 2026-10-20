'use client'

import { useState } from 'react'
import { ScrambleText } from '@youj/motion'
import { CopyIcon, EyeIcon, EyeOffIcon, RefreshIcon } from '@youj/icons'
import { ConfirmDialog } from '../../../components/ui/alert-dialog'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Field, FieldDescription, FieldLabel } from '../../../components/ui/field'
import { newSecret, type WebhooksCopy } from './data'

/** The endpoint's secret: masked until revealed (it decodes in), copied, or rotated behind a confirmation. */
export function SigningSecret({ secret, rotate, onRotate, copy }: { secret: string; rotate: () => Promise<unknown> | unknown; onRotate: (secret: string) => void; copy: WebhooksCopy }) {
  const [shown, setShown] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [rotated, setRotated] = useState(false)
  return (
    <Field>
      <FieldLabel>{copy.secret}</FieldLabel>
      <div className="flex flex-col gap-2 rounded-md border border-line bg-transparent p-2 ps-3">
        <code dir="ltr" aria-label={copy.secret} className="min-w-0 truncate py-1 font-mono text-ui-sm text-fg">
          {shown ? (
            <ScrambleText key={secret} trigger="mount">
              {secret}
            </ScrambleText>
          ) : (
            <>
              whsec_<span aria-hidden>{'•'.repeat(20)}</span>
              {secret.slice(-4)}
            </>
          )}
        </code>
        <div className="flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" aria-pressed={shown} onClick={() => setShown((s) => !s)}>
            {shown ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />} {shown ? copy.hide : copy.reveal}
          </Button>
          <AsyncButton variant="outline" size="sm" successLabel={copy.copied} onAction={() => navigator.clipboard?.writeText(secret)}>
            <CopyIcon size={14} /> {copy.copy}
          </AsyncButton>
          <Button variant="ghost" size="sm" className="ms-auto" onClick={() => setRotating(true)}>
            <RefreshIcon size={14} /> {copy.rotate}
          </Button>
        </div>
      </div>
      <FieldDescription aria-live="polite" className={rotated ? 'text-success-text' : undefined}>
        {rotated ? copy.rotated : copy.secretHint}
      </FieldDescription>
      <ConfirmDialog
        open={rotating}
        onOpenChange={setRotating}
        title={copy.rotateTitle}
        description={copy.rotateDescription}
        confirmLabel={copy.rotateConfirm}
        cancelLabel={copy.cancel}
        onConfirm={async () => {
          const next = await rotate()
          onRotate(typeof next === 'string' ? next : newSecret())
          setShown(true)
          setRotated(true)
        }}
      />
    </Field>
  )
}
