# Contributing to the docs site

The docs site is `apps/docs` in the Youj monorepo. Read the root `CONTRIBUTING.md` first for the workspace rules; this page covers the site.

## House rules

What typically drifts here. The root [Principles](../../CONTRIBUTING.md#principles) apply too.

- **Parity:** every component and block that ships has a docs page (a `<BlockStory>` for blocks); `test/parity.test.ts` fails without one, and a page no `meta.json` names is in no sidebar.
- Never spell the repository URL in MDX: write `[text](repo:issues/new)` (`test/repo-url.test.ts`).
- Docs show `npx @youj/cli add <item>` and package imports, never `npx shadcn add` or `@/components/ui/...` as the way to use Youj.
- Budgets: `scripts/budgets.json` holds the page-weight and JS limits. A change that grows a page must fit; raise a limit only with a reason in its `note`.
- Examples are plain client components registered in `examples/index.tsx`; write them as app code, with theme tokens and no local shape overrides.
- Generated output (`generated/`, `public/r/`, `out/`) is not committed. Run `pnpm -F docs generate` after changing props or registry items.
- US English, plain and short. Demos use fictional names; real marks need a `THIRD_PARTY_NOTICES.md` entry. Maintainers handle promo videos and media upload.
- `pnpm -F docs verify` includes `lint:shapes` and the tests. Run `build:static --budgets` when a change can affect page weight.

## Set up and run

Node 22.22 or later and pnpm (the build scripts are TypeScript that Node runs directly).

```bash
pnpm install
pnpm -F docs dev        # runs pnpm generate, then next dev at http://localhost:3100
```

The first start runs `pnpm generate` (props, registry, icons, loaders, search art, demos), so it takes a moment. Rerun it after changing a package's props or registry items; `pnpm -F docs generate` runs it alone.

## Check your work

| Command | What it does |
| --- | --- |
| `pnpm -F docs verify` | `typecheck` and `test`: run it before opening a pull request |
| `pnpm -F docs test` | Vitest: parity, links, repo URL and the other guards (`test/`, `lib/*.test.ts`, `scripts/*.test.ts`) |
| `pnpm -F docs typecheck` | `fumadocs-mdx` and `tsc --noEmit` |
| `pnpm lint` (repository root) | Biome and the repository's lint checks |
| `pnpm -F docs build` | `generate`, `next build`, then the page-weight and JS budgets |
| `pnpm -F docs build:static --mode staging --budgets` | the static export that ships, with the budgets (what CI runs); `pnpm -F docs test` then also scans `out/` |

The README has the table of every `pnpm -F docs` script.

## Adding a page

1. Add `content/docs/<section>/<name>.mdx` with `title` and `description` front matter.
2. Name it in the folder's `meta.json`. A page no `meta.json` names is in no sidebar, and `test/parity.test.ts` lists the exceptions.
3. Every component and block that ships needs a docs page as well as a story; the parity test fails without one.
4. Run `pnpm -F docs test`.

The rules for filing a page and for writing a component page follow.

## Where a page goes

The docs are filed by what a reader is looking for, not by package: **Get started** (the top-level pages), **Guides** (task-based how-tos across the kit), **Components** (everything with a look of its own, from `@youj/react` or `@youj/motion`, in groups by the job it does), **Motion** (the tokens, principles and presets, and the motion primitives and transitions you put on your own elements), **Icons**, **Illustrations**, **Miniatures** and **Loaders** (the Visuals; for the illustrations, the ready-made scenes, drawing your own, and the grid backdrops; the explorer is their gallery, so the docs keep no gallery or scene table of their own).

- **Groups are `(group)` folders**, which Fumadocs leaves out of the URL: `components/(forms)/date-picker.mdx` is `/docs/components/date-picker`, in the sidebar's Forms & inputs. So a page can change groups without changing its URL. A group's own page is named after its folder (`(forms)/forms.mdx`) and set as `pagesIndex` in its `meta.json`, and it shows every page of the group as a card; separators in `meta.json` are the group's sub-labels, and the page's `##` headings match them. `lib/sections.ts` reads the folders for the eyebrow, search breadcrumbs and the MCP index ("Components / Forms & inputs").
- **Sidebar groups of pages that stay where they are.** A `(group)` folder holding only a `meta.json` whose `pages` name files elsewhere (`"../theming"`, `"../../shadcn-registry"`) is a sidebar group without moving anything: Get started's Theming and More, Guides' Platform and shadcn, Icons' Icon state. It has no `pagesIndex`, so its row only opens and closes. A page that no `meta.json` names is in no sidebar (`motion/playground`, a card on the Motion overview), and `test/parity.test.ts` lists it with the reason.
- **One command field.** A fenced block that is one `npx @youj/cli …` or `pnpm add …` line renders as the install field (`components/landing/install-field.tsx`, through `CodeBlock`; `lib/install-command.ts` decides), in the reader's package manager; config, output and several lines stay code. For a tool's own command, `<McpConnect />` is the same field with `kind: 'client'`, whose menu picks Claude Code, Codex or Gemini CLI (`lib/ai-client.ts`, remembered like the package manager).
- **Badges.** `status: new` spotlights a new capability (a family, a tool or a guide), at most eight at a time, never on the parts of a family, cleared at the next release; `status: deprecated` marks a page kept for apps that still use it. Placeholder pages aren't published. `sidebarTitle` renames a page in the sidebar only (a section's front page reads "Overview").

## Writing a component page

```mdx
---
title: Reveal
description: One sentence that says what it's for.
status: new # optional: see Badges above
---

<ComponentPreview name="reveal/demo" />   {/* examples/reveal/demo.tsx */}
<InstallTabs name="reveal" />             {/* a registry item name */}
<MotionSpec rows={[{ moment: 'Enter', duration: 'slow', ease: 'enter' }]} reduced="Renders its final state." />
<PropsTable name="Reveal" />              {/* an exported component or *Props interface */}
```

- **Examples** are plain client components in `examples/`, registered by path in `examples/index.tsx`. The preview's Code tab shows the file verbatim, so write it as app code. A test fails if a page uses an unregistered example or a file isn't registered.
- **Stories (trial on Field):** `<ComponentStories>` puts a page's examples in one preview with a Story menu in its strip. Each `<Story id label>` holds its `<ComponentPreview>` as written (so `lib/basics.ts`, `scripts/stage-heights.ts`, the examples test and the Markdown export read it as on any page), then its description: a first line, and anything only that story needs said. The story is the hash (`#validation`), so old example anchors land on it. Nothing sits under the stage: inside `<ComponentStories>`, `<Examples label="Get started">` holds Installation & usage (`<InstallTabs noImport>`, as the usage code imports), Description (`<StoryDescription />`) and Code (`<StoryCode />`), the last two following the story on show. Parts, hooks and other prose-only sections go in Reference.
- **Props** are extracted with the TypeScript compiler API: only props the package declares (inherited DOM and motion props become an "extends" note), aliases kept as written with their literal members expanded, and defaults read from destructuring, `@default`, or a trailing "Default x." sentence.
- **Other blocks:** `<Callout type="note|tip|warning|danger">`, `<Steps>`/`<Step>` (start each step with a `###` heading so it lands in the TOC), `<Cards>`/`<Card href demo soon>` (`demo` names the picture for a page that has none, like a group), `<ComponentIndex />` (every component and motion piece, A to Z), `<ComingSoon name>`, `<TopicLoop topic>` (a part's loop from apps/promo, at the top of its overview, always followed by a short paragraph before the next picture or preview; `test/parity.test.ts` holds every page to it), and `<Snippet code="… {registry}/reveal.json" />` for code that needs this site's URL.
- **`<PageArt art>`** opens every Get started and Guides page, straight under the title: a quiet band (184px, 152px on a phone) of the page's canvas in a hairline frame, with a faded isometric grid, drawn on the server. Inside it sit the page's registry scenes (`components/docs/page-art-scenes.tsx`, named in `lib/page-art.ts`). They assemble in view and float, and where one hands something on to the next, a dashed route carries a particle that runs only on screen. It's decorative, follows the site's theme and mode, and under reduced motion it's still from the first paint. Like a topic loop, text follows it. Theming and Styles open with their own picture instead, and `test/page-art.test.ts` holds every page to one or the other.

- **Reference:** wrap a page's Motion, Props, Accessibility and Reduced motion sections in `<Reference>…</Reference>` (blank lines inside), so the page leads with the preview and usage. TOC links into it open it.
- **A new MDX block** fills the page's column. Don't give its root a width of its own: a picture, code or a table that's wider than the column scales or scrolls inside it.


## Documenting a block

A card, section, screen or frame has no page of its own. It is a `<BlockStory>` on its family's page in `content/docs/blocks/(cards|sections|screens|frames)`, inside that page's `<BlockStories>`:

```mdx
<BlockStory id="feed" label="Activity feed" block="activity-feed" story="Default" backdrop="heather">

One short paragraph on what it does.

</BlockStory>
```

`block` is the registry name, `story` the Storybook export, and `id` the story's anchor (the page's first story has none). `lib/block-docs.ts` reads the pages, so `lib/block-docs.test.ts` and `test/parity.test.ts` fail on a block without a story. Block demos render at `/view/blocks/<slug>`; run `pnpm -F docs theme-audit <base URL>` against `next start` to check that they follow the theme bar.

## Budgets

Page weight (HTML, gzip and RSC payload per kind of page) and the JavaScript each kind of page loads are held to limits in `scripts/budgets.json`. `build` runs both checks after `next build`, and `build:static --budgets` runs them on the export. To check an existing build, run `pnpm -F docs weight [dir]` and `pnpm -F docs js-budget`. A limit is a ceiling to notice a regression by: lower it when pages get lighter, and raise it only with a reason in that entry's `note`. What keeps pages light is in [docs/architecture.md](docs/architecture.md), "Page weight".

## The static build

`pnpm -F docs build:static --mode staging|production` (`scripts/build-static.ts`) runs the Next export into `out/` and adds the Markdown twins, `_headers` and `_redirects`. It is what Cloudflare serves. Vercel-only routes are named `*.vercel.ts(x)` and static-only ones `*.static.ts(x)`; `pageExtensions` in `next.config.mjs` picks one set per build. Details, and what deploys where, are in [docs/hosting.md](docs/hosting.md).

## Other scripts you may need

- `pnpm -F docs stage-heights [--url …]` after a demo changes height (rewrites `lib/stage-heights.json`).
- `pnpm -F docs miniatures:thumbs` after a miniature is added or redrawn (needs a running server).
- `pnpm -F docs favicons` when the brand changes.
- `pnpm -F docs media:upload` after a promo film is approved (promo videos only; there are no screenshots).
