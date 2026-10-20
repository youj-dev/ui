/* The picture each Get started and Guides page opens with, by name:
 * `<PageArt art="…" />` under the title (components/docs/page-art.tsx), a
 * composition of isometric scenes from @youj/illustrations
 * (components/docs/page-art-scenes.tsx). Plain data, so the server frame,
 * the scenes and the content tests read one list. */

export const PAGE_ARTS = [
  'installation',
  'cli',
  'shadcn-registry',
  'choosing-a-level',
  'ai',
  'figma',
  'comparison',
  'versioning',
  'contributing',
  'guides',
  'shadcn',
  'composing',
  'i18n',
  'accessibility',
] as const

export type PageArtId = (typeof PAGE_ARTS)[number]

export const isPageArt = (value: string): value is PageArtId => (PAGE_ARTS as readonly string[]).includes(value)

/** The one scene of the registry that stands for each page's picture, for the search palette's stage. */
export const PAGE_ART_SCENE: Record<PageArtId, string> = {
  installation: 'delivery',
  cli: 'laptop',
  'shadcn-registry': 'warehouse',
  'choosing-a-level': 'museum',
  ai: 'chat',
  figma: 'design-tools',
  comparison: 'scales',
  versioning: 'contract',
  contributing: 'team',
  guides: 'map',
  shadcn: 'pipeline',
  composing: 'puzzle',
  i18n: 'globe',
  accessibility: 'checklist',
}
