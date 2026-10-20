// @vitest-environment node
import { createElement, type ComponentType } from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import * as grids from '../components/youj/graphics/grids'
import * as isoBox from '../components/youj/graphics/iso-box'
import * as isoCylinder from '../components/youj/graphics/iso-cylinder'
import * as isoPlatform from '../components/youj/graphics/iso-platform'
import * as kit from '../components/youj/graphics/illustrations/kit'
import type { IllustrationProps } from '../components/youj/graphics/illustrations/kit'
import { YoujProvider } from '@youj/core'
import { generateCode, installItems, KIT_PATH } from './codegen'
import { AXES, componentNameOf, createPart, FACINGS, LATHE_PRESETS, PRISM_PRESETS, sanitizeScene, type BuilderScene, type PaletteKind, type Part } from './model'
import { BuiltScene } from './render'
import { TEMPLATES } from './templates'

/** Every kind of part, every outline and profile, each look and a group: what the code has to get right. */
const KITCHEN_SINK = sanitizeScene({
  name: 'Kitchen sink',
  base: 'turntable',
  parts: [
    { id: 'p1', type: 'box', x: 1, y: 1, z: 0.5, w: 2, d: 1.5, h: 1, tone: 'raised', lift: 0.5 },
    { id: 'p2', type: 'box', x: 3, y: 1, z: 0.5, w: 1, d: 1, h: 0, variant: 'ghost' },
    { id: 'p3', type: 'cylinder', x: 5, y: 1, z: 0.5, r: 0.75, h: 1.5, variant: 'wire', lit: true, float: 0.2 },
    { id: 'p4', type: 'platform', x: 1, y: 4, w: 3, d: 3, h: 0.3, grid: true, tone: 'neutral' },
    { id: 'p5', type: 'platform', x: 5, y: 5, w: 2, d: 2, h: 0.3, round: true },
    { id: 'p6', type: 'prism', preset: 'gable', facing: 'right', x: 1, y: 2.5, z: 1.5, w: 2, d: 1.5, h: 1 },
    { id: 'p7', type: 'prism', preset: 'wedge', facing: 'top', x: 4, y: 3, w: 1, d: 1, h: 0.5 },
    { id: 'p8', type: 'prism', preset: 'tab', facing: 'left', x: 2, y: 5, z: 0.5, w: 1.5, d: 0.25, h: 1.5, tone: 'sunken' },
    { id: 'p9', type: 'prism', preset: 'heart', facing: 'left', x: 5, y: 3, z: 1, w: 1.5, d: 0.4, h: 1.4, lit: true, lift: 1, float: 0.15 },
    { id: 'p10', type: 'prism', preset: 'star', facing: 'right', x: 6, y: 1, z: 2, w: 0.3, d: 1.5, h: 1.5, group: 'g1' },
    { id: 'p11', type: 'lathe', preset: 'cup', x: 2, y: 2, z: 1.5, r: 0.5, h: 0.75, group: 'g1' },
    { id: 'p12', type: 'lathe', preset: 'bell', x: 6, y: 3, r: 0.75, h: 1.5 },
    { id: 'p13', type: 'lathe', preset: 'dome', x: 3, y: 6, r: 1, h: 1 },
    { id: 'p14', type: 'lathe', preset: 'ball', x: 4, y: 6, z: 1, r: 0.5, h: 1 },
    { id: 'p15', type: 'lathe', preset: 'ball', x: 5, y: 6, z: 1, r: 0.5, h: 0.75 },
    { id: 'p16', type: 'lathe', preset: 'cone', x: 0.5, y: 6, r: 0.5, h: 1.5, tone: 'raised' },
  ],
  groups: [{ id: 'g1', lift: 0.8, float: 0.1 }],
})!

/** Every item on the palette, and every plane a prism or screen can face and way a pipe can lie, each with a footprint of its own. */
const KINDS: PaletteKind[] = ['box', 'tile', 'cylinder', 'platform', 'pipe', 'screen', 'crate', ...PRISM_PRESETS.map((p) => `prism:${p}` as const), ...LATHE_PRESETS.map((p) => `lathe:${p}` as const)]
const variants = KINDS.flatMap((kind): Part[] => {
  const part = createPart(kind, 'p')
  if (part.type === 'prism') return FACINGS.map((facing) => ({ ...part, facing }))
  if (part.type === 'screen') return FACINGS.map((facing) => ({ ...part, facing }))
  if (part.type === 'pipe') return AXES.map((axis) => ({ ...part, axis }))
  return [part]
})
/** One scene per few parts (a scene holds at most 60), so a failure names a part type. */
const EVERY_PART = Array.from({ length: Math.ceil(variants.length / 6) }, (_, n) =>
  sanitizeScene({
    name: `Every part ${n + 1}`,
    base: 'plinth',
    parts: variants.slice(n * 6, n * 6 + 6).map((part, i) => ({ ...part, id: `p${i + 1}`, name: i === 0 ? 'First' : undefined, x: (i % 3) * 2.5, y: Math.floor(i / 3) * 3, z: 0.5, lift: i === 1 ? 0.4 : 0, float: i === 2 ? 0.1 : 0 })),
  })!,
)

const SCENES: BuilderScene[] = [KITCHEN_SINK, ...EVERY_PART, ...TEMPLATES.map((t) => t.scene)]

/** Where the generated file's imports land: the kit's own modules, as the registry copies them. */
const MODULES: Record<string, unknown> = {
  'react/jsx-runtime': jsxRuntime,
  [`${KIT_PATH}/iso-box`]: isoBox,
  [`${KIT_PATH}/iso-cylinder`]: isoCylinder,
  [`${KIT_PATH}/iso-platform`]: isoPlatform,
  [`${KIT_PATH}/grids`]: grids,
  [`${KIT_PATH}/illustrations/kit`]: kit,
}

/** The generated file, compiled and run: its component. */
function load(scene: BuilderScene): ComponentType<IllustrationProps> {
  const { outputText, diagnostics } = ts.transpileModule(generateCode(scene), {
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })
  expect(diagnostics ?? []).toEqual([])
  const exports: Record<string, unknown> = {}
  const require = (id: string) => {
    if (!(id in MODULES)) throw new Error(`The code imports ${id}, which the kit doesn't have`)
    return MODULES[id]
  }
  new Function('require', 'exports', outputText)(require, exports)
  return exports[componentNameOf(scene.name)] as ComponentType<IllustrationProps>
}

/** Markup with the ids React made numbered in order of appearance: two trees made separately name their gradients differently, and nothing else may differ. */
function normalise(html: string) {
  const ids = new Map<string, string>()
  return html.replace(/kg-[\w-]+/g, (id) => {
    if (!ids.has(id)) ids.set(id, `kg-${ids.size}`)
    return ids.get(id)!
  })
}

const draw = (node: ReturnType<typeof createElement>) => normalise(renderToStaticMarkup(createElement(YoujProvider, { reducedMotion: 'always', children: node })))

describe('the generated code', () => {
  it.each(SCENES.map((s) => [s.name, s] as const))('draws what the canvas draws: %s', (_, scene) => {
    const Generated = load(scene)
    for (const props of [{}, { explode: 1 }, { float: false, explode: 0.5 }] satisfies IllustrationProps[]) {
      const canvas = draw(createElement(BuiltScene, { scene, ...props }))
      expect(canvas).toContain('data-slot="iso-scene"')
      expect(draw(createElement(Generated, props))).toBe(canvas)
    }
  })

  it('covers every kind of part on the palette', () => {
    const seen = new Set(EVERY_PART.flatMap((s) => s.parts.map((p) => (p.type === 'prism' || p.type === 'lathe' ? `${p.type}:${p.preset}` : p.type === 'box' && p.h === 0 ? 'tile' : p.type))))
    for (const kind of KINDS) expect(seen.has(kind)).toBe(true)
    expect(EVERY_PART.flatMap((s) => s.parts)).toHaveLength(variants.length)
  })

  it('draws the same with the canvas’s part wrappers taken off', () => {
    const scene = KITCHEN_SINK
    const tagged = draw(createElement(BuiltScene, { scene, annotate: true, explode: 1 }))
    expect(tagged.match(/data-part=/g)).toHaveLength(scene.parts.length)
    const unwrapped = tagged.replace(/<g data-part="[^"]+">/g, '').replace(/<\/g>/g, '')
    expect(unwrapped).toBe(draw(createElement(BuiltScene, { scene, explode: 1 })).replace(/<\/g>/g, ''))
  })

  it('imports only what it draws with, from where the registry copies the kit', () => {
    const blank = generateCode(TEMPLATES.find((t) => t.id === 'blank')!.scene)
    expect(blank).toContain(`import { IsoPlatform } from '${KIT_PATH}/iso-platform'`)
    expect(blank).toContain(`import { type IllustrationProps, IllustrationStage } from '${KIT_PATH}/illustrations/kit'`)
    expect(blank).not.toMatch(/IsoBox|IsoCylinder|Lathe|Prism|Group|bob/)
    const sink = generateCode(KITCHEN_SINK)
    expect(sink).toContain(`import { bob, Group, type IllustrationProps, IllustrationStage, Lathe, orb, type PlanePoint, Prism, rounded } from '${KIT_PATH}/illustrations/kit'`)
    expect(sink).toMatch(/^const heart = /m)
    expect(sink).toMatch(/^const star = /m)
    expect(sink.startsWith(`'use client'\n`)).toBe(true)
  })

  it('reads like a shipped scene: a named component on the stage, defaults left out', () => {
    const code = generateCode(TEMPLATES.find((t) => t.id === 'desk')!.scene, { link: 'https://k.dev/illustrations/build?s=1' })
    expect(code).toContain('Open it again: https://k.dev/illustrations/build?s=1')
    expect(code).toContain('export function IllustrationDesk(props: IllustrationProps) {')
    expect(code).toContain('<IllustrationStage id="desk" {...props}>')
    expect(code).toContain('<IsoBox x={1.5} y={2.5} z={0.5} w={1} d={2.5} h={1.25} tone="raised" />')
    expect(code).toContain('float={bob(props, 0.12)} lift={0.3}')
    expect(code).not.toMatch(/variant="solid"|tone="neutral"|z=\{0\}/)
  })

  it('names the registry items it needs', () => {
    expect(installItems(TEMPLATES.find((t) => t.id === 'blank')!.scene)).toEqual(['illustration-kit', 'iso-shapes'])
    expect(installItems(sanitizeScene({ name: 'x', base: 'grid', parts: [{ type: 'lathe', x: 1, y: 1, r: 1, h: 1 }] })!)).toEqual(['illustration-kit', 'grid-backdrops'])
  })
})
