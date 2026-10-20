'use client'

import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import { useLocale } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { dataTableConfirmLabels } from '@youj/core/labels'
import { ConfirmDialog, type ConfirmDialogProps } from '../alert-dialog'
import { Button } from '../button'
import { useDataTableReturnFocus } from './data-table-grid-nav'

export interface DataTableConfirmActionProps {
  /** The action, as a verb: "Delete". */
  label: string
  /** How many rows it touches. */
  count: number
  /** What the rows are: "orders". */
  noun?: string
  icon?: ReactNode
  /** What happens, in a sentence. Defaults to "This can't be undone." */
  description?: ReactNode
  /** Ask for the count to be typed before it runs. Default: from 3 rows. */
  typeToConfirm?: boolean
  /** Runs the action. A promise keeps the dialog open and busy until it settles; a rejection is shown. */
  onConfirm: () => void | Promise<unknown>
}

interface ConfirmRequest extends DataTableConfirmActionProps {
  trigger: HTMLElement | null
}

const ConfirmContext = createContext<((request: ConfirmRequest) => void) | null>(null)

/**
 * Hosts the bulk actions' confirmations at the table, not in the action bar:
 * a confirmed delete empties the selection and the bar leaves, but the dialog
 * still closes on its own time. If its trigger left with the bar, focus goes
 * back to the grid instead of falling to the page.
 */
export function DataTableConfirmHost({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null)
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLElement | null>(null)
  const finalFocus = useDataTableReturnFocus(trigger)
  const ask = (next: ConfirmRequest) => {
    trigger.current = next.trigger
    setRequest(next)
    setOpen(true)
  }
  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {request && <RequestDialog request={request} open={open} onOpenChange={setOpen} finalFocus={finalFocus} />}
    </ConfirmContext.Provider>
  )
}

function RequestDialog({
  request,
  open,
  onOpenChange,
  finalFocus,
}: {
  request: ConfirmRequest
  open: boolean
  onOpenChange: (open: boolean) => void
  finalFocus: ConfirmDialogProps['finalFocus']
}) {
  const { label, count, noun, icon, description, typeToConfirm = count >= 3, onConfirm } = request
  const locale = useLocale()
  const labels = useComponentLabels(dataTableConfirmLabels)
  const what = labels.itemCount(count.toLocaleString(locale), count, noun ?? labels.rowsNoun)
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      finalFocus={finalFocus}
      destructive
      icon={icon}
      title={labels.confirmTitle(label, what)}
      description={description === undefined ? labels.cannotBeUndone : description}
      confirmLabel={labels.confirmAction(label, what)}
      pendingLabel={labels.confirmPending(label, what)}
      challenge={typeToConfirm ? String(count) : undefined}
      onConfirm={onConfirm}
    />
  )
}

function ConfirmTrigger(props: DataTableConfirmActionProps) {
  const ask = useContext(ConfirmContext)!
  const button = useRef<HTMLButtonElement>(null)
  return (
    <Button
      ref={button}
      variant="ghost"
      size="sm"
      className="own:text-danger-text own:hover:bg-danger-subtle own:hover:text-danger-text"
      onClick={() => ask({ ...props, trigger: button.current })}
    >
      {props.icon}
      {props.label}
    </Button>
  )
}

/**
 * A destructive bulk action behind a ConfirmDialog. The dialog names the
 * count in its title and on its button ("Delete 12 orders"), and from three
 * rows it asks for the count to be typed, the cheapest proof the number was
 * read. A returned promise keeps it open and busy; a failure stays in view.
 */
export function DataTableConfirmAction(props: DataTableConfirmActionProps) {
  const host = useContext(ConfirmContext)
  // Outside a DataTable it brings its own host.
  return host ? (
    <ConfirmTrigger {...props} />
  ) : (
    <DataTableConfirmHost>
      <ConfirmTrigger {...props} />
    </DataTableConfirmHost>
  )
}
