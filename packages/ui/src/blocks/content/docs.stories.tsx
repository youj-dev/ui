import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { basalt } from '@youj/core'
import { Docs } from './docs'

const meta: Meta<typeof Docs> = {
  title: 'Blocks/Content/Docs',
  component: Docs,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: basalt },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Help readers navigate your documentation with a page tree and an outline beside each article.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Docs>

export const Default: Story = {}

export const Introduction: Story = { args: { defaultPage: 'introduction' } }

/** With your data: a payments API's docs with its own pages, brand and version, no edit link, and navigation and feedback in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Tollgate' },
    version: 'API 2026-09',
    getEditHref: null,
    defaultPage: 'charges',
    pages: [
      {
        id: 'overview',
        group: 'Start here',
        title: 'Overview',
        lead: 'Tollgate takes card and bank payments through one API.',
        sections: [{ id: 'keys', title: 'API keys', body: <p className="leading-7">Use a test key while you build; switch to a live key to take real money.</p> }],
      },
      {
        id: 'charges',
        group: 'Payments',
        title: 'Charges',
        lead: 'Create, capture and refund a charge.',
        updated: 'Sep 28, 2026',
        sections: [
          { id: 'create', title: 'Create a charge', body: <p className="leading-7">POST an amount in minor units and a payment method id.</p> },
          { id: 'capture', title: 'Capture later', depth: 1, body: <p className="leading-7">Authorize now and capture within seven days.</p> },
          { id: 'refund', title: 'Refund', body: <p className="leading-7">Refund all or part of a captured charge.</p> },
        ],
      },
      {
        id: 'payouts',
        group: 'Payments',
        title: 'Payouts',
        lead: 'Move your balance to a bank account.',
        sections: [{ id: 'schedule', title: 'Schedule', body: <p className="leading-7">Daily, weekly or monthly, from 07:00 UTC.</p> }],
      },
    ],
    copy: { helpful: 'Did this answer your question?' },
    onPageChange: fn(),
    onFeedback: fn(),
  },
}
