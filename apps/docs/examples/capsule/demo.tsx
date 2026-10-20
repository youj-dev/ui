'use client'

import { useState } from 'react'
import { CpuIcon, LayersIcon, MaximizeIcon, ScissorsIcon, WandIcon } from '@youj/icons'
import { Button, Capsule, CapsuleSearch, CapsuleStepper, CapsuleToggle, StatPill } from '@youj/react'

export default function CapsuleDemo() {
  const [tool, setTool] = useState('cut')
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <CapsuleToggle
        aria-label="Tool"
        iconOnly
        value={tool}
        onValueChange={setTool}
        options={[
          { value: 'cut', label: 'Blade', icon: <ScissorsIcon size={16} /> },
          { value: 'layer', label: 'Layers', icon: <LayersIcon size={16} /> },
          { value: 'fx', label: 'Effects', icon: <WandIcon size={16} /> },
        ]}
      />
      <CapsuleStepper label="Tempo" defaultValue={124} min={60} max={200} unit="BPM" />
      <StatPill label="DSP" value={38} unit="%" icon={<CpuIcon />} trend={[22, 30, 26, 35, 31, 38]} />
      <CapsuleSearch shortcut="/" placeholder="Find a sample" />
      {/* A bare capsule holds your own controls. */}
      <Capsule>
        <Button variant="ghost" size="icon" aria-label="Full screen">
          <MaximizeIcon size={16} />
        </Button>
      </Capsule>
    </div>
  )
}
