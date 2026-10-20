import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { Catalog } from './catalog'
import { NotFound } from './format'
import { getAddCommand } from './tools/add'
import { getProjectInfo } from './tools/project-info'
import { getComponent, search } from './tools/components'
import { listComponents, listLoaders, listMiniatures } from './tools/lists'
import { drawIllustration, illustrationGuide } from './tools/draw'
import { listIllustrations } from './tools/illustrations'
import { getIcon, searchIcons, suggestIconMorph } from './tools/icons'
import { motionGuidance } from './tools/motion'
import { FRAMEWORKS, setup } from './tools/setup'
import { getShowcase, listShowcase } from './tools/showcase'
import { createTheme, getTokens, PRESETS } from './tools/theme'
import { LOOKS } from '@youj/core/lib/youj/look'

/* The Youj MCP server: tools, resources and prompts over the bundled index. */

const INSTRUCTIONS = `Youj is a React 19 + Tailwind v4 UI kit: accessible components (@youj/react), the provider, tokens and themes (@youj/core), motion (@youj/motion), loading animations (@youj/loaders), miniatures (@youj/miniatures), icons (@youj/icons: animated ones that morph between states, plus static brand marks), isometric illustrations (@youj/illustrations), themes with contrast checked against WCAG AA, and the same source to copy in, only with \`npx youj add\`. Import each thing from the package that owns it: components from \`@youj/react\`, the provider, tokens, themes and presets from \`@youj/core\`, motion (interactions, backgrounds, players) from \`@youj/motion\`, loaders from \`@youj/loaders/<id>\` (one entry each), miniatures from \`@youj/miniatures\`, icons from \`@youj/icons\`, scenes from \`@youj/illustrations\`, sounds from \`@youj/sound\`.
- Find things by meaning with \`search\` (components, blocks, icons, illustrations, miniatures, loaders, hooks, docs); read one with \`get_component\` before using it.
- Icons: \`search_icons\`, \`get_icon\`; for an icon that changes state (play → pause, menu → close, copy → check) call \`suggest_icon_morph\`.
- Copy-in levels: cards, sections and screens are blocks (\`list_blocks\`, filter by \`level\`; \`get_block\`). Components (simple or composite) are imported from the packages instead. \`get_block\` shows the files as \`npx youj add\` writes them, a file at a time.
- An app's frame (sidebar, top bar, account, search) is built in Create (youj.dev/create), which adds in-app screens to it as the pages of its nav; \`npx youj create '<link>'\` installs it, screens and all.
- Illustrations (isometric scenes for empty states, onboarding and heroes): \`list_illustrations\` by category, \`search\` by name or tag, \`get_component("illustration-coffee")\`. When none fits, draw one: \`get_illustration_guide\`, then \`draw_illustration\`.
- Styling: \`get_tokens\`; a brand theme: \`create_theme\`. Motion: \`motion_guidance\` names the piece that already does it.
- Sound: components emit cues as they move; a pack from \`@youj/sound\`, passed as \`<YoujProvider sound={beacon}>\`, plays them (opt-in). \`motion_guidance("interface sounds")\` has the setup.
- Project: \`get_project_info\`; install commands: \`get_add_command\`. Setup: \`setup\` (prefer \`npx youj init\`).
Rules: use semantic colour classes (bg-canvas, text-fg, text-fg-muted, bg-accent…) and \`h-control*\`/\`text-ui*\`, never raw colours or hard-coded durations; take timing from useYouj() or var(--yj-duration-*); every animation needs a reduced-motion equivalent.`

type Result = { content: { type: 'text'; text: string }[]; isError?: boolean }

async function run(work: () => string | Promise<string>): Promise<Result> {
  try {
    return { content: [{ type: 'text', text: await work() }] }
  } catch (error) {
    if (error instanceof NotFound) return { content: [{ type: 'text', text: error.message }], isError: true }
    throw error
  }
}

const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const

/** `remote`: served over HTTP (worker/), where there is no local app to inspect: no `get_project_info`, no version check. */
export function createServer(catalog: Catalog, options: { cwd?: string; remote?: boolean } = {}): McpServer {
  const { meta } = catalog.index
  const installed = options.remote ? undefined : catalog.host.installedVersion(options.cwd)
  const mismatch = installed && installed !== meta.version ? `\nNote: this app has Youj ${installed}, and this server describes ${meta.version}. Run the matching server: npx @youj/mcp@${installed}` : ''
  const server = new McpServer({ name: 'youj', title: 'Youj', version: meta.version, websiteUrl: meta.site }, { instructions: INSTRUCTIONS + mismatch })
  const categories = [...new Set(catalog.index.icons.map((i) => i.category))].sort() as [string, ...string[]]

  const cwdSchema = z.string().min(1).max(4096).refine((value) => !value.includes('\0'), 'Path cannot contain NUL').refine(catalog.host.insideCwd, 'cwd must be inside the directory the server was started in').optional().describe('App directory (default: process.cwd()); reads stay inside this directory')
  if (!options.remote) server.registerTool(
    'get_project_info',
    {
      title: 'Inspect a project',
      description: 'Read local project setup: framework, package manager, Youj package or @youj registry route, installed and declared versions, React, Tailwind and setup warnings. Read-only; never searches outside cwd.',
      inputSchema: { cwd: cwdSchema },
      annotations: readOnly,
    },
    ({ cwd }) => run(() => getProjectInfo(catalog, cwd ?? options.cwd)),
  )
  server.registerTool(
    'get_add_command',
    {
      title: 'Get an install command',
      description: 'Resolve component, block or illustration scene names (`illustration-coffee`) exactly (case-insensitive), then return the project’s package-manager command for missing dependencies and package imports, or npx youj add for the registry route. Includes optional peers and subpath imports. Unknown names are errors with suggestions. Does not install anything.',
      inputSchema: { items: z.array(z.string().trim().min(1).max(80)).min(1).max(50), cwd: cwdSchema },
      annotations: readOnly,
    },
    ({ items, cwd }) => run(() => getAddCommand(catalog, items, cwd ?? options.cwd)),
  )

  server.registerTool(
    'search',
    {
      title: 'Search Youj',
      description: 'Search Youj by meaning across components, blocks, icons, illustration scenes, miniatures, loaders, hooks and docs, e.g. "loading spinner", "delete confirmation", "settings page", "list reorder animation". Returns ranked one-line results with the tool to call next.',
      inputSchema: {
        query: z.string().min(1, 'Say what you need, in a few words').max(200).describe('What you need, in plain words'),
        kinds: z.array(z.enum(['component', 'block', 'icon', 'illustration', 'miniature', 'loader', 'hook', 'docs'])).optional().describe('Only these kinds (default: all)'),
        limit: z.number().int().min(1).max(25).default(8),
      },
      annotations: readOnly,
    },
    ({ query, kinds, limit }) => run(() => search(catalog, query, kinds, limit)),
  )

  server.registerTool(
    'get_component',
    {
      title: 'Get a component',
      description: 'Everything needed to use one Youj component (UI, core or motion), the illustration kit and its parts, or one illustration scene (`illustration-coffee`): what it is for and what to use instead, install (package and `npx youj add`), a usage example, props, motion tokens, reduced-motion behaviour and accessibility. Accepts a registry name (`alert-dialog`), title or export (`AlertDialogContent`).',
      inputSchema: {
        name: z.string().min(1).max(80).describe('Registry name, title or export name'),
        part: z.string().max(80).optional().describe('A sub-component export to show props for, e.g. "DialogContent"'),
        sections: z.array(z.enum(['install', 'usage', 'props', 'motion', 'a11y', 'related'])).optional().describe('Only these sections (default: all)'),
      },
      annotations: readOnly,
    },
    ({ name, part, sections }) => run(() => getComponent(catalog, name, { part, sections })),
  )

  server.registerTool(
    'list_components',
    {
      title: 'List components',
      description: 'Every component (UI, core, motion, sound) by docs category with its package, stability and a one-line summary. Filter by kind or category. One in detail: get_component.',
      inputSchema: {
        kind: z.enum(['ui', 'core', 'motion', 'sound']).optional().describe('Only this kind'),
        category: z.string().max(40).optional().describe('Only this docs category, e.g. "forms"'),
      },
      annotations: readOnly,
    },
    ({ kind, category }) => run(() => listComponents(catalog, { kind, category })),
  )
  server.registerTool(
    'list_loaders',
    {
      title: 'List loaders',
      description: 'Every loading animation (@youj/loaders) by category, with its id, component and technique. Search finds one by meaning.',
      inputSchema: { category: z.string().max(40).optional().describe('Only this category') },
      annotations: readOnly,
    },
    ({ category }) => run(() => listLoaders(catalog, category)),
  )
  server.registerTool(
    'list_miniatures',
    {
      title: 'List miniatures',
      description: 'Every miniature (@youj/miniatures, interactive isometric objects) by category, with its id and component.',
      inputSchema: { category: z.string().max(40).optional().describe('Only this category') },
      annotations: readOnly,
    },
    ({ category }) => run(() => listMiniatures(catalog, category)),
  )

  server.registerTool(
    'search_icons',
    {
      title: 'Search icons',
      description: 'Search original Youj icons, brand marks and optional Lucide icons by meaning (synonyms, typos, prefixes), e.g. "notification", "delete", "loading". type: static (one pose, animates on hover), morph (state icons that morph between two meanings), swap (IconSwap pairs). Returns names, a JSX snippet each and the import line.',
      inputSchema: {
        query: z.string().min(1, 'Say what the icon is for, in a few words').max(100),
        type: z.enum(['all', 'static', 'morph', 'swap']).default('all'),
        category: z.enum(categories).optional().describe('A Youj icon category'),
        source: z.enum(['all', 'youj', 'lucide']).default('all'),
        limit: z.number().int().min(1).max(30).default(12),
      },
      annotations: readOnly,
    },
    ({ query, type, category, source, limit }) => run(() => searchIcons(catalog, query, { type, category, source, limit })),
  )

  server.registerTool(
    'get_icon',
    {
      title: 'Get an icon',
      description: 'One icon in detail: its choreography, states (for morphing icons), triggers (hover, mount, loop, none, controlled `active`), the accessible button pattern, props, install and IconSwap partners. For a Lucide icon: how to animate it with YoujIcon and install the optional lucide-react dependency.',
      inputSchema: { name: z.string().min(1).max(80).describe('`bell-off`, `BellOffIcon`, or `lucide:rocket`') },
      annotations: readOnly,
    },
    ({ name }) => run(() => getIcon(catalog, name)),
  )

  server.registerTool(
    'suggest_icon_morph',
    {
      title: 'Suggest an icon morph',
      description: 'Given two meanings or icons ("play → pause", "menu → close", "copy → check", "bell → muted"), returns the best way to animate between them: a state icon choreographed for that pair when one exists, otherwise an IconSwap between the two best icons with the fitting transition, and a code snippet with the accessible button pattern.',
      inputSchema: {
        pair: z.string().max(120).optional().describe('"from → to", e.g. "play → pause"'),
        from: z.string().max(60).optional(),
        to: z.string().max(60).optional(),
      },
      annotations: readOnly,
    },
    (input) => run(() => suggestIconMorph(catalog, input)),
  )

  server.registerTool(
    'list_blocks',
    {
      title: 'List blocks',
      description:
        'Every block: a copy-in card (a self-contained panel), section (a website band) or screen (a full screen), grouped by domain, each tagged with its level and a one-line summary. (An app frame is built in Create, not listed here.)',
      inputSchema: {
        group: z.string().max(40).optional().describe('Only this group, e.g. "Auth"'),
        level: z.enum(['card', 'section', 'screen']).optional().describe('Only this level, e.g. "screen" for whole screens'),
      },
      annotations: readOnly,
    },
    (input: { group?: string; level?: string }) => run(() => listShowcase(catalog, input.group, input.level)),
  )
  server.registerTool(
    'get_block',
    {
      title: 'Get a block',
      description: `One block: description, the components it uses, its install command and files. Pass source: true (and file/offset to page) for the code, ${12_000} characters at a time.`,
      inputSchema: {
        name: z.string().min(1).max(80).optional().describe("The block's name, from list_blocks"),
        slug: z.string().min(1).max(80).optional().describe('Deprecated: use name'),
        source: z.boolean().optional().describe('Return source code instead of the summary'),
        file: z.string().max(200).optional().describe('Which file (from the Files list)'),
        offset: z.number().int().min(0).optional().describe('Character offset, to page through a long file'),
      },
      annotations: readOnly,
    },
    ({ name, slug, source, file, offset }) =>
      run(() => {
        const wanted = name ?? slug
        if (!wanted) throw new NotFound('Say which block: get_block({ name }), from list_blocks.')
        return getShowcase(catalog, wanted, { source, file, offset })
      }),
  )

  server.registerTool(
    'list_illustrations',
    {
      title: 'List illustrations',
      description: 'The ready-made isometric illustration scenes by category, with ids and tags (without a category: every category and its scene ids), how to install or draw one, and how to draw your own with the illustration builder and the illustration kit. One scene in detail: get_component("illustration-<id>").',
      inputSchema: { category: z.string().max(40).optional().describe('Only this category, e.g. "food" or "Data"') },
      annotations: readOnly,
    },
    ({ category }) => run(() => listIllustrations(catalog, category)),
  )

  server.registerTool(
    'get_illustration_guide',
    {
      title: 'Illustration guide',
      description: 'How to compose a new isometric illustration in the builder’s JSON format, for draw_illustration: the volume and grid, every part type, prism and lathe preset, shade, variant and base, composition rules that read at small sizes, and worked example scenes. Check list_illustrations first.',
      inputSchema: {},
      annotations: readOnly,
    },
    () => run(() => illustrationGuide(catalog)),
  )
  server.registerTool(
    'draw_illustration',
    {
      title: 'Draw an illustration',
      description: 'Checks a scene in the illustration builder’s JSON format (get_illustration_guide) and returns the React component for the project’s install route, the file to write it to, the install command, and a builder link to see and tweak it. An invalid scene returns every problem with its fix. Writes nothing.',
      inputSchema: {
        scene: z.union([z.record(z.string(), z.unknown()), z.string().max(200_000)]).describe('{ "name", "base", "parts": [...], "groups"?: [...] }, as get_illustration_guide describes'),
        name: z.string().trim().min(1).max(40).optional().describe('The component’s name, e.g. "Empty inbox" → IllustrationEmptyInbox (default: the scene’s name)'),
        cwd: cwdSchema,
      },
      annotations: readOnly,
    },
    ({ scene, name, cwd }) => {
      const drawn = drawIllustration(catalog, scene, { name, cwd: cwd ?? options.cwd })
      return { content: [{ type: 'text' as const, text: drawn.text }], ...(drawn.isError ? { isError: true } : {}) }
    },
  )

  server.registerTool(
    'get_tokens',
    {
      title: 'Get design tokens',
      description: 'Youj tokens for a preset (default basalt): colour (light and dark, with the class to use), type, radius, control size and control heights, motion durations, easings, springs and staggers, and character (stroke width and ink, shadow style, title and label voice, icon weight).',
      inputSchema: {
        preset: z.enum(PRESETS as [string, ...string[]]).optional(),
        groups: z.array(z.enum(['color', 'type', 'radius', 'spacing', 'motion', 'character'])).optional().describe('Only these groups (default: all)'),
        mode: z.enum(['light', 'dark', 'both']).default('both'),
      },
      annotations: readOnly,
    },
    ({ preset, groups, mode }) => run(() => getTokens(catalog, { preset, groups, mode })),
  )

  server.registerTool(
    'create_theme',
    {
      title: 'Create a theme',
      description: 'Builds a Youj theme from a brand colour (over a preset, Basalt unless another is named; neutrals, status and info inks, radius, control size, motion personality, fonts, its character: stroke, shadow, headings, labels, and its tone: a two-tone chrome) with defineTheme, runs checkTheme (every text pair ≥ 4.5:1 and field borders ≥ 3:1 on every surface, in both modes; a WCAG AA failure refuses the theme unless allowLowContrast is set) and returns the code, how to apply it (with `style`, in that component style), the derived colours and any issues.',
      inputSchema: {
        accent: z.string().min(3).max(60).describe('Brand colour: hex, rgb(), hsl() or oklch()'),
        name: z.string().max(40).optional(),
        base: z.enum(PRESETS as [string, ...string[]]).optional().describe('A preset to extend (default basalt)'),
        neutral: z
          .object({
            hue: z.number().min(0).max(360).optional(),
            chroma: z.number().min(0).max(0.04).optional(),
            wash: z.number().min(0).max(1).optional(),
            lift: z.number().min(0).max(1).optional().describe('Dark mode: how far cards and raised surfaces stand above the page (0 close, 1 lit slabs)'),
          })
          .optional()
          .describe('Neutral tint (default: leans toward the accent hue at chroma 0.01)'),
        success: z.string().max(60).optional(),
        warning: z.string().max(60).optional(),
        danger: z.string().max(60).optional(),
        info: z.string().max(60).optional().describe('Informational ink (alerts, toasts, badges); default: the accent'),
        radius: z.enum(['none', 'sm', 'md', 'lg', 'full']).optional(),
        controlSize: z.enum(['compact', 'default', 'comfortable']).optional().describe('Control heights: compact, default or comfortable'),
        motionPersonality: z.enum(['precise', 'calm', 'lively']).optional().describe('Timing: precise, calm or lively'),
        fonts: z
          .object({ sans: z.string().max(200).optional(), mono: z.string().max(200).optional(), display: z.string().max(200).optional().describe('Titles; default: sans') })
          .optional(),
        stroke: z
          .object({
            width: z.number().min(0.5).max(4).optional().describe('Border width in px (default 1)'),
            ink: z.number().min(0).max(1).optional().describe('0 = quiet hairline, 1 = lines in the text colour'),
            icons: z.number().min(0.5).max(2).optional().describe('Icon stroke multiplier'),
          })
          .optional(),
        shadow: z.enum(['soft', 'hard', 'none']).optional().describe('soft: blurred elevation; hard: solid offset shadows in ink; none: flat'),
        actions: z.enum(['accent', 'ink']).optional().describe('What fills primary buttons: accent (default), or ink, the text colour, leaving the accent to "on" states'),
        controls: z.enum(['pill', 'rounded']).optional().describe('The shape of every control (buttons, fields, tab and toggle tracks, badges): pill (default), or rounded at the control radius in proportion to each height'),
        fields: z.enum(['outlined', 'soft']).optional().describe('How every field is drawn: outlined (default, the fill on a 3:1 edge) or soft (a filled band with no edge)'),
        tone: z
          .object({ chrome: z.enum(['match', 'dark', 'light']).optional(), overlays: z.enum(['content', 'chrome']).optional() })
          .optional()
          .describe("Two-tone: which mode the chrome (sidebar, headers, toolbars, islands) is drawn in, match (default) or held dark or light; overlays (menus, dialogs) follow the content (default) or the chrome. { chrome: 'dark' } gives dark bars on a light page"),
        headings: z.object({ weight: z.number().min(100).max(900).optional(), tracking: z.number().min(-0.1).max(0.3).optional() }).optional(),
        labels: z
          .object({ case: z.enum(['none', 'upper']).optional(), font: z.enum(['sans', 'mono']).optional(), tracking: z.number().min(-0.1).max(0.3).optional() })
          .optional()
          .describe('Badges, column heads, field labels, group headings, tabs and keys'),
        allowLowContrast: z.boolean().optional().describe('Accept pairs that miss WCAG AA. Without it, a failing theme is refused with the failing pairs listed.'),
        look: z
          .enum(LOOKS)
          .optional()
          .describe('The look to apply it with: how components are built, independent of the theme (classic, the default: hairline panels, rounded controls, outlined fields, underline tabs; bezel: instrument panels, pill actions, filled fields, segmented tabs, mono figures)'),
      },
      annotations: readOnly,
    },
    (input) => run(() => createTheme(input)),
  )

  server.registerTool(
    'motion_guidance',
    {
      title: 'Motion guidance',
      description: 'For an interaction ("toast enters", "list reorders", "button success", "tabs indicator", "section reveals on scroll"), names the Youj component, preset or token that already does it, with a snippet, its tokens and its reduced-motion behaviour.',
      inputSchema: { interaction: z.string().min(2, 'Describe the moment in a few words, e.g. "toast enters"').max(200) },
      annotations: readOnly,
    },
    ({ interaction }) => run(() => motionGuidance(catalog, interaction)),
  )

  server.registerTool(
    'setup',
    {
      title: 'Set up Youj',
      description: 'How to add Youj to an app: `npx youj init` and the manual route for the framework, package or registry mode, in a component style when one is given. Paste package.json and/or the global stylesheet to check versions and stylesheet order like `youj doctor`.',
      inputSchema: {
        framework: z.enum(FRAMEWORKS).optional(),
        mode: z.enum(['package', 'registry']).optional(),
        look: z.enum(LOOKS).optional().describe('The look: classic (default) or bezel. Independent of the theme'),
        packageJson: z.string().max(50_000).optional().describe('The app’s package.json'),
        css: z.string().max(50_000).optional().describe('The global stylesheet'),
      },
      annotations: readOnly,
    },
    (input) => run(() => setup(catalog, input) + mismatch),
  )

  /* ── Resources ── */

  const docUri = (slug: string) => `youj://docs/${slug || 'index'}`
  server.registerResource(
    'docs',
    new ResourceTemplate('youj://docs/{+slug}', {
      list: () => ({
        resources: catalog.index.docs.map((d) => ({ uri: docUri(d.slug), name: d.slug || 'index', title: d.title, description: d.description, mimeType: 'text/markdown' })),
      }),
      complete: { slug: (value) => catalog.index.docs.map((d) => d.slug || 'index').filter((s) => s.startsWith(value)).slice(0, 50) },
    }),
    { title: 'Youj docs', description: 'Every docs page as Markdown', mimeType: 'text/markdown' },
    (uri, { slug }) => {
      const key = String(slug) === 'index' ? '' : String(slug)
      const page = catalog.doc(key)
      if (!page) throw new Error(`No docs page "${slug}"`)
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: page.markdown }] }
    },
  )
  server.registerResource('tokens', 'youj://tokens', { title: 'Youj tokens', description: 'Basalt (the default preset) tokens: colour, type, radius, control size and motion', mimeType: 'text/markdown' }, (uri) => ({
    contents: [{ uri: uri.href, mimeType: 'text/markdown', text: getTokens(catalog) }],
  }))
  server.registerResource('components', 'youj://components', { title: 'Youj components', description: 'Every component, one line each', mimeType: 'text/markdown' }, (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: 'text/markdown',
        text: catalog.index.components.map((c) => `- \`${c.name}\` ${c.title} (${c.kind}, ${c.category}): ${c.description}`).join('\n'),
      },
    ],
  }))

  /* ── Prompts ── */

  server.registerPrompt(
    'build-screen',
    {
      title: 'Build a screen with Youj',
      description: 'Plan and build a screen from Youj blocks, components, icons and motion',
      argsSchema: { screen: z.string().describe('The screen, e.g. "a settings page with profile, billing and team tabs"'), framework: z.string().optional() },
    },
    ({ screen, framework }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Build this screen with Youj${framework ? ` in ${framework}` : ''}: ${screen}

1. Look for a block that already covers it: \`search\` with kind block, then \`get_block\`. Start from it when it fits.
2. For each remaining part, \`search\` for the component and read it with \`get_component\` before writing code (props, accessibility, what to use instead).
3. Icons: \`search_icons\`; wherever an icon shows a state change, \`suggest_icon_morph\`.
4. Motion: use what the components already do; for anything else ask \`motion_guidance\`. Every animation keeps a reduced-motion equivalent.
5. Style only with Youj tokens (\`get_tokens\`): semantic colour classes, h-control*, text-ui*, no raw colours or durations.
6. If Youj isn't set up yet, follow \`setup\`.
Then write the code, and list what to install (\`npx youj add …\` or the package).`,
          },
        },
      ],
    }),
  )
  server.registerPrompt(
    'brand-theme',
    {
      title: 'Theme Youj for a brand',
      description: 'Create and apply a theme from a brand colour, checked for contrast',
      argsSchema: { accent: z.string().describe('The brand colour'), name: z.string().optional() },
    },
    ({ accent, name }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Create a Youj theme${name ? ` called ${name}` : ''} from the brand colour ${accent}: call \`create_theme\`, fix anything it reports (adjust the input, not the derived colours), then apply it app-wide with themeProps on <html> and YoujProvider, as its output shows. Compare with the closest preset from \`get_tokens\` and say what differs.`,
          },
        },
      ],
    }),
  )

  return server
}
