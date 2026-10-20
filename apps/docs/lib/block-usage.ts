import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { BlockDoc, PropDoc } from '@/scripts/props'

export type { BlockDoc } from '@/scripts/props'

let cache: Record<string, BlockDoc> | undefined

/** Each block's props, item types and `copy` keys, extracted at build time by scripts/props.ts. */
export function blockDoc(slug: string): BlockDoc | undefined {
  cache ??= JSON.parse(readFileSync(join(process.cwd(), 'generated/block-props.json'), 'utf8')) as Record<string, BlockDoc>
  return cache[slug]
}

/** Props a usage snippet leaves to their defaults: the look, the page around it and the demo's starting state. */
const QUIET = /^(theme|embedded|className|classNames|illustration|headingLevel|locale|variant|layout|mode|live|autoPlay|autoplay|loading|error|empty|header|actions|footer|aside|children|copy|linkComponent|getHref|renderItem)$|^default[A-Z]/

/** A prop that carries the developer's data: a list, a record or an item type, never a slot or a theme. */
function isData(prop: PropDoc) {
  if (QUIET.test(prop.name) || /^on[A-Z]/.test(prop.name)) return false
  if (/^(ReactNode|ThemeInput|IllustrationSlot|ElementType|boolean|string|number)$/.test(prop.type)) return false
  return /\[\]|^Record<|^readonly |^[A-Z]\w*$/.test(prop.type)
}

/** `(slot: SlotGridSlot, service: Service) => …` → `['slot', 'service']`. */
export function callbackParams(type: string): string[] {
  if (!type.startsWith('(')) return []
  let depth = 0
  let end = 0
  for (let i = 0; i < type.length; i++) {
    if ('([{<'.includes(type[i]!)) depth++
    else if (')]}>'.includes(type[i]!) && type[i - 1] !== '=') depth--
    if (depth === 0) {
      end = i
      break
    }
  }
  const inner = type.slice(1, end)
  const params: string[] = []
  let current = ''
  depth = 0
  for (const [i, ch] of [...inner].entries()) {
    if ('([{<'.includes(ch)) depth++
    if (')]}>'.includes(ch) && inner[i - 1] !== '=') depth--
    if (ch === ',' && depth === 0) {
      params.push(current)
      current = ''
    } else current += ch
  }
  if (current.trim()) params.push(current)
  return params.map((p) => p.trim().split(/\??:/)[0]!.trim()).filter(Boolean)
}

const quote = (text: string) => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

/**
 * A short, typed usage of a block with your own data: its data props come in
 * through a wrapper's props, one string shows where `copy` goes, and each
 * action is a callback to fill in. `undefined` when the block takes none of
 * them (a demo to edit after adding).
 */
export function blockUsage(doc: BlockDoc): string | undefined {
  const data = doc.props.filter(isData).slice(0, 4)
  const callbacks = doc.props.filter((p) => /^on[A-Z]/.test(p.name)).slice(0, 3)
  const copyEntry = Object.entries(doc.copy ?? {}).find(([key, value]) => value && !/^(locale|currency)$/.test(key))
  const link = doc.props.some((p) => p.name === 'linkComponent')
  if (data.length === 0 && callbacks.length === 0 && !copyEntry) return undefined

  const { component } = doc
  const propsType = doc.propsType ?? `ComponentProps<typeof ${component}>`
  const lines = ["'use client'", '']
  if (!doc.propsType && data.length) lines.push("import type { ComponentProps } from 'react'")
  if (link) lines.push("import Link from 'next/link'")
  const imports = doc.propsType && data.length ? `${component}, type ${doc.propsType}` : component
  lines.push(`import { ${imports} } from '@/${doc.path}'`, '')

  const names = data.map((p) => p.name)
  const params = data.length ? `{ ${names.join(', ')} }: Pick<${propsType}, ${names.map(quote).join(' | ')}>` : ''
  lines.push(`export function ${component}View(${params}) {`, '  return (', `    <${component}`)
  for (const name of names) lines.push(`      ${name}={${name}}`)
  if (copyEntry) lines.push(`      copy={{ ${copyEntry[0]}: ${quote(copyEntry[1])} }}`)
  if (link) lines.push('      linkComponent={Link}')
  for (const cb of callbacks) {
    const args = callbackParams(cb.type)
    const signature = `(${args.join(', ')})`
    const isAsync = /Promise/.test(cb.type)
    lines.push(`      ${cb.name}={${isAsync ? 'async ' : ''}${signature} => {`, `        // ${isAsync ? 'await your API here; the block shows progress until it settles' : 'your code'}`, '      }}')
  }
  lines.push('    />', '  )', '}')
  return lines.join('\n')
}

/**
 * A frame part's usage: the frame it lives in. A sidebar's pages, current
 * page and links come in through AppFrame, so the snippet is an app's shell
 * routed by Next.js: the nav from the app, the current page from the path,
 * the router's Link, and the sidebar with its own data, one `copy` string and
 * its actions stubbed, as a block's usage shows them.
 */
export function frameUsage(doc: BlockDoc): string {
  const data = doc.props.filter(isData).slice(0, 3)
  const callbacks = doc.props.filter((p) => /^on[A-Z]/.test(p.name)).slice(0, 2)
  const copyEntry = Object.entries(doc.copy ?? {}).find(([, value]) => value)
  const { component } = doc
  const propsType = doc.propsType ?? `ComponentProps<typeof ${component}>`
  const lines = ["'use client'", '', "import Link from 'next/link'", "import { usePathname, useRouter } from 'next/navigation'"]
  lines.push(!doc.propsType && data.length ? "import type { ComponentProps, ReactNode } from 'react'" : "import type { ReactNode } from 'react'")
  lines.push("import { AppFrame, navPages, type FrameNavSection } from '@/blocks/frame/shell'")
  lines.push(`import { ${doc.propsType && data.length ? `${component}, type ${doc.propsType}` : component} } from '@/${doc.path}'`, '')

  const names = data.map((p) => p.name)
  const params = ['nav', ...names, 'children'].join(', ')
  const sidebar = [`<${component}`]
  for (const name of names) sidebar.push(`          ${name}={${name}}`)
  if (copyEntry) sidebar.push(`          copy={{ ${copyEntry[0]}: ${quote(copyEntry[1])} }}`)
  for (const cb of callbacks) {
    const isAsync = /Promise/.test(cb.type)
    sidebar.push(`          ${cb.name}={${isAsync ? 'async ' : ''}(${callbackParams(cb.type).join(', ')}) => {`, `            // ${isAsync ? 'await your API here' : 'your code'}`, '          }}')
  }
  const element = sidebar.length > 1 ? [`      sidebar={`, `        ${sidebar[0]}`, ...sidebar.slice(1), '        />', '      }'] : [`      sidebar={<${component} />}`]

  lines.push(
    'interface AppShellProps {',
    '  nav: FrameNavSection[]',
    ...names.map((name) => `  ${name}: ${propsType}[${quote(name)}]`),
    '  children: ReactNode',
    '}',
    '',
    `export function AppShell({ ${params} }: AppShellProps) {`,
    '  const pathname = usePathname()',
    '  const router = useRouter()',
    '  return (',
    '    <AppFrame',
    '      nav={nav}',
    '      active={navPages(nav).find((page) => page.item.href === pathname)?.item.id}',
    '      linkComponent={Link}',
    "      // Links route clicks; route the palette's and the search's picks here.",
    '      onNavigate={(item, event) => !event && item.href && router.push(item.href)}',
    ...element,
    '    >',
    '      {children}',
    '    </AppFrame>',
    '  )',
    '}',
  )
  return lines.join('\n')
}
