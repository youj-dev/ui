import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CtaHeadline } from './cta-headline'

const meta: Meta<typeof CtaHeadline> = {
  title: 'Blocks/Marketing/CTA headline',
  component: CtaHeadline,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section', preset: 'brutal' },
    docs: {
      description: {
        component:
          'Close your page with a bold headline and a prominent button for the next step.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CtaHeadline>

export const Default: Story = {}

/** In a narrower column, the type scales to the container, not the viewport. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto min-h-dvh max-w-3xl bg-canvas p-6">
      <h1 className="sr-only">Northwind for agencies</h1>
      <CtaHeadline {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    cta: { label: 'Apply now', href: '#apply', onClick: fn() },
    copy: {
      eyebrow: 'Spring cohort opens 3 March',
      command: '',
      title: 'Learn it',
      titleOutline: 'by doing.',
      description: 'Twelve weeks, one real product, a mentor who has shipped it before.',
      finePrint: 'Scholarships available · Pay after you are hired',
    },
  },
}
