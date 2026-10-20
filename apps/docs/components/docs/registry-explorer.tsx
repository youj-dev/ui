import type { ExplorerItem } from '@/components/docs/registry-explorer-view'
import { RegistryExplorerView as View } from '@/components/mdx-lazy'
import { areaOf, dependencyClosure } from '@/lib/catalog'
import type { PillarId } from '@/lib/nav'
import { registryItems, type RegistryItem } from '@/lib/registry'

/** Items that show the range: UI that pulls in motion, motion on its own, one icon. */
const PICKS = ['button', 'dialog', 'tabs', 'toast', 'reveal', 'dock', 'icon-bell']

function kindOf(item: RegistryItem): PillarId {
  if (item.name === 'youj-core' || item.name === 'youj-ui-core') return 'themes'
  if (areaOf(item) === 'icons' || item.name.startsWith('icon-') || item.name === 'youj-icon') return 'icons'
  return item.package === '@youj/react' ? 'ui' : 'motion'
}

function noteOf(item: RegistryItem): string {
  if (item.name === 'youj-core') return 'tokens, provider, cn'
  if (item.name === 'youj-ui-core') return 'UI tokens and cn'
  if (item.name === 'icon-engine') return 'the icon engine'
  return item.package
}

/**
 * MDX: `<RegistryExplorer />`. Per-item installs read from the registry: pick
 * an item, see its command and everything `youj add` brings with it.
 */
export function RegistryExplorer({ picks = PICKS }: { picks?: string[] }) {
  const items = registryItems()
  const explorer: ExplorerItem[] = picks.flatMap((name) => {
    const item = items.get(name)
    if (!item) return []
    return [
      {
        name,
        title: item.title?.replace(/ icon$/, '') ?? name,
        command: `npx youj add ${name}`,
        npm: item.dependencies ?? [],
        kind: kindOf(item),
        brings: dependencyClosure(name, items).flatMap((dep) => {
          const found = items.get(dep)
          return found ? [{ name: dep, kind: kindOf(found), note: noteOf(found) }] : []
        }),
      },
    ]
  })
  return (
    <div className="not-prose my-6">
      <View items={explorer} />
    </div>
  )
}
