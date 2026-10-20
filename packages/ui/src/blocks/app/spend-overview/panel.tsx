'use client'

import type { ReactNode } from 'react'
import { ChevronRightIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'

export type SpendSection = 'requests' | 'audit' | 'personal' | 'leaderboard' | 'billing'

interface PanelProps {
  /** The card's heading (an h2). */
  title: string
  description?: ReactNode
  /** Adds an open button at the head's end. */
  onOpen?: () => void
  /** The open button's name: "Open requests". */
  openLabel?: string
  className?: string
  /** Classes on the content under the head. */
  contentClassName?: string
  children: ReactNode
}

/** A card of the spend page: a heading and a line under it, an optional button that opens the section, then its content. */
function Panel({ title, description, onOpen, openLabel, className, contentClassName, children }: PanelProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {onOpen && (
          <CardAction>
            <Button variant="ghost" size="icon-sm" aria-label={openLabel ?? title} onClick={onOpen}>
              <ChevronRightIcon size={16} className="rtl:-scale-x-100" />
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className={cn('flex flex-1 flex-col gap-4', contentClassName)}>{children}</CardContent>
    </Card>
  )
}

export { Panel }
