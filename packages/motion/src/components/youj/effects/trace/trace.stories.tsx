import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef, useState } from 'react'
import { expect, waitFor } from 'storybook/test'
import { ThemeScope, YoujProvider } from '@youj/core/lib/youj/provider'
import { ReplayButton, SignInCard, SmallScreen, Stage, useReplay } from '../entrance/story-demos'
import { trace, type TraceRun } from './engine'
import { TraceEntrance, type TraceEntranceProps } from './trace'

type Args = Pick<TraceEntranceProps, 'duration' | 'speed' | 'phases' | 'accent'>

const meta: Meta<Args> = {
  title: 'Motion/Effects/Trace',
  component: TraceEntrance as never,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'An entrance for real UI that lights it up like a circuit. A thin signal comes in from beside the frame and runs both ways round its border, then spreads down the layout: along each box’s edges and short square connectors into the regions inside it, round their borders and on to every piece, all branches at once. Each piece glows on its edge as the signal reaches it, then appears; the path stays etched faintly until the end. Monochrome by default, or in the theme’s accent. `<TraceEntrance>` plays around its first child; `trace(node)` is the engine, for any element. It moves small heads by transform and draws the path on one canvas, and leaves nothing behind. Under reduced motion the UI is just there.',
      },
    },
  },
  argTypes: {
    speed: { control: { type: 'range', min: 0.25, max: 3, step: 0.25 } },
    accent: { control: 'boolean' },
    duration: { control: { type: 'number', min: 1000, max: 12000, step: 250 } },
    phases: { control: 'object', description: 'Each stage’s share of the run, as weights: enter, spread, settle.' },
  },
  args: { speed: 1, accent: false },
}
export default meta
type Story = StoryObj<Args>

/** A sign-in card: the signal runs round the card, then down its edge to every field, label and button. */
export const Hero: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <TraceEntrance key={play} {...args}>
          <SignInCard />
        </TraceEntrance>
      </Stage>
    )
  },
}

/** A small dashboard screen: the signal branches into the sidebar, the header and each panel at once, and the panels
 * fill in as their borders are traced. */
export const Screen: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <TraceEntrance key={play} {...args}>
          <SmallScreen />
        </TraceEntrance>
      </Stage>
    )
  },
}

/** The signal in the theme’s accent. */
export const Accent: Story = {
  args: { accent: true },
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <TraceEntrance key={play} {...args}>
          <SmallScreen />
        </TraceEntrance>
      </Stage>
    )
  },
}

/** Pacing: `duration`, `speed` and `phases` set it precisely. On the left a quick run that is nearly all spread, on
 * the right a slow one that lingers on the frame. */
export const Pacing: Story = {
  render: function Render() {
    const [play, replay] = useReplay()
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden bg-canvas px-4 py-12">
        <div className="flex flex-wrap items-start justify-center gap-10">
          {(
            [
              ['Quick: 1.4 s, all spread', { duration: 1400, phases: { enter: 8, spread: 84, settle: 8 } }],
              ['Studied: 4 s, frame first', { duration: 4000, phases: { enter: 24, spread: 64, settle: 12 } }],
            ] as const
          ).map(([name, pace]) => (
            <figure key={name} className="flex flex-col items-center gap-3">
              <TraceEntrance key={play} {...pace}>
                <SignInCard />
              </TraceEntrance>
              <figcaption className="font-mono text-xs text-fg-muted">{name}</figcaption>
            </figure>
          ))}
        </div>
        <ReplayButton onClick={replay} />
      </div>
    )
  },
}

/** Reduced motion: no signal. The UI is just there, with nothing added to the page. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Stage replay={() => {}}>
        <TraceEntrance {...args}>
          <SignInCard />
        </TraceEntrance>
      </Stage>
    </YoujProvider>
  ),
}

/** `trace(node)` on any element, and `cancel()` part way: the card is restored at once and the signal is gone. */
export const CancelMidRun: Story = {
  render: function Render(args) {
    const ref = useRef<HTMLDivElement>(null)
    const run = useRef<TraceRun | undefined>(undefined)
    const [state, setState] = useState('Playing')
    const start = () => {
      run.current?.cancel()
      setState('Playing')
      const card = ref.current?.firstElementChild as HTMLElement | null
      if (!card) return
      run.current = trace(card, args)
      void run.current.finished.then(() => setState((s) => (s === 'Playing' ? 'Finished' : s)))
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: plays once on mount
    useEffect(() => {
      start()
      return () => run.current?.cancel()
    }, [])
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden bg-canvas px-4 py-12">
        <div ref={ref}>
          <SignInCard />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <ReplayButton
            onClick={() => {
              setState('Cancelled')
              run.current?.cancel()
            }}
          >
            Cancel
          </ReplayButton>
          <ReplayButton onClick={start}>Play again</ReplayButton>
          <output className="w-20 text-fg-subtle">{state}</output>
        </div>
      </div>
    )
  }, // In Chromium: cancel part way, then let a run finish; both leave the card's markup and the page's animations as they were.
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('form')!
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-trace]')).not.toBeNull())
    const cancel = [...canvasElement.querySelectorAll('button')].find((b) => b.textContent === 'Cancel')!
    cancel.click()
    await expect(canvasElement.querySelector('[data-yj-trace]')).toBeNull()
    await expect(document.getAnimations()).toHaveLength(0)
    const markup = card.outerHTML
    await expect(markup).not.toContain('style=')
    const again = [...canvasElement.querySelectorAll('button')].find((b) => b.textContent === 'Play again')!
    again.click()
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-trace]')).not.toBeNull())
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-trace]')).toBeNull(), { timeout: 15000 })
    await expect(document.getAnimations()).toHaveLength(0)
    await expect(card.outerHTML).toBe(markup)
  },
}

/** The signal is the theme’s foreground, so it reads on either theme. */
export const LightAndDark: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <div className="grid min-h-dvh grid-cols-2">
        {(['light', 'dark'] as const).map((mode) => (
          <ThemeScope key={mode} mode={mode}>
            <div className="flex h-full flex-col items-center justify-center gap-6 overflow-hidden bg-canvas px-4 py-12">
              <TraceEntrance key={play} {...args}>
                <SignInCard />
              </TraceEntrance>
              {mode === 'dark' && <ReplayButton onClick={replay} />}
            </div>
          </ThemeScope>
        ))}
      </div>
    )
  },
}

/** Right to left: the signal comes in from the right and runs from each box’s right-hand corner. */
export const RightToLeft: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <div dir="rtl">
        <Stage replay={replay}>
          <TraceEntrance key={play} {...args}>
            <SmallScreen />
          </TraceEntrance>
        </Stage>
      </div>
    )
  },
}
