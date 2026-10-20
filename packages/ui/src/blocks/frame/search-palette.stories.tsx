import type { Meta, StoryObj } from '@storybook/react-vite'
import { DEFAULT_FRAME } from '../../docs/create/config'
import { FramePreview } from '../../docs/create/render'
import { fn } from 'storybook/test'
import { DemoAppPage } from '../../docs/demo-app-page'
import { CreditCardIcon, PackageIcon } from '@youj/icons'
import { AppFrame } from './shell'
import { NAV } from './shell/data'
import { FrameSearchPalette } from './search-palette'
import { FrameSidebarClassic } from './sidebar-classic'
import { FrameTopbarBreadcrumb } from './topbar-breadcrumb'

const meta: Meta<typeof FramePreview> = {
  title: 'Blocks/Frame/Search palette',
  component: FramePreview,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'overlay' },
    docs: {
      description: {
        component:
          'Put pages and common actions within reach with a command palette in your app frame.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FramePreview>

export const Default: Story = {
  name: 'Default',
  args: { config: { ...DEFAULT_FRAME, search: 'palette' } },
}

export const WithYourData: Story = {
  name: 'With your data',
  render: () => (
    <AppFrame
      nav={NAV}
      sidebar={<FrameSidebarClassic />}
      topbar={
        <FrameTopbarBreadcrumb
          search={
            <FrameSearchPalette
              placeholder="Find anything…"
              commands={[
                { id: 'new-order', label: 'New order', icon: PackageIcon, shortcut: '⌘O' },
                { id: 'refund', label: 'Issue a refund', icon: CreditCardIcon, keywords: ['money back'] },
              ]}
              onCommand={fn()}
            />
          }
        />
      }
    >
      <DemoAppPage />
    </AppFrame>
  ),
}
