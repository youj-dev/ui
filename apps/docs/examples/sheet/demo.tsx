'use client'

import { useState, type FormEvent } from 'react'
import {
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Switch,
} from '@youj/react'
import { SlidersIcon } from '@youj/icons'
import { IllustrationServerRack, LineGrid } from '@youj/illustrations'

const regions = { fra1: 'Frankfurt (fra1)', iad1: 'Washington, D.C. (iad1)', sfo1: 'San Francisco (sfo1)', hnd1: 'Tokyo (hnd1)' }

export default function SheetDemo() {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('Production · fra1')

  function save(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    // Stands in for the request to your API.
    setTimeout(() => {
      setSaving(false)
      setOpen(false)
      setStatus('Settings saved · applies to the next deployment')
    }, 900)
  }

  return (
    <div className="flex w-full max-w-sm items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex min-w-0 flex-col">
        <span className="text-ui font-semibold text-fg">orion</span>
        <span role="status" className="truncate text-ui-sm text-fg-muted">
          {status}
        </span>
      </div>
      <Sheet open={open} onOpenChange={(next) => !saving && setOpen(next)}>
        <SheetTrigger render={<Button variant="outline" size="sm" />}>
          <SlidersIcon />
          Settings
        </SheetTrigger>
        <SheetContent>
          {/* The form wraps header, body and footer, so the footer's Save submits it. */}
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <SheetHeader>
              <SheetTitle>Project settings</SheetTitle>
              <SheetDescription>Changes apply to the next deployment.</SheetDescription>
            </SheetHeader>
            <SheetBody>
              {/* Decorative: with no title the scene is hidden from assistive tech. */}
              <div className="relative isolate grid shrink-0 place-items-center overflow-hidden rounded-lg border border-line py-2">
                <LineGrid gap={16} />
                <IllustrationServerRack unit={10} />
              </div>
              <FieldGroup>
                <Field>
                  <FieldLabel>Project name</FieldLabel>
                  <Input defaultValue="orion" readOnly={saving} />
                </Field>
                <Field>
                  <FieldLabel>Build command</FieldLabel>
                  <Input defaultValue="pnpm build" readOnly={saving} className="font-mono" />
                  <FieldDescription>Runs in the project root after install.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel>Function region</FieldLabel>
                  <Select items={regions} defaultValue="fra1">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(regions).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel>Preview comments</FieldLabel>
                    <FieldDescription>Reviewers can comment on preview deployments.</FieldDescription>
                  </FieldContent>
                  <Switch defaultChecked />
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel>Protect previews</FieldLabel>
                    <FieldDescription>Only members can open preview links.</FieldDescription>
                  </FieldContent>
                  <Switch />
                </Field>
              </FieldGroup>
            </SheetBody>
            <SheetFooter>
              <SheetClose render={<Button variant="outline" disabled={saving} />}>Cancel</SheetClose>
              <Button type="submit" loading={saving} loadingLabel="Saving">
                Save changes
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
