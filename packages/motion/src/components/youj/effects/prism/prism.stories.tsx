import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef, useState } from 'react'
import { expect, waitFor } from 'storybook/test'
import { ThemeScope, YoujProvider } from '@youj/core/lib/youj/provider'
import { ReplayButton, SignInCard, SmallScreen, Stage, useReplay } from '../entrance/story-demos'
import { prism, type PrismRun } from './engine'
import { PrismEntrance, type PrismEntranceProps } from './prism'

type Args = Pick<PrismEntranceProps, 'duration' | 'speed' | 'phases' | 'marks'>

const meta: Meta<Args> = {
  title: 'Motion/Effects/Prism',
  component: PrismEntrance as never,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'An entrance for real UI that locks it in piece by piece out of its color channels. Registration marks lock at the frame’s corners and the frame registers; then each piece, in build order, arrives as three faint copies (red, green and blue) a few px apart, slides together and snaps into register as the real piece. On a dark theme the channels add up to light, on a light one they multiply down to ink. `<PrismEntrance>` plays around its first child; `prism(node)` is the engine, for any element. Its copies are drawn once per piece and only moved by transform and opacity, and it leaves nothing behind. Under reduced motion the UI is just there.',
      },
    },
  },
  argTypes: {
    speed: { control: { type: 'range', min: 0.25, max: 3, step: 0.25 } },
    marks: { control: 'boolean' },
    duration: { control: { type: 'number', min: 1000, max: 12000, step: 250 } },
    phases: { control: 'object', description: 'Each stage’s share of the run, as weights: frame, build, settle.' },
  },
  args: { speed: 1, marks: true },
}
export default meta
type Story = StoryObj<Args>

/** A sign-in card registers: the marks and the card’s frame lock, then every piece snaps in from its channels. */
export const Hero: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <PrismEntrance key={play} {...args}>
          <SignInCard />
        </PrismEntrance>
      </Stage>
    )
  },
}

/** A small dashboard screen: the sidebar and panels register with the frame, then stat cards, rows, the chart and the
 * nav lock in one by one. */
export const Screen: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <Stage replay={replay}>
        <PrismEntrance key={play} {...args}>
          <SmallScreen />
        </PrismEntrance>
      </Stage>
    )
  },
}

/** Pacing: `duration`, `speed` and `phases` set it precisely. On the left a quick run that is nearly all build, on the
 * right a slow one that lets the frame register first. */
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
              <PrismEntrance key={play} {...pace}>
                <SignInCard />
              </PrismEntrance>
              <figcaption className="font-mono text-xs text-fg-muted">{name}</figcaption>
            </figure>
          ))}
        </div>
        <ReplayButton onClick={replay} />
      </div>
    )
  },
}

/** Reduced motion: no channels. The UI is just there, with nothing added to the page. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Stage replay={() => {}}>
        <PrismEntrance {...args}>
          <SignInCard />
        </PrismEntrance>
      </Stage>
    </YoujProvider>
  ),
}

/** `prism(node)` on any element, and `cancel()` part way: the card is restored at once and the copies are gone. */
export const CancelMidRun: Story = {
  render: function Render(args) {
    const ref = useRef<HTMLDivElement>(null)
    const run = useRef<PrismRun | undefined>(undefined)
    const [state, setState] = useState('Playing')
    const start = () => {
      run.current?.cancel()
      setState('Playing')
      const card = ref.current?.firstElementChild as HTMLElement | null
      if (!card) return
      run.current = prism(card, args)
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
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-prism]')).not.toBeNull())
    const cancel = [...canvasElement.querySelectorAll('button')].find((b) => b.textContent === 'Cancel')!
    cancel.click()
    await expect(canvasElement.querySelector('[data-yj-prism]')).toBeNull()
    await expect(document.getAnimations()).toHaveLength(0)
    const markup = card.outerHTML
    await expect(markup).not.toContain('opacity')
    const again = [...canvasElement.querySelectorAll('button')].find((b) => b.textContent === 'Play again')!
    again.click()
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-prism]')).not.toBeNull())
    await waitFor(() => expect(canvasElement.querySelector('[data-yj-prism]')).toBeNull(), { timeout: 15000 })
    await expect(document.getAnimations()).toHaveLength(0)
    await expect(card.outerHTML).toBe(markup)
  },
}

/** The channels read on either theme: added up to light on dark, multiplied down to ink on light. */
export const LightAndDark: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <div className="grid min-h-dvh grid-cols-2">
        {(['light', 'dark'] as const).map((mode) => (
          <ThemeScope key={mode} mode={mode}>
            <div className="flex h-full flex-col items-center justify-center gap-6 overflow-hidden bg-canvas px-4 py-12">
              <PrismEntrance key={play} {...args}>
                <SignInCard />
              </PrismEntrance>
              {mode === 'dark' && <ReplayButton onClick={replay} />}
            </div>
          </ThemeScope>
        ))}
      </div>
    )
  },
}

/** Right to left: pieces lock in from the right, and the channels’ offsets mirror. */
export const RightToLeft: Story = {
  render: function Render(args) {
    const [play, replay] = useReplay()
    return (
      <div dir="rtl">
        <Stage replay={replay}>
          <PrismEntrance key={play} {...args}>
            <SmallScreen />
          </PrismEntrance>
        </Stage>
      </div>
    )
  },
}
