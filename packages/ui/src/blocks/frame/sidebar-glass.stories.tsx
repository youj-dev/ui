import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DEFAULT_FRAME } from '../../docs/create/config'
import { FramePreview } from '../../docs/create/render'
import { DemoAppPage } from '../../docs/demo-app-page'
import { GLASS_NAV, GLASS_PAGE, GLASS_TEAMS, GLASS_USER, SidebarDemoPage } from '../../docs/sidebar-demos'
import { FrameAccountCard } from './account-card'
import { AppFrame } from './shell'
import { FrameSidebarGlass, type FrameSidebarGlassProps } from './sidebar-glass'
import { FrameTopbarBreadcrumb } from './topbar-breadcrumb'
import { FrameWorkspace } from './workspace'

const meta: Meta<typeof FrameSidebarGlass> = {
  title: 'Blocks/Frame/Sidebar glass',
  component: FrameSidebarGlass,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'fragment' },
    docs: {
      description: {
        component:
          'For data tools, file systems and knowledge bases: the kit Sidebar’s glass surface over a backdrop of the theme’s inks, a nav column beside an explorer with a filter and a tree to any depth.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FrameSidebarGlass>

/** A data catalog: the nav column and the catalog's tree in the explorer. */
function Catalog(props: Partial<FrameSidebarGlassProps>) {
  return (
    <AppFrame
      nav={GLASS_NAV}
      defaultActive="orders"
      onNavigate={fn()}
      sidebar={
        <FrameSidebarGlass header={<FrameWorkspace teams={GLASS_TEAMS} onValueChange={fn()} />} footer={<FrameAccountCard user={GLASS_USER} onSignOut={fn()} />} {...props} />
      }
      topbar={<FrameTopbarBreadcrumb />}
    >
      <SidebarDemoPage data={GLASS_PAGE} />
    </AppFrame>
  )
}

export const Default: Story = { render: () => <Catalog /> }

export const Dark: Story = { render: () => <Catalog />, globals: { theme: 'dark' } }

export const Phone: Story = { render: () => <Catalog />, globals: { viewport: { value: 'mobile2', isRotated: false } } }

/** In Create's frame, on the sample nav: Projects opens in the explorer. */
export const InCreate: Story = {
  name: 'In Create',
  render: () => <FramePreview config={{ ...DEFAULT_FRAME, sidebar: 'glass' }}>{<DemoAppPage />}</FramePreview>,
}

/** Your own background behind the glass, and no filter. */
export const WithYourData: Story = { name: 'With your data', render: () => <Catalog backdrop={false} search={false} /> }
