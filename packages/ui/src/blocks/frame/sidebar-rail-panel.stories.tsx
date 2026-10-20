import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DEFAULT_FRAME } from '../../docs/create/config'
import { FramePreview } from '../../docs/create/render'
import { DemoAppPage } from '../../docs/demo-app-page'
import { RAIL_PANEL_NAV, RAIL_PANEL_PAGE, RAIL_PANEL_TEAMS, RAIL_PANEL_USER, SidebarDemoPage } from '../../docs/sidebar-demos'
import { FrameAccountCard } from './account-card'
import { AppFrame } from './shell'
import { FrameSidebarRailPanel, type FrameSidebarRailPanelProps } from './sidebar-rail-panel'
import { FrameTopbarBreadcrumb } from './topbar-breadcrumb'
import { FrameWorkspace } from './workspace'

const meta: Meta<typeof FrameSidebarRailPanel> = {
  title: 'Blocks/Frame/Sidebar rail panel',
  component: FrameSidebarRailPanel,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'fragment' },
    docs: {
      description: {
        component:
          'For products with many areas: round keys for the sections on a slim rail, beside a panel with the section’s title, a view toggle, a filter and its pages as a tree with count pills. Folds to the rail, whose keys fly the pages out.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FrameSidebarRailPanel>

const VIEWS = [
  { id: '30', label: '30 days' },
  { id: '365', label: '12 months' },
]

/** Contract management: sections on the rail, a renewal tree in the panel. */
function Contracts(props: Partial<FrameSidebarRailPanelProps> & { collapsed?: boolean }) {
  const { collapsed, ...sidebar } = props
  return (
    <AppFrame
      nav={RAIL_PANEL_NAV}
      defaultActive="quill"
      defaultCollapsed={collapsed}
      onNavigate={fn()}
      sidebar={
        <FrameSidebarRailPanel
          header={<FrameWorkspace teams={RAIL_PANEL_TEAMS} onValueChange={fn()} />}
          footer={<FrameAccountCard user={RAIL_PANEL_USER} onSignOut={fn()} />}
          views={VIEWS}
          onViewChange={fn()}
          onAdd={fn()}
          {...sidebar}
        />
      }
      topbar={<FrameTopbarBreadcrumb />}
    >
      <SidebarDemoPage data={RAIL_PANEL_PAGE} />
    </AppFrame>
  )
}

export const Default: Story = { render: () => <Contracts /> }

export const Dark: Story = { render: () => <Contracts />, globals: { theme: 'dark' } }

export const Phone: Story = { render: () => <Contracts />, globals: { viewport: { value: 'mobile2', isRotated: false } } }

/** Folded to the rail: each key flies its section's pages out beside it. */
export const Collapsed: Story = { name: 'Folded to the rail', render: () => <Contracts collapsed /> }

/** `panel="drill"`: one level at a time, the way back named above each level. */
export const Drill: Story = { name: 'Drill-down panel', render: () => <Contracts panel="drill" /> }

/** In Create's frame, on the sample nav. */
export const InCreate: Story = {
  name: 'In Create',
  render: () => <FramePreview config={{ ...DEFAULT_FRAME, sidebar: 'rail-panel' }}>{<DemoAppPage />}</FramePreview>,
}

/** No views or add button, and the rail's name in German. */
export const WithYourData: Story = {
  name: 'With your data',
  render: () => <Contracts views={undefined} onAdd={undefined} copy={{ sections: 'Bereiche', path: 'Pfad', back: (to) => `Zurück zu ${to}` }} />,
}
