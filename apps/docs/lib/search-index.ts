import type { AdvancedIndex } from 'fumadocs-core/search/server'
import { illustrationCategories, illustrations } from '@youj/illustrations'
import { faq } from '@/app/faq/questions'
import { loaderCategories, loaderEntries } from '@/components/loaders/entries'
import { roadmap } from '@/app/roadmap/roadmap'
import { readPolicy } from '@/app/security/policy'
import { plainText, readChangelog } from '@/lib/changelog'
import { registryItems } from '@/lib/registry'
import { itemHref } from '@/lib/block-docs'
import { LEVEL_LABELS } from '@/lib/level-paths'
import { blocks, partsOf, type ShowcaseEntry } from '@/lib/showcase'
import { taxonomy } from '@/lib/taxonomy'

/* The blocks for the search index, on top of the docs pages:
 * each is a result of its own, filed under its level and category ("Cards /
 * Monitoring & incidents"), which the search dialog lists them by. A block
 * opens its story on its Blocks docs page. */

/**
 * An item: its description, its stories, its pages and what it's built with, so "otp" finds the OTP login and "login" the auth flow.
 * Its id is its own (a block's first story opens its docs page's own URL, which the page's entry already has).
 */
export function showcaseIndex(entry: ShowcaseEntry): AdvancedIndex {
  const parts = partsOf(entry.slug)
  const contents = [
    entry.description,
    entry.stories.length > 1 ? `Variants: ${entry.stories.map((s) => s.name).join(', ')}.` : '',
    parts.length ? `Pages: ${parts.map((p) => `${p.title}: ${p.summary}`).join(' ')}` : '',
    entry.components.length ? `Built with ${entry.components.map((c) => c.title).join(', ')}.` : '',
  ]
  return {
    id: `${entry.kind}/${entry.slug}`,
    url: itemHref(entry)!,
    title: entry.title,
    description: entry.summary,
    breadcrumbs: [LEVEL_LABELS[entry.level].many, taxonomy().levels[entry.level].categories[entry.category] ?? entry.category],
    structuredData: { headings: [], contents: contents.filter(Boolean).map((content) => ({ heading: undefined, content })) },
  }
}

/** A page's alias words (its `aliases` frontmatter) as a line of its text, so "modal" finds Dialog. */
export function withAliases(data: AdvancedIndex['structuredData'], aliases?: readonly string[]): AdvancedIndex['structuredData'] {
  if (!aliases?.length) return data
  return { ...data, contents: [...data.contents, { heading: undefined, content: `Also searched as ${aliases.join(', ')}.` }] }
}

function showcasePage(url: string, title: string, description: string): AdvancedIndex {
  return { id: url, url, title, description, structuredData: { headings: [], contents: [{ heading: undefined, content: description }] } }
}

/**
 * The illustrations explorer, and each scene in it, under its category:
 * "coffee", "cafe" or "404" opens the explorer on that scene. What it shows
 * comes from its registry item (the scene's doc comment); its tags from the
 * registry entry.
 */
export function illustrationIndexes(): AdvancedIndex[] {
  const names = new Map<string, string>(illustrationCategories.map((c) => [c.id, c.name]))
  const items = registryItems()
  return [
    showcasePage(
      '/illustrations',
      'Illustrations',
      'Every isometric illustration, drawn from your theme: search by name, category or tag, preview a scene live in any preset, light or dark, copy its code or install command, and download it as SVG or PNG.',
    ),
    ...illustrations.map((scene) => {
      const url = `/illustrations?scene=${scene.id}`
      const tags: readonly string[] = 'tags' in scene ? scene.tags : []
      const shows = items.get(`illustration-${scene.id}`)?.description?.split(/(?<=\.)\s/)[0]
      return {
        id: url,
        url,
        title: scene.name,
        description: shows,
        breadcrumbs: ['Illustrations', names.get(scene.category) ?? scene.category],
        structuredData: { headings: [], contents: [{ heading: undefined, content: [shows, tags.length ? `Tags: ${tags.join(', ')}.` : ''].filter(Boolean).join(' ') }] },
      }
    }),
  ]
}

/**
 * The loaders gallery, and each loader in it, under its category:
 * "waveform" or "orbit" opens the gallery on that one. What it shows and its
 * tags come from its registry item, as the gallery's do.
 */
export function loaderIndexes(): AdvancedIndex[] {
  const names = new Map(loaderCategories().map((c) => [c.id, c.title]))
  return [
    showcasePage(
      '/loaders',
      'Loaders',
      'Every loader and spinner, live: particle fields in perspective, wireframes and lit solids, waveforms, the youj letterforms and interface moments. Set its size, pace and color, then copy its code or install command.',
    ),
    ...loaderEntries().map((loader) => {
      const url = `/loaders?id=${loader.id}`
      const shows = loader.description.split(/(?<=\.)\s/)[0]
      return {
        id: url,
        url,
        title: loader.title,
        description: shows,
        breadcrumbs: ['Loaders', names.get(loader.category) ?? loader.category],
        structuredData: { headings: [], contents: [{ heading: undefined, content: [shows, `Tags: ${loader.tags.join(', ')}.`].join(' ') }] },
      }
    }),
  ]
}

/** Every block (components are docs pages, which the docs index has), a block's own parts (the auth flow's pages) in the block they belong to. The frame's parts are Create's, found as Create. */
export function levelIndexes(): AdvancedIndex[] {
  return [
    ...blocks()
      .filter((b) => !b.partOf && b.level !== 'frame')
      .map((b) => showcaseIndex(b)),
  ]
}

export function showcaseIndexes(): AdvancedIndex[] {
  return [
    ...levelIndexes(),
    ...illustrationIndexes(),
    ...loaderIndexes(),
    showcasePage('/miniatures', 'Miniatures', 'Interactive isometric models of real things, for React.'),
    showcasePage(
      '/create',
      'Create',
      'Build your app frame (sidebar, top bar, account, search), add screens from the Screens catalog (dashboards, tables, settings, billing, an assistant…) and give it a theme (accent, neutrals, radius, density, fonts, motion), preview it live, and export it as code: app shell, nav, a route per screen, defineTheme and one install command.',
    ),
  ]
}

/* The site pages. Each FAQ question and each release is a heading, so a
 * search for "react 18" or "0.1.0" lands on its anchor (/faq#react-18 opens
 * that answer). */
export function sitePageIndexes(): AdvancedIndex[] {
  const groups = faq()
  const questions = groups.flatMap((g) => g.questions)
  const { releases } = readChangelog()
  const stages = roadmap()
  const policy = readPolicy()
  return [
    {
      id: '/faq',
      url: '/faq',
      title: 'FAQ',
      description: 'Straight answers about Youj: license, shadcn/ui, React and Next.js, bundle size, reduced motion, theming, icons, accessibility and help.',
      structuredData: {
        headings: questions.map((q) => ({ id: q.id, content: q.question })),
        contents: questions.map((q) => ({ heading: q.id, content: plainText(q.answer) })),
      },
    },
    {
      id: '/changelog',
      url: '/changelog',
      title: 'Changelog',
      description: 'Every Youj release: what broke, what was added and what was fixed.',
      structuredData: {
        headings: releases.map((r) => ({ id: r.id, content: r.version })),
        contents: releases.flatMap((r) =>
          r.sections.map((s) => ({ heading: r.id, content: plainText([s.title, s.body].filter(Boolean).join('\n')) })),
        ),
      },
    },
    {
      id: '/about',
      url: '/about',
      title: 'About & support',
      description: 'What Youj is, its principles, the packages, open source credits, and how to report a bug, ask a question or report a vulnerability.',
      structuredData: {
        headings: [
          { id: 'help', content: 'Get help' },
          { id: 'maintainer', content: 'Maintainer' },
        ],
        contents: [
          { heading: 'help', content: 'Report a bug on GitHub issues, ask a question in GitHub Discussions, report a vulnerability privately.' },
          { heading: 'maintainer', content: 'Maintained by @louis-henry on GitHub.' },
        ],
      },
    },
    {
      id: '/roadmap',
      url: '/roadmap',
      title: 'Roadmap',
      description: 'What Youj is doing now, what’s next, what’s later and what it’s exploring, as high-level themes. No dates.',
      structuredData: {
        headings: stages.flatMap((s) => s.items.map((i) => ({ id: i.id, content: i.title }))),
        contents: stages.flatMap((s) => s.items.map((i) => ({ heading: i.id, content: `${s.title}: ${i.body}` }))),
      },
    },
    {
      id: '/security',
      url: '/security',
      title: 'Security',
      description: 'How to report a vulnerability privately, supported versions, the supply chain, and what the CLI and MCP server do on your machine.',
      structuredData: {
        headings: policy.sections.map((s) => ({ id: s.id, content: s.title })),
        contents: policy.sections.map((s) => ({ heading: s.id, content: plainText(s.body) })),
      },
    },
  ]
}
