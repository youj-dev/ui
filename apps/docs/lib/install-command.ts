import type { Install } from '@/components/landing/install-field'

/**
 * A fenced shell block's text as an install field's command, when it is
 * exactly one install or run command: `npx @youj/cli add button`, `pnpm add
 * @youj/react` (or npm, yarn or bun's words for it). Anything else, such as
 * a pipeline, a script of the repo's own or several lines, stays a code block.
 */
export function parseInstall(text: string): Install | undefined {
  const line = text.trim()
  if (!line || /[\n&|;<>$`\\]/.test(line)) return undefined
  const cli = line.match(/^npx @youj\/cli (\S.*)$/)
  if (cli) return { kind: 'cli', run: cli[1]! }
  const add = line.match(/^(?:pnpm add|npm i(?:nstall)?|yarn add|bun add)(?:\s+(-D|-d|--dev|--save-dev))?\s+(\S.*)$/)
  if (add && !add[2]!.startsWith('-')) return { kind: 'package', packages: add[2]!, dev: !!add[1] }
  return undefined
}
