import type { Meta, StoryObj } from '@storybook/react-vite'
import { CodeBlock } from './code-block'

const meta: Meta<typeof CodeBlock> = {
  title: 'UI/Display/Code Block',
  component: CodeBlock,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A block of code on a recessed panel: a header with the file name or language and a copy button, then the code, highlighted as tokens (never HTML) and scrolling sideways instead of wrapping. Copy writes a check onto the CopyIcon and announces it; a refused clipboard says so. Optional line numbers in a gutter that holds still while the code scrolls. The same block the chat renders.',
      },
    },
  },
  args: { language: 'tsx' },
}
export default meta
type Story = StoryObj<typeof CodeBlock>

const COMPONENT = `'use client'

import { AsyncButton } from '@youj/react'
import { useYouj } from '@youj/core'

export function SaveButton({ onSave }: { onSave: () => Promise<void> }) {
  const k = useYouj() // Speed and reduced motion reach every animation
  return (
    <AsyncButton onAction={onSave} pendingLabel="Saving…">
      Save changes
    </AsyncButton>
  )
}`

/** A component file, named in the header, with line numbers. */
export const Hero: Story = {
  args: { code: COMPONENT, filename: 'components/save-button.tsx', lineNumbers: true },
  render: (args) => (
    <div className="w-full max-w-[560px]">
      <CodeBlock {...args} />
    </div>
  ),
}

/** A one-line command: the language labels the header. */
export const Command: Story = {
  args: { code: 'pnpm dlx @youj/cli@latest init', language: 'sh' },
  render: (args) => (
    <div className="w-full max-w-[420px]">
      <CodeBlock {...args} />
    </div>
  ),
}

/** A long line scrolls sideways; the gutter stays put. */
export const LongLines: Story = {
  args: {
    language: 'json',
    filename: 'registry.json',
    lineNumbers: true,
    code: `{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "youj",
  "items": [{ "name": "code-block", "type": "registry:ui", "registryDependencies": ["button", "scroll-area", "tooltip", "youj-ui-core"] }]
}`,
  },
  render: (args) => (
    <div className="w-full max-w-[420px]">
      <CodeBlock {...args} />
    </div>
  ),
}

/** A diff: inserted and deleted lines in their inks. */
export const Diff: Story = {
  args: {
    language: 'diff',
    code: `- import { Check } from 'lucide-react'
+ import { CheckIcon } from '@youj/icons'
  export function Done() {
-   return <Check />
+   return <CheckIcon trigger="mount" />
  }`,
  },
  render: (args) => (
    <div className="w-full max-w-[480px]">
      <CodeBlock {...args} />
    </div>
  ),
}
