import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
import { Button } from '../../components/ui/button'
import { DemoSite } from '../../docs/demo-site'
import { NavbarStore } from './navbar-store'

const meta: Meta<typeof NavbarStore> = {
  title: 'Blocks/Marketing/Navbar Store',
  component: NavbarStore,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'A shop’s header: a strip with the promise and the region, departments with collection tiles, a search that suggests products priced in your currency, and a bag whose count drops in.',
      },
    },
  },
  render: (args) => <DemoSite page="store">{(scroller) => <NavbarStore {...args} scrollContainer={scroller} />}</DemoSite>,
}
export default meta
type Story = StoryObj<typeof NavbarStore>

export const Default: Story = {}

/** Add to the bag: the count drops in on a settle spring. */
export const BagCount: Story = {
  render: (args) => {
    function Demo() {
      const [count, setCount] = useState(2)
      return (
        <DemoSite page="store">
          {(scroller) => (
            <>
              <NavbarStore {...args} bag={{ href: '#bag', count }} scrollContainer={scroller} />
              <div className="fixed end-4 bottom-4 z-50">
                <Button onClick={() => setCount((c) => c + 1)}>Add to bag</Button>
              </div>
            </>
          )}
        </DemoSite>
      )
    }
    return <Demo />
  },
}

/** A café's shop in pounds: two departments, no promise, its own search catalogue. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Fernhill', href: '/' },
    departments: [
      { label: 'Coffee', groups: [{ title: 'Beans', links: [{ label: 'Single origin', href: '/coffee/single-origin' }, { label: 'Blends', href: '/coffee/blends' }] }] },
      { label: 'Brewing', href: '/brewing' },
      { label: 'Offers', href: '/offers', highlight: true },
    ],
    regions: [{ id: 'gb', label: 'United Kingdom', currency: 'GBP' }],
    promo: null,
    utilityLinks: [{ label: 'Cafés', href: '/cafes' }],
    products: [{ id: 'kiambu', name: 'Kiambu AA', href: '/coffee/kiambu', price: 14.5, category: 'Single origin' }],
    popularSearches: ['decaf'],
    bag: { href: '/bag', count: 0 },
    onSearchSelect: fn(),
    onRegionChange: fn(),
    current: '/brewing',
    copy: { searchPlaceholder: 'Search the shop…' },
  },
}
