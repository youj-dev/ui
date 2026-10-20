import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Specimen } from '../../stories/kit'
import { AvatarUpload } from './avatar-upload'

const meta: Meta<typeof AvatarUpload> = {
  title: 'UI/Inputs/AvatarUpload',
  component: AvatarUpload,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A profile photo you can replace. Pick or drop an image on the avatar and frame it in a circular crop: drag to move, and pinch, scroll or slide to zoom (1–4×, anchored on the circle’s center). The photo tracks the pointer 1:1; pulled past an edge it gives with resistance and springs back on the smooth spring, so the circle is always filled, and a thirds grid shows while it moves. Arrows move it, + and − zoom, 0 resets. Save draws the crop to a canvas and hands `onSave` a square File, through Button’s onAction (spinner, drawn check), then the dialog closes. Reduced motion: it clamps instead of springing back.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AvatarUpload>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function Profile({ initial = null as string | null }) {
  const [src, setSrc] = useState<string | null>(initial)
  return (
    <AvatarUpload
      src={src}
      name="Ada Lovelace"
      fallback="AL"
      size={72}
      onSave={async (file) => {
        await wait(900)
        setSrc(URL.createObjectURL(file))
      }}
      onRemove={() => setSrc(null)}
    />
  )
}

/** Upload, crop and save a profile photo. */
export const Hero: Story = {
  render: () => <Profile />,
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {[48, 64, 96].map((size) => (
        <Specimen key={size} label={`${size}px`}>
          <AvatarUpload size={size} fallback="KL" onSave={() => wait(600)} />
        </Specimen>
      ))}
    </div>
  ),
}

export const Disabled: Story = {
  render: () => <AvatarUpload disabled fallback="AL" onSave={() => {}} />,
}

/** Reduced motion: the photo clamps at the circle's edge instead of springing back. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <Profile />
    </YoujProvider>
  ),
}
