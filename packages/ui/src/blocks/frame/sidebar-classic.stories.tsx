import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DEFAULT_FRAME } from '../../docs/create/config'
import { FramePreview } from '../../docs/create/render'
import { DemoAppPage } from '../../docs/demo-app-page'
import { CLASSIC_LINKS, CLASSIC_NAV, CLASSIC_PAGE, CLASSIC_TEAMS, CLASSIC_USER, SidebarDemoPage } from '../../docs/sidebar-demos'
import { FrameAccountCard } from './account-card'
import { AppFrame } from './shell'
import { FrameSidebarClassic, type FrameSidebarClassicProps } from './sidebar-classic'
import { FrameTopbarBreadcrumb } from './topbar-breadcrumb'
import { FrameUpgradeCard } from './upgrade-card'
import { FrameWorkspace } from './workspace'

const meta: Meta<typeof FrameSidebarClassic> = {
  title: 'Blocks/Frame/Sidebar classic',
  component: FrameSidebarClassic,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'fragment' },
    docs: {
      description: {
        component:
          'The app sidebar most products start from, close to shadcn’s: a filter, labeled sections, icons and counts, nested pages, a folding Favorites group, pages for the foot, a meter and the account. Resizes, and folds to icons.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FrameSidebarClassic>

/** A sales CRM: its nav, a credits meter and the account at the foot. */
function Crm(props: Partial<FrameSidebarClassicProps> & { collapsed?: boolean }) {
  const { collapsed, ...sidebar } = props
  return (
    <AppFrame
      nav={CLASSIC_NAV}
      defaultActive="inbox"
      defaultCollapsed={collapsed}
      onNavigate={fn()}
      sidebar={
        <FrameSidebarClassic
          header={<FrameWorkspace teams={CLASSIC_TEAMS} onValueChange={fn()} />}
          links={CLASSIC_LINKS}
          footer={
            <>
              <FrameUpgradeCard plan={null} label="Credits used" used={810} limit={3100} action={null} dismissible={false} />
              <FrameAccountCard user={CLASSIC_USER} onSignOut={fn()} />
            </>
          }
          {...sidebar}
        />
      }
      topbar={<FrameTopbarBreadcrumb />}
    >
      <SidebarDemoPage data={CLASSIC_PAGE} />
    </AppFrame>
  )
}

export const Default: Story = { render: () => <Crm /> }

export const Dark: Story = { render: () => <Crm />, globals: { theme: 'dark' } }

export const Phone: Story = { render: () => <Crm />, globals: { viewport: { value: 'mobile2', isRotated: false } } }

/** Folded to icons: names in tooltips, and Automations opens its pages in a menu to its side. */
export const Collapsed: Story = { name: 'Collapsed to icons', render: () => <Crm collapsed /> }

/** `variant="inset"`: the page is a raised card, the top bar pinned to its top. */
export const Inset: Story = { render: () => <Crm variant="inset" /> }

/** In Create's frame, on the sample nav. */
export const InCreate: Story = {
  name: 'In Create',
  render: () => <FramePreview config={{ ...DEFAULT_FRAME, sidebar: 'classic' }}>{<DemoAppPage />}</FramePreview>,
}

/** Another width the app keeps, no filter, and the edge's name in German. */
export const WithYourData: Story = {
  name: 'With your data',
  render: () => <Crm search={false} defaultWidth={300} onWidthChange={fn()} copy={{ resize: 'Seitenleiste anpassen', resizeValue: (px) => `${px} Pixel breit`, resizeCollapsed: 'Auf Symbole reduziert' }} />,
}
