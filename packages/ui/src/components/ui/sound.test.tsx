import { useState, type ReactNode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider, type ReducedMotionSetting, type SoundCue } from '@youj/core'
import { SoundCueContext } from '@youj/core/internal'
import { Button } from './button'
import { AsyncButton } from './async-button'
import { Checkbox } from './checkbox'
import { CodeBlock } from './code-block'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './dialog'
import { SegmentedControl, SegmentedControlItem } from './segmented-control'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './sheet'
import { Switch } from './switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { Toaster, toast } from './toast'
import { Toggle } from './toggle'

/* The component side of sound: which cue each interaction emits, in step
 * with its motion, and none when an instance is silenced. UI never imports
 * @youj/sound, so a recorder stands in for YoujProvider's sound on the
 * cue bus; whether a cue is audible (on, muted, reduced, gesture, cooldown)
 * is the sound package's to test. */

const heard = vi.fn<(cue: SoundCue, reduced: boolean) => void>()
beforeEach(() => heard.mockClear())

const sounds = () => heard.mock.calls.map(([cue]) => cue)

function On({ children, reducedMotion = 'never' }: { children: ReactNode; reducedMotion?: ReducedMotionSetting }) {
  return (
    <YoujProvider reducedMotion={reducedMotion}>
      <SoundCueContext.Provider value={heard}>{children}</SoundCueContext.Provider>
    </YoujProvider>
  )
}

describe('Button', () => {
  test('taps once per press: on pointer down for a mouse, on the click for a key', async () => {
    const user = userEvent.setup()
    render(
      <On>
        <Button>Save</Button>
      </On>,
    )
    const button = screen.getByRole('button', { name: 'Save' })
    fireEvent.pointerDown(button, { pointerType: 'mouse', button: 0 })
    expect(sounds()).toEqual(['tap'])
    fireEvent.click(button, { detail: 1 })
    expect(sounds()).toEqual(['tap'])
    heard.mockClear()
    button.focus()
    await user.keyboard('{Enter}')
    expect(sounds()).toEqual(['tap'])
  })

  test('a touch sounds on the click, since a touch that scrolls never presses', () => {
    render(
      <On>
        <Button>Save</Button>
      </On>,
    )
    const button = screen.getByRole('button', { name: 'Save' })
    fireEvent.pointerDown(button, { pointerType: 'touch', button: 0 })
    expect(sounds()).toEqual([])
    fireEvent.click(button, { detail: 1 })
    expect(sounds()).toEqual(['tap'])
  })

  test('stays silent when silenced, link-styled or disabled', () => {
    render(
      <On>
        <Button sound={false}>Quiet</Button>
        <Button variant="link">Link</Button>
        <Button disabled>Disabled</Button>
      </On>,
    )
    for (const name of ['Quiet', 'Link', 'Disabled']) {
      const button = screen.getByRole('button', { name })
      fireEvent.pointerDown(button, { pointerType: 'mouse', button: 0 })
      fireEvent.click(button, { detail: 0 })
    }
    expect(sounds()).toEqual([])
  })

  test('onAction sounds its outcome as the check draws or the cross shakes', async () => {
    const user = userEvent.setup()
    render(
      <On>
        <AsyncButton onAction={() => Promise.resolve()}>Publish</AsyncButton>
        <AsyncButton onAction={() => Promise.reject(new Error('nope'))}>Deploy</AsyncButton>
      </On>,
    )
    await user.click(screen.getByRole('button', { name: 'Publish' }))
    await waitFor(() => expect(sounds()).toEqual(['tap', 'success']))
    heard.mockClear()
    await user.click(screen.getByRole('button', { name: 'Deploy' }))
    await waitFor(() => expect(sounds()).toEqual(['tap', 'error']))
  })
})

describe('toggles', () => {
  test('Switch, Checkbox and Toggle chirp up when turned on and down when turned off', async () => {
    const user = userEvent.setup()
    render(
      <On>
        <Switch aria-label="Wi-Fi" />
        <Checkbox aria-label="Remember me" />
        <Toggle aria-label="Bold">B</Toggle>
      </On>,
    )
    for (const control of [screen.getByRole('switch'), screen.getByRole('checkbox'), screen.getByRole('button', { name: 'Bold' })]) {
      heard.mockClear()
      await user.click(control)
      await user.click(control)
      expect(sounds()).toEqual(['toggleOn', 'toggleOff'])
    }
  })

  test('a silenced instance stays quiet, and so does a change the app cancels', async () => {
    const user = userEvent.setup()
    render(
      <On>
        <Switch aria-label="Quiet" sound={false} />
        <Switch aria-label="Locked" onCheckedChange={(_, details) => details.cancel()} />
      </On>,
    )
    await user.click(screen.getByRole('switch', { name: 'Quiet' }))
    await user.click(screen.getByRole('switch', { name: 'Locked' }))
    expect(sounds()).toEqual([])
  })
})

describe('selection', () => {
  test('Tabs play select when a person chooses a tab, by pointer or arrow key', async () => {
    const user = userEvent.setup()
    render(
      <On>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a">Overview</TabsTrigger>
            <TabsTrigger value="b">Activity</TabsTrigger>
            <TabsTrigger value="c">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="a">A</TabsContent>
          <TabsContent value="b">B</TabsContent>
          <TabsContent value="c">C</TabsContent>
        </Tabs>
      </On>,
    )
    await user.click(screen.getByRole('tab', { name: 'Activity' }))
    expect(sounds()).toEqual(['select'])
    await user.keyboard('{ArrowRight}')
    expect(sounds()).toEqual(['select', 'select'])
  })

  test('SegmentedControl plays select on a new choice, not on the one already chosen', async () => {
    const user = userEvent.setup()
    render(
      <On>
        <SegmentedControl defaultValue="day" aria-label="Range">
          <SegmentedControlItem value="day">Day</SegmentedControlItem>
          <SegmentedControlItem value="week">Week</SegmentedControlItem>
        </SegmentedControl>
      </On>,
    )
    await user.click(screen.getByRole('button', { name: 'Day' }))
    expect(sounds()).toEqual([])
    await user.click(screen.getByRole('button', { name: 'Week' }))
    expect(sounds()).toEqual(['select'])
  })
})

describe('overlays', () => {
  test('a Dialog breathes open and closed with its popup, and a Sheet does too', async () => {
    const user = userEvent.setup()
    render(
      <On>
        <Dialog>
          <DialogTrigger render={<Button sound={false} />}>Open dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Rename</DialogTitle>
          </DialogContent>
        </Dialog>
        <Sheet>
          <SheetTrigger render={<Button sound={false} />}>Open sheet</SheetTrigger>
          <SheetContent>
            <SheetTitle>Filters</SheetTitle>
          </SheetContent>
        </Sheet>
      </On>,
    )
    await user.click(screen.getByRole('button', { name: 'Open dialog' }))
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Open sheet' }))
    await user.keyboard('{Escape}')
    expect(sounds()).toEqual(['open', 'close', 'open', 'close'])
  })

  test('a controlled Dialog sounds when the app opens it, with no press on a trigger', () => {
    function Palette() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Shortcut
          </button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogTitle>Command palette</DialogTitle>
            </DialogContent>
          </Dialog>
        </>
      )
    }
    render(
      <On>
        <Palette />
      </On>,
    )
    expect(sounds()).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: 'Shortcut' }))
    expect(sounds()).toEqual(['open'])
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(sounds()).toEqual(['open', 'close'])
  })
})

describe('Toaster', () => {
  afterEach(() => act(() => toast.dismiss()))

  test('a toast plays notify as it arrives; success and error arrive with their own cue', async () => {
    render(
      <On>
        <Toaster />
      </On>,
    )
    act(() => void toast('Invite sent'))
    await waitFor(() => expect(sounds()).toEqual(['notify']))
    act(() => void toast.error('Payment failed'))
    await waitFor(() => expect(sounds()).toEqual(['notify', 'error']))
  })

  test('a promise toast sounds again when it settles', async () => {
    let resolve!: () => void
    render(
      <On>
        <Toaster />
      </On>,
    )
    act(() => void toast.promise(new Promise<void>((done) => (resolve = done)), { loading: 'Deploying', success: 'Deployed', error: 'Failed' }))
    await waitFor(() => expect(sounds()).toEqual(['notify']))
    await act(async () => resolve())
    await waitFor(() => expect(sounds()).toEqual(['notify', 'success']))
  })

  test('<Toaster sound={false}> keeps toasts silent', async () => {
    render(
      <On>
        <Toaster sound={false} />
      </On>,
    )
    act(() => void toast('Quiet'))
    await screen.findByText('Quiet')
    expect(sounds()).toEqual([])
  })
})

test('a copy button ticks on the press and chimes when the text is copied', async () => {
  const user = userEvent.setup()
  render(
    <On>
      <CodeBlock code="pnpm add @youj/react" language="sh" />
    </On>,
  )
  await user.click(screen.getByRole('button', { name: 'Copy code' }))
  await waitFor(() => expect(sounds()).toEqual(['tap', 'success']))
})

describe('without sound, and under reduced motion', () => {
  function Everything() {
    return (
      <>
        <Button>Save</Button>
        <Switch aria-label="Wi-Fi" />
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  async function pressEverything() {
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await user.click(screen.getByRole('switch'))
    await user.click(screen.getByRole('button', { name: 'Open' }))
  }

  test('components work the same with no sound: a cue goes nowhere', async () => {
    render(
      <YoujProvider>
        <Everything />
      </YoujProvider>,
    )
    await pressEverything()
    expect(screen.getByRole('switch', { hidden: true })).toBeChecked()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(heard).not.toHaveBeenCalled()
  })

  test('each cue says whether motion is reduced where it happened, so the provider can keep it quiet', async () => {
    render(
      <On reducedMotion="always">
        <Everything />
      </On>,
    )
    await pressEverything()
    expect(heard.mock.calls).toEqual([
      ['tap', true],
      ['toggleOn', true],
      ['open', true],
    ])
  })
})
