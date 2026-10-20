import type { Catalog, Hit, Kind } from '../catalog'
import { cap, code, motionLines, NotFound, npmForm, propsTable, stabilityLine } from '../format'
import type { Component, ShowcaseItem } from '../types'
import { ICONS_PACKAGE } from './icons'
import { getScene } from './illustrations'
import { install } from './showcase'

const oneLine = (text: string, max = 140) => {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat
}

/** The exact way in for a component: the package import (and the command when it needs more than the package), or the CLI when it's copy-in only. */
function componentInstall(c: Component): string {
  const i = c.install
  if (i.copyOnly) return `\`${i.registryCommand}\``
  const way = i.packageImport ?? i.packageStylesheet
  return `\`${npmForm(i.packageCommand)}\`${way ? ` · \`${way}\`` : ''}`
}

const showcaseInstall = (item: ShowcaseItem) => {
  const command = install(item)
  return command ? ` · \`${command}\`` : ''
}

function hitLine(hit: Hit, i: number): string {
  const n = `${i + 1}.`
  switch (hit.kind) {
    case 'component': {
      const c = hit.item
      return `${n} **${c.title}** (${c.complexity ? `${c.complexity}: ` : ''}${c.kind === 'ui' ? 'UI' : c.kind} component \`${c.name}\`, ${c.package}, ${c.stability}): ${oneLine(c.description)} → get_component("${c.name}") · ${componentInstall(c)}`
    }
    case 'block':
      return `${n} **${hit.item.group}: ${hit.item.title}** (${hit.item.level} block \`${hit.item.slug}\`, ${hit.item.stability}): ${oneLine(hit.item.summary)} → get_block("${hit.item.slug}")${showcaseInstall(hit.item)}`
    case 'illustration': {
      const s = hit.item
      return `${n} **${s.name}** (illustration scene \`${s.id}\`, ${s.category}; tags: ${s.tags.join(', ')}): ${oneLine(s.description, 100)} → get_component("${s.registry}") · \`npx youj add ${s.registry}\``
    }
    case 'icon': {
      const i = hit.item
      const morph = i.states ? `, morphs ${i.states[0]} ↔ ${i.states[1]}` : ''
      return `${n} **${i.component}** (icon \`${i.name}\`${morph}): ${oneLine(i.description, 100)} → get_icon("${i.name}") · \`import { ${i.component} } from '${ICONS_PACKAGE}'\``
    }
    case 'miniature': {
      const m = hit.item
      return `${n} **${m.title}** (miniature \`${m.id}\`; tags: ${m.tags.join(', ')}): ${oneLine(m.description, 100)} → \`npm install @youj/miniatures\` · \`import { ${m.component} } from '@youj/miniatures/${m.id}'\``
    }
    case 'loader': {
      const a = hit.item
      return `${n} **${a.title}** (${a.categoryTitle} loader \`${a.id}\`, ${a.technique}; tags: ${a.tags.join(', ')}): ${oneLine(a.description, 100)} → \`npx youj add ${a.registry}\` · \`import { ${a.component} } from '@youj/loaders/${a.id}'\``
    }
    case 'hook':
      return `${n} **${hit.item.name}** (hook): ${oneLine(hit.item.description || hit.item.signature)} — \`${hit.item.import}\``
    case 'docs':
      return `${n} **${hit.item.title}** (docs page \`${hit.item.slug}\`): ${oneLine(hit.item.description ?? '')} → resource youj://docs/${hit.item.slug}`
  }
}

export function search(catalog: Catalog, query: string, kinds: Kind[] | undefined, limit: number): string {
  const hits = catalog.search(query, kinds, limit)
  if (!hits.length) return `Nothing in Youj matches "${query}". Try other words (what it does, not what it's called), or search_icons for icons.`
  return [`Youj results for "${query}":`, '', ...hits.map((h, i) => hitLine(h.item, i))].join('\n')
}

export type ComponentSection = 'install' | 'usage' | 'props' | 'motion' | 'a11y' | 'related'

/** The export the page is about: the one named like the title, else the first. */
function mainExport(c: Component): string | undefined {
  const pascal = c.title.replace(/[^A-Za-z0-9]/g, '')
  return c.exports.find((e) => e === pascal) ?? c.exports[0]
}

export function getComponent(catalog: Catalog, name: string, options: { part?: string; sections?: ComponentSection[] } = {}): string {
  const { sections } = options
  const scene = catalog.scene(name)
  if (scene) return getScene(catalog, scene)
  const found = catalog.component(name)
  const c = found.component
  const askedPart = options.part ?? found.part
  if (askedPart && !c.exports.includes(askedPart)) throw new NotFound(`${c.title} has no part "${askedPart}". Its parts: ${c.exports.join(', ')}.`)
  const want = (s: ComponentSection) => !sections?.length || sections.includes(s)
  const site = catalog.index.meta.site
  const out: string[] = [`# ${c.title}`, '', `${c.kind === 'ui' ? 'UI component' : c.kind === 'sound' ? 'Sound provider' : c.kind === 'core' ? 'Core' : 'Motion component'} · \`${c.package}\` · ${c.category}${c.docs ? ` · docs: ${site}/docs/${c.docs}` : ''}`, '', c.description, '', stabilityLine(c.stability, site)]

  if (!sections?.length && c.intro) out.push('', '## When to use', '', cap(c.intro, 1400))

  if (want('install')) {
    const i = c.install
    if (i.copyOnly) out.push('', '## Install', '', `Copy-in only (\`${c.package}\` doesn't export it): the Youj CLI copies it, with what it needs${i.registryDeps.length ? ` (${i.registryDeps.join(', ')})` : ''}.`, code('bash', i.registryCommand), ...(i.registryImport ? [code('tsx', i.registryImport)] : []))
    else {
      out.push('', '## Install', '', 'Package (recommended):', code('bash', npmForm(i.packageCommand)))
      if (i.packageImport) out.push(code('tsx', i.packageImport))
      else if (i.packageStylesheet) out.push('Nothing to import: it\'s CSS utilities in the package stylesheet. Add the stylesheet once to your global CSS, then use the utility classes:', code('css', i.packageStylesheet))
    }
    if (i.peerDependencies?.length) out.push(`Needs ${i.peerDependencies.map((d) => `\`${d}\``).join(', ')}: optional peers of \`${c.package}\` that the command installs. Import it from the entry above, not \`${c.package}\`.`)
    if (!i.copyOnly) out.push('', `Or copy the source into the app with the Youj CLI: \`npx youj add ${c.name}\`${i.registryDeps.length ? ` (brings ${i.registryDeps.join(', ')})` : ''}. Import from the package unless you copy in.`)
  }

  if (want('usage') && c.usage) out.push('', '## Usage', '', code('tsx', cap(c.usage, 2400)))

  if (want('props')) {
    const main = askedPart ?? mainExport(c)
    const doc = main ? catalog.index.props[main] : undefined
    if (doc) out.push('', `## Props: ${main}`, '', propsTable(doc))
    const parts = c.exports.filter((e) => e !== main)
    if (parts.length) {
      out.push('', `Parts: ${parts.map((p) => {
        const d = catalog.index.props[p]
        const own = d?.props.map((x) => x.name) ?? []
        return own.length ? `${p} (${own.slice(0, 6).join(', ')}${own.length > 6 ? ', …' : ''})` : p
      }).join('; ')}.`, `A part's props: get_component({ name: "${c.name}", part: "${parts[0]}" }).`)
    }
  }

  if (want('motion') && (c.motion?.length || c.reduced)) {
    out.push('', '## Motion')
    if (c.motion?.length) out.push('', motionLines(c.motion))
    if (c.reduced) out.push('', `Reduced motion: ${oneLine(c.reduced, 600)}`)
  }

  if (want('a11y') && c.a11y) out.push('', '## Accessibility', '', cap(c.a11y, 1600))

  if (want('related') && c.related.length) out.push('', '## Related', '', ...c.related.map((r) => `- ${r.title}${r.note ? `: ${oneLine(r.note, 100)}` : ''}`))

  return out.join('\n')
}
