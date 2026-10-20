'use client'

import { ShareRing } from '@youj/react'
import { Demo, TileCard } from './demo'

const STORAGE = [
  { id: 'media', label: 'Media', value: 412 },
  { id: 'backups', label: 'Backups', value: 268 },
  { id: 'docs', label: 'Documents', value: 141 },
]

/** Storage by type: point at a part, in the ring or its legend, to read its share. */
export default function ShareTile() {
  return (
    <Demo>
      <TileCard className="max-w-72">
        <div className="flex items-baseline justify-between">
          <span className="text-ui font-semibold text-fg">Storage</span>
          <span className="text-ui-sm text-fg-muted">821 GB used</span>
        </div>
        <ShareRing segments={STORAGE} unit="GB" />
      </TileCard>
    </Demo>
  )
}
