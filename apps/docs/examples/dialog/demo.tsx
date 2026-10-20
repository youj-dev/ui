'use client'

import { useState, type FormEvent } from 'react'
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
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
} from '@youj/react'
import { PencilIcon } from '@youj/icons'
import { IllustrationDesignTools } from '@youj/illustrations'

const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export default function DialogDemo() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('Orion')
  const [draft, setDraft] = useState(name)
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const invalid = touched && draft.trim() === ''

  function save(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (draft.trim() === '') return
    setSaving(true)
    // Stands in for the request to your API.
    setTimeout(() => {
      setName(draft.trim())
      setSaving(false)
      setOpen(false)
    }, 900)
  }

  return (
    <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-subtle font-mono text-ui-sm font-semibold text-accent-text">
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-ui font-semibold text-fg">{name}</span>
        <span className="truncate text-ui-sm text-fg-muted">acme.dev/{slugify(name)}</span>
      </div>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          // The dialog holds while the save runs, so its outcome isn't hidden.
          if (saving) return
          setOpen(next)
          if (next) {
            setDraft(name)
            setTouched(false)
          }
        }}
      >
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <PencilIcon />
          Rename
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={save} noValidate className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              {/* Decorative: with no title the scene is hidden from assistive tech. */}
              <IllustrationDesignTools unit={9} className="-my-4 -mx-2 shrink-0" />
              <DialogHeader>
                <DialogTitle>Rename project</DialogTitle>
                <DialogDescription>The name shows in the sidebar and in the project’s URL.</DialogDescription>
              </DialogHeader>
            </div>
            <Field invalid={invalid}>
              <FieldLabel>Name</FieldLabel>
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
                readOnly={saving}
                autoComplete="off"
              />
              {invalid ? (
                <FieldError>Enter a name for the project.</FieldError>
              ) : (
                <FieldDescription>acme.dev/{slugify(draft) || '…'}</FieldDescription>
              )}
            </Field>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" disabled={saving} />}>Cancel</DialogClose>
              <Button type="submit" loading={saving} loadingLabel="Saving">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
