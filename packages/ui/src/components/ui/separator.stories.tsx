import type { Meta, StoryObj } from '@storybook/react-vite'
import { BoldIcon, ItalicIcon, LinkIcon, UnderlineIcon } from '@youj/icons'
import { Button } from './button'
import { FieldSeparator } from './field'
import { Separator } from './separator'

const meta: Meta<typeof Separator> = {
  title: 'UI/Primitives/Separator',
  component: Separator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A hairline in the border token with role="separator" and aria-orientation from Base UI. Vertical separators stretch to their row. For a labeled break inside forms ("or"), use FieldSeparator.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Separator>

export const Hero: Story = {
  render: () => (
    <div className="w-full max-w-[360px] rounded-xl border border-line bg-surface p-5">
      <p className="text-ui-lg font-medium text-fg">youj/ui</p>
      <p className="mt-1 text-ui text-fg-muted">Accessible primitives, animated through @youj/motion.</p>
      <Separator className="my-4" />
      <div className="flex h-5 items-center gap-3 text-ui text-fg-muted">
        <span>Docs</span>
        <Separator orientation="vertical" />
        <span>Source</span>
        <Separator orientation="vertical" />
        <span>Changelog</span>
      </div>
    </div>
  ),
}

export const InToolbar: Story = {
  render: () => (
    <div className="flex h-control items-center gap-1 rounded-lg border border-line bg-surface px-1">
      <Button variant="ghost" size="icon-sm" aria-label="Bold">
        <BoldIcon />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Italic">
        <ItalicIcon />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Underline">
        <UnderlineIcon />
      </Button>
      <Separator orientation="vertical" className="mx-1 my-1.5" />
      <Button variant="ghost" size="icon-sm" aria-label="Link">
        <LinkIcon />
      </Button>
    </div>
  ),
}

export const Labelled: Story = {
  render: () => (
    <div className="grid w-72 gap-4">
      <Button variant="outline">Continue with GitHub</Button>
      <FieldSeparator>or</FieldSeparator>
      <Button variant="outline">Continue with email</Button>
    </div>
  ),
}
