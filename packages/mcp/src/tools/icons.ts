import type { AnyIcon, Catalog, Pair } from '../catalog'
import { code, NotFound, propsTable } from '../format'
import { stem, words } from '../search'
import { CONCEPTS } from '../thesaurus'
import type { Icon } from '../types'

/* The icon tools: search by meaning with the explorer's own search, details
 * and triggers, and the morph finder, which prefers a state icon (one icon
 * choreographed between two meanings) over an IconSwap between two icons. */

export const ICONS_PACKAGE = '@youj/icons'

export type IconType = 'all' | 'static' | 'morph' | 'swap'

const label = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

function importLine(icons: AnyIcon[], extra: string[] = []): string {
  const own = [...new Set([...icons.filter((i) => i.source === 'youj').map((i) => i.component), ...extra])].sort()
  const lucide = [...new Set(icons.filter((i) => i.source === 'lucide').map((i) => i.component))].sort()
  const needsWrapper = icons.some((i) => i.source === 'lucide') && !extra.includes('IconSwap')
  const youjNames = needsWrapper ? [...new Set([...own, 'YoujIcon'])].sort() : own
  return [...(lucide.length ? [`import { ${lucide.join(', ')} } from 'lucide-react'`] : []), ...(youjNames.length ? [`import { ${youjNames.join(', ')} } from '${ICONS_PACKAGE}'`] : [])].join('\n')
}

/** A lucide icon's likely effect, from what it depicts. */
function effectFor(name: string): string {
  const rules: [RegExp, string][] = [
    [/^(arrow|chevron|move|corner|send|external)/, 'nudge'],
    [/(refresh|rotate|loader|settings|cog|sync|repeat)/, 'spin'],
    [/^bell/, 'ring'],
    [/^heart/, 'heartbeat'],
    [/(alert|x-circle|octagon|ban|triangle-alert)/, 'shake'],
    [/(check|pen|pencil|signature)/, 'draw'],
    [/(rocket|plane|feather|balloon|cloud)/, 'float'],
    [/(trash|bin)/, 'wiggle'],
    [/(star|sparkle|zap|award|trophy)/, 'pop'],
    [/(coin|badge|medal)/, 'flip'],
    [/(globe|orbit|atom)/, 'orbit'],
  ]
  return rules.find(([re]) => re.test(name))?.[1] ?? 'pop'
}

function usage(icon: AnyIcon): string {
  if (icon.source === 'lucide') return `<YoujIcon icon={${icon.component}} effect="${effectFor(icon.name)}" />`
  if (icon.states) return `<${icon.component} active={active} />`
  return icon.defaultTrigger === 'hover' ? `<${icon.component} />` : `<${icon.component} /> {/* trigger="${icon.defaultTrigger}" by default */}`
}

function iconLine(icon: AnyIcon): string {
  if (icon.source === 'lucide') return `- **${icon.component}** (lucide \`${icon.name}\`): ${usage(icon)}`
  const morph = icon.states ? `, morphs ${icon.states[0]} → ${icon.states[1]}` : ''
  return `- **${icon.component}** (\`${icon.name}\`, ${icon.category}${morph}): ${usage(icon)}`
}

function pairLine(pair: Pair): string {
  return `- ${pair.from.name} → ${pair.to.name}${pair.from.source === 'lucide' ? ' (lucide)' : ''}: <IconSwap from={${pair.from.component}} to={${pair.to.component}} active={on} transition="${transitionFor(pair.from, pair.to).id}" />`
}

export function searchIcons(catalog: Catalog, query: string, options: { type?: IconType; category?: string; source?: 'all' | 'youj' | 'lucide'; limit?: number } = {}): string {
  const { type = 'all', category, source = 'all', limit = 12 } = options
  if (type === 'swap') {
    const pairs = catalog.searchPairs(query).filter((p) => source === 'all' || p.from.source === source).filter((p) => !category || (p.from.source === 'youj' && p.from.category === category))
    if (!pairs.length) return `No swap pairs match "${query}". suggest_icon_morph pairs any two meanings.`
    const shown = pairs.slice(0, limit)
    return [`${pairs.length} swap pair${pairs.length === 1 ? '' : 's'} for "${query}"${pairs.length > limit ? ` (first ${limit})` : ''}:`, '', ...shown.map(pairLine), '', code('tsx', importLine(shown.flatMap((p) => [p.from, p.to]), ['IconSwap']))].join('\n')
  }
  const found = catalog
    .searchIcons(query)
    .filter((i) => source === 'all' || i.source === source)
    .filter((i) => !category || (i.source === 'youj' && i.category === category))
    .filter((i) => (type === 'morph' ? i.source === 'youj' && !!i.states : type === 'static' ? !(i.source === 'youj' && i.states) : true))
  if (!found.length) {
    const cats = [...new Set(catalog.index.icons.map((i) => i.category))].join(', ')
    return `No icons match "${query}"${category ? ` in ${category}` : ''}. Try a synonym or a shorter word.${category ? ` Categories: ${cats}.` : ''}`
  }
  // Youj icons animate natively; lucide ones fill in after them.
  const youj = found.filter((i) => i.source === 'youj')
  const lucide = found.filter((i) => i.source === 'lucide')
  const shown = [...youj, ...lucide].slice(0, limit)
  const out = [`${youj.length} Youj${lucide.length ? ` and ${lucide.length} lucide` : ''} icon${found.length === 1 ? '' : 's'} match "${query}":`, '', ...shown.map(iconLine), '', code('tsx', importLine(shown))]
  if (shown.some((i) => i.source === 'youj' && i.states)) out.push('', 'State icons morph between their two states with `active`; get_icon shows the accessible button pattern.')
  if (shown.some((i) => i.source === 'lucide')) out.push('', 'Lucide icons need the optional lucide-react dependency and animate through YoujIcon; get_icon lists the effects.')
  return out.join('\n')
}

/* ── get_icon ── */

function reducedNote(catalog: Catalog): string {
  const page = catalog.doc('icons')?.markdown ?? ''
  return /## Reduced motion\n\n([^\n]+)/.exec(page)?.[1] ?? 'Icons hold their resting pose under reduced motion; a controlled `active` still switches the state.'
}

const TRIGGERS = [
  '`hover` (default): plays while the icon, or its closest button, link, tab, menu item or `data-yj-trigger` ancestor, is hovered or keyboard-focused.',
  '`mount`: plays once as it appears.',
  '`loop`: repeats while on screen (paused offscreen and in hidden tabs).',
  '`none`: holds the resting pose.',
  '`active` (controlled) wins over every trigger: `true` holds the active pose, `false` rest.',
]

/** How the button around a state icon should speak: a disclosure, an action that flips, or a pressed toggle. */
function statePattern(icon: Icon): { kind: 'disclosure' | 'flip' | 'toggle'; snippet: string } {
  const [a, b] = icon.states!
  if (/^(collapsed|expanded|open|closed|menu|more)$/.test(a) || ['menu', 'sidebar', 'panel-right', 'panel-bottom', 'more-horizontal', 'more-vertical'].includes(icon.name)) {
    return {
      kind: 'disclosure',
      snippet: `const [open, setOpen] = useState(false)\n\n<button type="button" aria-expanded={open} aria-label="${label(icon.name.replace(/-/g, ' '))}" onClick={() => setOpen(!open)}>\n  <${icon.component} active={${/^(open|expanded)$/.test(a) ? '!open' : 'open'}} />\n</button>`,
    }
  }
  if (/^(play|record|send|share|log in|zoom in|maximize|undo|call|visible|show|hidden|minus|plus|add|download|upload|repeat)$/.test(a)) {
    return {
      kind: 'flip',
      snippet: `const ${camel(a)} = useIconState({ labels: ['${label(a)}', '${label(b)}'] })\n\n<button {...${camel(a)}.buttonProps}>\n  <${icon.component} {...${camel(a)}.iconProps} />\n</button>`,
    }
  }
  const name = label(icon.name.replace(/-/g, ' '))
  return {
    kind: 'toggle',
    snippet: `const ${camel(icon.name)} = useIconState({ label: '${name}' })\n\n<button {...${camel(icon.name)}.buttonProps}>\n  <${icon.component} {...${camel(icon.name)}.iconProps} />\n</button>`,
  }
}

function stateCode(icon: Icon, pattern: ReturnType<typeof statePattern>): string {
  const imports = pattern.kind === 'disclosure' ? `import { useState } from 'react'\nimport { ${icon.component} } from '${ICONS_PACKAGE}'` : `import { ${icon.component}, useIconState } from '${ICONS_PACKAGE}'`
  return `${imports}\n\n${pattern.snippet}`
}

const camel = (text: string) => text.replace(/[^a-z0-9]+(.)/gi, (_, c: string) => c.toUpperCase()).replace(/^./, (c) => c.toLowerCase())

export function getIcon(catalog: Catalog, name: string): string {
  const icon = catalog.icon(name)
  const swaps = catalog.pairs.filter((p) => p.from === icon || p.to === icon).slice(0, 8)
  if (icon.source === 'lucide') {
    const own = catalog.icons.find((i) => i.source === 'youj' && i.name === icon.name)
    const effects = catalog.index.effects
    return [
      `# ${icon.component} (lucide \`${icon.name}\`)`,
      '',
      `A lucide-react icon${icon.keywords.length ? ` (also: ${icon.keywords.join(', ')})` : ''}. Youj animates it with YoujIcon: the same triggers as its own icons, and one of ${effects.length} effects.${own ? ` Youj also has its own \`${own.name}\` (${(own as Icon).component}), choreographed for it: prefer that.` : ''}`,
      '',
      code('tsx', `import { ${icon.component} } from 'lucide-react'\nimport { YoujIcon } from '${ICONS_PACKAGE}'\n\n<button type="button">\n  <YoujIcon icon={${icon.component}} effect="${effectFor(icon.name)}" size={16} />\n  Label\n</button>`),
      '',
      '## Effects',
      '',
      ...effects.map((e) => `- \`${e.id}\`: ${e.note}`),
      '',
      '## Triggers',
      '',
      ...TRIGGERS.map((t) => `- ${t}`),
      '',
      `\`intensity\` (subtle, default, strong) scales the effect; \`direction\` steers directional ones and follows RTL. Install: \`npm install ${ICONS_PACKAGE} lucide-react\`, or \`npx @youj/cli add youj-icon\` plus \`npm install lucide-react\`.`,
      ...(swaps.length ? ['', `Swaps well with: ${swaps.map((p) => (p.from === icon ? p.to.name : p.from.name)).join(', ')} (IconSwap).`] : []),
      '',
      `Reduced motion: ${reducedNote(catalog)}`,
    ].join('\n')
  }

  const out = [`# ${icon.component} (\`${icon.name}\`)`, '', `Youj icon · ${icon.category} · keywords: ${icon.keywords.join(', ')}`, '', `**Choreography:** ${icon.description}`]
  if (icon.states) {
    const pattern = statePattern(icon)
    out.push(
      '',
      '## States',
      '',
      `A state icon: \`active={false}\` shows **${icon.states[0]}**, \`active={true}\` shows **${icon.states[1]}**, and it morphs between them, reversing from wherever it is when toggled mid-morph. Drive it from your state; the button around it carries the meaning.`,
      '',
      code('tsx', stateCode(icon, pattern)),
      '',
      pattern.kind === 'disclosure'
        ? 'A disclosure: `aria-expanded` carries the state.'
        : pattern.kind === 'flip'
          ? 'An action that flips: the button\'s name says what it will do next (useIconState `labels`), with no `aria-pressed`.'
          : 'A pressed toggle: one name, and `aria-pressed` reports the state (useIconState `label`).',
    )
  } else {
    out.push('', '## Usage', '', code('tsx', `import { ${icon.component} } from '${ICONS_PACKAGE}'\n\n<button type="button">\n  <${icon.component} size={16} />\n  Label\n</button>`), '', icon.defaultTrigger === 'hover' ? 'It plays when the button is hovered or keyboard-focused, with no wiring. Decorative by default (`aria-hidden`); pass `aria-label` when it stands alone.' : `Its default trigger is \`${icon.defaultTrigger}\`.`)
  }
  out.push('', '## Triggers', '', ...TRIGGERS.map((t) => `- ${t}`))
  const props = catalog.index.props.IconProps
  if (props) out.push('', '## Props', '', propsTable(props))
  out.push('', `Install: \`npm install ${ICONS_PACKAGE}\`, or copy the source: \`npx @youj/cli add icon-${icon.name}\`.`)
  if (swaps.length) out.push('', `IconSwap pairs: ${swaps.map((p) => `${p.from.name} → ${p.to.name}`).join(', ')}.`)
  out.push('', `Reduced motion: ${reducedNote(catalog)}`)
  return out.join('\n')
}

/* ── suggest_icon_morph ── */

const concept = new Map<string, Set<string>>()
for (const group of CONCEPTS) {
  const stems = group.map(stem)
  for (const w of stems) {
    const set = concept.get(w) ?? new Set<string>()
    stems.forEach((o) => set.add(o))
    concept.set(w, set)
  }
}

const DONE = new Set(['done', 'complet', 'finish', 'success'].map(stem))

/** How well a meaning ("pause", "muted") names a state label: 3 exact, 2 related, 0 none. */
function meaningScore(meaning: string[], labelText: string): number {
  const target = words(labelText)
  if (!meaning.length || !target.length) return 0
  if (meaning.join(' ') === target.join(' ')) return 3
  if (meaning.every((w) => target.includes(w))) return 2.6
  if (meaning.some((w) => target.includes(w))) return 2
  if (meaning.some((w) => target.some((t) => concept.get(w)?.has(t)))) return 1.4
  // "done", "complete": any finished state (downloaded, sent, merged).
  if (meaning.some((w) => DONE.has(w)) && /ed$/.test(labelText)) return 1.4
  return 0
}

/** Parses "play → pause", "play -> pause", "menu to close", "copy/check". */
export function parsePair(text: string): [string, string] | null {
  const m = /^\s*(?:from\s+)?(.+?)\s*(?:→|->|=>|⇒|↔|<->|\bto\b|\/|,|\bvs\.?\b|\|)\s*(.+?)\s*$/i.exec(text)
  return m ? [m[1]!, m[2]!] : null
}

interface Transition {
  id: string
  why: string
}

/** The IconSwap transition that fits two icons. */
export function transitionFor(from: AnyIcon, to: AnyIcon): Transition {
  const a = from.name
  const b = to.name
  const success = /^(check|check-circle|circle-check|badge-check|check-check|thumbs-up|party-popper|sparkles)/.test(b)
  if (success) return { id: 'pop', why: 'the second icon is a success: pop overshoots once and settles, the one bounce Youj keeps for success.' }
  if (/-off$/.test(b) || /-off$/.test(a) || b === `${a}-x`) return { id: 'morph', why: 'an off state: the true morph carves the slash out of the original strokes.' }
  if ((/sun/.test(a) && /moon/.test(b)) || (/moon/.test(a) && /sun/.test(b))) return { id: 'rotate', why: 'a theme flip reads as one continuous turn.' }
  if (/(^|-)(up|down)(-|$)/.test(a) && /(^|-)(up|down)(-|$)/.test(b)) return { id: 'rotate', why: 'opposite directions: a quarter turn keeps the arrow one object.' }
  if (/(upload|download)/.test(a) && /(upload|download)/.test(b)) return { id: 'slide', why: 'a transfer: one strip pushes the old icon out along the direction of travel.' }
  const shared = a.split('-')[0] === b.split('-')[0]
  if (shared) return { id: 'morph', why: 'the icons share strokes, so a true morph keeps them and bends the rest into place.' }
  return { id: 'morph', why: 'a true path morph between any two icons, the signature transition; `scale-blur` is the quieter default.' }
}

const STATE_MATCH = 2.8

export function suggestIconMorph(catalog: Catalog, input: { pair?: string; from?: string; to?: string }): string {
  const parsed = input.from && input.to ? ([input.from, input.to] as [string, string]) : input.pair ? parsePair(input.pair) : null
  if (!parsed) throw new NotFound('Give two meanings or icons: `pair: "play → pause"`, or `from` and `to`.')
  const [fromText, toText] = parsed
  const A = words(fromText)
  const B = words(toText)

  // 1. A state icon choreographed for exactly these two meanings.
  const states: { icon: Icon; score: number; reversed: boolean }[] = []
  for (const icon of catalog.index.icons) {
    if (!icon.states) continue
    const [s0, s1] = icon.states
    // The icon named for a meaning is strong evidence: "heart → liked" is the heart.
    const nameHit = (m: string[]) => (m.join('-') === words(icon.name).join('-') ? 2 : m.some((w) => words(icon.name).includes(w)) ? 0.8 : 0)
    const forward = meaningScore(A, s0) + meaningScore(B, s1)
    const backward = meaningScore(A, s1) + meaningScore(B, s0)
    const fwdOk = meaningScore(A, s0) + nameHit(A) > 0 && meaningScore(B, s1) > 0
    const bwdOk = meaningScore(A, s1) > 0 && meaningScore(B, s0) + nameHit(B) > 0
    if (fwdOk && forward >= backward) states.push({ icon, score: forward + nameHit(A) + nameHit(B), reversed: false })
    else if (bwdOk) states.push({ icon, score: backward + nameHit(A) + nameHit(B) - 0.5, reversed: true })
  }
  states.sort((x, y) => y.score - x.score)
  const best = states[0]

  // 2. Two icons for IconSwap, each the best match for its meaning.
  // Youj icons first (they animate natively), then a couple of lucide ones.
  // An icon named for the meaning, or listing it as a keyword, beats one that only starts with it ("close" is X, not eye-closed).
  const side = (text: string) => {
    const q = text.trim().toLowerCase().replace(/\s+/g, '-')
    const found = catalog.searchIcons(text)
    const pool = [...found.filter((i) => i.source === 'youj').slice(0, 12), ...found.filter((i) => i.source === 'lucide').slice(0, 3)]
    const rank = (icon: AnyIcon) => pool.filter((i) => i.source === icon.source).indexOf(icon)
    return pool
      .map((icon) => ({ icon, fit: (icon.name === q ? 3 : 0) + (icon.keywords[0] === q ? 3 : icon.keywords.includes(q) ? 2 : 0) + (icon.source === 'youj' ? 1.5 : 0) - rank(icon) * 0.15 - (icon.name.split('-').length - 1) * 0.4 }))
      .sort((a, b) => b.fit - a.fit)
  }
  const fromIcons = side(fromText)
  const toIcons = side(toText)
  const known = new Set(catalog.pairs.map((p) => `${p.from.source}:${p.from.name}|${p.to.source}:${p.to.name}`))
  let swap: { from: AnyIcon; to: AnyIcon; score: number } | undefined
  fromIcons.forEach(({ icon: f, fit: fi }) =>
    toIcons.forEach(({ icon: t, fit: tj }) => {
      if (f === t) return
      let score = fi + tj
      if (f.source === t.source) score += 0.5
      if (known.has(`${f.source}:${f.name}|${t.source}:${t.name}`)) score += 3
      if (!swap || score > swap.score) swap = { from: f, to: t, score }
    }),
  )

  const out: string[] = []
  // Both meanings name the two states, exactly or by a shared concept (sun ≈ light, moon ≈ dark).
  if (best && best.score >= STATE_MATCH) {
    const { icon, reversed } = best
    const pattern = statePattern(icon)
    out.push(
      `# ${fromText} → ${toText}: ${icon.component}`,
      '',
      `Best: a **state icon**. \`${icon.component}\` morphs **${icon.states![0]}** ↔ **${icon.states![1]}** with its own choreography: ${icon.description}`,
      '',
      `\`active={false}\` shows ${icon.states![0]}, \`active={true}\` shows ${icon.states![1]}${reversed ? ` (so "${fromText}" is \`active={true}\` here)` : ''}. Toggling mid-morph reverses from where it is.`,
      '',
      code('tsx', stateCode(icon, pattern)),
    )
    if (swap) out.push('', `Alternative, two separate icons: \`<IconSwap from={${swap.from.component}} to={${swap.to.component}} active={on} transition="${transitionFor(swap.from, swap.to).id}" />\`. Prefer the state icon: its morph is choreographed for this pair.`)
    const others = states.slice(1, 4).filter((s) => s.score >= STATE_MATCH)
    if (others.length) out.push('', `Other state icons that fit: ${others.map((s) => `${s.icon.component} (${s.icon.states!.join(' ↔ ')})`).join(', ')}.`)
  } else if (swap) {
    const t = transitionFor(swap.from, swap.to)
    const imports = importLine([swap.from, swap.to], ['IconSwap'])
    out.push(
      `# ${fromText} → ${toText}: IconSwap`,
      '',
      `No state icon covers this pair, so swap two icons: **${swap.from.component}** (${swap.from.source} \`${swap.from.name}\`) → **${swap.to.component}** (${swap.to.source} \`${swap.to.name}\`), transition \`${t.id}\`: ${t.why}`,
      '',
      code('tsx', `import { useState } from 'react'\n${imports}\n\nconst [on, setOn] = useState(false)\n\n<button type="button" aria-pressed={on} aria-label="…" onClick={() => setOn(!on)}>\n  <IconSwap from={${swap.from.component}} to={${swap.to.component}} active={on} transition="${t.id}" />\n</button>`),
      '',
      '`active={false}` shows `from`, `true` shows `to`; pass the components, not elements. Toggling mid-swap reverses from where it is. Without a labelled button around it, give it `labels={[…, …]}` so it reads as an image named for its state.',
      '',
      `Other transitions: ${catalog.index.transitions.filter((x) => x.id !== t.id).map((x) => x.id).join(', ')}. Scrub any pair in the Morph Lab: ${catalog.index.meta.site}/icons?view=lab`,
    )
    const named = (list: { icon: AnyIcon }[], chosen: AnyIcon) => list.slice(0, 4).filter(({ icon }) => icon !== chosen).map(({ icon }) => `${icon.name}${icon.source === 'lucide' ? ' (lucide)' : ''}`)
    const alts = [...named(fromIcons, swap.from).map((n) => `from ${n}`), ...named(toIcons, swap.to).map((n) => `to ${n}`)]
    if (alts.length) out.push('', `Other candidates: ${alts.join(', ')}.`)
  } else {
    throw new NotFound(`No icons match "${fromText}" or "${toText}". Try search_icons with other words.`)
  }
  out.push('', 'Reduced motion: the icon switches straight to the new state, with no morph; the meaning stays.')
  return out.join('\n')
}
