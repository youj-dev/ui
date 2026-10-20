'use client'

import { useState } from 'react'
import { ColorOpacityField, InspectorPanel, InspectorRow, ScrubNumberField } from '@youj/react'

const TYPES = [
  { value: 'drop', label: 'Drop shadow' },
  { value: 'inner', label: 'Inner shadow' },
]

export default function InspectorPanelDemo() {
  const [type, setType] = useState('drop')
  const [enabled, setEnabled] = useState(true)
  const [visible, setVisible] = useState(true)
  return (
    <div className="w-full max-w-sm">
      <InspectorPanel
        title={TYPES.find((t) => t.value === type)!.label}
        types={TYPES}
        type={type}
        onTypeChange={setType}
        enabled={enabled}
        onEnabledChange={setEnabled}
        visible={visible}
        onVisibleChange={setVisible}
        onAdd={() => {}}
        onRemove={() => {}}
      >
        <InspectorRow label="Position">
          <ScrubNumberField size="sm" aria-label="X" label="X" defaultValue={0} />
          <ScrubNumberField size="sm" aria-label="Y" label="Y" defaultValue={8} />
        </InspectorRow>
        <InspectorRow label="Blur">
          <ScrubNumberField size="sm" aria-label="Blur" label="B" defaultValue={24} min={0} />
        </InspectorRow>
        <InspectorRow label="Color">
          <ColorOpacityField size="sm" aria-label="Color" defaultValue={{ color: '#1d2a6b', opacity: 45 }} />
        </InspectorRow>
      </InspectorPanel>
    </div>
  )
}
