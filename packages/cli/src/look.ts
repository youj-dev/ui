import { DEFAULT_LOOK, isYoujLook, LOOKS, type YoujLook } from '../../core/src/lib/youj/look'
import { lookItem, lookStylesheet } from '../../ui/src/docs/create/look-url'
import { addCssImports, addTagAttributes } from './codemods'
import type { Mode } from './constants'
import { detectStylesheet, type Entry, type Framework } from './detect'
import { importPath, type Project } from './project'
import { CliError } from './ui'

/* The component look (classic, bezel): how components are built, beside the
 * theme's colours and type. A look is CSS keyed on data-yj-look. Classic is
 * the default and has no stylesheet: a root YoujProvider writes
 * data-yj-look="classic" itself, so the provider needs no prop; the attribute
 * also goes on a server-rendered <html> (for what's portaled to <body> from
 * outside a provider, and pages rendered without one). Bezel is
 * `look="bezel"` on the provider and data-yj-look="bezel" on <html>, and on
 * the registry its stylesheet (its item copies it) is imported right after
 * ui.css. The package's styles.css has every look already. */

export { DEFAULT_LOOK, LOOKS, type YoujLook }

/** A --look value, checked: undefined stays undefined (the default applies). */
export function checkLook(value: string | undefined): YoujLook | undefined {
  if (value === undefined) return undefined
  if (!isYoujLook(value)) throw new CliError(`--look takes ${LOOKS.join(', ')}; got "${value}".`)
  return value
}

/** The registry item that copies the look's stylesheet in, when the app is on the registry and the look has one (bezel). */
export function registryLookItem(look: YoujLook, mode: Mode): string | null {
  return mode === 'registry' ? lookItem(look) : null
}

/** Where the look's stylesheet is (or will be) in a registry app: beside the copied ui.css. */
export function lookStylesheetPath(project: Project, look: YoujLook): string | null {
  const sheet = lookStylesheet(look)
  if (!sheet) return null
  const ui = project.walk('.', (n) => n === 'ui.css').find((f) => f.endsWith('styles/ui.css'))
  if (ui) return ui.replace(/ui\.css$/, sheet.slice(sheet.lastIndexOf('/') + 1))
  return `${project.exists('src') ? 'src/' : ''}${sheet}`
}

const PROVIDER_OPEN = /<YoujProvider\b[^>]*>/
const lookIn = (opening: string) => opening.match(/\slook=["']([\w-]+)["']/)?.[1] ?? (/\slook=/.test(opening) ? '?' : null)
const HTML_LOOK = /(<(?:html|Html)\b[^>]*?\sdata-yj-look=)(["'])([\w-]*)\2/

/** The files that render YoujProvider: the app's root and its document. */
function providerFiles(project: Project, entry: Entry | null): string[] {
  return [...new Set([entry?.root, entry?.document])].filter((f): f is string => Boolean(f && /\.[jt]sx?$/.test(f) && PROVIDER_OPEN.test(project.read(f) ?? '')))
}

/** The look an app names: its provider's `look` prop (`?` for an expression), else data-yj-look on <html>. Null when it names none. */
function appLook(project: Project, entry: Entry | null): { look: string; file: string; on: 'provider' | 'html' } | null {
  for (const file of providerFiles(project, entry)) {
    const look = lookIn(project.read(file)!.match(PROVIDER_OPEN)![0])
    if (look) return { look, file, on: 'provider' }
  }
  const document = entry?.document
  const look = document && project.read(document)?.match(HTML_LOOK)?.[3]
  return document && look ? { look, file: document, on: 'html' } : null
}

/**
 * The look to set up when `look` is asked for, or null to leave the app's
 * own. The default (classic) takes no look away: an app that names another
 * keeps it. Bezel replaces a classic the app has only by default (on <html>,
 * nothing on the provider) and leaves one its provider names, with a note.
 */
export function lookToApply(project: Project, entry: Entry | null, look: YoujLook, manual: string[]): YoujLook | null {
  const current = appLook(project, entry)
  if (!current || current.look === look) return look
  if (look === DEFAULT_LOOK) return null
  if (current.on === 'provider') {
    manual.push(`${current.file}: YoujProvider already sets a look${current.look === '?' ? '' : ` ("${current.look}")`}; change it to look="${look}" to use ${look}.`)
    return null
  }
  return look
}

/**
 * Puts `look` on an app that has Youj (pass it through lookToApply
 * first): `look="bezel"` on the provider (classic, the default, needs no
 * prop), data-yj-look on <html>, and the registry stylesheet's import. Edits
 * go to `project`; steps it can't take safely go to `manual`. Running it
 * again changes nothing.
 */
export function applyLook(project: Project, framework: Framework | null, entry: Entry | null, look: YoujLook, mode: Mode, manual: string[]): void {
  // 1. The provider: only a look other than the default is a prop.
  if (look !== DEFAULT_LOOK) {
    const attribute = `look="${look}"`
    const files = providerFiles(project, entry)
    for (const file of files) {
      const source = project.read(file)!
      if (lookIn(source.match(PROVIDER_OPEN)![0])) continue
      const edited = addTagAttributes(source, 'YoujProvider', attribute, /\slook=/)
      if (edited === null) manual.push(`Add ${attribute} to YoujProvider in ${file}.`)
      else project.write(file, edited)
    }
    if (!files.length && framework !== 'astro') manual.push(`Couldn't find YoujProvider: give it ${attribute} (or data-yj-look="${look}" on <html>).`)
  }

  // 2. <html>, where the framework renders one: what's portaled from outside a provider follows too
  const document = entry?.document
  const html = document && project.read(document)
  if (document && html) {
    const tag = framework === 'next-pages' ? 'Html' : 'html'
    const current = html.match(HTML_LOOK)
    const edited = current
      ? html.replace(HTML_LOOK, `$1$2${look}$2`)
      : addTagAttributes(html, tag, `data-yj-look="${look}"`, /data-yj-look=/)
    if (edited === null) manual.push(`Add data-yj-look="${look}" to <${tag}> in ${document}.`)
    else if (edited !== html) project.write(document, edited)
  } else if (framework === 'astro') manual.push(`Add data-yj-look="${look}" to <html> in your layout.`)

  // 3. The registry's stylesheet, right after ui.css (the package's looks.css has it already)
  const file = lookStylesheetPath(project, look)
  if (mode !== 'registry' || !file || !framework || !entry) return
  const sheet = detectStylesheet(project, framework, entry)
  const css = project.read(sheet.path)
  if (css === null) manual.push(`Import ${file} right after ui.css in your global stylesheet.`)
  else project.write(sheet.path, addCssImports(css, [importPath(sheet.path, file)]))
}
