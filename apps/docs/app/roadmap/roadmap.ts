import { repo } from '@/lib/repo'
import { siteUrl } from '@/lib/site'

/* The roadmap: a short summary of 0.1, then high-level themes for now, next,
 * later and exploring. No dates, no counts and no specific features; what
 * already shipped lives in the changelog. The page,
 * /roadmap.md and the search index read from here. */

export interface RoadmapItem {
  id: string
  title: string
  body: string
  href?: string
}

export interface RoadmapStage {
  id: 'shipped' | 'now' | 'next' | 'later' | 'exploring'
  title: string
  lede: string
  items: RoadmapItem[]
}

/** The review line on the page and at the top of /roadmap.md. */
export const ROADMAP_REVIEW = 'The roadmap is reviewed with each minor release. Youj has one maintainer, so it is a plan, not a promise.'

export function roadmap(): RoadmapStage[] {
  return [
    {
      id: 'shipped',
      title: 'In 0.1',
      lede: 'What is here today.',
      items: [
        { id: 'first-release', title: 'The first release', body: 'A complete kit built from one design language, so every part looks and moves like it belongs together.' },
        { id: 'components', title: 'Components', body: 'Accessible React components on Base UI and Tailwind, with themes you can make your own, from color and type to shape and motion.' },
        { id: 'blocks', title: 'Blocks and screens', body: 'Ready-made sections, app screens and frames to start from, copied into your project and yours to change.' },
        { id: 'motion', title: 'Motion', body: 'Transitions, effects and entrances, with reduced motion handled for you.' },
        { id: 'visuals', title: 'Visuals', body: 'Animated icons, isometric illustrations, loaders, interactive miniatures and interface sounds.' },
        { id: 'tools', title: 'Tools', body: 'A CLI that sets everything up in one command, Create to assemble a themed app, and an MCP server so AI tools build with Youj the right way.' },
        { id: 'alpha', title: 'An alpha', body: 'The foundations are in place, and the APIs will keep settling as people use it. The changelog has the details.', href: '/changelog' },
      ],
    },
    {
      id: 'now',
      title: 'Now',
      lede: 'Settling into the alpha.',
      items: [
        { id: 'settling', title: 'Settling into the alpha', body: 'Smoothing the rough edges early users find, polishing the docs and the first five minutes, and making installs dependable.' },
      ],
    },
    {
      id: 'next',
      title: 'Next',
      lede: 'The themes after that.',
      items: [
        { id: 'growing', title: 'Growing the kit', body: 'More components, blocks and screens; more icons, illustrations, miniatures, loaders and sounds; more ways to theme and more motion.' },
        { id: 'solidifying', title: 'Solidifying', body: 'Bringing every part up to the same standard, strengthening accessibility and testing, and firming up the APIs on the way to stable.' },
        { id: 'ai', title: 'Building with AI', body: 'Evolving the MCP server, supporting more AI tools and providers, and making the docs even easier for AI to use well.' },
      ],
    },
    {
      id: 'later',
      title: 'Later',
      lede: 'Towards 1.0.',
      items: [
        { id: 'towards-1-0', title: 'Towards 1.0', body: 'Stable APIs, speed and lighter bundles, better tools for designers, and making it easy for teams to adopt Youj.' },
      ],
    },
    {
      id: 'exploring',
      title: 'Exploring',
      lede: 'Not promised.',
      items: [
        { id: 'exploring', title: 'Exploring (not promised)', body: 'Youj beyond React (Vue, Svelte, Angular, Web Components), testing helpers, and new kinds of visuals.' },
      ],
    },
  ]
}

/** /roadmap.md: the roadmap as Markdown, from the same source as /roadmap, with absolute links. */
export function roadmapMarkdown(): string {
  const site = siteUrl()
  const lines = [
    '# Youj roadmap',
    '',
    `High-level themes, not a feature list and no dates. The [changelog](${site}/changelog) says what has shipped.`,
    '',
    ROADMAP_REVIEW,
    `Ideas and requests go to the Roadmap discussion on [GitHub Discussions](${repo.discussions}).`,
    '',
  ]
  for (const stage of roadmap()) {
    lines.push(`## ${stage.title}`, '', stage.lede, '')
    for (const item of stage.items) lines.push(`- **${item.href ? `[${item.title}](${item.href.startsWith('/') ? site : ''}${item.href})` : item.title}.** ${item.body}`)
    lines.push('')
  }
  return `${lines.join('\n').trimEnd()}\n`
}
