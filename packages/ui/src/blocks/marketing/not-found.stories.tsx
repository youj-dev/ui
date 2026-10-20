import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { NotFound as NotFoundBlock } from './not-found'

const meta: Meta<typeof NotFoundBlock> = {
  title: 'Blocks/Marketing/Not found',
  component: NotFoundBlock,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component: 'Give visitors a way forward with a not-found page, its lighthouse sweeping the fog, or a coming-soon page with a launch sign-up.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof NotFoundBlock>

/** The 404 beside a lighthouse sweeping the fog: a search field, the way home and the popular pages. */
export const NotFound: Story = {}

/** The 404 without the miniature: its digits rise over a constellation that gathers around the pointer. */
export const NotFoundPlain: Story = { name: 'Not found, plain', args: { media: null } }

export const ComingSoon: Story = {
  args: { variant: 'coming-soon' },
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    homeCta: { label: 'Back to the shop', href: '/' },
    destinations: [
      { title: 'Coffee', description: 'This week’s roasts.', href: '/coffee' },
      { title: 'Subscriptions', description: 'Fresh beans, every two weeks.', href: '/subscribe' },
    ],
    copy: {
      title: 'This bag is empty',
      description: 'We couldn’t find that page. The roast may have sold out.',
      searchPlaceholder: 'Search coffees and brewing guides',
      back: '',
    },
    onSearch: fn(),
    onBack: fn(),
    onNotify: fn(),
  },
}
