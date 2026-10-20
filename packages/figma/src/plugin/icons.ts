import type { IconPart, KitIcon } from '../kit'
import { solid } from './draw'
import { clearChildren, keyOf, tag } from './store'

/* Icons as components. Each part arrives as absolute path data in the
 * 24-unit box; Figma parses it (createNodeFromSvg, one path at a time) and
 * the plugin assembles the rest: ink strokes and fills bound to a Color
 * variable, luminance masks for knock-outs and alpha masks for clips, and
 * scale constraints so a resized instance keeps its drawing. State icons
 * become a component set with State=<rest label> and State=<active label>. */

export const ICON_INK = 'role/fg'

function literal(p: 'white' | 'black'): SolidPaint {
  const v = p === 'white' ? 1 : 0
  return { type: 'SOLID', color: { r: v, g: v, b: v } }
}

const paintFor = (p: 'ink' | 'white' | 'black') => (p === 'ink' ? solid(ICON_INK) : literal(p))

function drawPath(parent: BaseNode & ChildrenMixin, part: Extract<IconPart, { kind: 'path' }>): SceneNode {
  const stroke = part.stroke ? ` stroke="#000000" stroke-width="${part.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"` : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="${part.d}" fill="${part.fill ? '#000000' : 'none'}"${stroke}/></svg>`
  const frame = figma.createNodeFromSvg(svg)
  const node = frame.children[0] as VectorNode
  parent.appendChild(node)
  frame.remove()
  node.name = part.stroke ? 'Stroke' : 'Fill'
  node.fills = part.fill ? [paintFor(part.fill)] : []
  node.strokes = part.stroke ? [paintFor(part.stroke)] : []
  if (part.stroke) {
    node.strokeWeight = part.strokeWidth
    node.strokeCap = 'ROUND'
    node.strokeJoin = 'ROUND'
    node.strokeAlign = 'CENTER'
  }
  if (part.dash) node.dashPattern = part.dash
  if (part.opacity !== 1) node.opacity = part.opacity
  node.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }
  return node
}

/** Draws parts into a parent, bottom to top; returns the top-level nodes made. */
export function drawParts(parent: BaseNode & ChildrenMixin, parts: IconPart[]): SceneNode[] {
  const made: SceneNode[] = []
  for (const part of parts) {
    if (part.kind === 'path') {
      made.push(drawPath(parent, part))
      continue
    }
    const maskNodes = drawParts(parent, part.mask)
    const mask = maskNodes.length === 1 ? maskNodes[0]! : figma.group(maskNodes, parent)
    mask.name = part.type === 'LUMINANCE' ? 'Knockout' : 'Clip'
    ;(mask as GroupNode).isMask = true
    ;(mask as GroupNode).maskType = part.type
    const content = drawParts(parent, part.content)
    const group = figma.group([mask, ...content], parent)
    group.name = part.type === 'LUMINANCE' ? 'Masked' : 'Clipped'
    made.push(group)
  }
  return made
}

const DOCS = 'Static rest pose. The motion lives in code:'

function describe(icon: KitIcon, state?: string): string {
  const lines = [
    `${icon.component}${state ? ` (${state})` : ''} · ${icon.keywords.join(', ')}`,
    `import { ${icon.component} } from '@youj/icons'`,
    icon.states ? `${DOCS} <${icon.component} active={…} /> morphs ${icon.states[0]} ↔ ${icon.states[1]}.` : `${DOCS} it plays on hover, focus or a trigger.`,
  ]
  return lines.join('\n')
}

function paint(component: ComponentNode, parts: IconPart[]) {
  clearChildren(component)
  component.layoutMode = 'NONE'
  component.resize(24, 24)
  component.fills = []
  component.clipsContent = false
  drawParts(component, parts)
}

export interface IconBuild {
  /** The node to place: a component, or a component set for state icons. */
  node: ComponentNode | ComponentSetNode
  /** The component an instance should use (the rest state for sets). */
  rest: ComponentNode
}

/**
 * Builds or updates one icon inside `parent`. `existing` is the icon's node
 * from an earlier run, updated in place so instances keep pointing at it.
 */
export function buildIcon(icon: KitIcon, parent: BaseNode & ChildrenMixin, existing?: ComponentNode | ComponentSetNode): IconBuild {
  const key = `icon:${icon.name}`
  const name = `Icon/${icon.category}/${icon.name}`
  const states = icon.states && icon.active ? icon.states : null

  if (existing && (existing.type === 'COMPONENT_SET') !== Boolean(states)) {
    existing.remove()
    existing = undefined
  }

  if (!states) {
    const c = (existing as ComponentNode | undefined) ?? figma.createComponent()
    parent.appendChild(c)
    tag(c, key)
    c.name = name
    paint(c, icon.rest)
    c.description = describe(icon)
    return { node: c, rest: c }
  }

  const variants: [string, IconPart[], string][] = [
    [`${key}:rest`, icon.rest, states[0]],
    [`${key}:active`, icon.active!, states[1]],
  ]
  const set = existing as ComponentSetNode | undefined
  const made = variants.map(([vkey, parts, label]) => {
    const old = set?.children.find((c) => keyOf(c) === vkey) as ComponentNode | undefined
    const c = old ?? figma.createComponent()
    tag(c, vkey)
    c.name = `State=${label}`
    paint(c, parts)
    c.description = describe(icon, label)
    return c
  })
  let node: ComponentSetNode
  if (set) {
    for (const c of made) if (c.parent !== set) set.appendChild(c)
    for (const c of set.children) if (!made.includes(c as ComponentNode)) c.remove()
    parent.appendChild(set)
    node = set
  } else {
    for (const c of made) parent.appendChild(c)
    node = figma.combineAsVariants(made, parent)
  }
  tag(node, key)
  node.name = name
  node.description = describe(icon)
  node.layoutMode = 'HORIZONTAL'
  node.itemSpacing = 12
  node.paddingTop = node.paddingBottom = node.paddingLeft = node.paddingRight = 8
  node.layoutSizingHorizontal = 'HUG'
  node.layoutSizingVertical = 'HUG'
  node.fills = []
  return { node, rest: made[0]! }
}
