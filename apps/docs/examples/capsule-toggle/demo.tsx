'use client'

import { useState } from 'react'
import { LayoutGridIcon, LayoutListIcon } from '@youj/icons'
import { CapsuleToggle } from '@youj/react'

export default function CapsuleToggleDemo() {
  const [monitor, setMonitor] = useState('mix')
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <CapsuleToggle
        label="Monitor"
        value={monitor}
        onValueChange={setMonitor}
        options={[
          { value: 'source', label: 'Source' },
          { value: 'mix', label: 'Mix' },
          { value: 'master', label: 'Master' },
        ]}
      />
      <CapsuleToggle
        aria-label="Layout"
        iconOnly
        defaultValue="grid"
        options={[
          { value: 'grid', label: 'Grid', icon: <LayoutGridIcon size={16} /> },
          { value: 'list', label: 'List', icon: <LayoutListIcon size={16} /> },
        ]}
      />
    </div>
  )
}
