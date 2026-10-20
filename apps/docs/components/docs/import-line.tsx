import { componentsIn } from '@/lib/props'
import { installInfo, registryItems } from '@/lib/registry'

/**
 * The one-line import under a component page's title, from the same registry
 * data as the install tabs. Static HTML: a page whose slug isn't a registry
 * item (an overview, a guide) shows nothing.
 */
export function ImportLine({ slugs }: { slugs: string[] }) {
  const name = slugs[0] === 'components' ? slugs[slugs.length - 1] : undefined
  if (!name || !registryItems().has(name)) return null
  let line: string | undefined
  try {
    line = installInfo(name, componentsIn).packageImport
  } catch {
    return null
  }
  if (!line) return null
  return (
    <p className="mt-4 text-[13px]">
      <code className="code-inline break-words">{line}</code>
    </p>
  )
}
