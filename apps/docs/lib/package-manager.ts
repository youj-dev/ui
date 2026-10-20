/* Install commands are written once, for pnpm (`pnpm add …`), and shown in
 * the reader's package manager: the install blocks' switch
 * (components/docs/install-tabs-view.tsx) and the Markdown pages. */

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun'

export const PACKAGE_MANAGERS: PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun']

/**
 * A pnpm install in another package manager's words: `npm install`, `yarn add`,
 * `bun add` (`-d` for a dev dependency). Anything else, such as `npx @youj/cli add`,
 * which runs the same under every one of them, is returned as it is.
 */
export function forManager(command: string, pm: PackageManager): string {
  const install = command.match(/^pnpm add(\s+-D)?\s+(.*)$/)
  if (!install) return command
  const dev = install[1] ? (pm === 'bun' ? ' -d' : ' -D') : ''
  return `${pm === 'npm' ? 'npm install' : `${pm} add`}${dev} ${install[2]}`
}
