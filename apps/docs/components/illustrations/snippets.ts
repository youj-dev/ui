import type { SceneEntry } from './catalog'

/* The code the detail panel shows and copies, from the scene's registry entry
 * and item: by id through <Illustration> (what a block's slot takes), or the
 * scene's own component, from the package or copied in with the CLI. */

export const GRAPHICS_PACKAGE = '@youj/illustrations'

/** Where `add illustration-<id>` writes the scene, as an app import. */
export const installedPath = (id: string) => `@/components/youj/graphics/illustrations/scenes/${id}`

export const itemName = (id: string) => `illustration-${id}`

/** How the panel's Colour row has it: mono (nothing to say), the theme's hues, or hues of your own. */
export interface SceneLook {
  colors?: 'theme' | readonly string[]
}

const lookProps = ({ colors }: SceneLook = {}) =>
  colors === 'theme' ? ' colors="theme"' : colors?.some(Boolean) ? ` colors={[${colors.map((c) => `'${c}'`).join(', ')}]}` : ''

export function byIdSnippet(scene: SceneEntry, look?: SceneLook): string {
  return `import { Illustration } from '${GRAPHICS_PACKAGE}'\n\n<Illustration scene="${scene.id}"${lookProps(look)} />`
}

export function directSnippet(scene: SceneEntry): string {
  return `import { ${scene.component} } from '${GRAPHICS_PACKAGE}'\n\n<${scene.component} />`
}

export function copiedSnippet(scene: SceneEntry): string {
  return `import { ${scene.component} } from '${installedPath(scene.id)}'\n\n<${scene.component} />`
}
