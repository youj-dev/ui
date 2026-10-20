import { clearChildren, keyOf, tag } from '../store'

/* A component set built from a spec, updated in place on every run. Variants
 * are found by key and redrawn inside the same node, so instances in your
 * designs stay linked; text and swaps go through component properties, whose
 * values on instances survive a rebuild. Variants are laid out on a grid:
 * one column per value of `columns`, one row per combination of the rest. */

export type Props = Record<string, string>

export interface VariantSpec {
  props: Props
  build(component: ComponentNode): Promise<void>
}

export interface PropertySpec {
  name: string
  type: 'TEXT' | 'BOOLEAN' | 'INSTANCE_SWAP'
  default: string | boolean
  /** Instance swap: components offered first. */
  preferred?: InstanceSwapPreferredValue[]
  /** Which sublayers it drives: layers tagged with ref(name). */
  field: 'characters' | 'visible' | 'mainComponent'
}

export interface SetSpec {
  key: string
  name: string
  description: string
  variants: VariantSpec[]
  properties: PropertySpec[]
  /** The variant property laid out across columns. */
  columns: string
  gap?: [number, number]
}

const REF = 'youj:ref'

/** Marks a sublayer as driven by component properties (applied once the set has its properties). */
export function ref<T extends SceneNode>(node: T, ...properties: string[]): T {
  node.setPluginData(REF, properties.join(','))
  return node
}

const variantName = (props: Props) =>
  Object.entries(props)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ')
const variantKey = (setKey: string, props: Props) =>
  `${setKey}:${Object.entries(props)
    .map(([k, v]) => `${k}=${v}`.toLowerCase())
    .join(',')}`

function findProperty(set: ComponentSetNode, name: string): string | undefined {
  return Object.keys(set.componentPropertyDefinitions).find((k) => k.split('#')[0] === name && set.componentPropertyDefinitions[k]!.type !== 'VARIANT')
}

function defineProperty(set: ComponentSetNode, p: PropertySpec): string {
  const existing = findProperty(set, p.name)
  const defaultValue = p.default
  if (existing && set.componentPropertyDefinitions[existing]!.type === p.type) {
    return set.editComponentProperty(existing, { defaultValue, ...(p.preferred ? { preferredValues: p.preferred } : {}) })
  }
  if (existing) set.deleteComponentProperty(existing)
  return set.addComponentProperty(p.name, p.type, defaultValue, p.preferred ? { preferredValues: p.preferred } : undefined)
}

/** Where the variants landed: for labelling the grid from outside the set. */
export interface Grid {
  columns: { label: string; x: number; w: number }[]
  rows: { label: string; y: number; h: number }[]
  /** The properties the rows vary, e.g. "Variant · State". */
  rowHeader: string
  width: number
  height: number
}

/** `minColumn` widens a column to fit its label (keyed by column value); the variants are centred in the extra room. */
export async function buildSet(
  parent: BaseNode & ChildrenMixin,
  spec: SetSpec,
  existing?: ComponentSetNode,
  minColumn: Record<string, number> = {},
): Promise<{ set: ComponentSetNode; grid: Grid }> {
  const made: ComponentNode[] = []
  for (const v of spec.variants) {
    const key = variantKey(spec.key, v.props)
    let c = existing?.children.find((n) => keyOf(n) === key) as ComponentNode | undefined
    if (c) clearChildren(c)
    else {
      c = figma.createComponent()
      tag(c, key)
    }
    c.name = variantName(v.props)
    await v.build(c)
    made.push(c)
  }

  let set: ComponentSetNode
  if (existing) {
    for (const c of made) if (c.parent !== existing) existing.appendChild(c)
    for (const c of [...existing.children]) if (!made.includes(c as ComponentNode)) c.remove()
    parent.appendChild(existing)
    set = existing
  } else {
    for (const c of made) parent.appendChild(c)
    set = figma.combineAsVariants(made, parent)
    tag(set, spec.key)
  }
  set.name = spec.name
  set.description = spec.description

  // Properties on the set, then every tagged sublayer bound to them. One the spec no longer has (a style's own, say) goes.
  for (const [k, def] of Object.entries(set.componentPropertyDefinitions))
    if (def.type !== 'VARIANT' && !spec.properties.some((p) => p.name === k.split('#')[0])) set.deleteComponentProperty(k)
  const ids = new Map(spec.properties.map((p) => [p.name, defineProperty(set, p)]))
  // Only the variant's own layers: a nested instance's layers belong to its own component.
  const own = (n: SceneNode, root: ComponentNode) => {
    for (let p = n.parent; p && p !== root; p = p.parent) if (p.type === 'INSTANCE') return false
    return true
  }
  for (const c of made) {
    for (const node of c.findAll((n) => n.getPluginData(REF) !== '' && own(n, c))) {
      const refs: Record<string, string> = {}
      for (const name of node.getPluginData(REF).split(',')) {
        const p = spec.properties.find((x) => x.name === name)
        if (!p) throw new Error(`${spec.name}: no property ${name}`)
        refs[p.field] = ids.get(p.name)!
      }
      node.componentPropertyReferences = refs
    }
  }
  return { set, grid: arrange(set, made, spec, minColumn) }
}

/** Lays variants out on a grid and sizes the set around them. */
function arrange(set: ComponentSetNode, variants: ComponentNode[], spec: SetSpec, minColumn: Record<string, number>): Grid {
  const [colGap, rowGap] = spec.gap ?? [24, 16]
  const pad = 24
  const colValues = [...new Set(spec.variants.map((v) => v.props[spec.columns]!))]
  const rowKey = (props: Props) =>
    Object.entries(props)
      .filter(([k]) => k !== spec.columns)
      .map(([, v]) => v)
      .join(' · ')
  const rowValues = [...new Set(spec.variants.map((v) => rowKey(v.props)))]
  const content = colValues.map((cv) => Math.max(...variants.filter((_, i) => spec.variants[i]!.props[spec.columns] === cv).map((c) => c.width)))
  const colWidth = colValues.map((cv, i) => Math.ceil(Math.max(content[i]!, minColumn[cv] ?? 0)))
  const rowHeight = rowValues.map((rv) => Math.max(...variants.filter((_, i) => rowKey(spec.variants[i]!.props) === rv).map((c) => c.height)))
  set.layoutMode = 'NONE'
  variants.forEach((c, i) => {
    const col = colValues.indexOf(spec.variants[i]!.props[spec.columns]!)
    const row = rowValues.indexOf(rowKey(spec.variants[i]!.props))
    c.x = pad + colWidth.slice(0, col).reduce((a, w) => a + w + colGap, 0) + Math.round((colWidth[col]! - content[col]!) / 2)
    // Top-aligned: Figma's default variant is the top-left-most one, which must be the first column's.
    c.y = pad + rowHeight.slice(0, row).reduce((a, h) => a + h + rowGap, 0)
  })
  const width = pad * 2 + colWidth.reduce((a, w) => a + w, 0) + colGap * (colValues.length - 1)
  const height = pad * 2 + rowHeight.reduce((a, h) => a + h, 0) + rowGap * (rowValues.length - 1)
  set.resizeWithoutConstraints(width, height)
  return {
    columns: colValues.map((v, i) => ({ label: `${spec.columns}=${v}`, x: pad + colWidth.slice(0, i).reduce((a, w) => a + w + colGap, 0), w: colWidth[i]! })),
    rows: rowValues.map((v, i) => ({ label: v, y: pad + rowHeight.slice(0, i).reduce((a, h) => a + h + rowGap, 0), h: rowHeight[i]! })),
    rowHeader: Object.keys(spec.variants[0]!.props)
      .filter((k) => k !== spec.columns)
      .join(' · '),
    width,
    height,
  }
}

/** An instance of a set's variant, by its properties. */
export function instanceOf(set: ComponentSetNode, props: Props): InstanceNode {
  const match = set.children.find((c) => {
    const vp = (c as ComponentNode).variantProperties ?? {}
    return Object.entries(props).every(([k, v]) => vp[k] === v)
  }) as ComponentNode | undefined
  if (!match) throw new Error(`${set.name} has no variant ${variantName(props)}`)
  return match.createInstance()
}
