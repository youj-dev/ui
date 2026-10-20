import { componentsIn } from '@/lib/props'
import { installInfo } from '@/lib/registry'
import { InstallTabsView } from './install-tabs-view'

/**
 * Two ways in: the npm package (import from it), or the item's source copied
 * in with `npx youj add`. Commands are built from the registry fragments,
 * so an unknown item fails the build instead of shipping a broken command.
 */
export function InstallTabs({ name, imports, noImport }: { name: string; /** The names to show imported, for a kit whose page covers one part: `ChatMessageList`. */ imports?: string; /** No import line, where the usage right after it imports. */ noImport?: boolean }) {
  const info = installInfo(name, componentsIn, imports)
  return (
    <InstallTabsView
      packageCommand={info.packageCommand}
      packageImport={noImport ? undefined : info.packageImport}
      registryCommand={info.registryCommand}
      registryImport={noImport ? undefined : info.registryImport}
      registryDeps={info.registryDeps}
      copyIn={info.copyIn}
    />
  )
}
