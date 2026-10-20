import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef, useState } from 'react'
import { expect, waitFor } from 'storybook/test'
import { ThemeScope, YoujProvider } from '@youj/core/lib/youj/provider'
import { ReplayButton, SignInCard, SmallScreen, Stage, useReplay } from '../entrance/story-demos'
import { generate, type GenerateRun } from './engine'
import { GenerateEntrance, type GenerateEntranceProps } from './generate'

type Args = Pick<GenerateEntranceProps, 'duration' | 'speed' | 'phases' | 'order' | 'names'>

const meta: Meta<Args> = {
  title: 'Motion/Effects/Generate',
  component: GenerateEntrance as never,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'An entrance for real UI that builds it in part by part, in its real colours. The demo’s frame and main regions are dragged out with selection outlines; then every part arrives in build order, each its own way: surfaces drag out, text types in line by line, controls pop, icons draw their strokes, charts and images wipe in. `<GenerateEntrance>` plays around its first child and needs no script; `generate(node)` is the engine, for any element. It animates only opacity, clip-path and transform, and leaves nothing behind. Under reduced motion the UI is just there.',
      },
    },
  },
  argTypes: {
    speed: { control: { type: 'range', min: 0.25, max: 3, step: 0.25 } },
    order: { control: 'object', description: 'Selectors for the regions to drag out first, in this order.' },
    names: { control: 'object', description: 'A name for a region (by its selector in `order`), shown on its tab.' },
    duration: { control: { type: 'number', min: 1000, max: 12000, step: 250 } },
    phases: { control: 'object', description: 'Each stage’s share of the run, as weights: frame, build, settle.' },
  },
  args: { speed: 1 },
}
export default meta
type Story = StoryObj<Args>

/** A sign-in card builds itself: its frame is dragged out, then the heading types in, the fields drag out, the buttons pop. */
export const Hero: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <GenerateEntrance key={play} {...args}>
          <SignInCard />
        </GenerateEntrance>
      </Stage>
    )
  },
}

/** A small dashboard screen: the sidebar and panels are dragged out with the frame, then stat cards, rows, the chart and the
 * nav arrive one by one. */
export const Screen: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <GenerateEntrance key={play} {...args}>
          <SmallScreen />
        </GenerateEntrance>
      </Stage>
    )
  },
}

/** Pacing: `duration`, `speed` and `phases` set it precisely. On the left a quick run that is nearly all build, on the
 * right a slow one that lets the frame be dragged out first. */
export const Pacing: Story = {
  render: function Render() {
    const [play, replay] = useReplay()
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden bg-canvas px-4 py-12">
        <div className="flex flex-wrap items-start justify-center gap-10">
          {(
            [
              ['Quick: 1.4 s, all build', { duration: 1400, phases: { frame: 8, build: 84, settle: 8 } }],
              ['Studied: 4 s, frame first', { duration: 4000, phases: { frame: 26, build: 62, settle: 12 } }],
            ] as const
          ).map(([name, pace]) => (
            <figure key={name} className="flex flex-col items-center gap-3">
              <GenerateEntrance key={play} {...pace}>
                <SignInCard />
              </GenerateEntrance>
              <figcaption className="font-mono text-xs text-fg-muted">{name}</figcaption>
            </figure>
          ))}
        </div>
        <ReplayButton onClick={replay} />
      </div>
    )
  },
}

/** Reduced motion: no build. The UI is just there, with nothing added to the page. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Stage replay={() => {}}>
        <GenerateEntrance {...args}>
          <SignInCard />
        </GenerateEntrance>
      </Stage>
    </YoujProvider>
  ),
}

/** `generate(node)` on any element, and `cancel()` part way: the card is restored at once and the outlines are gone. */
export const CancelMidRun: Story = {
  render: function Render(args) {
    const ref = useRef<HTMLDivElement>(null)
    const run = useRef<GenerateRun | undefined>(undefined)
    const [state, setState] = useState('Playing')
    const start = () => {
      run.current?.cancel()
      setState('Playing')
      const card = ref.current?.firstElementChild as HTMLElement | null
      if (!card) return
      run.current = generate(card, args)
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
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-generate]')).not.toBeNull())
    const cancel = [...canvasElement.querySelectorAll('button')].find((b) => b.textContent === 'Cancel')!
    cancel.click()
    await expect(canvasElement.querySelector('[data-yj-generate]')).toBeNull()
    await expect(document.getAnimations()).toHaveLength(0)
    const markup = card.outerHTML
    await expect(markup).not.toContain('opacity')
    const again = [...canvasElement.querySelectorAll('button')].find((b) => b.textContent === 'Play again')!
    again.click()
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-generate]')).not.toBeNull())
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-generate]')).toBeNull(), { timeout: 15000 })
    await expect(document.getAnimations()).toHaveLength(0)
    await expect(card.outerHTML).toBe(markup)
  },
}

/** The build reads on either theme: the outlines and tabs take the accent, the parts arrive in their own colours. */
export const LightAndDark: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <div className="grid min-h-dvh grid-cols-2">
        {(['light', 'dark'] as const).map((mode) => (
          <ThemeScope key={mode} mode={mode}>
            <div className="flex h-full flex-col items-center justify-center gap-6 overflow-hidden bg-canvas px-4 py-12">
              <GenerateEntrance key={play} {...args}>
                <SignInCard />
              </GenerateEntrance>
              {mode === 'dark' && <ReplayButton onClick={replay} />}
            </div>
          </ThemeScope>
        ))}
      </div>
    )
  },
}

/** Right to left: regions are dragged out from the right, and text types in from the right. */
export const RightToLeft: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <div dir="rtl">
        <Stage replay={replay}>
          <GenerateEntrance key={play} {...args}>
            <SmallScreen />
          </GenerateEntrance>
        </Stage>
      </div>
    )
  },
}
