import { render, screen } from '@testing-library/react'
import type * as PageTree from 'fumadocs-core/page-tree'
import { DocsSidebar } from './docs-sidebar'

const prefetch = vi.hoisted(() => vi.fn())
const path = vi.hoisted(() => ({ current: '/docs/p4' }))
vi.mock('next/navigation', () => ({ usePathname: () => path.current, useRouter: () => ({ prefetch }) }))

const pages = Array.from({ length: 10 }, (_, i): PageTree.Item => ({ type: 'page', name: `P${i}`, url: `/docs/p${i}` }))
const tree: PageTree.Root = { name: 'Docs', children: pages }

describe('DocsSidebar', () => {
  afterEach(() => {
    prefetch.mockClear()
    Reflect.deleteProperty(navigator, 'connection')
  })

  it('prefetches the nearest pages when idle, at most six, never the current one', () => {
    vi.stubGlobal('requestIdleCallback', (f: () => void) => (f(), 1))
    render(<DocsSidebar tree={tree} />)
    const hrefs = prefetch.mock.calls.map(([h]) => h)
    expect(hrefs).toEqual(['/docs/p5', '/docs/p3', '/docs/p6', '/docs/p2', '/docs/p7', '/docs/p1'])
    vi.unstubAllGlobals()
  })

  it('prefetches nothing for a reader saving data', () => {
    vi.stubGlobal('requestIdleCallback', (f: () => void) => (f(), 1))
    Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true })
    render(<DocsSidebar tree={tree} />)
    expect(prefetch).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('has a Blocks area, opening the first blocks page and showing only the Blocks section', () => {
    path.current = '/docs/blocks/features'
    const blocks: PageTree.Root = {
      name: 'Docs',
      children: [
        { type: 'separator', name: 'Get started' },
        { type: 'page', name: 'Intro', url: '/docs' },
        { type: 'separator', name: 'Blocks' },
        { type: 'folder', name: 'Sections', children: [{ type: 'page', name: 'Features', url: '/docs/blocks/features' }] },
      ],
    }
    render(<DocsSidebar tree={blocks} />)
    const tab = screen.getByRole('link', { name: 'Blocks' })
    expect(tab.getAttribute('href')).toBe('/docs/blocks/features')
    expect(tab.getAttribute('aria-current')).toBe('true')
    expect(screen.queryByText('Intro')).toBeNull()
    expect(screen.getByText('Features')).toBeTruthy()
    path.current = '/docs/p4'
  })
})
