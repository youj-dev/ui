import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef, useState } from 'react'
import { expect, waitFor } from 'storybook/test'
import { ThemeScope, YoujProvider } from '@youj/core/lib/youj/provider'
import { SignInCard, SmallScreen, Stage, useReplay } from '../entrance/demos.fixtures'
import type { EntranceRun } from '../entrance/run'
import { layers } from './engine'
import { LayersEntrance, type LayersEntranceProps } from './layers'

type Args = Pick<LayersEntranceProps, 'duration' | 'speed' | 'phases'>

const meta: Meta<Args> = {
  title: 'Motion/Effects/Layers',
  component: LayersEntrance as never,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'An entrance for real UI: the demo starts as an exploded isometric stack of its layers, like a view-hierarchy debugger: the frame at the bottom, its regions, its boxes and its content above, each a thin outlined plane with its depth label (`z2  boxes  48`). The planes come up one by one and draw their parts in build order; then the camera settles flat as the gaps close layer by layer, and each plane hands over to the real parts it holds. Transforms and opacity only. `<LayersEntrance>` plays around its first child; `layers(node)` is the look, for any element. Under reduced motion the UI is just there.',
      },
    },
  },
  argTypes: {
    speed: { control: { type: 'range', min: 0.25, max: 3, step: 0.25 } },
    duration: { control: { type: 'number', min: 1000, max: 12000, step: 250 } },
    phases: { control: 'object', description: 'Each stage’s share of the run, as weights: stack, collapse, resolve.' },
  },
  args: { speed: 1 },
}
export default meta
type Story = StoryObj<Args>

/** A sign-in card as a stack of four planes: the frame, its header and fields, its controls, its type. */
export const Hero: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <LayersEntrance key={play} {...args}>
          <SignInCard />
        </LayersEntrance>
      </Stage>
    )
  },
}

/** A small dashboard screen: its panels make the regions plane, and the stack takes longer to build. */
export const Screen: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <LayersEntrance key={play} {...args}>
          <SmallScreen />
        </LayersEntrance>
      </Stage>
    )
  },
}

/** Pacing: the same card twice. `duration`, `speed` and `phases` set it precisely: a quick run that collapses soon,
 *  and a slow one that holds the exploded stack. */
export const Pacing: Story = {
  render: function Render() {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <div className="flex flex-wrap items-start justify-center gap-10">
          {(
            [
              ['Quick: 2 s, early collapse', { duration: 2000, phases: { stack: 30, collapse: 40, resolve: 30 } }],
              ['Studied: 6 s, long stack', { duration: 6000, phases: { stack: 55, collapse: 25, resolve: 20 } }],
            ] as const
          ).map(([name, pace]) => (
            <figure key={name} className="flex flex-col items-center gap-3">
              <LayersEntrance key={play} {...pace}>
                <SignInCard />
              </LayersEntrance>
              <figcaption className="font-mono text-xs text-fg-muted">{name}</figcaption>
            </figure>
          ))}
        </div>
      </Stage>
    )
  },
}

/** Reduced motion: no stack. The UI is just there, with nothing added to the page. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Stage replay={() => {}}>
        <LayersEntrance {...args}>
          <SignInCard />
        </LayersEntrance>
      </Stage>
    </YoujProvider>
  ),
}

/** `layers(node)` on any element, and `cancel()` part way: the card is restored at once and the overlay is gone. */
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
      run.current = layers(card, args)
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
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-layers]')).not.toBeNull())
    button('Cancel').click()
    await expect(canvasElement.querySelector('[data-yj-layers]')).toBeNull()
    await expect(document.getAnimations()).toHaveLength(0)
    await expect(card.matches('[style], :has([style])')).toBe(false)
    const markup = card.outerHTML
    button('Play again').click()
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-layers]')).not.toBeNull())
    button('Cancel').click()
    await expect(canvasElement.querySelector('[data-yj-layers]')).toBeNull()
    await expect(document.getAnimations()).toHaveLength(0)
    await expect(card.outerHTML).toBe(markup)
    const again = [...canvasElement.querySelectorAll('button')].find((b) => b.textContent === 'Play again')!
    again.click()
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-layers]')).not.toBeNull())
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-layers]')).toBeNull(), { timeout: 15000 })
    await expect(document.getAnimations()).toHaveLength(0)
    await expect(card.outerHTML).toBe(markup)
  },
}

/** The planes are drawn in the theme’s own fills and inks, so the stack reads in either mode. */
export const LightAndDark: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <div className="grid min-h-dvh grid-cols-2">
        {(['light', 'dark'] as const).map((mode) => (
          <ThemeScope key={mode} mode={mode}>
            <div className="flex h-full flex-col items-center justify-center gap-6 overflow-hidden bg-canvas px-4 py-12">
              <LayersEntrance key={play} {...args}>
                <SignInCard />
              </LayersEntrance>
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

/** Right to left: the camera turns the other way and the depth labels sit on the right. */
export const RightToLeft: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <div dir="rtl">
        <Stage replay={replay}>
          <LayersEntrance key={play} {...args}>
            <SmallScreen />
          </LayersEntrance>
        </Stage>
      </div>
    )
  },
}
