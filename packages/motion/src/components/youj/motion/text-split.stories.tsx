import type { Meta, StoryObj } from '@storybook/react-vite'
import { revealVariantNames } from './reveal'
import { TextSplit } from './text-split'
import { Replayable } from './story-kit'

const meta = {
  title: 'Motion/TextSplit',
  component: TextSplit,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Splits text by `chars`, `words` or `lines` and reveals the pieces in sequence with any Reveal variant. `mask` clips each piece to its own box, so `rise` slides up from behind the line. Lines are measured from real layout and re-measured on resize and after web fonts load. The full text is rendered once in an `sr-only` span; the split copy is `aria-hidden`. Reduced motion renders plain text.',
      },
    },
  },
  args: {
    children: 'Precise motion is a quiet kind of confidence.',
    by: 'words',
    variant: 'rise',
    mask: false,
    inView: false,
    delay: 0,
  },
  argTypes: {
    by: { control: 'inline-radio', options: ['chars', 'words', 'lines'] },
    variant: { control: 'select', options: revealVariantNames },
    step: { control: 'inline-radio', options: [undefined, 'tight', 'base', 'loose'] },
    inView: { control: 'boolean' },
    duration: { control: 'select', options: [undefined, 'fast', 'base', 'slow', 'deliberate'] },
    ease: { control: 'select', options: [undefined, 'standard', 'enter', 'emphasized'] },
    as: { control: false },
  },
} satisfies Meta<typeof TextSplit>

export default meta
type Story = StoryObj<typeof meta>

/** An editorial header: chars for the kicker, masked lines for the headline, blurred words for the deck. */
export const Hero: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <Replayable className="flex min-h-screen items-center justify-center p-10">
      <article className="max-w-3xl">
        <TextSplit as="p" by="chars" variant="fade" inView={false} className="mb-6 font-mono text-xs tracking-[0.2em] text-accent uppercase">
          Field notes · Issue 07
        </TextSplit>
        <TextSplit
          as="h1"
          by="lines"
          mask
          inView={false}
          delay={1}
          duration="deliberate"
          ease="enter"
          className="text-6xl leading-[1.04] font-semibold tracking-tight text-fg"
        >
          The best transitions are the ones you only notice when they are gone.
        </TextSplit>
        <TextSplit as="p" by="words" variant="blur-in" step="tight" inView={false} delay={24} className="mt-8 max-w-xl text-lg/relaxed text-fg-muted">
          On timing tokens, springs without overshoot, and why a 240 millisecond fade reads as instant.
        </TextSplit>
        <div className="mt-10 flex items-center gap-3 border-t border-line pt-6 text-sm text-fg-muted">
          <span className="grid size-8 place-items-center rounded-full bg-well font-medium text-fg">KR</span>
          <span>Kai Rivera · 6 min read</span>
        </div>
      </article>
    </Replayable>
  ),
}

export const Modes: Story = {
  render: () => (
    <Replayable className="w-full max-w-[640px] pt-14">
      <div className="space-y-10">
      <div>
        <p className="mb-2 font-mono text-xs text-fg-subtle">chars · rise</p>
        <TextSplit by="chars" inView={false} className="text-3xl font-semibold tracking-tight">
          Kinetic typography
        </TextSplit>
      </div>
      <div>
        <p className="mb-2 font-mono text-xs text-fg-subtle">words · blur-in</p>
        <TextSplit by="words" variant="blur-in" inView={false} className="text-3xl font-semibold tracking-tight">
          Word by word, in focus
        </TextSplit>
      </div>
      <div>
        <p className="mb-2 font-mono text-xs text-fg-subtle">lines · wipe-right</p>
        <TextSplit as="p" by="lines" variant="wipe-right" inView={false} className="text-xl/relaxed text-fg-muted">
          Line mode groups words by where they actually wrapped, and measures again when the container resizes or fonts finish loading.
        </TextSplit>
      </div>
      <div>
        <p className="mb-2 font-mono text-xs text-fg-subtle">chars · mask</p>
        <TextSplit by="chars" mask inView={false} duration="slow" ease="enter" className="text-5xl font-semibold tracking-tight">
          Masked
        </TextSplit>
      </div>
      </div>
    </Replayable>
  ),
}

/** Drag the corner to resize: lines re-measure and keep their settled state. */
export const ResizableLines: Story = {
  args: { by: 'lines', mask: true, children: 'Resize this box. The lines are measured from real layout, so the split always matches what you see, at any width and with any font.' },
  render: (args) => (
    <div className="w-full max-w-[560px] resize-x overflow-hidden rounded-xl border border-dashed border-line-strong p-6">
      <TextSplit {...args} as="p" className="text-2xl/snug font-medium tracking-tight" />
    </div>
  ),
}

export const Playground: Story = {
  render: (args) => (
    <Replayable className="w-full max-w-[560px] pt-12">
      <TextSplit {...args} as="p" className="text-4xl font-semibold tracking-tight" />
    </Replayable>
  ),
}

/** Plain text, fully readable, no split. */
export const ReducedMotion: Story = {
  ...Hero,
  globals: { reducedMotion: 'always' },
}
