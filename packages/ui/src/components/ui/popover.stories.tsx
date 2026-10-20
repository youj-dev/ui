import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { motion } from 'motion/react'
import { YoujProvider } from '@youj/core'
import { MorphLabel, useMorphRoot } from '@youj/motion'
import { CheckIcon, LinkIcon, UserPlusIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from './avatar'
import { Button } from './button'
import { Input } from './input'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from './popover'

const meta: Meta<typeof PopoverContent> = {
  title: 'UI/Overlays/Popover',
  component: PopoverContent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI popover. It grows out of the point it is anchored to (motion’s yj-pop: scale .96 → 1 and a fade on the enter curve, fast token) and leaves on the instant token; reopening mid-close reverses from where it is. Opened with the keyboard it appears at once. Focus moves inside and returns to the trigger; Escape or a press outside closes it. Surface: the popover elevation (white in light, raised in dark), hairline border, md shadow. Reduced motion: instant.',
      },
    },
  },
  argTypes: {
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    sideOffset: { control: { type: 'number', min: 0, max: 24 } },
  },
  args: { side: 'bottom', align: 'end', sideOffset: 6 },
}
export default meta
type Story = StoryObj<typeof PopoverContent>

const people = [
  { name: 'Ada Lovelace', email: 'ada@acme.com', role: 'Owner' },
  { name: 'Grace Hopper', email: 'grace@acme.com', role: 'Editor' },
  { name: 'Alan Turing', email: 'alan@acme.com', role: 'Viewer' },
]

function CopyLinkButton() {
  const [copied, setCopied] = useState(false)
  const morph = useMorphRoot(6)
  return (
    <Button
      variant="outline"
      size="sm"
      render={<motion.button {...morph} />}
      className="overflow-hidden"
      onClick={() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      }}
    >
      <MorphLabel value={copied ? 'copied' : 'copy'} contentClassName="gap-1.5">
        {copied ? (
          <>
            <CheckIcon trigger="mount" size={14} strokeWidth={2} /> Copied
          </>
        ) : (
          <>
            <LinkIcon className="size-3.5" /> Copy link
          </>
        )}
      </MorphLabel>
    </Button>
  )
}

function SharePopover(args: Story['args']) {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        <UserPlusIcon />
        Share
      </PopoverTrigger>
      <PopoverContent {...args} className="w-80">
        <PopoverHeader>
          <PopoverTitle>Share “Orion”</PopoverTitle>
          <PopoverDescription>Invite teammates by email, or send the link.</PopoverDescription>
        </PopoverHeader>
        <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
          <Input aria-label="Email address" type="email" placeholder="name@acme.com" className="flex-1" />
          <Button type="submit">Invite</Button>
        </form>
        <ul className="-mx-1 flex flex-col">
          {people.map((p) => (
            <li key={p.email} className="flex items-center gap-2.5 rounded-md px-1 py-1.5">
              <Avatar size="sm">
                <AvatarFallback>
                  {p.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-ui font-medium">{p.name}</span>
                <span className="truncate text-ui-sm text-fg-muted">{p.email}</span>
              </div>
              <span className="text-ui-sm text-fg-muted">{p.role}</span>
            </li>
          ))}
        </ul>
        <div className="-mx-4 flex items-center justify-between gap-3 border-t border-line px-4 pt-3">
          <span className="text-ui-sm text-fg-muted">Anyone at Acme with the link can view.</span>
          <CopyLinkButton />
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** A share panel: an invite form, the people who already have access, and a copy-link action with morphing feedback. */
export const Hero: Story = {
  render: (args) => <SharePopover {...args} />,
}

const sides = ['top', 'right', 'bottom', 'left'] as const

/** Each popover grows out of its trigger: the origin follows the side it opens on (and the collision flip). */
export const Placement: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-3">
      {sides.map((side) => (
        <Popover key={side}>
          <PopoverTrigger render={<Button variant="outline" className="w-28 capitalize" />}>{side}</PopoverTrigger>
          <PopoverContent {...args} side={side} align="center" className="w-56">
            <PopoverHeader>
              <PopoverTitle className="capitalize">{side}</PopoverTitle>
              <PopoverDescription>Grows out of the edge that touches the trigger.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  ),
}

/** Long content: the popup caps at the space available and the body scrolls. */
export const LongContent: Story = {
  render: (args) => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Release notes</PopoverTrigger>
      <PopoverContent {...args} className="max-h-[min(24rem,var(--available-height))] w-80 overflow-y-auto">
        <PopoverHeader>
          <PopoverTitle>What’s new in 4.2</PopoverTitle>
          <PopoverDescription>Shipped on 24 September.</PopoverDescription>
        </PopoverHeader>
        {Array.from({ length: 8 }, (_, i) => (
          <p key={i} className="text-ui text-fg-muted">
            {i + 1}. Deploy previews now build {i + 2}× faster on the edge network, and preview comments sync with
            your issue tracker.
          </p>
        ))}
      </PopoverContent>
    </Popover>
  ),
}

/**
 * Touch (`YoujProvider device="touch"`, a phone's width): the same share panel as a bottom sheet. It rises
 * from the bottom edge over a scrim with a grab handle and spans the screen; pull it down, tap outside or press
 * Escape to close it, and focus returns to the trigger. A field inside raises the keyboard and the sheet rides
 * above it. `presentation="popover"` keeps the anchored popover on touch.
 */
export const Touch: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  decorators: [
    // A provider resets Speed and Reduced motion to its defaults: the toolbar's are passed on.
    (Story, { globals }) => (
      <YoujProvider device="touch" reducedMotion={globals.reducedMotion} timeScale={Number(globals.timeScale) || 1}>
        <Story />
      </YoujProvider>
    ),
  ],
  render: (args) => <SharePopover {...args} />,
}
