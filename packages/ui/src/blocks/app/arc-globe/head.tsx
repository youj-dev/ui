import type { ElementType } from 'react'
import { PlayIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { CardAction, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { cn } from '../../../lib/utils'
import type { ArcGlobeCopy } from './data'

/* The title (with the Demo data badge on the demo), how many places, and the
 * Live toggle. */

interface HeadProps {
  Title: ElementType
  titleId: string
  copy: ArcGlobeCopy
  count: number
  /** Show the Demo data badge. */
  marker: boolean
  live: boolean
  onLive: () => void
}

export function Head({ Title, titleId, copy, count, marker, live, onLive }: HeadProps) {
  return (
    <CardHeader className="border-b border-line py-[calc(var(--card-spacing)-var(--spacing))]">
      <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Title id={titleId}>{copy.title}</Title>
        {marker && (
          <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
            {copy.demoData}
          </Badge>
        )}
      </CardTitle>
      <CardDescription>{copy.subtitle(count)}</CardDescription>
      <CardAction>
        {/* A toggle: pressed while visitors stream in. */}
        <Button
          variant="secondary"
          size="xs"
          aria-pressed={live}
          aria-label={live ? copy.pause : copy.resume}
          onClick={onLive}
          className="gap-2 font-mono text-ui-sm"
        >
          <span
            aria-hidden
            className={cn(
              'size-1.5 rounded-full transition-[background-color,box-shadow] yj-duration-fast ease-standard',
              live ? 'bg-success shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-success)_22%,transparent)]' : 'bg-line-strong',
            )}
          />
          {live ? copy.live : copy.paused}
          <PlayIcon size={12} active={live} className="text-fg-muted" />
        </Button>
      </CardAction>
    </CardHeader>
  )
}
