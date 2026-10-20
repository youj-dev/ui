import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { loaderArgTypes, loaderArgs, SizeRow, Stage } from '../story-kit'
import { LoaderBanyan, meta as about } from './banyan'

const meta = {
  title: 'Visuals/Loaders/Geometry/Banyan',
  component: LoaderBanyan,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: about.description } } },
  argTypes: { ...loaderArgTypes, size: { control: { type: 'range', min: 24, max: 900, step: 8 } } },
  args: { ...loaderArgs, size: 720 },
} satisfies Meta<typeof LoaderBanyan>
export default meta
type Story = StoryObj<typeof meta>

/** The introduction holds its canopy while a visitor enters their early access code. */
export const Hero: Story = {
  render: (args) => (
    <main className="grid min-h-screen items-center overflow-hidden bg-canvas text-fg lg:grid-cols-[1.2fr_1fr]">
      <div className="grid min-h-[28rem] place-items-center [--yj-anim-paper:var(--color-canvas)]">
        <LoaderBanyan {...args} label={null} style={{ zoom: 'min(1, calc(100vw / 780px))' }} />
      </div>
      <section className="mx-auto w-full max-w-md px-8 pb-16 lg:py-16">
        <p className="mb-6 font-mono text-xs tracking-widest text-accent uppercase">Private beta</p>
        <h1 className="text-4xl leading-tight font-medium tracking-tight">Good things<br />take root.</h1>
        <p className="mt-5 max-w-xs text-sm leading-relaxed text-fg-muted">A little space for what comes next. Enter your invitation code to join us.</p>
        <form className="mt-10 flex flex-col gap-3" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="banyan-early-access-code" className="text-xs font-medium">Invitation code</label>
          <input id="banyan-early-access-code" name="code" autoComplete="off" placeholder="Your early access code" className="rounded-md border border-line bg-surface px-4 py-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent" />
          <button type="submit" className="mt-1 rounded-md bg-accent px-4 py-3 text-sm font-medium text-on-accent outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Enter the beta</button>
        </form>
        <p className="mt-6 text-xs text-fg-subtle">An invitation to grow something.</p>
      </section>
    </main>
  ),
}

/** Eighteen token beats; pause holds the current living canopy. */
export const Playground: Story = { render: (args) => <Stage><LoaderBanyan {...args} /></Stage> }

export const Sizes: Story = { render: () => <SizeRow Loader={LoaderBanyan} /> }

/** The illuminated crown is also the server-rendered frame. */
export const ReducedMotion: Story = {
  render: (args) => <YoujProvider reducedMotion="always"><Stage><LoaderBanyan {...args} /></Stage></YoujProvider>,
}

export const Label: Story = {
  args: { size: 240, label: 'Putting down roots', showLabel: true },
  render: (args) => <Stage><LoaderBanyan {...args} /></Stage>,
}
