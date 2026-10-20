import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SparklesIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { DemoSite } from '../../docs/demo-site'
import { NavbarDocs } from './navbar-docs'

const meta: Meta<typeof NavbarDocs> = {
  title: 'Blocks/Marketing/Navbar Docs',
  component: NavbarDocs,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'A documentation header: a version menu, ⌘K search over every page, the repository with its stars and the sections as tabs, with a drawer of the page tree on phones.',
      },
    },
  },
  render: (args) => <DemoSite page="docs">{(scroller) => <NavbarDocs {...args} scrollContainer={scroller} />}</DemoSite>,
}
export default meta
type Story = StoryObj<typeof NavbarDocs>

export const Default: Story = {
  args: { defaultSection: 'guides', current: '#guides/rollbacks/instant' },
}

/** Your own actions sit before the call to action: here an Ask AI button. */
export const WithActions: Story = {
  args: {
    defaultSection: 'guides',
    current: '#guides/rollbacks/instant',
    actions: (
      <Button variant="outline" size="sm" className="max-md:hidden">
        <SparklesIcon size={14} />
        Ask AI
      </Button>
    ),
  },
}

/** Two sections, no versions, no repository, in German. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Fernhill', href: '/' },
    sections: [
      { id: 'handbook', label: 'Handbuch', href: '/handbuch', groups: [{ title: 'Rösten', pages: [{ label: 'Profile', href: '/handbuch/profile' }, { label: 'Lagerung', href: '/handbuch/lagerung' }] }] },
      { id: 'api', label: 'API', href: '/api', groups: [{ title: 'Bestellungen', pages: [{ label: 'Abos', href: '/api/abos' }] }] },
    ],
    versions: [],
    repository: null,
    links: [{ label: 'Blog', href: '/blog' }],
    cta: { label: 'Anmelden', href: '/login', onClick: fn() },
    onSectionChange: fn(),
    onSearchSelect: fn(),
    copy: { docs: 'Doku', searchPlaceholder: 'Doku durchsuchen…', searchLabel: 'Doku durchsuchen', sectionsLabel: 'Bereiche', openMenu: 'Menü öffnen' },
  },
}
