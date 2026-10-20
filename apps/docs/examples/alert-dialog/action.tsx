'use client'

import { useState } from 'react'
import type { AsyncState } from '@youj/motion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Field,
  FieldLabel,
  Switch,
} from '@youj/react'
import { HistoryIcon } from '@youj/icons'
import { LoaderOffshoot } from '@youj/loaders/offshoot'

// Stands in for the request to your API.
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function AlertDialogActionDemo() {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<AsyncState>('idle')
  const [live, setLive] = useState('4f2a91c')
  const [failNext, setFailNext] = useState(false)

  async function rollBack() {
    await wait(1200)
    if (failNext) throw new Error('The build for 3f9c2a1 has expired')
    setLive('3f9c2a1')
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-ui font-medium text-fg">Production</span>
          <span className="font-mono text-ui-sm text-fg-muted">acme.dev · {live}</span>
        </div>
        {/* While the rollback runs, the dialog can't be dismissed. */}
        <AlertDialog open={open} onOpenChange={(next) => state !== 'pending' && setOpen(next)}>
          <AlertDialogTrigger
            render={<Button variant="outline" size="sm" disabled={live === '3f9c2a1'} focusableWhenDisabled />}
          >
            <HistoryIcon />
            Roll back
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              {/* While it runs, the badge plays the commit history; the action's label announces the wait. */}
              <AlertDialogMedia>{state === 'pending' ? <LoaderOffshoot size={28} label={null} /> : <HistoryIcon />}</AlertDialogMedia>
              <AlertDialogTitle>Roll back production?</AlertDialogTitle>
              <AlertDialogDescription>acme.dev serves 3f9c2a1, from yesterday, until the next promotion.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={state === 'pending'}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onAction={rollBack}
                pendingLabel="Rolling back…"
                successLabel="Rolled back"
                errorLabel="Rollback failed"
                onActionStateChange={(next) => {
                  // Close once the success has shown and settled. After an error, stay open to retry.
                  if (next === 'idle' && state === 'success') setOpen(false)
                  setState(next)
                }}
              >
                Roll back to 3f9c2a1
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Field orientation="horizontal" className="border-t border-line pt-3">
        <Switch checked={failNext} onCheckedChange={setFailNext} />
        <FieldLabel className="font-normal text-fg-muted">Make the next rollback fail</FieldLabel>
      </Field>
    </div>
  )
}
