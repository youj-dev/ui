import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef, useState } from 'react'
import { expect, waitFor } from 'storybook/test'
import { ThemeScope, YoujProvider } from '@youj/core/lib/youj/provider'
import { SignInCard, SmallScreen, Stage, useReplay } from '../entrance/demos.fixtures'
import type { EntranceRun } from '../entrance/run'
import { inspector } from './engine'
import { InspectorEntrance, type InspectorEntranceProps } from './inspector'

type Args = Pick<InspectorEntranceProps, 'duration' | 'speed' | 'phases'>

const meta: Meta<Args> = {
  title: 'Motion/Effects/Inspector',
  component: InspectorEntrance as never,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'An entrance for real UI: the demo appears first as the browser’s box model. Part by part, in build order, each box lays down its margin, padding and content in soft tints with a crisp edge, while a hover runs through the tree with a mono size tag (`div 72 × 40`, `p 14/20`) and the element’s path under the demo. Then each part hands off to the real thing, the frame first. `<InspectorEntrance>` plays around its first child; `inspector(node)` is the look, for any element. Under reduced motion the UI is just there.',
      },
    },
  },
  argTypes: {
    speed: { control: { type: 'range', min: 0.25, max: 3, step: 0.25 } },
    duration: { control: { type: 'number', min: 1000, max: 12000, step: 250 } },
    phases: { control: 'object', description: 'Each stage’s share of the run, as weights: inspect, handoff.' },
  },
  args: { speed: 1 },
}
export default meta
type Story = StoryObj<Args>

/** A sign-in card: the frame’s box model, then every part’s, with the hover reading out each tag. */
export const Hero: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <InspectorEntrance key={play} {...args}>
          <SignInCard />
        </InspectorEntrance>
      </Stage>
    )
  },
}

/** A small dashboard screen: more parts, so the run is longer and the hover reads a sample of them. */
export const Screen: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <InspectorEntrance key={play} {...args}>
          <SmallScreen />
        </InspectorEntrance>
      </Stage>
    )
  },
}

/** Pacing: the same card twice. `duration`, `speed` and `phases` set it precisely: a quick run that hands off early,
 *  and a slow one that inspects at length. */
export const Pacing: Story = {
  render: function Render() {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <div className="flex flex-wrap items-start justify-center gap-10">
          {(
            [
              ['Quick: 1.6 s, early hand-off', { duration: 1600, phases: { inspect: 45, handoff: 55 } }],
              ['Studied: 5 s, long inspect', { duration: 5000, phases: { inspect: 75, handoff: 25 } }],
            ] as const
          ).map(([name, pace]) => (
            <figure key={name} className="flex flex-col items-center gap-3">
              <InspectorEntrance key={play} {...pace}>
                <SignInCard />
              </InspectorEntrance>
              <figcaption className="font-mono text-xs text-fg-muted">{name}</figcaption>
            </figure>
          ))}
        </div>
      </Stage>
    )
  },
}

/** Reduced motion: no overlay. The UI is just there, with nothing added to the page. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Stage replay={() => {}}>
        <InspectorEntrance {...args}>
          <SignInCard />
        </InspectorEntrance>
      </Stage>
    </YoujProvider>
  ),
}

/** `inspector(node)` on any element, and `cancel()` part way: the card is restored at once and the overlay is gone. */
export const CancelMidRun: Story = {
  render: function Render(args) {
    const ref = useRef<HTMLDivElement>(null)
    const run = useRef<EntranceRun | undefined>(undefined)
    const [state, setState] = useState('Playing')
    const start = () => {
      run.current?.cancel()
      setState('Playing')
      const card = ref.current?.firstElementChild as HTMLElement | null
      if (!card) return
      run.current = inspector(card, args)
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
          <button
            type="button"
            onClick={() => {
              setState('Cancelled')
              run.current?.cancel()
            }}
            className="rounded-md border border-line bg-surface px-3 py-1.5 text-fg-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={start}
            className="rounded-md border border-line bg-surface px-3 py-1.5 text-fg-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
          >
            Play again
          </button>
          <output className="w-20 text-fg-subtle">{state}</output>
        </div>
      </div>
    )
  }, // In Chromium: cancel part way, then let a run finish; both leave the card's markup and the page's animations as they were.
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('form')!
    const button = (name: string) => [...canvasElement.querySelectorAll('button')].find((b) => b.textContent === name)!
    // The run starts on mount and hides the card's parts from its first frame, so the card as it was is read after a
    // cancel, once nothing of the run is left on it.
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-inspector]')).not.toBeNull())
    button('Cancel').click()
    await expect(canvasElement.querySelector('[data-yj-inspector]')).toBeNull()
    await expect(document.getAnimations()).toHaveLength(0)
    await expect(card.matches('[style], :has([style])')).toBe(false)
    const markup = card.outerHTML
    button('Play again').click()
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-inspector]')).not.toBeNull())
    button('Cancel').click()
    await expect(canvasElement.querySelector('[data-yj-inspector]')).toBeNull()
    await expect(document.getAnimations()).toHaveLength(0)
    await expect(card.outerHTML).toBe(markup)
    const again = [...canvasElement.querySelectorAll('button')].find((b) => b.textContent === 'Play again')!
    again.click()
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-inspector]')).not.toBeNull())
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-inspector]')).toBeNull(), { timeout: 15000 })
    await expect(document.getAnimations()).toHaveLength(0)
    await expect(card.outerHTML).toBe(markup)
  },
}

/** The tints come from the theme’s status colours, so the overlay reads in either mode. */
export const LightAndDark: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <div className="grid min-h-dvh grid-cols-2">
        {(['light', 'dark'] as const).map((mode) => (
          <ThemeScope key={mode} mode={mode}>
            <div className="flex h-full flex-col items-center justify-center gap-6 overflow-hidden bg-canvas px-4 py-12">
              <InspectorEntrance key={play} {...args}>
                <SignInCard />
              </InspectorEntrance>
              {mode === 'dark' && (
                <button
                  type="button"
                  onClick={replay}
                  className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-fg-muted focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Replay
                </button>
              )}
            </div>
          </ThemeScope>
        ))}
      </div>
    )
  },
}

/** Right to left: the models wipe in from the right, the tags sit on each box’s right edge, and the path is right-aligned. */
export const RightToLeft: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <div dir="rtl">
        <Stage replay={replay}>
          <InspectorEntrance key={play} {...args}>
            <SmallScreen />
          </InspectorEntrance>
        </Stage>
      </div>
    )
  },
}
