'use client'

import { PartyPopperIcon } from '@youj/icons'
import { toast } from '@youj/react/components/ui/toast'

/** The last task handed off: the one moment Tandem makes a fuss, a popper going off in the toast. */
export function celebrate(project: string) {
  toast(
    <span className="flex items-center gap-2">
      <PartyPopperIcon size={16} strokeWidth={2} trigger="mount" className="shrink-0 text-accent" />
      Ready for launch
    </span>,
    { description: `Every task on the ${project} runway is handed off.` },
  )
}
