import { act, fireEvent, render, screen } from '@testing-library/react'
import type * as PageTree from 'fumadocs-core/page-tree'
import { PageTreeNav } from './page-tree'

const route = vi.hoisted(() => ({ pathname: '/docs/motion/reveal' }))
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname, useRouter: () => ({ prefetch: () => {} }) }))

const page = (url: string, name = url.split('/').pop()!): PageTree.Item => ({ type: 'page', name, url })

const primitives: PageTree.Folder = {
  type: 'folder',
  name: 'Primitives',
  index: page('/docs/motion/primitives', 'Primitives'),
  children: [page('/docs/motion/reveal', 'Reveal'), page('/docs/motion/counter', 'Counter')],
}
const transitions: PageTree.Folder = {
  type: 'folder',
  name: 'Transitions',
  index: page('/docs/motion/transitions', 'Transitions'),
  children: [page('/docs/motion/collapse', 'Collapse')],
}
const effects: PageTree.Folder = { type: 'folder', name: 'Effects', children: [page('/docs/components/dock', 'Dock')] }

const tree: PageTree.Root = {
  name: 'Docs',
  children: [
    page('/docs', 'Introduction'),
    { type: 'separator', name: 'Motion' },
    primitives,
    transitions,
    effects,
  ],
}

const expanded = (name: RegExp) => screen.getByRole('button', { name }).getAttribute('aria-expanded')

describe('PageTreeNav', () => {
  beforeEach(() => {
    route.pathname = '/docs/motion/reveal'
  })

  it('marks the current page and opens only the group holding it', () => {
    render(<PageTreeNav tree={tree} />)
    expect(screen.getByRole('link', { name: 'Reveal' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Introduction' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'Collapse Primitives' })).toHaveAttribute('aria-expanded', 'true')
    expect(expanded(/Transitions/)).toBe('false')
    expect(expanded(/Effects/)).toBe('false')
  })

  it('moves the highlight on the click, and aria-current once the page arrives', () => {
    const { rerender } = render(<PageTreeNav tree={tree} />)
    const counter = screen.getByRole('link', { name: 'Counter' })
    act(() => fireEvent.click(counter))
    expect(counter).toHaveAttribute('data-active')
    expect(screen.getByRole('link', { name: 'Reveal' })).not.toHaveAttribute('data-active')
    expect(counter).not.toHaveAttribute('aria-current')
    route.pathname = '/docs/motion/counter'
    rerender(<PageTreeNav tree={tree} />)
    expect(counter).toHaveAttribute('aria-current', 'page')
    expect(counter).toHaveAttribute('data-active')
  })

  it('names each section by its label', () => {
    render(<PageTreeNav tree={tree} />)
    expect(screen.getByRole('group', { name: 'Motion' })).toBeInTheDocument()
  })

  it('opens and closes a group from its toggle, naming what it will do', () => {
    render(<PageTreeNav tree={tree} />)
    const toggle = screen.getByRole('button', { name: /Effects/ })
    act(() => fireEvent.click(toggle))
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    // Mounted as it opens (the height animation itself doesn't run in jsdom).
    expect(screen.getByText('Dock').closest('a')).toHaveAttribute('href', '/docs/components/dock')
  })

  it('closes the group it opened for you once you leave it', () => {
    const { rerender } = render(<PageTreeNav tree={tree} />)
    route.pathname = '/docs/motion/collapse'
    rerender(<PageTreeNav tree={tree} />)
    expect(expanded(/Primitives/)).toBe('false')
    expect(expanded(/Transitions/)).toBe('true')
  })

  it('leaves a group you opened yourself as you left it', () => {
    const { rerender } = render(<PageTreeNav tree={tree} />)
    act(() => fireEvent.click(screen.getByRole('button', { name: /Effects/ })))
    route.pathname = '/docs/motion/collapse'
    rerender(<PageTreeNav tree={tree} />)
    expect(expanded(/Effects/)).toBe('true')
  })

  it('keeps a group you closed closed while you stay in it', () => {
    const { rerender } = render(<PageTreeNav tree={tree} />)
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Collapse Primitives' })))
    route.pathname = '/docs/motion/counter'
    rerender(<PageTreeNav tree={tree} />)
    expect(expanded(/Primitives/)).toBe('false')
  })

  it('tells the caller when a link is followed, so a drawer can close', () => {
    const onNavigate = vi.fn()
    render(<PageTreeNav tree={tree} onNavigate={onNavigate} />)
    act(() => fireEvent.click(screen.getByRole('link', { name: 'Counter' })))
    expect(onNavigate).toHaveBeenCalled()
  })

  it('draws a page’s badge from its status, after its name', () => {
    render(<PageTreeNav tree={{ name: 'Docs', children: [{ type: 'page', name: 'AI & MCP', url: '/docs/ai', status: 'new' } as PageTree.Item] }} />)
    const link = screen.getByRole('link', { name: /^AI & MCP/ })
    expect(link.querySelector('.sidebar-badge')).toHaveAttribute('data-status', 'new')
  })
})
