'use client'

import { useId, useState } from 'react'
import { useLabels, useLocale } from '@youj/core'
import { SparklesIcon, XIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Progress, ProgressLabel, ProgressValue } from '../../components/ui/progress'
import { SidebarCard, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../../components/ui/sidebar'
import { useFrameCompact } from './shell'
import { numberFormat } from '../../lib/utils'

/* The plan, above a frame sidebar's footer: the kit's SidebarCard holding
 * what's used of it as a meter and the way up as the ink key. With no `plan`
 * and no `action` it is the meter alone ("Credits used 810 / 3,100"). It can
 * be dismissed for the session. Where the sidebar is narrow (collapsed to
 * icons, a rail) it folds to one sparkle that says the same in its tooltip
 * and name. */

interface FrameUpgradeCardProps {
  /** The plan you're on, as the card's title. Default "Free plan"; `null` for the meter alone. */
  plan?: string | null
  /** What the meter counts. Default "Projects". */
  label?: string
  used?: number
  limit?: number
  /** The call to action. Default "Upgrade to Pro"; `null` leaves the button out. */
  action?: string | null
  onUpgrade?: () => void
  /** Adds a close button; the card stays gone until the frame reloads. */
  dismissible?: boolean
  /** The numbers' locale. Default: the provider's. */
  locale?: string
  className?: string
}

function FrameUpgradeCard({
  plan = 'Free plan',
  label = 'Projects',
  used = 3,
  limit = 5,
  action = 'Upgrade to Pro',
  onUpgrade,
  dismissible = true,
  locale: localeProp,
  className,
}: FrameUpgradeCardProps) {
  const compact = useFrameCompact()
  const labels = useLabels()
  const locale = useLocale(localeProp)
  const titleId = useId()
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  const number = numberFormat(locale)

  if (compact) {
    const name = action ?? label
    return (
      <SidebarMenu data-slot="frame-upgrade-card">
        <SidebarMenuItem>
          <SidebarMenuButton tooltip={name} aria-label={name} onClick={onUpgrade} data-yj-trigger="" className="size-8 justify-center p-0 text-accent-text">
            <SparklesIcon size={16} strokeWidth={1.75} />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // A region named by the plan (or the meter), so the card is findable and nothing in the sidebar sits outside a landmark.
  return (
    <SidebarCard data-slot="frame-upgrade-card" role="region" aria-labelledby={titleId} className={className}>
      {plan && (
        <div className="flex items-center gap-2 pe-6">
          <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-md bg-accent-subtle text-accent-text">
            <SparklesIcon size={14} strokeWidth={1.75} trigger="mount" />
          </span>
          <span id={titleId} className="truncate text-ui font-medium text-fg">
            {plan}
          </span>
        </div>
      )}
      {dismissible && (
        <Button variant="ghost" size="icon-xs" aria-label={labels.dismiss} onClick={() => setDismissed(true)} className="absolute end-2 top-2 text-fg-muted">
          <XIcon />
        </Button>
      )}
      <Progress value={used} max={limit} className="gap-y-1.5">
        <ProgressLabel id={plan ? undefined : titleId} className="text-ui-sm font-normal text-fg-muted">
          {label}
        </ProgressLabel>
        <ProgressValue className="text-ui-sm tabular-nums">{() => `${number.format(used)} / ${number.format(limit)}`}</ProgressValue>
      </Progress>
      {action && (
        <Button size="sm" onClick={onUpgrade} className="w-full" data-yj-trigger="">
          {action}
        </Button>
      )}
    </SidebarCard>
  )
}

export { FrameUpgradeCard }
export type { FrameUpgradeCardProps }
