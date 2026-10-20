import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { defineTheme } from '@youj/core'
import { ApiKeys } from './api-keys'

const ledger = defineTheme({ accent: 'oklch(0.7 0.15 170)', radius: 'sm', controlSize: 'compact' }) // youj-allow: theme accent

const meta: Meta<typeof ApiKeys> = {
  title: 'Blocks/App/API Keys',
  component: ApiKeys,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: ledger },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Manage your API keys in a table with scopes, recent use and a flow for creating new keys.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ApiKeys>

export const Default: Story = {}

/** Its own page, for an app without the frame: the top bar over a centered canvas. */
export const Standalone: Story = { args: { embedded: false } }

/** The create flow: a name, None / Read / Write for each resource, an expiry, then the secret shown once. */
export const CreateWithScopes: Story = {
  name: 'Create with scopes',
  args: { defaultCreateOpen: true, onCreateOpenChange: fn() },
}

export const TestEnvironment: Story = { args: { defaultEnv: 'test' } }

/** Your own keys, resources and words: a fleet platform's tokens, minted and revoked through your API. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Routewise', logo: 'RW' },
    resources: ['Vehicles', 'Drivers', 'Routes'],
    nav: [
      { label: 'Overview', href: '#' },
      { label: 'Tokens', href: '#', current: true },
      { label: 'Usage', href: '#' },
    ],
    keys: [
      { id: 'rw1', name: 'Dispatch backend', env: 'live', last4: '9c1d', scopes: { Vehicles: 'write', Drivers: 'write', Routes: 'write' }, createdBy: 'Ines Duarte', lastUsed: Date.UTC(2026, 8, 30, 11, 40), expires: 'never', traffic: [2200, 2310, 2480, 2405, 2600, 1200, 980] },
      { id: 'rw2', name: 'Driver app sync', env: 'live', last4: '04be', scopes: { Vehicles: 'read', Drivers: 'write', Routes: 'read' }, createdBy: 'Kofi Mensah', lastUsed: Date.UTC(2026, 8, 30, 9), expires: '1y', traffic: [640, 702, 690, 720, 815, 300, 260] },
      { id: 'rw3', name: 'CI smoke tests', env: 'test', last4: '77f0', scopes: { Vehicles: 'read', Drivers: 'none', Routes: 'read' }, createdBy: 'Ines Duarte', lastUsed: Date.UTC(2026, 8, 29, 4), expires: '90d', traffic: [12, 12, 14, 12, 13, 0, 0] },
    ],
    copy: {
      title: 'Access tokens',
      createKey: 'New token',
      brandBadge: 'platform',
      emptyDescription: 'Sandbox tokens route against a simulated fleet.',
    },
    onCreate: fn(async (draft) => `sk_${draft.env}_0123456789abcdefghijkmnopqrstuvw`),
    onRoll: fn(async (key) => `sk_${key.env}_zyxwvutsrqponmkjihgfedcba9876543`),
    onRevoke: fn(),
    onEnvChange: fn(),
  },
}
