import { isValidElement, type ReactNode } from 'react'
import type * as PageTree from 'fumadocs-core/page-tree'

/* Pure walks over the docs page tree, kept apart from the content source so
 * they're testable on their own and usable on the server and in the browser.
 * The root is the sidebar: runs of nodes under labeled separators (Get
 * started, Guides, Components, Motion, Icons, Showcase), one per section. A
 * section's folders are its groups; a folder's own page is its index. */

export interface TreeSection {
  id: string
  label?: ReactNode
  nodes: PageTree.Node[]
}

/** Root children split at separators: each separator starts a labeled section. */
export function treeSections(tree: PageTree.Root): TreeSection[] {
  const out: TreeSection[] = []
  let current: TreeSection | undefined
  tree.children.forEach((node, i) => {
    if (node.type === 'separator') {
      current = { id: node.$id ?? `section-${i}`, label: node.name, nodes: [] }
      out.push(current)
      return
    }
    if (!current) {
      current = { id: `section-${i}`, nodes: [] }
      out.push(current)
    }
    current.nodes.push(node)
  })
  return out.filter((s) => s.nodes.length > 0)
}

/** Whether a node is, or contains, the page at `url`. */
export function containsUrl(node: PageTree.Node, url: string): boolean {
  if (node.type === 'page') return node.url === url
  if (node.type === 'folder') return node.index?.url === url || node.children.some((child) => containsUrl(child, url))
  return false
}

/** The section holding the page at `url`. */
export function sectionOf(tree: PageTree.Root, url: string): TreeSection | undefined {
  return treeSections(tree).find((section) => section.nodes.some((node) => containsUrl(node, url)))
}

/** Where a node leads: a page's URL, a folder's own page, or the pages of a folder without one (a plain group such as Theming). */
function entryUrls(node: PageTree.Node): string[] {
  if (node.type === 'page') return [node.url]
  if (node.type !== 'folder') return []
  return node.index ? [node.index.url] : node.children.flatMap(entryUrls)
}

/**
 * The entries of the section whose index is `url`, in sidebar order: its
 * pages and its groups' own pages, the index itself left out. What the
 * header's menu for that section lists.
 */
export function sectionEntries(tree: PageTree.Root, url: string): string[] {
  const section = sectionOf(tree, url)
  if (!section) return []
  return section.nodes.flatMap(entryUrls).filter((entry) => entry !== url)
}

export interface TreeRun {
  /** The separator heading the run: "Dates and times" in Forms & inputs. */
  label?: string
  urls: string[]
}

export interface TreeGroup {
  /** The folder's name: "Forms & inputs". */
  name: string
  /** Its own page, when it has one. */
  url?: string
  /** Its pages, in runs under its separator labels (one unlabeled run when it has none). */
  runs: TreeRun[]
}

/** A folder's pages in tree order, split at its separators, sub-folders flattened in place. */
function runs(folder: PageTree.Folder): TreeRun[] {
  const out: TreeRun[] = [{ urls: [] }]
  const visit = (nodes: PageTree.Node[]) => {
    for (const node of nodes) {
      if (node.type === 'separator') out.push({ label: typeof node.name === 'string' ? node.name : undefined, urls: [] })
      else if (node.type === 'page') out.at(-1)!.urls.push(node.url)
      else {
        if (node.index) out.at(-1)!.urls.push(node.index.url)
        visit(node.children)
      }
    }
  }
  visit(folder.children)
  return out.filter((run) => run.urls.length > 0)
}

/** The groups of the section whose index is `url`: each folder, with its pages. What an overview lays out. */
export function sectionGroups(tree: PageTree.Root, url: string): TreeGroup[] {
  const section = sectionOf(tree, url)
  if (!section) return []
  return section.nodes.flatMap((node) =>
    node.type === 'folder' ? [{ name: typeof node.name === 'string' ? node.name : '', url: node.index?.url, runs: runs(node) }] : [],
  )
}

/** A page in the drawn tree: its badge (`status: new` in its frontmatter) as data, drawn by the tree itself. */
export type NavItem = PageTree.Item & { status?: string }

/** The plain name under a badge: Fumadocs' status plugin wraps a badged page's name with its badge. */
function plainName(name: ReactNode): ReactNode {
  if (!isValidElement(name)) return name
  const children = (name.props as { children?: ReactNode }).children
  return Array.isArray(children) ? children[0] : children
}

function navNode(node: PageTree.Node): PageTree.Node {
  if (node.type === 'separator') return { type: 'separator', name: node.name }
  if (node.type === 'page') return navItem(node)
  // A group of one page named like the group is that page (Blocks > Specialized), not a folder around itself.
  const [only] = node.children
  if (!node.index && node.children.length === 1 && only?.type === 'page' && only.name === node.name) return navItem(only)
  return {
    type: 'folder',
    name: node.name,
    ...(node.index ? { index: navItem(node.index) } : {}),
    ...(node.defaultOpen ? { defaultOpen: true } : {}),
    children: node.children.map(navNode),
  }
}

function navItem(item: NavItem): NavItem {
  return { type: 'page', name: item.status ? plainName(item.name) : item.name, url: item.url, ...(item.status ? { status: item.status } : {}) }
}

/**
 * The tree as the sidebar and the mobile menu draw it: names, links, each
 * group's own page, and a page's badge as `status`. Plain data (JSON for
 * /docs-tree.json), without the descriptions and Fumadocs' internal ids and
 * file refs, which were most of what every docs page carried for it.
 */
export function navTree(tree: PageTree.Root): PageTree.Root {
  return { name: tree.name, children: tree.children.map(navNode) }
}

/** The first page of a named group in a section named by its separator label, when the group has one: where a section without an index opens its group. */
export function groupFirstUrl(tree: PageTree.Root, section: string, group: string): string | undefined {
  const holder = treeSections(tree).find((s) => s.label === section)
  const folder = holder?.nodes.find((node): node is PageTree.Folder => node.type === 'folder' && node.name === group)
  return folder ? (folder.index ? [folder.index.url] : folder.children.flatMap(entryUrls))[0] : undefined
}
