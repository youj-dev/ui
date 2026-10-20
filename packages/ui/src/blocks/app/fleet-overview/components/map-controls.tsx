'use client'

import { CrosshairIcon, MinusIcon, PlusIcon } from '@youj/icons'
import { Button } from '../../../../components/ui/button'
import { Kbd } from '../../../../components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../components/ui/tooltip'
import { cn } from '../../../../lib/utils'
import { glass } from '../model'
import type { Harbor } from '../use-harbor'

export function MapControls({ harbor: { map, selected } }: { harbor: Harbor }) {
  return (
    <div role="group" aria-label="Map" className={cn('flex flex-col overflow-hidden rounded-xl p-0.5', glass)}>
      {[
        { label: 'Zoom in', key: '+', icon: <PlusIcon size={16} />, run: () => map.current?.zoomBy(1.4) },
        { label: 'Zoom out', key: '−', icon: <MinusIcon size={16} />, run: () => map.current?.zoomBy(1 / 1.4) },
        { label: selected ? 'Frame the voyage' : 'Frame the fleet', key: '0', icon: <CrosshairIcon size={16} />, run: () => map.current?.fit() },
      ].map((c) => (
        <Tooltip key={c.label}>
          <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={c.label} onClick={c.run} data-yj-trigger="" />}>{c.icon}</TooltipTrigger>
          <TooltipContent side="inline-start">
            {c.label} <Kbd>{c.key}</Kbd>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
