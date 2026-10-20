import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DEFAULT_FRAME } from '../../docs/create/config'
import { FramePreview } from '../../docs/create/render'
import { DemoAppPage } from '../../docs/demo-app-page'
import { ICON_RAIL_NAV, ICON_RAIL_PAGE, ICON_RAIL_TEAMS, ICON_RAIL_USER, SidebarDemoPage } from '../../docs/sidebar-demos'
import { FrameAccountCard } from './account-card'
import { AppFrame } from './shell'
import { FrameSidebarIconRail } from './sidebar-icon-rail'
import { FrameTopbarBreadcrumb } from './topbar-breadcrumb'
import { FrameWorkspace } from './workspace'

const meta: Meta<typeof FrameSidebarIconRail> = {
  title: 'Blocks/Frame/Sidebar icon rail',
  component: FrameSidebarIconRail,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'fragment' },
    docs: {
      description: {
        component: 'For products with a handful of areas: a slim floating rail of icons with names in tooltips, the current one raised, the account at the foot. On phones it becomes the bottom tab bar.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FrameSidebarIconRail>

/** An AI research desk with a handful of areas. */
function Desk() {
  return (
    <AppFrame
      nav={ICON_RAIL_NAV}
      defaultActive="accounts"
      onNavigate={fn()}
      sidebar={<FrameSidebarIconRail header={<FrameWorkspace teams={ICON_RAIL_TEAMS} onValueChange={fn()} />} footer={<FrameAccountCard user={ICON_RAIL_USER} onSignOut={fn()} />} />}
      topbar={<FrameTopbarBreadcrumb />}
    >
      <SidebarDemoPage data={ICON_RAIL_PAGE} />
    </AppFrame>
  )
}

export const Default: Story = { render: () => <Desk /> }

export const Dark: Story = { render: () => <Desk />, globals: { theme: 'dark' } }

/** On a phone the rail is the bottom tab bar; Menu opens the whole nav. */
export const Phone: Story = { render: () => <Desk />, globals: { viewport: { value: 'mobile2', isRotated: false } } }

/** In Create's frame, on the sample nav. */
export const InCreate: Story = {
  name: 'In Create',
  render: () => <FramePreview config={{ ...DEFAULT_FRAME, sidebar: 'icon-rail' }}>{<DemoAppPage />}</FramePreview>,
}
