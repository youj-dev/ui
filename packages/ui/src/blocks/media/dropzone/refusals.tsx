'use client'

import { useState } from 'react'
import { Collapse } from '@youj/motion'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import type { MediaDropzoneCopy } from './data'
import type { Refusals as RefusalsState } from './use-files'

/* What wasn't added, in one alert under the zone: a reason per file (the
 * first five, the rest a press away) and, quietly, the system files a folder
 * brought along. It grows in with Collapse and is dismissed the same way;
 * the zone's description points at it while it's there. */

const SHOWN = 5

export function Refusals({
  id,
  refusals,
  copy,
  onDismiss,
}: {
  id: string
  refusals: RefusalsState | null
  copy: MediaDropzoneCopy
  onDismiss: () => void
}) {
  const [all, setAll] = useState(false)
  // A new set of refusals starts folded again.
  const [seen, setSeen] = useState(refusals)
  if (seen !== refusals) {
    setSeen(refusals)
    setAll(false)
  }
  const rejected = refusals?.rejected ?? []
  const hidden = all ? 0 : Math.max(0, rejected.length - SHOWN)
  return (
    <Collapse open={!!refusals}>
      {refusals && rejected.length > 0 && (
        <Alert id={id} variant="warning" open onOpenChange={() => onDismiss()} dismissLabel={copy.dismiss}>
          <AlertTitle>{copy.refusedTitle(rejected.length)}</AlertTitle>
          <AlertDescription>
            <ul className="flex flex-col gap-0.5">
              {rejected.slice(0, all ? undefined : SHOWN).map((r, i) => (
                <li key={`${r.name}-${i}`} className="break-words">
                  {r.reason}
                </li>
              ))}
            </ul>
            {hidden > 0 && (
              <Button variant="link" size="xs" className="h-auto px-0" onClick={() => setAll(true)}>
                {copy.refusedMore(hidden)}
              </Button>
            )}
            {refusals.skipped > 0 && <p className="text-fg-muted">{copy.skipped(refusals.skipped)}</p>}
          </AlertDescription>
        </Alert>
      )}
      {refusals && rejected.length === 0 && refusals.skipped > 0 && (
        <p id={id} className="px-1 text-ui-sm text-fg-muted">
          {copy.skipped(refusals.skipped)}
        </p>
      )}
    </Collapse>
  )
}
