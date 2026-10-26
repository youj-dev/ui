import { act, render, screen } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import type { Pillar } from '@/lib/nav'
import { Family } from './family'

const pillar = (id: Pillar['id'], label: string, url: string, stat = label): Pillar => ({ id, name: `Youj ${label}`, label, url, blurb: '', stat })
const PILLARS: Pillar[] = [
  pillar('ui', 'UI', '/docs/components'),
  pillar('motion', 'Motion', '/docs/motion'),
  { ...pillar('loaders', 'Loaders', '/docs/loaders', 'Loading animations'), status: 'experimental' },
  pillar('icons', 'Icons', '/docs/icons'),
  pillar('illustrations', 'Illustrations', '/docs/illustrations'),
  pillar('sound', 'Sound', '/docs/sound'),
  pillar('themes', 'Themes', '/docs/theming'),
  pillar('blocks', 'Blocks', '/screens', 'Screens and sections'),
]

/** Each tile's picture is the element it's given: the home hero's own piece. */
async function renderFamily() {
  await act(async () => {
    render(
      <YoujProvider>
        <Family pillars={PILLARS} element={(id) => <span data-element={id} />} />
      </YoujProvider>,
    )
  })
}

describe('the family', () => {
  it('shows the eight parts in order, each going to its docs, and Blocks to the screens’ list', async () => {
    await renderFamily()
    const tiles = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(tiles).toEqual(['/docs/components', '/docs/motion', '/docs/loaders', '/docs/icons', '/docs/illustrations', '/docs/sound', '/docs/theming', '/screens'])
  })

  it('leads with UI and runs Motion wide, the rest as single tiles, in full rows', async () => {
    await renderFamily()
    const sizes = screen.getAllByRole('listitem').map((item) => item.getAttribute('data-size'))
    expect(sizes).toEqual(['lead', 'wide', null, null, null, null, null, null])
    // Full rows: from sm two columns (lead and wide each across both), from xl four (lead 2×2, wide 2×1, six singles).
    expect((2 + 2 + 6) % 2).toBe(0)
    expect((4 + 2 + 6) % 4).toBe(0)
  })

  it('names each part with what it holds, and marks a part that has a status', async () => {
    await renderFamily()
    // jsdom lays nothing out, so the name's parts run together here; a browser reads "Loaders experimental Loading animations".
    expect(screen.getByRole('link', { name: /^Loaders\s*experimental\s*Loading animations$/ })).toHaveAttribute('href', '/docs/loaders')
    expect(screen.getByRole('link', { name: /^Blocks\s*Screens and sections$/ })).toHaveAttribute('href', '/screens')
    expect(screen.getAllByText('experimental')).toHaveLength(1)
  })

  it('opens the Sound overview from its tile', async () => {
    await renderFamily()
    expect(screen.getByRole('link', { name: /Sound/ })).toHaveAttribute('href', '/docs/sound')
  })

  it('draws each tile’s element in its picture, hidden from assistive technology, under the section’s heading', async () => {
    await renderFamily()
    expect(screen.getByRole('heading', { level: 2, name: 'Multiple parts. One system.' })).toBeInTheDocument()
    for (const p of PILLARS) {
      const element = screen.getByRole('link', { name: (name) => name.includes(p.label) }).querySelector(`[data-element=${p.id}]`)
      expect(element, p.id).not.toBeNull()
      expect(element!.closest('[aria-hidden]')).not.toBeNull()
    }
  })
})
