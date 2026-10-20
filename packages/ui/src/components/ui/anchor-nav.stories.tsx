import type { Meta, StoryObj } from '@storybook/react-vite'
import { AnchorNav, type AnchorNavItem } from './anchor-nav'

const meta: Meta<typeof AnchorNav> = {
  title: 'UI/Navigation/AnchorNav',
  component: AnchorNav,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A table of contents that follows the reader. The section in view is aria-current="location" and a bar on the list\'s edge (a motion SlidingIndicator) glides to it on the smooth spring. Choosing a link scrolls smoothly to the section (instantly under reduced motion), moves focus there without a second scroll and updates the hash; during that scroll the bar goes straight to the destination instead of stepping through every section. Wheel or touch mid-scroll hands control back. `offset` clears a sticky header; `scrollContainer` tracks an element instead of the page.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AnchorNav>

const items: AnchorNavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'install', label: 'Installation' },
  { id: 'npm', label: 'From npm', depth: 1 },
  { id: 'registry', label: 'From the registry', depth: 1 },
  { id: 'theming', label: 'Theming' },
  { id: 'motion', label: 'Motion and reduced motion' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'faq', label: 'FAQ' },
]

function Docs() {
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_14rem]">
      <article className="flex min-w-0 flex-col gap-10">
        {items.map((item, i) => (
          <section key={item.id} id={item.id} className="flex scroll-mt-4 flex-col gap-3 rounded-md outline-none focus-visible:outline-2 focus-visible:outline-focus">
            {item.depth ? (
              <h3 className="text-ui-lg font-semibold text-fg">{item.label}</h3>
            ) : (
              <h2 className="text-2xl font-semibold tracking-tight text-fg">{item.label}</h2>
            )}
            {Array.from({ length: i % 3 === 0 ? 3 : 2 }, (_, p) => (
              <p key={p} className="text-ui-lg leading-relaxed text-fg-muted">
                Youj components compose from Base UI primitives and move through motion tokens, so Speed and reduced
                motion reach everything: overlays, indicators and the height of a list. This paragraph is here so the page
                has something to scroll through.
              </p>
            ))}
          </section>
        ))}
        <div className="h-[40vh]" />
      </article>
      <aside className="hidden lg:block">
        <AnchorNav items={items} className="sticky top-10" />
      </aside>
    </div>
  )
}

export const Default: Story = { render: () => <Docs /> }
