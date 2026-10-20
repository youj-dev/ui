import { useState, type FormEvent } from 'react'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core'
import { SlidersIcon } from '@youj/icons'
import { Button } from './button'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from './field'
import { Input } from './input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  type SheetSide,
} from './sheet'
import { Switch } from './switch'

const meta: Meta<typeof SheetContent> = {
  title: 'UI/Overlays/Sheet',
  component: SheetContent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A panel that slides in from an edge: a positioned Base UI Dialog (modal, focus-trapped, Escape and the scrim close it, focus returns to the trigger). motion’s yj-sheet-* slides it fully off its edge, decelerating in on the slow token and accelerating away on the base token; reversing mid-slide continues from where it is. `side` takes physical edges or the logical start / end, which mirror in RTL (default end). Header and footer stay put while the body scrolls. For swipe-to-dismiss, use Drawer. Reduced motion: instant.',
      },
    },
  },
  argTypes: {
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left', 'start', 'end'] },
    variant: { control: 'inline-radio', options: ['docked', 'floating'] },
    backdrop: { control: 'inline-radio', options: ['dim', 'blur'] },
  },
  args: { side: 'end', variant: 'docked', backdrop: 'dim' },
}
export default meta
type Story = StoryObj<typeof SheetContent>

const frameworks = { next: 'Next.js', remix: 'Remix', astro: 'Astro', vite: 'Vite' }
const regions = { fra1: 'Frankfurt (fra1)', iad1: 'Washington, D.C. (iad1)', sfo1: 'San Francisco (sfo1)', hnd1: 'Tokyo (hnd1)' }

function ProjectSettings(args: Story['args']) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')
  const save = (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setOpen(false)
      setSaved('Settings saved')
    }, 900)
  }
  return (
    <div className="flex w-96 items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex flex-col">
        <span className="text-ui font-semibold">orion</span>
        <span className="text-ui-sm text-fg-muted" role="status">
          {saved || 'Production · fra1'}
        </span>
      </div>
      <Sheet open={open} onOpenChange={(next) => !saving && setOpen(next)}>
        <SheetTrigger render={<Button variant="outline" size="sm" />}>
          <SlidersIcon />
          Settings
        </SheetTrigger>
        <SheetContent {...args}>
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
            <SheetHeader>
              <SheetTitle>Project settings</SheetTitle>
              <SheetDescription>Changes apply to the next deployment.</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <FieldGroup>
                <Field>
                  <FieldLabel>Project name</FieldLabel>
                  <Input defaultValue="orion" />
                </Field>
                <Field>
                  <FieldLabel>Framework</FieldLabel>
                  <Select items={frameworks} defaultValue="next">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(frameworks).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Build command</FieldLabel>
                  <Input defaultValue="pnpm build" className="font-mono" />
                  <FieldDescription>Runs in the project root after install.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel>Function region</FieldLabel>
                  <Select items={regions} defaultValue="fra1">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(regions).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel>Preview comments</FieldLabel>
                    <FieldDescription>Reviewers can comment on preview deployments.</FieldDescription>
                  </FieldContent>
                  <Switch defaultChecked />
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel>Protect previews</FieldLabel>
                    <FieldDescription>Only members can open preview links.</FieldDescription>
                  </FieldContent>
                  <Switch />
                </Field>
              </FieldGroup>
            </SheetBody>
            <SheetFooter>
              <SheetClose render={<Button variant="outline" disabled={saving} />}>Cancel</SheetClose>
              <Button type="submit" loading={saving} loadingLabel="Saving">
                Save changes
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}

/** Project settings from the end edge: the header and footer hold while the form scrolls; Save shows its progress before the sheet leaves. */
export const Hero: Story = {
  render: (args) => <ProjectSettings {...args} />,
}

const sides: SheetSide[] = ['top', 'right', 'bottom', 'left', 'start', 'end']

/** Every edge. `start` and `end` follow the writing direction. */
export const Sides: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-3">
      {sides.map((side) => (
        <Sheet key={side}>
          <SheetTrigger render={<Button variant="outline" className="w-24 capitalize" />}>{side}</SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle className="capitalize">{side}</SheetTitle>
              <SheetDescription>Slides in from the {side} edge and back out the way it came.</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <p className="text-ui text-fg-muted">Press Escape, the scrim or × to close it.</p>
            </SheetBody>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  ),
}

/**
 * `variant="floating"`: inset from every edge, rounded and raised, over a
 * blurred page (`backdrop="blur"`). It slides past its gap on the same
 * curves. On touch it becomes the pull-to-dismiss bottom sheet.
 */
export const Floating: Story = {
  args: { variant: 'floating', backdrop: 'blur' },
  render: (args) => <ProjectSettings {...args} />,
}

/** Floating on every edge. Top and bottom are a centered column. */
export const FloatingSides: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-3">
      {sides.map((side) => (
        <Sheet key={side}>
          <SheetTrigger render={<Button variant="outline" className="w-24 capitalize" />}>{side}</SheetTrigger>
          <SheetContent side={side} variant="floating" backdrop="blur">
            <SheetHeader>
              <SheetTitle className="capitalize">{side}</SheetTitle>
              <SheetDescription>Floats in from the {side} edge, past its gap, and back out the way it came.</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <p className="text-ui text-fg-muted">Press Escape, the scrim or × to close it.</p>
            </SheetBody>
          </SheetContent>
        </Sheet>
      ))}
    </div>
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
    <div className="mx-auto flex w-full max-w-sm flex-col items-stretch gap-4 [&>*]:w-full">
      <Story />
    </div>
  </YoujProvider>
)

/**
 * On touch a side sheet covers a phone's whole width (up to 28rem on a
 * tablet), like a page pushed over the app. Its × is a 44px target, it
 * clears the notch and the home indicator, and the footer's actions share the
 * width. To pull a panel away with a finger, use Drawer.
 */
export const Touch: Story = {
  decorators: [onTouch],
  parameters: { layout: 'padded' },
  render: (args) => <ProjectSettings {...args} />,
}

/** A floating sheet on touch is the bottom sheet a Dialog becomes: a grab handle, pulled down to dismiss. */
export const FloatingTouch: Story = {
  decorators: [onTouch],
  parameters: { layout: 'padded' },
  args: { variant: 'floating', backdrop: 'blur' },
  render: (args) => <ProjectSettings {...args} />,
}
