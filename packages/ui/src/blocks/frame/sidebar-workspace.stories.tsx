import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DEFAULT_FRAME } from '../../docs/create/config'
import { FramePreview } from '../../docs/create/render'
import { DemoAppPage } from '../../docs/demo-app-page'
import { SidebarDemoPage, WORKSPACE_LINKS, WORKSPACE_NAV, WORKSPACE_PAGE, WORKSPACE_TEAMS, WORKSPACE_USER } from '../../docs/sidebar-demos'
import { FrameAccountCard } from './account-card'
import { AppFrame } from './shell'
import { FrameSidebarWorkspace, type FrameSidebarWorkspaceProps } from './sidebar-workspace'
import { FrameTopbarBreadcrumb } from './topbar-breadcrumb'
import { FrameWorkspace } from './workspace'

const meta: Meta<typeof FrameSidebarWorkspace> = {
  title: 'Blocks/Frame/Sidebar workspace',
  component: FrameSidebarWorkspace,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'fragment' },
    docs: {
      description: {
        component:
          'For products people run their day in: raised white rows on the gray chrome, a command field with go-to keys, counts on one column, folding spaces, optional live state, and a setup card at the foot.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FrameSidebarWorkspace>

/** Home-care operations: its nav and regions, the setup card, the foot's pages and the account. */
function Ops(props: Partial<FrameSidebarWorkspaceProps> & { collapsed?: boolean }) {
  const { collapsed, ...sidebar } = props
  return (
    <AppFrame
      nav={WORKSPACE_NAV}
      defaultActive="alerts"
      defaultCollapsed={collapsed}
      onNavigate={fn()}
      sidebar={
        <FrameSidebarWorkspace
          header={<FrameWorkspace teams={WORKSPACE_TEAMS} onValueChange={fn()} />}
          footer={<FrameAccountCard user={WORKSPACE_USER} onSignOut={fn()} />}
          setup={{ title: 'Finish setup', description: 'Connect the front-desk tablet so staff can check visitors in.', done: 3, total: 4 }}
          onSetupNext={fn()}
          onSetupSkip={fn()}
          links={WORKSPACE_LINKS}
          actions={[{ id: 'visit', label: 'New visit', onSelect: fn() }]}
          {...sidebar}
        />
      }
      topbar={<FrameTopbarBreadcrumb />}
    >
      <SidebarDemoPage data={WORKSPACE_PAGE} />
    </AppFrame>
  )
}

export const Default: Story = { render: () => <Ops /> }

export const Dark: Story = { render: () => <Ops />, globals: { theme: 'dark' } }

export const Phone: Story = { render: () => <Ops />, globals: { viewport: { value: 'mobile2', isRotated: false } } }

export const Collapsed: Story = { name: 'Collapsed to icons', render: () => <Ops collapsed /> }

/** Pinned tiles, what needs you, and who's where: the live state the old Pulse and Spaces sidebars carried. */
export const LiveState: Story = {
  name: 'Live state',
  render: () => (
    <Ops
      setup={undefined}
      pinned={['overview', 'schedule', 'visits']}
      signals={[
        { id: 'swap', page: 'alerts', title: 'Odile needs a swap at 13:15', priority: 'urgent', time: '4m' },
        { id: 'note', page: 'clients', title: 'Care note from Kasimir’s family', priority: 'normal', time: '1h' },
      ]}
      onSignalClear={fn()}
      activity={{
        schedule: { people: [{ id: 'iv', name: 'Ines Varga' }, { id: 'to', name: 'Tomas Oyelaran' }] },
        staff: { live: true },
        clients: { unread: true },
      }}
    />
  ),
}

/** In Create's frame, on the sample nav. */
export const InCreate: Story = {
  name: 'In Create',
  render: () => <FramePreview config={{ ...DEFAULT_FRAME, sidebar: 'workspace' }}>{<DemoAppPage />}</FramePreview>,
}

/** The field's strings in German and no setup card. */
export const WithYourData: Story = {
  name: 'With your data',
  render: () => <Ops setup={undefined} copy={{ search: 'Seiten und Aktionen suchen', placeholder: 'Suchen oder springen…', pages: 'Seiten', actions: 'Aktionen' }} />,
}
