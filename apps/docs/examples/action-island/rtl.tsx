'use client'

import { CodeIcon, EyeIcon, LayersIcon, LinkIcon, SparklesIcon } from '@youj/icons'
import { ActionIsland, ActionIslandGroup, ActionIslandMark, ActionIslandSeparator, ActionIslandTile } from '@youj/react'

export default function ActionIslandRtl() {
  return (
    // An Arabic interface: the tiles run from the right and the arrow keys rove the other way.
    <div dir="rtl" lang="ar">
      <ActionIsland aria-label="إجراءات المعاينة">
        <ActionIslandMark aria-hidden>
          <LayersIcon />
        </ActionIslandMark>
        <ActionIslandGroup aria-label="العرض">
          <ActionIslandTile label="معاينة" pressed>
            <EyeIcon />
          </ActionIslandTile>
          <ActionIslandTile label="الكود" pressed={false}>
            <CodeIcon />
          </ActionIslandTile>
        </ActionIslandGroup>
        <ActionIslandSeparator />
        <ActionIslandTile label="نسخ الرابط">
          <LinkIcon />
        </ActionIslandTile>
        <ActionIslandTile label="فتح" variant="primary" showLabel>
          <SparklesIcon />
        </ActionIslandTile>
      </ActionIsland>
    </div>
  )
}
