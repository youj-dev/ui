import { useState } from 'react'
import { ThemeScope } from '@youj/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Note, Specimen } from '../../stories/kit'
import { Field, FieldDescription, FieldLabel } from './field'
import { FilterChips } from './filter-chips'

const meta: Meta<typeof FilterChips> = {
  title: 'UI/Inputs/Filter chips',
  component: FilterChips,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A filter query as chips (`label:bug`, `priority:in(p1,p2)`) with a field for the next one, in a filled well. The TagInput’s model for text that is a query: a token ends at a space, never inside brackets or quotes, and a finished `key:value` becomes a chip as you type the space after it (or press Enter). Click a chip, or focus it and press Enter, to edit it; Backspace or Delete removes it. Chips are keyed by their field, so a filter that mirrors a control updates in place. `validate` rejects a token with a reason: the frame shakes, the reason grows in under it and is read out. Reduced motion: no shake or glide.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FilterChips>

const FIELDS = ['label', 'priority', 'assignee', 'repo']

function checkToken(token: string) {
  const match = /^([a-z]+):(.+)$/.exec(token)
  if (!match) return 'Write a filter as field:value, e.g. assignee:me.'
  if (!FIELDS.includes(match[1]!)) return `There’s no ${match[1]} field. Try ${FIELDS.join(', ')}.`
}

function IssueSearch() {
  const [tokens, setTokens] = useState(['label:bug', 'priority:in(p1,p2)'])
  return (
    <Frame className="w-[34rem] max-w-full p-5">
      <Field>
        <FieldLabel>Issues</FieldLabel>
        <FilterChips value={tokens} onValueChange={setTokens} validate={checkToken} />
        <FieldDescription>Type assignee:me and a space. Try repo with no value, or color:red.</FieldDescription>
      </Field>
    </Frame>
  )
}

/** Type `assignee:me` and a space, or paste `repo:web priority:in(p1, p2)`. Backspace from the empty field reaches the chips. */
export const Hero: Story = {
  name: 'Issue search',
  render: () => <IssueSearch />,
}

export const Variants: Story = {
  render: () => (
    <div className="grid w-[34rem] max-w-full gap-8">
      <Specimen label="empty">
        <FilterChips aria-label="Filters" />
      </Specimen>
      <Specimen label="long tokens wrap and truncate">
        <FilterChips
          aria-label="Filters"
          defaultValue={['priority:in(p0,p1,p2,p3,unsorted)', 'repo:"a very long repository name that keeps going past the edge of the field"', 'label:bug']}
        />
      </Specimen>
      <Specimen label="disabled">
        <FilterChips aria-label="Filters" defaultValue={['label:bug', 'priority:in(p1,p2)']} disabled />
      </Specimen>
    </div>
  ),
}

/** Under RTL the chips flow from the right and the arrow keys follow the reading direction. */
export const RightToLeft: Story = {
  render: () => (
    <ThemeScope dir="rtl">
      <div dir="rtl" className="w-[34rem] max-w-full">
        <FilterChips aria-label="عوامل التصفية" defaultValue={['label:bug', 'priority:in(p1,p2)']} />
      </div>
    </ThemeScope>
  ),
}

/** Reduced motion (toolbar): a rejected token doesn't shake and chips don't glide; the reason and the duplicate flash still show. */
export const ReducedMotion: Story = {
  render: () => (
    <div className="flex w-[34rem] max-w-full flex-col gap-3">
      <Note>Set Motion to reduced in the toolbar, then add color:red, or label:bug again.</Note>
      <IssueSearch />
    </div>
  ),
}
