'use client'

import { BadgeCheckIcon, CheckIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent } from '../../../components/ui/card'
import type { App, IntegrationsCopy } from './data'
import { Monogram } from './monogram'

/* One section (CardContent), so the card keeps its padding in every style: Bezel pads sections, not the card. */
function AppCard({ app, installed, onOpen, copy, compact }: { app: App; installed: boolean; onOpen: () => void; copy: IntegrationsCopy; compact: (n: number) => string }) {
  return (
    <Card spotlight lift size="sm" className="h-full">
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-start gap-3">
          <Monogram app={app} />
          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="flex items-center gap-1.5 font-semibold text-fg">
              <button type="button" onClick={onOpen} className="truncate text-start outline-none after:absolute after:inset-0 after:rounded-[inherit]">
                {app.name}
              </button>
              {app.verified && <BadgeCheckIcon size={14} aria-label={copy.verified} className="shrink-0 text-accent-text" />}
            </h3>
            <span className="truncate text-ui-sm text-fg-muted">{app.vendor}</span>
          </div>
        </div>
        <p className="line-clamp-2 text-ui text-fg-muted">{app.blurb}</p>
        {/* The end slot shows what the next decision needs: the status once installed, the social proof before. */}
        <div className="mt-auto flex min-h-6 items-center gap-3 text-ui-xs text-fg-muted">
          <span className="min-w-0 truncate">{app.category}</span>
          {installed ? (
            <Badge variant="success" className="ms-auto shrink-0">
              <CheckIcon size={12} strokeWidth={2.5} /> {copy.installed}
            </Badge>
          ) : (
            <span className="ms-auto shrink-0 whitespace-nowrap tabular-nums">{copy.installs(compact(app.installs))}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { AppCard }
