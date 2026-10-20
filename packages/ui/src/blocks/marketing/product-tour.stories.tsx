import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Button } from '../../components/ui/button'
import { ProductTour } from './product-tour'

const meta: Meta<typeof ProductTour> = {
  title: 'Blocks/Marketing/Product tour',
  component: ProductTour,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Let visitors try the product instead of watching it: a rail of steps beside a live window of real components, with each step checked off as they do its thing and a progress line that fills.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ProductTour>

export const Default: Story = {}

/** Opens on the last step, with two done. */
export const NearlyThere: Story = { args: { defaultValue: 'ship', done: ['connect', 'guardrails'] } }

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="sr-only">Product tour</h1>
      <ProductTour {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { eyebrow: 'Try it', title: 'Take an order, start to finish', description: 'Three steps in a pretend shop. Nothing is saved.', finish: 'Open your own shop', address: 'fernhill.shop/admin' },
    steps: [
      {
        id: 'add',
        title: 'Add a product',
        description: 'A name, a price and a photo is all a product needs.',
        prompt: 'Add the beans',
        render: ({ done, complete }) => (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4">
            <span className="text-ui font-medium text-fg">Single origin, 250 g</span>
            <Button size="sm" onClick={complete} disabled={done}>
              {done ? 'Added' : 'Add to shop'}
            </Button>
          </div>
        ),
      },
      {
        id: 'order',
        title: 'Take an order',
        description: 'Orders arrive with the address and the payment already sorted.',
        prompt: 'Mark it as packed',
        render: ({ done, complete }) => (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4">
            <span className="text-ui font-medium text-fg">Order 1042 · 2 bags</span>
            <Button size="sm" variant="outline" onClick={complete}>
              {done ? 'Packed' : 'Mark packed'}
            </Button>
          </div>
        ),
      },
    ],
    cta: { href: '/signup', onClick: fn() },
    onValueChange: fn(),
    onDoneChange: fn(),
  },
}
