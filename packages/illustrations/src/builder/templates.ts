import { sanitizeScene, type BuilderScene } from './model'

/* Starting points, written in the builder's own format (the JSON "Copy
 * JSON" gives back), each a small scene that shows what the parts do: a
 * desk with its screen lit, a shop whose awning lifts, a stack that comes
 * apart, a lounge and a workshop that use the newer shapes, and a blank
 * plinth. */

export interface Template {
  id: 'desk' | 'shop' | 'stack' | 'lounge' | 'workshop' | 'blank'
  name: string
  note: string
  scene: BuilderScene
}

const scene = (input: unknown) => sanitizeScene(input)!

export const TEMPLATES: readonly Template[] = [
  {
    id: 'desk',
    name: 'Desk',
    note: 'A desk, its screen in the accent',
    scene: scene({
      name: 'Desk',
      base: 'plinth',
      parts: [
        { id: 'p1', name: 'Left drawers', type: 'box', x: 1.5, y: 2.5, z: 0.5, w: 1, d: 2.5, h: 1.25, tone: 'raised' },
        { id: 'p2', name: 'Right drawers', type: 'box', x: 5.5, y: 2.5, z: 0.5, w: 1, d: 2.5, h: 1.25, tone: 'raised' },
        { id: 'p3', name: 'Desktop', type: 'box', x: 1.5, y: 2.5, z: 1.75, w: 5, d: 2.5, h: 0.25, tone: 'raised' },
        { id: 'p4', name: 'Screen', type: 'prism', preset: 'tab', facing: 'left', x: 2.75, y: 2.75, z: 2.5, w: 2.5, d: 0.2, h: 1.5, lit: true, lift: 0.6 },
        { id: 'p5', name: 'Stand', type: 'box', x: 3.75, y: 2.75, z: 2, w: 0.5, d: 0.2, h: 0.5, tone: 'sunken' },
        { id: 'p6', name: 'Foot', type: 'box', x: 3.5, y: 2.5, z: 2, w: 1, d: 0.75, h: 0, tone: 'sunken' },
        { id: 'p7', name: 'Keyboard', type: 'box', x: 2.5, y: 3.75, z: 2, w: 2.25, d: 0.75, h: 0.1 },
        { id: 'p8', name: 'Mug', type: 'lathe', preset: 'cup', x: 5.25, y: 3.5, z: 2, r: 0.4, h: 0.6, float: 0.12, lift: 0.3 },
      ],
    }),
  },
  {
    id: 'shop',
    name: 'Shop',
    note: 'A shop front whose awning lifts',
    scene: scene({
      name: 'Shop',
      base: 'plinth',
      parts: [
        { id: 'p1', name: 'Shop', type: 'box', x: 1.5, y: 1.5, z: 0.5, w: 4.5, d: 2.5, h: 1.75, tone: 'raised' },
        { id: 'p2', name: 'Roof', type: 'prism', preset: 'gable', facing: 'right', x: 1.5, y: 1.5, z: 2.25, w: 4.5, d: 2.5, h: 0.75 },
        // Shallow and high, so what's under it still shows: in isometric an awning hides what it overhangs.
        { id: 'p3', name: 'Awning', type: 'prism', preset: 'wedge', facing: 'right', x: 1.5, y: 4, z: 1.85, w: 4.5, d: 0.5, h: 0.35, lit: true, lift: 0.5 },
        { id: 'p4', name: 'Door', type: 'prism', preset: 'tab', facing: 'left', x: 4.5, y: 4, z: 0.5, w: 1, d: 0.12, h: 1.2, tone: 'sunken' },
        { id: 'p5', name: 'Window', type: 'prism', preset: 'tab', facing: 'left', x: 2, y: 4, z: 0.9, w: 1.75, d: 0.08, h: 0.6, tone: 'sunken' },
        { id: 'p6', name: 'Pot', type: 'cylinder', x: 1.15, y: 5.35, z: 0.5, r: 0.35, h: 0.5, tone: 'raised', group: 'g1' },
        { id: 'p7', name: 'Shrub', type: 'lathe', preset: 'ball', x: 1, y: 5.2, z: 1, r: 0.5, h: 1, group: 'g1' },
      ],
      groups: [{ id: 'g1', lift: 0, float: 0.08 }],
    }),
  },
  {
    id: 'stack',
    name: 'Stack',
    note: 'Tiers that come apart',
    scene: scene({
      name: 'Stack',
      base: 'turntable',
      parts: [
        { id: 'p1', name: 'Base', type: 'cylinder', x: 2.5, y: 2.5, z: 0.5, r: 1.5, h: 0.4, tone: 'sunken' },
        { id: 'p2', name: 'Middle', type: 'cylinder', x: 2.5, y: 2.5, z: 0.9, r: 1.5, h: 0.4, lift: 0.3 },
        { id: 'p3', name: 'Top', type: 'cylinder', x: 2.5, y: 2.5, z: 1.3, r: 1.5, h: 0.4, lift: 0.6, lit: true },
        { id: 'p4', name: 'Next', type: 'cylinder', x: 2.5, y: 2.5, z: 1.7, r: 1.5, h: 0.4, variant: 'ghost', lift: 0.9, float: 0.12 },
      ],
    }),
  },
  {
    id: 'lounge',
    name: 'Lounge',
    note: 'A sofa, a screen, a vase and a bowl',
    scene: scene({
      name: 'Lounge',
      base: 'plinth',
      parts: [
        { id: 'p1', name: 'Cabinet', type: 'box', x: 2.5, y: 1.2, z: 0.5, w: 3, d: 0.9, h: 0.6, tone: 'raised' },
        { id: 'p2', name: 'Screen', type: 'screen', facing: 'left', x: 3, y: 1.5, z: 1.1, w: 2, d: 0.2, h: 1.2, lit: true, lift: 0.5 },
        { id: 'p3', name: 'Sofa', type: 'prism', preset: 'ell', facing: 'top', x: 1.2, y: 3.2, z: 0.5, w: 3.5, d: 3, h: 0.5, tone: 'raised' },
        { id: 'p4', name: 'Side table', type: 'cylinder', x: 5.2, y: 3.2, z: 0.5, r: 0.5, h: 0.6, tone: 'sunken' },
        { id: 'p5', name: 'Vase', type: 'lathe', preset: 'vase', x: 5.45, y: 3.45, z: 1.1, r: 0.25, h: 0.8, lift: 0.4, float: 0.1 },
        { id: 'p6', name: 'Coffee table', type: 'box', x: 4.8, y: 5.2, z: 0.5, w: 1.6, d: 1.2, h: 0.35, tone: 'sunken' },
        { id: 'p7', name: 'Bowl', type: 'lathe', preset: 'bowl', x: 5.2, y: 5.4, z: 0.85, r: 0.4, h: 0.25, lift: 0.3 },
        { id: 'p8', name: 'Bottle', type: 'lathe', preset: 'bottle', x: 1.6, y: 1.4, z: 0.5, r: 0.25, h: 1.1, lift: 0.5 },
      ],
    }),
  },
  {
    id: 'workshop',
    name: 'Workshop',
    note: 'A tank piped to a crate, and the steps up',
    scene: scene({
      name: 'Workshop',
      base: 'plinth',
      parts: [
        { id: 'p1', name: 'Tank', type: 'lathe', preset: 'capsule', x: 1.2, y: 1.2, z: 0.5, r: 0.9, h: 2.4, tone: 'raised', lit: true },
        { id: 'p2', name: 'Pipe', type: 'pipe', axis: 'x', x: 3, y: 1.7, z: 1.4, w: 3, d: 0.5, h: 0.5, lift: 0.4 },
        { id: 'p3', name: 'Crate', type: 'crate', x: 5, y: 3.4, z: 0.5, w: 1.8, d: 1.8, h: 0.9, lift: 0.2 },
        { id: 'p4', name: 'Funnel', type: 'lathe', preset: 'funnel', x: 5.4, y: 3.8, z: 1.4, r: 0.5, h: 0.6, float: 0.1, lift: 0.7 },
        { id: 'p5', name: 'Steps', type: 'prism', preset: 'stairs', facing: 'right', x: 1.2, y: 4.2, z: 0.5, w: 1.5, d: 2.5, h: 1.2 },
        { id: 'p6', name: 'Way', type: 'prism', preset: 'arrow', facing: 'top', x: 3, y: 4.5, z: 0.5, w: 1.8, d: 1.2, h: 0.1, tone: 'sunken' },
        { id: 'p7', name: 'Nut', type: 'prism', preset: 'hexagon', facing: 'top', x: 3.2, y: 5.9, z: 0.5, w: 1.6, d: 1.4, h: 0.4 },
      ],
    }),
  },
  {
    id: 'blank',
    name: 'Blank',
    note: 'An empty plinth',
    scene: scene({ name: 'Untitled', base: 'plinth', parts: [] }),
  },
]

export const DEFAULT_TEMPLATE = TEMPLATES[0]!
