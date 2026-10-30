import { createRef } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { HierarchyChart, type HierarchyChartHandle, type HierarchyNode } from '.'

const ORG: HierarchyNode = {
  id: 'ceo',
  name: 'Maya',
  role: 'CEO',
  children: [
    {
      id: 'cto',
      name: 'Jonas',
      role: 'CTO',
      badge: 'Hiring',
      children: [
        { id: 'leo', name: 'Leo', role: 'Engineer' },
        { id: 'ines', name: 'Ines', role: 'Engineer', children: [{ id: 'ana', name: 'Ana', role: 'Intern' }] },
      ],
    },
    { id: 'cfo', name: 'David', role: 'CFO' },
  ],
}

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
// A node's name starts with its person's name, then what the card shows (role, badge).
const item = (name: string) => screen.getByRole('treeitem', { name: new RegExp(`^${name}\\b`) })
const names = () => screen.queryAllByRole('treeitem').map((el) => el.getAttribute('data-yj-node'))
const key = (k: string) => fireEvent.keyDown(document.activeElement!, { key: k })

describe('HierarchyChart', () => {
  test('is a tree of treeitems with their level, place among siblings and open state', () => {
    reduced(<HierarchyChart nodes={ORG} label="Org" />)
    expect(screen.getByRole('tree', { name: 'Org' })).toBeInTheDocument()
    expect(names()).toEqual(['ceo', 'cto', 'leo', 'ines', 'ana', 'cfo'])
    const cto = item('Jonas')
    expect(cto).toHaveAttribute('aria-level', '2')
    expect(cto).toHaveAttribute('aria-posinset', '1')
    expect(cto).toHaveAttribute('aria-setsize', '2')
    expect(cto).toHaveAttribute('aria-expanded', 'true')
    expect(item('Leo')).not.toHaveAttribute('aria-expanded')
    expect(cto).toHaveTextContent('CTO')
    expect(cto).toHaveTextContent('Hiring')
    // One Tab stop: the first node.
    expect(screen.getAllByRole('treeitem').filter((el) => el.tabIndex === 0)).toEqual([item('Maya')])
  })

  test('opens with the given branches only, and a closed branch counts everyone it hides', () => {
    reduced(<HierarchyChart nodes={ORG} defaultExpanded={['ceo']} />)
    expect(names()).toEqual(['ceo', 'cto', 'cfo'])
    const cto = item('Jonas')
    expect(cto).toHaveAttribute('aria-expanded', 'false')
    expect(cto.querySelector('[data-slot=hierarchy-chart-toggle]')).toHaveTextContent('+3')
    expect(cto).toHaveAccessibleName('Jonas, CTO, Hiring, +3, 3 hidden below')
    expect(item('David')).toHaveAccessibleName('David, CFO')
  })

  test('the chip closes and opens a branch and reports the open branches', async () => {
    const onExpandedChange = vi.fn()
    reduced(<HierarchyChart nodes={ORG} onExpandedChange={onExpandedChange} />)
    fireEvent.click(item('Jonas').querySelector('[data-slot=hierarchy-chart-toggle]')!)
    expect(onExpandedChange).toHaveBeenLastCalledWith(['ceo', 'ines'])
    await waitFor(() => expect(names()).toEqual(['ceo', 'cto', 'cfo']))
    fireEvent.click(item('Jonas').querySelector('[data-slot=hierarchy-chart-toggle]')!)
    expect(names()).toEqual(['ceo', 'cto', 'leo', 'ines', 'ana', 'cfo'])
  })

  test('arrow keys move like a tree view: down and up in reading order, right opens or steps in, left closes or steps out', async () => {
    reduced(<HierarchyChart nodes={ORG} defaultExpanded={['ceo']} />)
    act(() => item('Maya').focus())
    key('ArrowDown')
    expect(item('Jonas')).toHaveFocus()
    key('ArrowRight')
    expect(item('Jonas')).toHaveAttribute('aria-expanded', 'true')
    expect(item('Jonas')).toHaveFocus()
    key('ArrowRight')
    expect(item('Leo')).toHaveFocus()
    key('ArrowLeft')
    expect(item('Jonas')).toHaveFocus()
    key('ArrowLeft')
    expect(item('Jonas')).toHaveAttribute('aria-expanded', 'false')
    key('End')
    expect(item('David')).toHaveFocus()
    key('ArrowUp')
    expect(item('Jonas')).toHaveFocus()
    key('Home')
    expect(item('Maya')).toHaveFocus()
    // The Tab stop follows focus.
    expect(item('Maya').tabIndex).toBe(0)
    expect(item('Jonas').tabIndex).toBe(-1)
  })

  test('Enter toggles a branch; closing a branch over the focused node hands focus to the branch', async () => {
    reduced(<HierarchyChart nodes={ORG} />)
    act(() => item('Ana').focus())
    key('ArrowLeft')
    expect(item('Ines')).toHaveFocus()
    key('ArrowLeft')
    expect(item('Ines')).toHaveFocus()
    key('Enter')
    expect(item('Ines')).toHaveAttribute('aria-expanded', 'true')
    act(() => item('Ana').focus())
    fireEvent.click(item('Jonas').querySelector('[data-slot=hierarchy-chart-toggle]')!)
    await waitFor(() => expect(names()).not.toContain('ana'))
    expect(item('Jonas')).toHaveFocus()
  })

  test('mirrors the arrows under RTL', () => {
    render(
      <YoujProvider reducedMotion="always" dir="rtl">
        <HierarchyChart nodes={ORG} defaultExpanded={['ceo']} />
      </YoujProvider>,
    )
    act(() => item('Jonas').focus())
    key('ArrowLeft')
    expect(item('Jonas')).toHaveAttribute('aria-expanded', 'true')
    key('ArrowRight')
    expect(item('Jonas')).toHaveAttribute('aria-expanded', 'false')
  })

  test('Space or a click selects, and the path down to the selection lights up', () => {
    const onSelectedChange = vi.fn()
    const { container } = reduced(<HierarchyChart nodes={ORG} onSelectedChange={onSelectedChange} />)
    act(() => item('Ana').focus())
    key(' ')
    expect(onSelectedChange).toHaveBeenLastCalledWith('ana')
    expect(item('Ana')).toHaveAttribute('aria-selected', 'true')
    expect(item('Ines')).toHaveAttribute('data-yj-path')
    expect(item('Jonas')).toHaveAttribute('data-yj-path')
    expect(item('David')).not.toHaveAttribute('data-yj-path')
    expect(container.querySelectorAll('[data-slot=hierarchy-chart-edge][data-active]')).toHaveLength(3)
    fireEvent.click(item('David'))
    expect(onSelectedChange).toHaveBeenLastCalledWith('cfo')
    expect(container.querySelectorAll('[data-slot=hierarchy-chart-edge][data-active]')).toHaveLength(1)
  })

  test('focusNode opens the branches above a node and focuses it', () => {
    const ref = createRef<HierarchyChartHandle>()
    reduced(<HierarchyChart ref={ref} nodes={ORG} defaultExpanded={['ceo']} />)
    expect(names()).not.toContain('ana')
    act(() => ref.current!.focusNode('ana'))
    expect(item('Ana')).toHaveFocus()
    expect(item('Jonas')).toHaveAttribute('aria-expanded', 'true')
    expect(item('Ines')).toHaveAttribute('aria-expanded', 'true')
  })

  test('draws each node with renderNode, given its state', () => {
    reduced(<HierarchyChart nodes={ORG} defaultSelected="cto" renderNode={(n, s) => <span>{`${n.name} L${s.depth}${s.selected ? ' picked' : ''}${s.branch ? ' branch' : ''}`}</span>} />)
    expect(item('Jonas')).toHaveTextContent('Jonas L1 picked branch')
    expect(item('David')).toHaveTextContent('David L1')
  })

  test('one connector per child, and zoom keys and buttons are named', () => {
    const { container } = reduced(<HierarchyChart nodes={ORG} />)
    expect(container.querySelectorAll('[data-slot=hierarchy-chart-edge]')).toHaveLength(5)
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fit to view' })).toBeInTheDocument()
    expect(screen.getByRole('tree')).toHaveAccessibleDescription(/Enter opens or closes a branch/)
  })
})
