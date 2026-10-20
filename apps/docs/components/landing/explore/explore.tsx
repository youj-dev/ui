import { Section } from '@/components/landing/section'
import { ExploreGrid } from './explore-live'

/**
 * Twenty-eight of the kit's pieces, live, on a bento: three large, eleven wide, six tall and eight single tiles, each with its
 * name and a corner link to its docs (the tile itself isn't a link: most hold controls). The grid is a client
 * component that takes no props, so the page's payload carries one reference to it instead of twenty-eight tiles' markup
 * (the HTML still has them all). Each tile's stage holds a light stand-in, and its piece is a chunk of its own,
 * fetched as the tile nears the screen (explore-live.tsx).
 */
export function Explore() {
  return (
    <Section id="explore" title="Try the parts, live." lede="Twenty-eight pieces of the kit, running. Use them, then open their docs.">
      <ExploreGrid />
    </Section>
  )
}
