import { shippedThemes } from '@youj/core/lib/youj/theme/themes'
import { privateAdvisory, project, securityEmail } from '@/lib/project'
import { BROWSERS, REACT, THEME_COLORS } from '@/lib/support'

/* The FAQ's questions and answers, as Markdown. Every answer is checked
 * against the code and docs it links (peer ranges in the package manifests,
 * size budgets in packages/ui/scripts/size.mjs, the provider's props, the
 * icon originality test); keep them in step. The page, its FAQPage JSON-LD
 * and the search index all read from here. */

export interface Question {
  id: string
  question: string
  answer: string
}

export interface QuestionGroup {
  id: string
  title: string
  questions: Question[]
}

const list = (items: string[]) => `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`

export function faq(): QuestionGroup[] {
  const presets = shippedThemes.map((t) => t.name)
  return [
    {
      id: 'getting-started',
      title: 'Getting started',
      questions: [
        {
          id: 'is-it-free',
          question: 'Is Youj free?',
          answer: `Yes. The components, the motion system, the icons, the illustrations, the loaders, the miniatures, the sounds, the CLI and the MCP server are all [MIT licensed](${project.file('LICENSE')}), for commercial work too. The only exception is the [brand marks](#brand-marks).`,
        },
        {
          id: 'shadcn',
          question: 'How is it different from shadcn/ui?',
          answer: `\`@youj/react\` is shadcn/ui: the \`base-nova\` style on Base UI, with shadcn's component APIs. Youj adds what shadcn leaves to you: a motion system every component moves through (tokens, springs, speed and reduced motion from one provider), original animated icons that morph between states, themes derived from a few inputs with contrast checked against WCAG AA, and components shadcn doesn't have, such as Data Table, Kanban, Tag Input and a chat kit. Install it as an npm package and import from \`@youj/react\`, or copy the source in with \`npx @youj/cli add\`.`,
        },
        {
          id: 'existing-shadcn-project',
          question: 'Can I add it to an existing shadcn project?',
          answer: `Yes, one step at a time: load the token bridge, rename \`accent\` to \`hover\`, swap tw-animate for Youj's presets, then replace components when you're ready. Each step is designed to leave your existing components working. [Coming from shadcn/ui](/docs/guides/shadcn) walks through it.`,
        },
        {
          id: 'react-18',
          question: 'Does it support React 18?',
          answer: `No, Youj needs React ${REACT}. The packages take \`react\` and \`react-dom\` \`^${REACT}\` as peer dependencies, and the components take \`ref\` as a prop, as React ${REACT} does. They need Tailwind CSS v4 as well. [Installation](/docs/installation)`,
        },
        {
          id: 'nextjs',
          question: 'Does it work with the Next.js App Router and server components?',
          answer: `Yes. The packages ship ESM with types and mark their client components with \`"use client"\`, so server components import them directly, with nothing to transpile. \`npx @youj/cli init\` recognizes the App and Pages Router, adds the stylesheet and the provider, and spreads the theme onto the server-rendered \`<html>\` so nothing flashes on load. Numbers and dates format in the provider's \`locale\`, so the server and the browser render the same text. [Server rendering guide](/docs/guides/ssr), [Installation](/docs/installation)`,
        },
        {
          id: 'browsers',
          question: 'Which browsers does it support?',
          answer: `${BROWSERS}. ${THEME_COLORS}. [Supported versions](/docs/versioning#supported-versions)`,
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance and motion',
      questions: [
        {
          id: 'bundle-size',
          question: 'How big is it, and what does the motion cost?',
          answer: `An app pays for what it imports. Components animate with Motion's lightweight \`m\` elements, and Motion's animation engine arrives in a chunk of its own after the page loads, so it stays off the first load; a component shows its resting state until then. CI holds each case to a budget, gzipped over React, on the first load: a Button 22.5 KB, a Dialog 42 KB, an icon 27 KB, ten common components 125 KB. The heavy libraries (recharts, react-hook-form, date-fns, cmdk, embla) are optional peers behind their own entries, so an app installs only the ones it uses. [Motion loads on demand](/docs/installation#motion-loads-on-demand)`,
        },
        {
          id: 'turn-off-animations',
          question: 'Can I turn animations off?',
          answer: `Yes. By default Youj follows the operating system's reduced-motion setting. \`<YoujProvider reducedMotion="always">\` reduces motion for everyone, \`"never"\` keeps it on, and \`"user"\`, the default, follows the system. Reduced motion isn't motion switched off: every item has a designed static or instant state that says the same thing, so a success state still appears and a counter still shows its value. \`timeScale\` slows down or speeds up every duration and spring. [Reduced motion is a design state](/docs/motion/principles#reduced-motion-keep-the-meaning-remove-the-travel)`,
        },
      ],
    },
    {
      id: 'design',
      title: 'Design',
      questions: [
        {
          id: 'theming',
          question: 'Can I use my own theme?',
          answer: `Yes. A theme is a small contract: which way the grays lean, one accent, the corner scale, the density, the typefaces and how things move. Youj derives the rest for light and dark in CSS: the neutral ramp, the status colors, shadcn's variables, the focus ring, the radii and the durations. The presets are ${list(presets)}; set one with \`data-yj-theme\` and no JavaScript, or define your own with \`defineTheme\`. \`checkTheme\` reports any pair that misses WCAG AA as an error: the provider logs it in development, and Create, the CLI and the MCP server refuse the theme unless it sets \`allowLowContrast\`. [Theming](/docs/theming)`,
        },
        {
          id: 'icons',
          question: 'Are the icons original? Do they work with Lucide?',
          answer: `The animated icons are drawn for Youj (the brand marks in the set are their owners' and never animate; see the [brand marks](#brand-marks) question). A test compares every icon's strokes, as geometry, with every Lucide icon on each run, and fails on a copied drawing; only primitives any 24-unit set draws the same way (a dot, a line, a chevron, a circle) may match. They share Lucide's conventions (a 24px grid, round caps and joins, \`currentColor\`, \`size\` and \`strokeWidth\` props), so they sit well beside Lucide icons, and \`YoujIcon\` gives any Lucide icon the same triggers and effects. The packages don't depend on lucide-react. [Icons](/docs/icons)`,
        },
        {
          id: 'figma',
          question: 'Is there a Figma kit?',
          answer: `Yes. A development plugin builds the kit in your file from the same tokens as the packages: every theme as variables, the text and effect styles, all the icons as components and the components bound to them. It needs the Figma desktop app, on any plan. Run it again after an update and everything changes in place, with your instances still linked. [Figma kit](/docs/figma)`,
        },
        {
          id: 'ai-mcp',
          question: 'Can AI coding tools use Youj?',
          answer: `Yes, any MCP client can use it (Claude Code, Cursor, VS Code, Windsurf, Codex, Gemini CLI and Zed, for example). Run \`npx @youj/cli mcp\` to add the server to your editor's config, or connect to the hosted one at \`https://mcp.youj.dev\`, which needs nothing installed. It searches components, blocks, templates, icons and hooks by meaning, reads props and motion notes, finds the right icon morph for two states and builds contrast-checked themes. Run locally, it works offline from an index of your version; requests to the hosted server pass through Cloudflare, which keeps standard logs. Every docs page is also Markdown, listed in [/llms.txt](/llms.txt). [AI & MCP](/docs/mcp)`,
        },
      ],
    },
    {
      id: 'quality',
      title: 'Accessibility and languages',
      questions: [
        {
          id: 'accessibility',
          question: 'Is it accessible?',
          answer: `Accessible by default: keyboard, screen-reader and reduced-motion support, built toward WCAG 2.2 AA and checked with automated tests (not a conformance claim). Components build on Base UI's primitives: correct roles and states, full keyboard support, visible focus rings, and live-region announcements where state changes silently. Every story is checked with axe in light and dark, the UI, blocks and examples again right to left in Arabic, and every UI story's pointer targets are measured against WCAG 2.2's 24px minimum. The theme derivation keeps text at 4.5:1 and control borders at 3:1 on every surface, for any theme; fields are soft by default (a filled band, found by its label) and can be outlined. Component pages document their keyboard and screen-reader behavior. There's no published VPAT or ACR yet. [Accessibility](/docs/guides/accessibility)`,
        },
        {
          id: 'i18n-rtl',
          question: 'Does it support other languages and right-to-left layouts?',
          answer: `Yes. The text components own (the close button's name, "Rows per page", spoken announcements) comes from the provider's \`labels\`, so one object translates the library. Ready-made packs cover German, French, Spanish, Brazilian Portuguese, Italian, Dutch, Swedish, Polish, Turkish, Japanese, Simplified Chinese, Korean, Arabic and Hebrew: \`import { de } from '@youj/core/locales/de'\`, then \`<YoujProvider locale="de-DE" labels={de}>\`. Each loads only when imported, and plurals follow the language. Numbers and dates format with \`Intl\` in the provider's \`locale\`. Layout uses logical sides, start and end, so under \`dir="rtl"\` sheets, sidebars, button groups and progress bars mirror, arrow keys in menus and toolbars reverse, and indicators slide the other way. [Translating built-in text](/docs/guides/i18n)`,
        },
      ],
    },
    {
      id: 'help',
      title: 'Help and licensing',
      questions: [
        {
          id: 'get-help',
          question: 'How do I report a bug or get help?',
          answer: `Search the docs first (⌘K, or Ctrl K on Windows and Linux). For a bug, [open an issue](${project.newIssue}) with your package versions (\`npx @youj/cli doctor\` prints them) and the smallest reproduction you can make. Questions and ideas go to [GitHub Discussions](${project.discussions}). Report security issues privately, never in a public issue: see [Is Youj secure to install?](#security).`,
        },
        {
          id: 'security',
          question: 'Is Youj secure to install, and how do I report a vulnerability?',
          answer: `No package has an install script, the CLI and the MCP server send no telemetry. Run locally, the MCP server makes no network requests; the hosted one at \`mcp.youj.dev\` receives your editor's queries. Report a vulnerability privately by email to [${securityEmail}](mailto:${securityEmail}) (or, once the repository is public, through [GitHub's private vulnerability reporting](${privateAdvisory})), never in a public issue. The [security policy](/security) covers the supported versions, what happens after a report and the supply chain.`,
        },
        {
          id: 'brand-marks',
          question: 'Can I use the brand marks under the MIT license?',
          answer: `No. Youj includes some third-party brand marks: the \`brand\` icons and the Google mark in the auth blocks, drawn from each owner's official asset, and a few marks in demo data, listed in [Credits](/docs/contributing#brand-marks) and THIRD_PARTY_NOTICES.md. They are their owners' trademarks, used only to refer to their services. They aren't covered by Youj's MIT license, and they never animate, because a moving mark is an altered one. Replace the demo marks with your own data before you ship a block that shows them.`,
        },
      ],
    },
  ]
}
