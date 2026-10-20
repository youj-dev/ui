'use client'

import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldLabel,
  Input,
  Switch,
} from '@youj/react'
import { ArrowLeftRightIcon, SettingsIcon } from '@youj/icons'
import { IllustrationDelivery, IllustrationPadlock, LineGrid } from '@youj/illustrations'

export default function DialogNested() {
  const [transferOpen, setTransferOpen] = useState(false)
  const [workspace, setWorkspace] = useState('')
  const [requested, setRequested] = useState('')

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <SettingsIcon />
        Project settings
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        {/* Decorative: with no title the scene is hidden from assistive tech. */}
        <div className="relative isolate grid place-items-center overflow-hidden rounded-lg border border-line py-2">
          <LineGrid gap={16} />
          <IllustrationPadlock unit={10} />
        </div>
        <DialogHeader>
          <DialogTitle>Orion settings</DialogTitle>
          <DialogDescription>
            {requested ? `Transfer to ${requested} requested.` : 'Visibility, previews and ownership.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col divide-y divide-line rounded-lg border border-line">
          <Field orientation="horizontal" className="justify-between p-3">
            <FieldLabel>Public preview links</FieldLabel>
            <Switch defaultChecked />
          </Field>
          <Field orientation="horizontal" className="justify-between p-3">
            <FieldLabel>Comments on previews</FieldLabel>
            <Switch />
          </Field>
          <div className="flex items-center justify-between gap-3 p-3">
            <div className="flex flex-col">
              <span className="text-ui font-medium text-fg">Transfer ownership</span>
              <span className="text-ui-sm text-fg-muted">Move Orion to another workspace.</span>
            </div>
            {/* A dialog inside a dialog: opening it pushes this one a step back. */}
            <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
              <DialogTrigger render={<Button variant="outline" size="sm" />}>
                <ArrowLeftRightIcon />
                Transfer…
              </DialogTrigger>
              <DialogContent>
                <form
                  className="flex flex-col gap-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    setRequested(workspace.trim() || 'acme-labs')
                    setTransferOpen(false)
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Decorative: with no title the scene is hidden from assistive tech. */}
                    <IllustrationDelivery unit={9} className="-my-4 -mx-2 shrink-0" />
                    <DialogHeader>
                      <DialogTitle>Transfer Orion</DialogTitle>
                      <DialogDescription>Deployments keep running. Members of this workspace lose access.</DialogDescription>
                    </DialogHeader>
                  </div>
                  <Field>
                    <FieldLabel>Destination workspace</FieldLabel>
                    <Input value={workspace} onChange={(event) => setWorkspace(event.target.value)} placeholder="acme-labs" />
                  </Field>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                    <Button type="submit">Request transfer</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button />}>Done</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
