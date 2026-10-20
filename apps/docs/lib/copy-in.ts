/** What `youj add <item>` writes into an app, for the line under an install command. */
export interface CopyIn {
  /** Every registry item it writes, the item itself and the shared ones included. */
  items: string[]
  /** What it brings beyond the item and the shared ones (`youj-core`, `youj-presets`, `youj-ui-core`). */
  extras: string[]
  lines: number
  /** Lines of `youj-core` alone, which every copy-in shares. */
  coreLines: number
}

/** What the package command assumes, since it names only the package: the peers and the provider come from `init`. */
export const PACKAGE_SETUP = 'For an app already set up with `npx @youj/cli init`, which installs the peers (`@youj/core`, `@youj/motion`, `motion` and Base UI) and wires the provider. New app? Start at [Installation](/docs/installation).'

const SHOWN = 10

/** The extras a line names: the first few, then how many more. */
export function shownExtras(copy: CopyIn): { names: string[]; more: number } {
  return { names: copy.extras.slice(0, SHOWN), more: Math.max(0, copy.extras.length - SHOWN) }
}

/** The honest line under the install command, as plain text with the items in backticks. */
export function copyInSentence(copy: CopyIn): string {
  const { names, more } = shownExtras(copy)
  const rounded = Math.round(copy.lines / 100) * 100
  const shared = copy.coreLines ? `, ${copy.coreLines.toLocaleString('en-US')} of them the shared \`youj-core\`` : ''
  return `The copy is ${copy.items.length} registry items, about ${rounded.toLocaleString('en-US')} lines in all${shared}. Beyond the shared ones it brings ${names.map((e) => `\`${e}\``).join(', ')}${more ? ` and ${more} more` : ''}.`
}
