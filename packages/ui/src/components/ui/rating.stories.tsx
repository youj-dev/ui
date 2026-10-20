import { useId, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { HeartIcon } from '@youj/icons'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Specimen } from '../../stories/kit'
import { AsyncButton } from './async-button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card'
import { Field, FieldDescription, FieldLabel } from './field'
import { Rating } from './rating'
import { Textarea } from './textarea'

const meta: Meta<typeof Rating> = {
  title: 'UI/Inputs/Rating',
  component: Rating,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A rating in stars, or any Youj or lucide-style icon, in whole or half steps. It is one focusable slider (“3.5 of 5 stars”): arrows step, Home and End go to none and full, a digit jumps, Backspace clears, and RTL flips both the keys and the fill. Each icon sits in its own key, in a row like a segmented control’s segments: empty, a key on a control-line hairline with a muted outline; filled, the accent with the icon solid in its contrast color, clipped to each key’s share. Hovering previews the value under the pointer: the fill sweeps there one tight stagger step per key, the key under the pointer lifts, and keys of the committed value keep a faint accent tint while the preview sits below them. `onPreviewChange` reports the preview so a readout can say what a click would set. Clicking commits (clicking the current value again clears it): the key presses in and springs back on the settle spring, the ones before it ripple, and a glint opens around it. `readOnly` is a labeled image. Reduced motion: the fill snaps and nothing lifts, presses or glints.',
      },
    },
  },
  args: { max: 5, allowHalf: false, readOnly: false, disabled: false, size: 'default' },
}
export default meta
type Story = StoryObj<typeof Rating>

function Review() {
  const [rating, setRating] = useState(0)
  const [preview, setPreview] = useState<number | null>(null)
  const shown = preview ?? rating
  const labelId = useId()
  const words = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']
  return (
    <Card className="w-full max-w-[380px]">
      <CardHeader>
        <CardTitle>How was your stay?</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field>
          <FieldLabel id={labelId}>Overall</FieldLabel>
          <div className="flex items-center gap-3">
            <Rating
              aria-labelledby={labelId}
              value={rating}
              onValueChange={setRating}
              onPreviewChange={setPreview}
              allowHalf
              size="lg"
            />
            {/* What a click would set while the pointer hovers, then what's set. */}
            <span aria-hidden className={`text-ui tabular-nums transition-colors yj-duration-fast ease-standard ${preview === null ? 'text-fg' : 'text-fg-muted'}`}>
              {shown ? (
                <>
                  {shown} <span className="text-fg-subtle">of 5</span> · {words[Math.ceil(shown)]}
                </>
              ) : (
                <span className="text-fg-subtle">Tap to rate</span>
              )}
            </span>
          </div>
        </Field>
        <Field>
          <FieldLabel>Anything to add?</FieldLabel>
          <Textarea placeholder="The view, the breakfast, the bed…" />
          <FieldDescription>Reviews are public and show your first name.</FieldDescription>
        </Field>
      </CardContent>
      <CardFooter className="justify-end">
        <AsyncButton disabled={!rating} onAction={() => new Promise((r) => setTimeout(r, 800))} successLabel="Thanks!">
          Post review
        </AsyncButton>
      </CardFooter>
    </Card>
  )
}

/** A review form: half stars, a sweeping hover preview with a readout of what a click would set, and a press with a glint when you commit. */
export const Hero: Story = {
  render: () => <Review />,
}

export const Playground: Story = {
  render: (args) => <Rating aria-label="Rating" defaultValue={3} {...args} />,
}

/** Read-only ratings, as in a list of products. */
export const ReadOnly: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[
        ['Linen overshirt', 4.5, 128],
        ['Merino crew', 4, 86],
        ['Canvas tote', 3.5, 41],
      ].map(([name, value, count]) => (
        <div key={name} className="flex w-72 items-center justify-between gap-3">
          <span className="text-ui">{name}</span>
          <span className="flex items-center gap-2">
            <Rating readOnly value={value as number} allowHalf size="sm" />
            <span className="text-ui-sm text-fg-muted tabular-nums">({count})</span>
          </span>
        </div>
      ))}
    </div>
  ),
}

/** Any icon: hearts, and a 10-point scale. */
export const CustomIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <Specimen label="hearts">
        <Rating aria-label="How much did you love it?" icon={HeartIcon} unit="hearts" defaultValue={4} className="[&_[data-slot=rating-fill]]:text-danger" />
      </Specimen>
      <Specimen label="max 10, sm">
        <Rating aria-label="Score" max={10} size="sm" defaultValue={7} />
      </Specimen>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <Specimen label="empty">
        <Rating aria-label="Rating" />
      </Specimen>
      <Specimen label="half">
        <Rating aria-label="Rating" allowHalf defaultValue={2.5} />
      </Specimen>
      <Specimen label="disabled">
        <Rating aria-label="Rating" disabled defaultValue={3} />
      </Specimen>
      <Specimen label="RTL">
        <div dir="rtl">
          <Rating aria-label="Rating" allowHalf defaultValue={3.5} />
        </div>
      </Specimen>
    </div>
  ),
}

/** Reduced motion: the fill snaps and nothing lifts, presses or glints. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <Review />
    </YoujProvider>
  ),
}
