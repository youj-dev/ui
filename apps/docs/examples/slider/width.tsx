'use client'

import { useState } from 'react'
import { MonitorIcon, SmartphoneIcon } from '@youj/icons'
import { Slider } from '@youj/react'

export default function SliderWidth() {
  const [width, setWidth] = useState(768)

  return (
    <div className="flex w-full max-w-md items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2">
      <SmartphoneIcon size={16} className="text-fg-muted" />
      {/* No visible label here, so aria-label names the thumb. */}
      <Slider aria-label="Preview width" value={width} onValueChange={(value) => setWidth(value as number)} min={320} max={1440} step={8} />
      <MonitorIcon size={16} className="text-fg-muted" />
      <span className="w-16 shrink-0 text-end font-mono text-ui-sm text-fg tabular-nums">{width} px</span>
    </div>
  )
}
