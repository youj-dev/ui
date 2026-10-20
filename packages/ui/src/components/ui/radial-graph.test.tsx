import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { RadialGraph, type RadialGraphNode } from './radial-graph'

const CENTER = { id: 'me', label: 'a.moreau' }
const NODES: RadialGraphNode[] = [
  { id: 'mail', label: 'mailbox', tone: 'chart-4', ring: 'solid', state: 'Compromised', detail: 'Rules forward to an outside address' },
  { id: 'laptop', label: 'lt-moreau', tone: 'chart-1' },
  { id: 'drive', label: 'shared-drive', via: 'mail', ring: 'dashed', state: 'At risk' },
  { id: 'wiki', label: 'team-wiki', via: 'laptop' },
]

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const items = () => within(screen.getByRole('list')).getAllByRole('listitem')
const distance = (el: HTMLElement) => Math.hypot(parseFloat(el.style.left) - 50, parseFloat(el.style.top) - 50)

describe('RadialGraph', () => {
  test('is a named group listing the center then each ring, every node with its distance', () => {
    reduced(<RadialGraph center={CENTER} nodes={NODES} label="Blast radius" />)
    expect(screen.getByRole('group', { name: 'Blast radius' })).toHaveAccessibleDescription('4 linked to a.moreau within 2 hops.')
    expect(items().map((i) => i.getAttribute('aria-label'))).toEqual([
      'a.moreau',
      'mailbox, 1 hop away',
      'lt-moreau, 1 hop away',
      'shared-drive, 2 hops away',
      'team-wiki, 2 hops away',
    ])
    expect(screen.getByRole('listitem', { name: 'mailbox, 1 hop away' })).toHaveAccessibleDescription(
      'Compromised. Rules forward to an outside address',
    )
  })

  test('places each ring farther out, and a node in the wedge of the one it hangs from', () => {
    reduced(<RadialGraph center={CENTER} nodes={NODES} />)
    const [center, mail, laptop, drive, wiki] = items()
    expect(distance(center!)).toBe(0)
    expect(distance(mail!)).toBeCloseTo(distance(laptop!))
    expect(distance(drive!)).toBeGreaterThan(distance(mail!) * 1.9)
    // An only child sits straight out from its parent.
    expect(Math.atan2(parseFloat(drive!.style.top) - 50, parseFloat(drive!.style.left) - 50)).toBeCloseTo(
      Math.atan2(parseFloat(mail!.style.top) - 50, parseFloat(mail!.style.left) - 50),
    )
    expect(Math.atan2(parseFloat(wiki!.style.top) - 50, parseFloat(wiki!.style.left) - 50)).toBeCloseTo(
      Math.atan2(parseFloat(laptop!.style.top) - 50, parseFloat(laptop!.style.left) - 50),
    )
  })

  test('draws a state ring, and the link into the node the same way', () => {
    reduced(<RadialGraph center={CENTER} nodes={NODES} />)
    expect(document.querySelectorAll('[data-slot=radial-graph-node][data-yj-ring=solid]')).toHaveLength(1)
    expect(document.querySelectorAll('[data-slot=radial-graph-link][data-yj-ring=dashed]')).toHaveLength(1)
    expect(document.querySelectorAll('[data-slot=radial-graph-ring]')).toHaveLength(2)
    expect(screen.getByText('1 hop')).toBeInTheDocument()
    expect(screen.getByText('2 hops')).toBeInTheDocument()
  })

  test('fewer hops fold the outer nodes into the ones they hang from', () => {
    reduced(<RadialGraph center={CENTER} nodes={NODES} hops={1} />)
    expect(items()).toHaveLength(3)
    expect(document.querySelectorAll('[data-slot=radial-graph-node][data-state=folded]')).toHaveLength(2)
    expect(screen.getByRole('group')).toHaveAccessibleDescription('2 linked to a.moreau within 1 hop.')
    expect(screen.queryByText('2 hops')).not.toBeInTheDocument()
  })

  test('is one tab stop: arrows walk a ring, Down follows a link out, Up goes back in', async () => {
    const user = userEvent.setup()
    reduced(<RadialGraph center={CENTER} nodes={NODES} />)
    await user.tab()
    expect(document.activeElement).toHaveAccessibleName('a.moreau')
    expect(items().filter((i) => i.tabIndex === 0)).toHaveLength(1)
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toHaveAccessibleName('mailbox, 1 hop away')
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toHaveAccessibleName('lt-moreau, 1 hop away')
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toHaveAccessibleName('team-wiki, 2 hops away')
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toHaveAccessibleName('lt-moreau, 1 hop away')
    await user.keyboard('{End}')
    expect(document.activeElement).toHaveAccessibleName('team-wiki, 2 hops away')
    await user.keyboard('{Home}')
    expect(document.activeElement).toHaveAccessibleName('a.moreau')
  })

  test('a via that is unknown or loops hangs from the center', () => {
    reduced(
      <RadialGraph
        center={CENTER}
        nodes={[
          { id: 'a', label: 'a', via: 'b' },
          { id: 'b', label: 'b', via: 'a' },
          { id: 'c', label: 'c', via: 'nowhere' },
        ]}
      />,
    )
    expect(items().map((i) => i.getAttribute('aria-label'))).toContain('c, 1 hop away')
    expect(items()).toHaveLength(4)
  })

  test('with nothing linked it says so, and the labels translate it', () => {
    render(
      <YoujProvider reducedMotion="always" labels={{ noData: 'Keine Daten', radialGraph: 'Radialgraph' }}>
        <RadialGraph center={CENTER} nodes={[]} />
      </YoujProvider>,
    )
    expect(screen.getByRole('group', { name: 'Radialgraph' })).toHaveTextContent('Keine Daten')
  })
})
