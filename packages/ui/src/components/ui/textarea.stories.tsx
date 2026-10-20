import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Specimen } from '../../stories/kit'
import { Button } from './button'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'
import { Textarea } from './textarea'

const meta: Meta<typeof Textarea> = {
  title: 'UI/Primitives/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A textarea rendered through Base UI\'s field control, so it is labeled, described and validated exactly like Input. It grows with its content (CSS field-sizing) from three lines up to 16rem, then scrolls; browsers without field-sizing fall back to a resizable box. Same border, hover and focus treatment as Input.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Textarea>

const LIMIT = 280

function Feedback() {
  const [value, setValue] = useState('')
  const left = LIMIT - value.length
  return (
    <form className="w-full max-w-[440px]" onSubmit={(e) => e.preventDefault()}>
      <Field invalid={left < 0}>
        <FieldLabel>What could be better?</FieldLabel>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="The more specific, the more useful."
        />
        <div className="flex items-center justify-between gap-3">
          {left < 0 ? (
            <FieldError>{`${-left} characters over the limit`}</FieldError>
          ) : (
            <FieldDescription>Goes straight to the team that owns it.</FieldDescription>
          )}
          {/* Counts silently; only the last 20 characters are announced. */}
          <span className="shrink-0 font-mono text-ui-xs text-fg-muted tabular-nums" aria-hidden>
            {left}
          </span>
        </div>
        <span className="sr-only" aria-live="polite">
          {left >= 0 && left <= 20 ? `${left} characters left` : ''}
        </span>
      </Field>
      <div className="mt-3 flex justify-end">
        <Button type="submit" disabled={left < 0 || value.trim() === ''}>
          Send feedback
        </Button>
      </div>
    </form>
  )
}

/** Type past the limit: the count turns into an error, and only the final stretch is announced. */
export const Hero: Story = {
  render: () => <Feedback />,
}

export const States: Story = {
  render: () => (
    <div className="grid w-full max-w-[560px] grid-cols-2 gap-x-6 gap-y-5">
      <Specimen label="empty">
        <Textarea aria-label="Empty" placeholder="Write a reply…" />
      </Specimen>
      <Specimen label="filled (grows)">
        <Textarea
          aria-label="Filled"
          defaultValue={'Shipped the new pricing page.\nFollow-ups: OG image, redirects from /plans, and the changelog entry.'}
        />
      </Specimen>
      <Specimen label="invalid">
        <Textarea aria-label="Invalid" aria-invalid defaultValue="Too short" />
      </Specimen>
      <Specimen label="disabled">
        <Textarea aria-label="Disabled" disabled defaultValue="Locked while the release is in review." />
      </Specimen>
    </div>
  ),
}
