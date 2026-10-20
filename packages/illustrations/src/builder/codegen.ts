import { componentNameOf, round2, sceneSlug, type BuilderScene } from './model'
import { HELPER_SOURCES, isList, MODULES, sceneSpec, type ElementSpec, type Value } from './spec'

/* A builder scene as a component of your own, written the way the shipped
 * scenes are: the stage, the kit's shapes placed in grid units with their
 * defaults left out, a group where parts move as one, and the float the
 * scene's props can hold still. It imports the kit from where the registry
 * copies it (`illustration-kit` and the shapes beside it), and it prints the
 * same spec the canvas draws, so it draws what you built. */

/** Where `youj add` copies the kit, as an app import. */
export const KIT_PATH = '@/components/youj/graphics'

const PATHS = {
  'iso-box': `${KIT_PATH}/iso-box`,
  'iso-cylinder': `${KIT_PATH}/iso-cylinder`,
  'iso-platform': `${KIT_PATH}/iso-platform`,
  grids: `${KIT_PATH}/grids`,
  kit: `${KIT_PATH}/illustrations/kit`,
} as const

const num = (v: number) => String(round2(v))

function print(value: Value): string {
  if (typeof value === 'number') return num(value)
  if (typeof value === 'string') return JSON.stringify(value)
  if (value === true) return 'true'
  if (isList(value)) return `[${value.map((v) => (typeof v === 'number' ? num(v) : `[${v.map(num).join(', ')}]`)).join(', ')}]`
  if ('bob' in value) return `bob(props, ${num(value.bob)})`
  if ('ink' in value) return `INK.${value.ink}`
  return `${value.call}(${value.args.map(num).join(', ')})`
}

function attrs(spec: ElementSpec) {
  return spec.props.map(([name, value]) => (value === true ? ` ${name}` : typeof value === 'string' ? ` ${name}=${JSON.stringify(value)}` : ` ${name}={${print(value)}}`)).join('')
}

function jsx(spec: ElementSpec, depth: number): string[] {
  const pad = '  '.repeat(depth)
  const label = spec.label ? [`${pad}{/* ${spec.label} */}`] : []
  if (!spec.children?.length) return [...label, `${pad}<${spec.component}${attrs(spec)} />`]
  return [...label, `${pad}<${spec.component}${attrs(spec)}>`, ...spec.children.flatMap((child) => jsx(child, depth + 1)), `${pad}</${spec.component}>`]
}

/** Every name the elements use: components, and the helpers their props call. */
function namesIn(specs: readonly ElementSpec[], out = new Set<string>()) {
  for (const spec of specs) {
    out.add(spec.component)
    for (const [, value] of spec.props) {
      if (typeof value !== 'object' || isList(value)) continue
      out.add('bob' in value ? 'bob' : 'ink' in value ? 'INK' : value.call)
    }
    if (spec.children) namesIn(spec.children, out)
  }
  return out
}

const byName = (a: string, b: string) => a.replace(/^type /, '').localeCompare(b.replace(/^type /, ''), 'en', { sensitivity: 'base' })

/** The registry items the code needs: the kit always, the shapes and the floor grid when it draws them. */
export function installItems(scene: BuilderScene): string[] {
  const names = namesIn(sceneSpec(scene))
  return ['illustration-kit', ...(['IsoBox', 'IsoCylinder', 'IsoPlatform'].some((n) => names.has(n)) ? ['iso-shapes'] : []), ...(names.has('IsoFloor') ? ['grid-backdrops'] : [])]
}

export interface CodeOptions {
  /** The builder link the scene came from, written at the top so it can be opened again. */
  link?: string
}

export function generateCode(scene: BuilderScene, { link }: CodeOptions = {}): string {
  const specs = sceneSpec(scene)
  const names = namesIn(specs)
  const helpers = (['heart', 'star', 'bubble'] as const).filter((h) => names.has(h))
  for (const h of helpers) names.delete(h)
  names.add('IllustrationStage')

  const imports = new Map<string, string[]>()
  for (const name of names) {
    const path = PATHS[MODULES[name as keyof typeof MODULES]]
    imports.set(path, [...(imports.get(path) ?? []), name])
  }
  imports.get(PATHS.kit)!.push('type IllustrationProps', ...(helpers.length ? ['type PlanePoint'] : []))
  const importLines = [...imports.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([path, list]) => `import { ${list.sort(byName).join(', ')} } from '${path}'`)

  const component = componentNameOf(scene.name)
  const body = specs.length ? specs.flatMap((spec) => jsx(spec, 3)) : ['      {null}']
  const header = [
    `// ${scene.name}, drawn in the Youj illustration builder.${link ? ` Open it again: ${link}` : ''}`,
    `// It draws with the illustration kit: npx youj add ${installItems(scene).join(' ')}`,
  ]
  return [
    `'use client'`,
    '',
    ...header,
    '',
    ...importLines,
    '',
    ...helpers.flatMap((h) => [HELPER_SOURCES[h], '']),
    `/** ${scene.name}: ${describe(scene)} */`,
    `export function ${component}(props: IllustrationProps) {`,
    '  return (',
    `    <IllustrationStage id="${sceneSlug(scene.name)}" {...props}>`,
    ...body,
    '    </IllustrationStage>',
    '  )',
    '}',
    '',
  ].join('\n')
}

/** The doc comment's line: how many parts, which one is lit, what comes apart. */
function describe(scene: BuilderScene): string {
  const n = scene.parts.length
  const lit = scene.parts.filter((p) => p.lit).length
  const moving = scene.parts.some((p) => p.lift > 0) || scene.groups.some((g) => g.lift > 0)
  const parts = n === 0 ? 'nothing yet' : `${n} ${n === 1 ? 'part' : 'parts'}`
  const accent = lit ? `, ${lit === 1 ? 'one' : lit} in the accent` : ''
  return `${parts}${accent}${moving ? '. Hovered, it comes apart.' : '.'}`
}
