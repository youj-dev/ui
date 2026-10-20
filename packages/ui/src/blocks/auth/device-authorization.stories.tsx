import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { wait } from './shell'
import { DeviceAuthorization } from './device-authorization'

const meta: Meta<typeof DeviceAuthorization> = {
  title: 'Blocks/Auth/Device authorization',
  component: DeviceAuthorization,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Let someone approve a command-line tool or device from the browser: who is asking, what it can do, the account it would use, the code to compare with the terminal and a plain safety note.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DeviceAuthorization>

export const Card: Story = { args: { code: 'TFXS-STXG' } }

export const Split: Story = { args: { code: 'TFXS-STXG', layout: 'split' } }

/** Opened by hand, without a code in the link: the code field takes the one the terminal printed (ZZZZ-ZZZZ is the demo's refused code). */
export const EnterCode: Story = { name: 'Enter the code' }

/** After Authorize: the tool is in, and the tab can close. */
export const Approved: Story = { args: { defaultStep: 'approved' } }

/** After Deny: nothing was shared. */
export const Denied: Story = { args: { defaultStep: 'denied' } }

/** The code ran out before anyone answered. */
export const Expired: Story = { args: { defaultStep: 'expired' } }

/** Another tool, account and words, and the checks in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Fernleaf Health', href: '/' },
    app: { name: 'Meadow Sync', version: '0.9.2' },
    access: ['Read your appointments', 'Write visit notes'],
    account: { name: 'Priya Raman', email: 'priya@fernleaf.health' },
    code: 'KD4M-72QW',
    copy: { deviceTitle: (app: string) => `Connect ${app}` },
    onAuthorize: fn(async () => wait(700)),
    onDeny: fn(async () => wait(400)),
    onCheckCode: fn(async () => wait(400)),
  },
}
