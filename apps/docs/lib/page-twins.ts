import { siteUrl } from './site'

/* The Markdown twins of the standalone pages (/icons.md, /create.md…): the page's title and its
 * summary, with a link back to it. Short on purpose; the docs have the depth (/docs.md, /llms.txt). */

const PAGES = {
  index: {
    path: '/',
    title: 'Youj',
    summary:
      'Accessible UI components, animated icons, illustrations and themes that move together. Install the kit, or copy just the pieces you need. Set up with `npx youj init`.',
    more: [['Docs', '/docs.md'], ['Everything in one file', '/llms-full.txt']],
  },
  icons: {
    path: '/icons',
    title: 'Icon explorer',
    summary:
      'Every Youj icon: static, animated, morphing and swapping. Search by meaning, preview at your size, stroke and color, and copy React, SVG, JSX or the install command.',
    more: [['Docs', '/docs.md']],
  },
  illustrations: {
    path: '/illustrations',
    title: 'Illustration explorer',
    summary:
      'Isometric scenes drawn from your theme. Search by name, category or tag, preview any scene live in any preset, light or dark, copy the code or the install command, and download it as SVG or PNG.',
    more: [['Illustration builder', '/illustrations/build.md']],
  },
  'illustrations/build': {
    path: '/illustrations/build',
    title: 'Illustration builder',
    summary:
      'Build a new isometric illustration from the Youj kit: place boxes, cylinders, prisms and turned solids on the floor, preview it in any theme, and take it home as code, SVG, PNG or JSON. Experimental.',
    more: [['Illustration explorer', '/illustrations.md']],
  },
  loaders: {
    path: '/loaders',
    title: 'Loaders',
    summary:
      'Every Youj loader, live in the interface it belongs in: a deploy card, an upload panel, an assistant’s reply, a dashboard, a splash screen. Set its size, loop, colors and label, then copy the install command or the code.',
    more: [],
  },
  miniatures: {
    path: '/miniatures',
    title: 'Miniatures',
    summary: 'Interactive isometric models of real things, for React.',
    more: [],
  },
  create: {
    path: '/create',
    title: 'Create',
    summary:
      'Build an app frame from Youj blocks (sidebar, top bar, account and search), add screens from the Screens catalog, give it your theme, and take it home as code with `npx youj create \'<link>\'`.',
    more: [['Docs', '/docs.md']],
  },
  about: {
    path: '/about',
    title: 'About & support',
    summary:
      'What Youj is, the principles behind it, what ships in the box, the open source it builds on, and how to get help.',
    more: [['FAQ', '/faq.md'], ['Security', '/security.md']],
  },
  changelog: {
    path: '/changelog',
    title: 'Changelog',
    summary:
      'Every Youj release: what broke, what was added and what was fixed, with the migration for each breaking change. An RSS feed is at /changelog.xml.',
    more: [['Roadmap', '/roadmap.md']],
  },
} as const

export type PageTwin = keyof typeof PAGES

export function pageTwinResponse(key: PageTwin): Response {
  const site = siteUrl()
  const { path, title, summary, more } = PAGES[key]
  const lines = [`# ${title}`, '', summary, '', `Page: ${site}${path === '/' ? '' : path}`]
  if (more.length) lines.push('', ...more.map(([name, href]) => `- [${name}](${site}${href})`))
  return new Response(`${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
