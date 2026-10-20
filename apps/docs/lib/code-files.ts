import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { getHighlighter } from 'fumadocs-core/highlight'
import { codeHighlight, youjCodeTheme } from '@/lib/code-theme'
import type { CodeBody } from '@/lib/code-url'

/* Every file a Code tab can show, for app/code/[...path]/route.ts to publish
 * as JSON at build time: the docs' examples (examples/<name>.tsx, what a
 * <ComponentPreview> runs) and each block's and example's files as
 * `youj add` writes them (generated/showcase-code.json, from
 * scripts/showcase.ts). */

const root = () => /*turbopackIgnore: true*/ process.cwd()

let installed: Record<string, { path: string; code: string }[]> | undefined

/** A block's or example's files, at their install paths, keyed `blocks/<slug>` or `examples/<slug>`. */
export function showcaseFiles(): Record<string, { path: string; code: string }[]> {
  installed ??= JSON.parse(readFileSync(join(root(), 'generated/showcase-code.json'), 'utf8'))
  return installed!
}

/** A docs example's source, as the Code tab shows and copies it. */
export function exampleSource(name: string): string {
  return readFileSync(join(root(), 'examples', `${name}.tsx`), 'utf8').trimEnd()
}

/** Every docs example by name (`button/demo`): the files under examples/ bar the index that registers them. */
export function exampleNames(): string[] {
  const dir = join(root(), 'examples')
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.tsx') && f !== 'index.tsx')
    .map((f) => relative(dir, join(dir, f)).replace(/\\/g, '/').replace(/\.tsx$/, ''))
    .sort()
}

/**
 * The highlighted markup for a file: one `<pre class="shiki">`, its tokens
 * colored by class. The panel around it is the scroller and the tab stop, so
 * the <pre> isn't a second one.
 */
export async function highlightHtml(code: string): Promise<string> {
  const highlighter = await getHighlighter('js', { langs: ['tsx'], themes: [youjCodeTheme] })
  return highlighter.codeToHtml(code, {
    lang: 'tsx',
    ...codeHighlight,
    transformers: [
      ...codeHighlight.transformers,
      {
        pre(node) {
          delete node.properties.tabindex
        },
      },
    ],
  })
}

/** What a published path holds: `docs/<name>` or `<kind>/<slug>/<install path>`, without the `.json`. */
export async function codeBody(path: string[]): Promise<CodeBody | undefined> {
  const [kind, ...rest] = path
  let code: string | undefined
  if (kind === 'docs') {
    const name = rest.join('/')
    code = exampleNames().includes(name) ? exampleSource(name) : undefined
  } else if (kind === 'blocks') {
    const [slug, ...file] = rest
    code = showcaseFiles()[`${kind}/${slug}`]?.find((f) => f.path === file.join('/'))?.code
  }
  return code === undefined ? undefined : { code, html: await highlightHtml(code) }
}

/** Every published path, for generateStaticParams. */
export function codePaths(): string[][] {
  return [
    ...exampleNames().map((name) => ['docs', ...name.split('/')]),
    ...Object.entries(showcaseFiles()).flatMap(([item, files]) => files.map((f) => [...item.split('/'), ...f.path.split('/')])),
  ]
}
