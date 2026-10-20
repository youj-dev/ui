'use client'

import { Reveal, ScrambleText } from '@youj/motion'
import { CopyIcon } from '@youj/icons'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import type { ApiKeysCopy } from './data'

export function SecretReveal({ value, onDone, product, copy }: { value: string; onDone: () => void; product: string; copy: ApiKeysCopy }) {
  return (
    <Reveal inView={false} variant="rise" className="flex flex-col gap-4">
      <Alert variant="warning">
        <AlertTitle>{copy.copyNow}</AlertTitle>
        <AlertDescription>{copy.shownOnce(product)}</AlertDescription>
      </Alert>
      <div className="flex items-center gap-2 rounded-md border border-line bg-transparent p-2 ps-3">
        <code className="min-w-0 flex-1 truncate font-mono text-ui text-fg" aria-label={copy.secret}>
          <ScrambleText trigger="mount">{value}</ScrambleText>
        </code>
        <AsyncButton
          variant="outline"
          size="sm"
          successLabel={copy.copied}
          errorLabel={copy.copyFailed}
          onAction={() => navigator.clipboard?.writeText(value)}
        >
          <CopyIcon size={14} /> {copy.copySecret}
        </AsyncButton>
      </div>
      <DialogFooter>
        <Button onClick={onDone}>{copy.saved}</Button>
      </DialogFooter>
    </Reveal>
  )
}

export function RolledDialog({ rolled, onClose, product, copy }: { rolled?: { name: string; secret: string }; onClose: () => void; product: string; copy: ApiKeysCopy }) {
  return (
    <Dialog open={!!rolled} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{copy.rolledTitle(rolled?.name ?? '')}</DialogTitle>
          <DialogDescription>{copy.rolledDescription}</DialogDescription>
        </DialogHeader>
        {rolled && <SecretReveal value={rolled.secret} onDone={onClose} product={product} copy={copy} />}
      </DialogContent>
    </Dialog>
  )
}
