import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef, useState } from 'react'
import { expect, waitFor } from 'storybook/test'
import { ThemeScope, YoujProvider } from '@youj/core/lib/youj/provider'
import { SignInCard, SmallScreen, Stage, useReplay } from '../entrance/demos.fixtures'
import type { EntranceRun } from '../entrance/run'
import { renderPasses } from './engine'
import { RenderPassesEntrance, type RenderPassesEntranceProps } from './passes'

type Args = Pick<RenderPassesEntranceProps, 'duration' | 'speed' | 'phases'>

const meta: Meta<Args> = {
  title: 'Motion/Effects/Render passes',
  component: RenderPassesEntrance as never,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'An entrance for real UI: the browser’s pipeline played as theatre. Three passes sweep through the parts in build order, each named over the demo with its count (`layout 12/54`): **layout** outlines every box with its size, **paint** fills each in a flat grey with its text and icons in grey (square, no shadows), and **composite** hands each piece to the real part, with its colour, radii, shadows and images. `<RenderPassesEntrance>` plays around its first child; `renderPasses(node)` is the look, for any element. Under reduced motion the UI is just there.',
      },
    },
  },
  argTypes: {
    speed: { control: { type: 'range', min: 0.25, max: 3, step: 0.25 } },
    duration: { control: { type: 'number', min: 1000, max: 12000, step: 250 } },
    phases: { control: 'object', description: 'Each pass’s share of the run, as weights: layout, paint, composite.' },
  },
  args: { speed: 1 },
}
export default meta
type Story = StoryObj<Args>

/** A sign-in card goes through layout, paint and composite, part by part. */
export const Hero: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <RenderPassesEntrance key={play} {...args}>
          <SignInCard />
        </RenderPassesEntrance>
      </Stage>
    )
  },
}

/** A small dashboard screen: more parts, so each pass takes longer to sweep through them. */
export const Screen: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <RenderPassesEntrance key={play} {...args}>
          <SmallScreen />
        </RenderPassesEntrance>
      </Stage>
    )
  },
}

/** Pacing: the same card twice. `duration`, `speed` and `phases` set it precisely: a quick run that lingers on the
 *  composite, and a slow one that dwells on layout and paint. */
export const Pacing: Story = {
  render: function Render() {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <div className="flex flex-wrap items-start justify-center gap-10">
          {(
            [
              ['Quick: 1.6 s, long composite', { duration: 1600, phases: { layout: 20, paint: 20, composite: 60 } }],
              ['Studied: 5 s, long layout and paint', { duration: 5000, phases: { layout: 38, paint: 38, composite: 24 } }],
            ] as const
          ).map(([name, pace]) => (
            <figure key={name} className="flex flex-col items-center gap-3">
              <RenderPassesEntrance key={play} {...pace}>
                <SignInCard />
              </RenderPassesEntrance>
              <figcaption className="font-mono text-xs text-fg-muted">{name}</figcaption>
            </figure>
          ))}
        </div>
      </Stage>
    )
  },
}

/** Reduced motion: no passes. The UI is just there, with nothing added to the page. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Stage replay={() => {}}>
        <RenderPassesEntrance {...args}>
          <SignInCard />
        </RenderPassesEntrance>
      </Stage>
    </YoujProvider>
  ),
}

/** `renderPasses(node)` on any element, and `cancel()` part way: the card is restored at once and the overlay is gone. */
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
      run.current = renderPasses(card, args)
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
    const markup = card.outerHTML
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-passes]')).not.toBeNull())
    const cancel = [...canvasElement.querySelectorAll('button')].find((b) => b.textContent === 'Cancel')!
    cancel.click()
    await expect(canvasElement.querySelector('[data-yj-passes]')).toBeNull()
    await expect(document.getAnimations()).toHaveLength(0)
    await expect(card.outerHTML).toBe(markup)
    const again = [...canvasElement.querySelectorAll('button')].find((b) => b.textContent === 'Play again')!
    again.click()
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-passes]')).not.toBeNull())
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-passes]')).toBeNull(), { timeout: 15000 })
    await expect(document.getAnimations()).toHaveLength(0)
    await expect(card.outerHTML).toBe(markup)
  },
}

/** Layout lines are the theme’s info ink and the paint is greys mixed from its foreground and canvas, so it reads in either mode. */
export const LightAndDark: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <div className="grid min-h-dvh grid-cols-2">
        {(['light', 'dark'] as const).map((mode) => (
          <ThemeScope key={mode} mode={mode}>
            <div className="flex h-full flex-col items-center justify-center gap-6 overflow-hidden bg-canvas px-4 py-12">
              <RenderPassesEntrance key={play} {...args}>
                <SignInCard />
              </RenderPassesEntrance>
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

/** Right to left: the passes sweep from the right, sizes sit in each box’s right corner and the pass strip reads from the right. */
export const RightToLeft: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <div dir="rtl">
        <Stage replay={replay}>
          <RenderPassesEntrance key={play} {...args}>
            <SmallScreen />
          </RenderPassesEntrance>
        </Stage>
      </div>
    )
  },
}
