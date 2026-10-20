import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core'
import { BoldIcon, CodeIcon, ItalicIcon, LinkIcon, ListIcon, ListOrderedIcon, QuoteIcon, RocketIcon, StrikethroughIcon } from '@youj/icons'
import { Button } from './button'
import { Kbd, KbdGroup } from './kbd'
import { Separator } from './separator'
import { Toggle } from './toggle'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

const meta: Meta<typeof TooltipContent> = {
  title: 'UI/Overlays/Tooltip',
  component: TooltipContent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI tooltip: a short visual label on hover or keyboard focus. It arrives from its trigger (motion’s yj-tooltip: a 3px drift off the trigger’s side, scale .97 and a fade on the fast token) and leaves on the instant token. In a TooltipProvider, once one tooltip is showing its neighbors open at once and without animation, so scanning a toolbar is immediate. Light theme: an ink chip; dark theme: a lifted neutral chip with a hairline, never a light panel. Keycaps inside adapt. Icon-only triggers keep an aria-label that matches the tooltip. Reduced motion: instant.',
      },
    },
  },
  argTypes: {
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
  },
  args: { side: 'top' },
}
export default meta
type Story = StoryObj<typeof TooltipContent>

type Tool = { label: string; icon: typeof BoldIcon; keys: string[]; pressed?: boolean }
const groups: Tool[][] = [
  [
    { label: 'Bold', icon: BoldIcon, keys: ['⌘', 'B'], pressed: true },
    { label: 'Italic', icon: ItalicIcon, keys: ['⌘', 'I'] },
    { label: 'Strikethrough', icon: StrikethroughIcon, keys: ['⌘', '⇧', 'X'] },
    { label: 'Inline code', icon: CodeIcon, keys: ['⌘', 'E'] },
  ],
  [
    { label: 'Link', icon: LinkIcon, keys: ['⌘', 'K'] },
    { label: 'Quote', icon: QuoteIcon, keys: ['⌘', '⇧', '.'] },
  ],
  [
    { label: 'Bulleted list', icon: ListIcon, keys: ['⌘', '⇧', '8'] },
    { label: 'Numbered list', icon: ListOrderedIcon, keys: ['⌘', '⇧', '7'] },
  ],
]

function FormattingToolbar(args: Story['args']) {
  return (
    <div className="w-[30rem] overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <TooltipProvider>
        <div role="group" aria-label="Formatting" className="flex items-center gap-0.5 border-b border-line p-1.5">
          {groups.map((group, i) => (
            <div key={i} className="flex items-center gap-0.5">
              {i > 0 && <Separator orientation="vertical" className="mx-1 h-5" />}
              {group.map((tool) => (
                <Tooltip key={tool.label}>
                  <TooltipTrigger
                    render={<Toggle size="sm" aria-label={tool.label} defaultPressed={tool.pressed} />}
                  >
                    <tool.icon />
                  </TooltipTrigger>
                  <TooltipContent {...args}>
                    {tool.label}
                    <KbdGroup>
                      {tool.keys.map((k) => (
                        <Kbd key={k}>{k}</Kbd>
                      ))}
                    </KbdGroup>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </TooltipProvider>
      <p className="px-4 py-3 text-ui text-fg-muted">
        Ship notes for <span className="font-semibold text-fg">4.2</span>: faster previews, and comments that
        sync with your tracker.
      </p>
    </div>
  )
}

/** An editor toolbar in one TooltipProvider: rest on one button, then sweep across the rest. */
export const Hero: Story = {
  render: (args) => <FormattingToolbar {...args} />,
}

const sides = ['top', 'right', 'bottom', 'left'] as const

/** Each side drifts in from its trigger. */
export const Sides: Story = {
  render: () => (
    <TooltipProvider>
      <div className="grid grid-cols-2 gap-3">
        {sides.map((side) => (
          <Tooltip key={side}>
            <TooltipTrigger render={<Button variant="outline" className="w-28 capitalize" />}>{side}</TooltipTrigger>
            <TooltipContent side={side}>Opens on the {side}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  ),
}

/**
 * A disabled action that explains itself. The button stays focusable (so keyboard users get the reason) and
 * takes the pointer back from Button's disabled style, so hovering it works too; presses still do nothing.
 */
export const OnADisabledButton: Story = {
  render: (args) => (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button disabled focusableWhenDisabled className="cursor-not-allowed data-disabled:pointer-events-auto" />
        }
      >
        <RocketIcon />
        Deploy
      </TooltipTrigger>
      <TooltipContent {...args}>Deploys are paused while the build runs</TooltipContent>
    </Tooltip>
  ),
}

/** Long labels wrap to a balanced block, capped at max-w-xs. */
export const LongLabel: Story = {
  render: (args) => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>Hover me</TooltipTrigger>
      <TooltipContent {...args}>
        Preview deployments are built for every push and expire after 30 days unless you promote them.
      </TooltipContent>
    </Tooltip>
  ),
}

/* A phone's version: the subtree is forced to touch (keeping the toolbar's
 * Speed and Motion settings) in a phone-wide column. */
const onTouch: Decorator = (Story, context) => (
  <YoujProvider
    device="touch"
    timeScale={Number(context.globals.timeScale ?? 1)}
    reducedMotion={(context.globals.reducedMotion as ReducedMotionSetting | undefined) ?? 'user'}
  >
    <div className="mx-auto flex w-full max-w-sm flex-col items-stretch gap-4">
      <Story />
    </div>
  </YoujProvider>
)

/**
 * Tooltips don't open on touch: a tap is a press. With `longPress`, holding
 * a button shows its name (without the shortcut, which needs a keyboard), the
 * press doesn't toggle it, and the tooltip hides a moment after the finger
 * lifts. The buttons keep their aria-labels, which is what a screen reader
 * reads either way. Tap a button to toggle it; hold one to see its name.
 */
export const Touch: Story = {
  decorators: [onTouch],
  parameters: { layout: 'padded' },
  render: (args) => (
    // Room above the toolbar: a tooltip on touch sits above the finger, not under it.
    <div className="mt-16 overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <TooltipProvider>
        <div role="group" aria-label="Formatting" className="flex flex-wrap items-center gap-1 p-1.5">
          {groups.flat().map((tool) => (
            <Tooltip key={tool.label} longPress>
              <TooltipTrigger render={<Toggle size="sm" aria-label={tool.label} defaultPressed={tool.pressed} />}>
                <tool.icon />
              </TooltipTrigger>
              <TooltipContent {...args}>
                {tool.label}
                <KbdGroup>
                  {tool.keys.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </KbdGroup>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  ),
}
