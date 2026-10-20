import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { AudioLinesIcon, CpuIcon, LayersIcon, MaximizeIcon, ScissorsIcon, WandIcon } from '@youj/icons'
import { Specimen } from '../../stories/kit'
import { Button } from './button'
import { Capsule, CapsuleLabel } from './capsule'
import { CapsuleSearch } from './capsule-search'
import { CapsuleStepper } from './capsule-stepper'
import { CapsuleToggle } from './capsule-toggle'
import { StatPill } from './stat-pill'

const meta: Meta<typeof Capsule> = {
  title: 'UI/Capsules/Capsule',
  component: Capsule,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The shell every capsule shares: one row of controls or figures on a floating surface, the control height plus an inset that keeps the discs inside concentric with its ends. Classic draws it as a bordered rounded panel; Bezel makes it a pill lifted on a hairline with a lit top edge (a square theme keeps it square). The family: StatPill (a live figure), CapsulePlayer (now playing), CapsuleStepper (− value +), CapsuleSearch (a search that opens when wanted) and CapsuleToggle (two or three options). Put your own controls in a bare Capsule, with CapsuleLabel for a short eyebrow.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Capsule>

function Tools() {
  const [mode, setMode] = useState('cut')
  return (
    <div className="flex flex-wrap items-center gap-2">
      <CapsuleToggle
        aria-label="Tool"
        iconOnly
        value={mode}
        onValueChange={setMode}
        options={[
          { value: 'cut', label: 'Blade', icon: <ScissorsIcon size={16} /> },
          { value: 'layer', label: 'Layers', icon: <LayersIcon size={16} /> },
          { value: 'fx', label: 'Effects', icon: <WandIcon size={16} /> },
        ]}
      />
      <CapsuleStepper label="Tempo" defaultValue={124} min={60} max={200} unit="BPM" />
      <StatPill label="DSP" value={38} unit="%" icon={<CpuIcon />} trend={[22, 30, 26, 35, 31, 38]} />
      <CapsuleSearch shortcut="/" placeholder="Find a sample" />
    </div>
  )
}

/** The family side by side, as a creative tool's floating controls: a tool toggle, a tempo, a live DSP load and a search. Press `/` to search. */
export const Hero: Story = { render: () => <Tools /> }

/** A bare capsule holds your own controls: ghost icon buttons become discs concentric with its ends. */
export const Shell: Story = {
  render: () => (
    <div className="grid gap-6">
      <Specimen label="icon buttons">
        <Capsule>
          <Button variant="ghost" size="icon" aria-label="Waveform">
            <AudioLinesIcon size={16} />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Full screen">
            <MaximizeIcon size={16} />
          </Button>
        </Capsule>
      </Specimen>
      <Specimen label="label + action, size sm">
        <Capsule size="sm">
          <CapsuleLabel>Export</CapsuleLabel>
          <Button size="sm">Render</Button>
        </Capsule>
      </Specimen>
    </div>
  ),
}
