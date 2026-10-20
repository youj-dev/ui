// @vitest-environment node
import type * as PageTree from 'fumadocs-core/page-tree'
import { createElement, Fragment } from 'react'
import { containsUrl, navTree, sectionEntries, sectionGroups, sectionOf, treeSections } from './tree'

const page = (url: string): PageTree.Item => ({ type: 'page', name: url, url })
const label = (name: string): PageTree.Separator => ({ type: 'separator', name })
const group = (name: string, index: string | undefined, children: PageTree.Node[]): PageTree.Folder => ({
  type: 'folder',
  name,
  children,
  ...(index ? { index: page(index) } : {}),
})

// Shaped like the docs: labeled sections, each spread into the root, with groups as folders.
const tree: PageTree.Root = {
  name: 'Docs',
  children: [
    label('Get started'),
    page('/docs'),
    page('/docs/installation'),
    label('Components'),
    page('/docs/components'),
    group('Actions', '/docs/components/actions', [page('/docs/components/button'), page('/docs/components/toggle')]),
    group('Forms & inputs', '/docs/components/forms', [
      label('Text'),
      page('/docs/components/input'),
      label('Dates and times'),
      page('/docs/components/calendar'),
      page('/docs/components/date-picker'),
    ]),
    group('Chat', '/docs/components/chat', [page('/docs/components/chat/message')]),
    label('Motion'),
    page('/docs/motion'),
    page('/docs/motion/principles'),
    group('Primitives', '/docs/motion/primitives', [page('/docs/motion/reveal')]),
    label('Showcase'),
    page('/blocks'),
  ],
}

describe('treeSections', () => {
  it('splits the root at its labels', () => {
    expect(treeSections(tree).map((s) => s.label)).toEqual(['Get started', 'Components', 'Motion', 'Showcase'])
  })
})

describe('containsUrl', () => {
  it('finds a page in a group, and the group’s own page', () => {
    const actions = tree.children[5]!
    expect(containsUrl(actions, '/docs/components/toggle')).toBe(true)
    expect(containsUrl(actions, '/docs/components/actions')).toBe(true)
    expect(containsUrl(actions, '/docs/components/input')).toBe(false)
  })
})

describe('sectionOf', () => {
  it('is the section holding a page, however deep', () => {
    expect(sectionOf(tree, '/docs/components/date-picker')?.label).toBe('Components')
    expect(sectionOf(tree, '/docs/nowhere')).toBeUndefined()
  })
})

describe('sectionEntries', () => {
  it('lists a section’s pages and its groups’ own pages, without the section’s index', () => {
    expect(sectionEntries(tree, '/docs/components')).toEqual(['/docs/components/actions', '/docs/components/forms', '/docs/components/chat'])
    expect(sectionEntries(tree, '/docs/motion')).toEqual(['/docs/motion/principles', '/docs/motion/primitives'])
    expect(sectionEntries(tree, '/docs')).toEqual(['/docs/installation'])
  })

  it('is empty for a page no section holds', () => {
    expect(sectionEntries(tree, '/docs/recipes')).toEqual([])
  })
})

describe('sectionGroups', () => {
  it('gives each group its own page and its pages, split at its labels', () => {
    expect(sectionGroups(tree, '/docs/components')).toEqual([
      { name: 'Actions', url: '/docs/components/actions', runs: [{ urls: ['/docs/components/button', '/docs/components/toggle'] }] },
      {
        name: 'Forms & inputs',
        url: '/docs/components/forms',
        runs: [
          { label: 'Text', urls: ['/docs/components/input'] },
          { label: 'Dates and times', urls: ['/docs/components/calendar', '/docs/components/date-picker'] },
        ],
      },
      { name: 'Chat', url: '/docs/components/chat', runs: [{ urls: ['/docs/components/chat/message'] }] },
    ])
  })
})

describe('navTree', () => {
  // As Fumadocs builds it: ids, file refs, descriptions, and a badged page's name wrapped with its badge.
  const badge = createElement('span', { className: 'sidebar-badge' }, 'new')
  const full: PageTree.Root = {
    $id: 'root',
    name: 'Docs',
    children: [
      { $id: '_0', type: 'separator', name: 'Get started' },
      { $id: 'index.mdx', $ref: 'index.mdx', type: 'page', name: 'Introduction', description: 'A long line about the page.', url: '/docs' },
      { $id: 'ai.mdx', $ref: 'ai.mdx', type: 'page', name: createElement(Fragment, null, 'AI & MCP', badge), description: 'More words.', url: '/docs/ai', status: 'new' } as PageTree.Item,
      {
        $id: 'components',
        $ref: { folder: 'components', meta: 'meta.json' },
        type: 'folder',
        name: 'Actions',
        description: 'Buttons and friends.',
        defaultOpen: true,
        index: { $id: 'actions.mdx', type: 'page', name: 'Actions', url: '/docs/components/actions', description: 'Its group page.' },
        children: [{ $id: 'button.mdx', type: 'page', name: 'Button', url: '/docs/components/button', description: 'Presses.' }],
      },
    ],
  }

  it('keeps what the tree draws, as plain data: names, links, group pages, open groups and badges', () => {
    expect(JSON.parse(JSON.stringify(navTree(full)))).toEqual({
      name: 'Docs',
      children: [
        { type: 'separator', name: 'Get started' },
        { type: 'page', name: 'Introduction', url: '/docs' },
        { type: 'page', name: 'AI & MCP', url: '/docs/ai', status: 'new' },
        {
          type: 'folder',
          name: 'Actions',
          defaultOpen: true,
          index: { type: 'page', name: 'Actions', url: '/docs/components/actions' },
          children: [{ type: 'page', name: 'Button', url: '/docs/components/button' }],
        },
      ],
    })
  })

  it('draws the same sections and finds the same pages as the tree it came from', () => {
    const slim = navTree(full)
    expect(treeSections(slim).map((s) => s.label)).toEqual(treeSections(full).map((s) => s.label))
    expect(sectionOf(slim, '/docs/components/button')?.label).toBe('Get started')
  })
})
