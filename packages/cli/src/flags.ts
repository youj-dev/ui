import { distance } from './registry'
import { CliError } from './ui'

/* The options a command takes. A misspelled one (`--dryrun`) must stop the run:
 * ignored, it would turn a preview into a real install. `add` hands what isn't
 * ours to shadcn, so its own `add` options are listed here too, and anything
 * else is a mistake. */

/** The options every command takes. */
const GLOBAL = ['cwd', 'latest', 'help', 'version']

/** The options each command takes besides those. */
const OPTIONS: Record<string, string[]> = {
  init: ['yes', 'mode', 'theme', 'motion-personality', 'quality', 'look', 'dry-run'],
  create: ['mode', 'overwrite', 'allow-low-contrast', 'dry-run'],
  add: ['yes', 'overwrite', 'path', 'dry-run', 'diff', 'view', 'silent', 'all'],
  doctor: ['strict'],
  mcp: ['client', 'yes', 'print', 'dry-run'],
}

/** The one-letter forms (shadcn's for the ones `add` passes on). */
const SHORT: Record<string, string> = { y: 'yes', o: 'overwrite', p: 'path', s: 'silent', a: 'all', c: 'cwd', h: 'help', v: 'version' }

/** Short options that take a value: what follows them in the same word is that value. */
const SHORT_VALUED = new Set(['p', 'c'])

/**
 * Throws a CliError naming each option `command` doesn't take, with the
 * nearest ones it does. An unknown command isn't checked: it is reported as
 * one. Arguments after `--` are not options.
 */
export function checkOptions(argv: string[], command: string | undefined): void {
  if (command && !OPTIONS[command]) return
  const allowed = new Set([...GLOBAL, ...(command ? OPTIONS[command]! : Object.values(OPTIONS).flat())])
  const unknown: string[] = []
  for (const arg of argv) {
    if (arg === '--') break
    if (arg.startsWith('--')) {
      const flag = arg.split('=')[0]!
      if (!allowed.has(flag.slice(2))) unknown.push(flag)
    } else if (/^-[^-]/.test(arg)) {
      for (const letter of arg.slice(1)) {
        if (!(SHORT[letter] && allowed.has(SHORT[letter]))) unknown.push(`-${letter}`)
        if (SHORT_VALUED.has(letter)) break
      }
    }
  }
  if (!unknown.length) return
  const names = [...allowed].sort()
  const lines = [...new Set(unknown)].map((flag) => {
    const close = flag.startsWith('--') ? nearest(flag.slice(2), names) : []
    return `Unknown option ${flag}${close.length ? `: did you mean ${close.map((n) => `--${n}`).join(' or ')}?` : '.'}`
  })
  throw new CliError(`${lines.join('\n')}\nnpx @youj/cli ${command ? `${command} ` : ''}--help lists the options.`)
}

/** The options a typo is nearest to: those it starts, else the closest by edit distance, when that is a slip rather than another word. */
function nearest(name: string, names: string[]): string[] {
  const started = names.filter((n) => name.length > 2 && n.startsWith(name))
  if (started.length) return started.slice(0, 2)
  const scored = names.map((n) => ({ n, d: distance(name, n) }))
  const best = Math.min(...scored.map(({ d }) => d))
  return best <= Math.max(1, Math.floor(name.length / 4)) ? scored.filter(({ d }) => d === best).map(({ n }) => n).slice(0, 2) : []
}
