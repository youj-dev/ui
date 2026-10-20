import type { ComponentType, Ref } from 'react'
import type { AnyMiniatureHandle, MiniatureId, MiniatureKeyHint, MiniatureMeta, MiniatureProgressProps } from '@youj/miniatures'
import thumbs from './thumbs.json'

/* The miniatures page's catalogue: each miniature's entry as a chunk of its own (`load`, through ./stage-loaders), its
 * thumbnails (./thumbs.json, written by `pnpm -F docs miniatures:thumbs`) and its key hints as the buttons the placard
 * draws. The metadata is the package's: the page's server reads the catalogue (`miniatures` from '@youj/miniatures')
 * and hands the client what it shows up front (`ShowroomMiniature`, the search's words included). */

/** A miniature as the page's client knows it before its entry arrives (the maker and description for the search). */
export type ShowroomMiniature = Pick<MiniatureMeta, 'id' | 'name' | 'model' | 'maker' | 'study' | 'spec' | 'description' | 'keys' | 'initial' | 'progress'>

/** The props the stage passes, which every miniature takes (the progress ones only matter to a progress indicator). */
export type StageMiniature = ComponentType<MiniatureProgressProps & { ref?: Ref<AnyMiniatureHandle> }>

/** What the stage needs of a miniature's entry: its component and its full metadata (the description too). */
export interface StageEntry {
  Component: StageMiniature
  meta: MiniatureMeta
}

const camel = (id: string) => baseName(id).replace(/^./, (c) => c.toLowerCase())
const loaded = new Map<string, Promise<StageEntry>>()

/** The miniature's entry, fetched once (a rejected fetch is forgotten, so the next ask tries again). */
export function load(id: string): Promise<StageEntry> {
  let pending = loaded.get(id)
  if (!pending) {
    pending = import('./stage-loaders').then(({ LOADERS }) => {
      const loader = LOADERS[id as MiniatureId]
      if (!loader) throw new Error(`No miniature named ${id}`)
      return loader().then((m) => ({ Component: m[componentName(id)] as StageMiniature, meta: m[camel(id)] as MiniatureMeta }))
    })
    pending.catch(() => loaded.delete(id))
    loaded.set(id, pending)
  }
  return pending
}

/** The miniature's thumbnails, light and dark, or none until `miniatures:thumbs` has taken them. */
export function thumbsOf(id: string): Record<'light' | 'dark', string | null> {
  const t = (thumbs as Record<string, { light?: string; dark?: string }>)[id]
  return { light: t?.light ?? null, dark: t?.dark ?? null }
}

/** The import a page writes for it: `import { MiniatureTurntable } from '@youj/miniatures/turntable'`. */
const baseName = (id: string) =>
  id
    .replace(/^3d/, 'three-d')
    .split('-')
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join('')

export const componentName = (id: string) => `Miniature${baseName(id)}`

export const importLine = (id: string) => `import { ${componentName(id)} } from '@youj/miniatures/${id}'`

/** What Copy code copies: the import, and the miniature on its paper. */
export const copySnippet = (id: string) => `${importLine(id)}\n\n<${componentName(id)} stage />`

/** The miniature on a page of its own. */
export const usageSnippet = (id: string) => `${importLine(id)}

export function Hero() {
  return <${componentName(id)} stage />
}`

/** A key as a string literal: in single quotes, a single quote escaped. */
const keyLiteral = (key: string) => `'${key.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

/** The miniature with a readout and a key of the page's own, as the docs show it: its snapshot, and its first key pressed through its handle. */
export function exhibitSnippet(meta: Pick<ShowroomMiniature, 'id' | 'keys'>) {
  const Name = componentName(meta.id)
  const data = camel(meta.id)
  const hint = meta.keys[0]
  const button = hint
    ? `\n        <button${hint.toggle ? ` aria-pressed={snapshot.pressed[${keyLiteral(hint.keys[0]!)}]}` : ''} onClick={() => ref.current?.press(${keyLiteral(hint.keys[0]!)})}>\n          ${hint.caps.join(' ')}: ${hint.label}\n        </button>`
    : ''
  return `'use client'

import { useRef, useState } from 'react'
import type { AnyMiniatureHandle, MiniatureSnapshot } from '@youj/miniatures'
import { ${Name}, ${data} } from '@youj/miniatures/${meta.id}'

export function Exhibit() {
  const ref = useRef<AnyMiniatureHandle>(null)
  const [snapshot, setSnapshot] = useState<MiniatureSnapshot>(${data}.initial)
  return (
    <figure>
      <${Name} ref={ref} onStateChange={setSnapshot} stage />
      <figcaption>
        {snapshot.readout} · {snapshot.state}${button}
      </figcaption>
    </figure>
  )
}`
}

/** One keycap: what it prints and the key it presses (null for a modifier printed to be held with the others: `⇧`). */
export interface Cap {
  label: string
  key: string | null
}

/** One cap of a hint as buttons: a key, or a range's two ends with the joiner printed between them. */
export interface CapGroup {
  caps: Cap[]
  joiner?: string
}

const MODIFIERS = new Set(['⇧', '⌥', '⌘', '⌃'])

/**
 * A hint's caps as buttons. A cap per key is a button each. A span written as its ends (`A …`, `'`) is its first and
 * last key. Otherwise the keys are shared out among the caps in order, and a cap that names several becomes a button
 * per key it spells out (`↑ ↓`), a range's two ends (`1–8`, `Q–I`), a modifier to hold (`⇧`), or its first key.
 */
export function capsOf(hint: MiniatureKeyHint): CapGroup[] {
  const { keys, caps } = hint
  const first = keys[0]!
  const last = keys[keys.length - 1]!
  if (caps.length === keys.length) return caps.map((label, i) => ({ caps: [{ label, key: keys[i]! }] }))
  const open = caps.length === 2 ? caps[0]!.match(/^(.+?)\s*([–…])$/) : null
  if (open) return [{ caps: [{ label: open[1]!, key: first }, { label: caps[1]!, key: last }], joiner: open[2] }]
  const per = Math.max(1, Math.floor(keys.length / caps.length))
  return caps.map((cap, i) => {
    const own = keys.slice(i * per, i === caps.length - 1 ? undefined : (i + 1) * per)
    const words = cap.split(/\s+/)
    if (own.length > 1 && words.length === own.length) return { caps: words.map((label, j) => ({ label, key: own[j]! })) }
    const range = cap.match(/^(.+?)\s*([–…])\s*(.+)$/)
    if (range && own.length > 1) return { caps: [{ label: range[1]!, key: own[0]! }, { label: range[3]!, key: own[own.length - 1]! }], joiner: range[2] }
    if (MODIFIERS.has(cap)) return { caps: [{ label: cap, key: null }] }
    return { caps: [{ label: cap, key: own[0] ?? first }] }
  })
}

/** The accessible name of a keycap: `Press Space, start / stop`. */
export const capLabel = (cap: Cap, hint: MiniatureKeyHint) => `Press ${cap.label}, ${hint.label}`

