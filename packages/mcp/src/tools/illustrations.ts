import type { Catalog } from '../catalog'
import { code, NotFound } from '../format'
import type { Scene } from '../types'

/* The ready-made isometric scenes: listed by category, one scene in detail,
 * and the pointers to drawing your own (the builder and the illustration kit). */

const oneLine = (text: string, max = 130) => {
  const flat = text.replace(/\s+/g, ' ').trim()
  const first = /^.*?[.!?](?=\s|$)/.exec(flat)?.[0] ?? flat
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first
}

const build = (site: string) =>
  `Draw your own: the illustration builder (experimental) at ${site}/illustrations/build, or the kit the scenes are drawn with (get_component("illustration-kit"); copy-in only: \`npx @youj/cli add illustration-kit iso-shapes\`).`

export function listIllustrations(catalog: Catalog, category?: string): string {
  const { categories, scenes } = catalog.index.illustrations
  const site = catalog.index.meta.site
  const asked = category?.trim().toLowerCase()
  if (!asked) {
    return [
      `${scenes.length} illustration scenes in ${categories.length} categories (isometric, drawn from your theme; copy one in with \`npx @youj/cli add illustration-<id>\`, or draw it by id with \`<Illustration scene="<id>" />\` from \`@youj/illustrations\`):`,
      '',
      ...categories.map((c) => {
        const own = scenes.filter((s) => s.category === c.id)
        return `- **${c.name}** (\`${c.id}\`, ${own.length}): ${own.map((s) => s.id).join(', ')}`
      }),
      '',
      'One category with its scenes and tags: list_illustrations({ category }). One scene: get_component("illustration-<id>"). search finds scenes by name, category and tag.',
      build(site),
    ].join('\n')
  }
  const found = categories.find((c) => c.id === asked || c.name.toLowerCase() === asked)
  if (!found) throw new NotFound(`No illustration category "${category}". Categories: ${categories.map((c) => c.id).join(', ')}.`)
  const own = scenes.filter((s) => s.category === found.id)
  return [
    `${found.name} illustrations (${own.length}):`,
    '',
    ...own.map((s) => `- \`${s.id}\` ${s.name} (\`${s.component}\`; tags: ${s.tags.join(', ') || 'none'}): ${oneLine(s.description)}`),
    '',
    'Install one: `npx @youj/cli add illustration-<id>`. Details: get_component("illustration-<id>").',
  ].join('\n')
}

export function getScene(catalog: Catalog, scene: Scene): string {
  const site = catalog.index.meta.site
  const category = catalog.categoryName(scene.category)
  return [
    `# ${scene.name} illustration`,
    '',
    `Illustration scene \`${scene.id}\` · ${category} · docs: ${site}/docs/illustrations · explorer: ${site}/illustrations?scene=${scene.id}`,
    '',
    scene.description,
    '',
    `Tags: ${scene.tags.join(', ') || 'none'}.`,
    '',
    '## Use it',
    '',
    'From the package (recommended):',
    code('tsx', `import { Illustration, ${scene.component} } from '@youj/illustrations'\n\n<Illustration scene="${scene.id}" title="…" />\n<${scene.component} title="…" />`),
    '',
    'Or copy the one scene in with the Youj CLI (it brings the kit the scenes are drawn with and the shapes it uses):',
    code('bash', `npx @youj/cli add ${scene.registry}`),
    ...(scene.importPath ? [`It lands in \`${scene.importPath.replace(/^@\//, '')}.tsx\` (under \`src/\` in an app that has one); import it through your \`@/\` alias:`, code('tsx', `import { ${scene.component} } from '${scene.importPath}'`)] : []),
    '',
    'Every scene frames the same volume, so any scene swaps for any other without the layout moving. It is decorative unless you give it a `title`; reduced motion draws it finished and still.',
    '',
    `Other ${category} scenes: list_illustrations({ category: "${scene.category}" }). ${build(site)}`,
  ].join('\n')
}
