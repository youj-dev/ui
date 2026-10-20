import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { VERSION } from '../src/constants'

/* The CLI's contract as scripts and AI agents see it: its help text and the exit code of each
 * invocation. Committed as api/youj-cli.api.txt, part of `pnpm check:api`; `pnpm api:update`
 * rewrites it after an intended change. A diff there is a flag or a command renamed, which is
 * a breaking change (RELEASING.md). */

const pkg = join(import.meta.dirname, '..')
const snapshot = join(pkg, '../../api/youj-cli.api.txt')
const COMMANDS = ['init', 'create', 'add', 'doctor', 'mcp']
// Every one runs with a closed stdin, in an empty folder, and needs no network.
const INVOCATIONS = [[], ['--help'], ['-h'], ['--version'], ...COMMANDS.map((c) => [c, '--help']), ['bogus'], ['doctor'], ['add'], ['create']]

let dist = ''
let empty = ''
beforeAll(() => {
  mkdirSync(join(pkg, 'node_modules/.tmp'), { recursive: true })
  dist = mkdtempSync(join(pkg, 'node_modules/.tmp/surface-'))
  empty = mkdtempSync(join(tmpdir(), 'youj-surface-'))
  execFileSync('pnpm', ['exec', 'tsdown', '-d', dist], { cwd: pkg, stdio: 'ignore' })
}, 60_000)
afterAll(() => {
  rmSync(dist, { recursive: true, force: true })
  rmSync(empty, { recursive: true, force: true })
})

const plain = (text: string) =>
  text
    // biome-ignore lint/suspicious/noControlCharactersInRegex: strips ANSI colour escapes
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replaceAll(VERSION, '<version>')
    .replaceAll(empty, '<cwd>')

it('keeps its help text and exit codes', () => {
  const blocks = INVOCATIONS.map((args) => {
    const run = spawnSync(process.execPath, [join(dist, 'cli.mjs'), ...args], { cwd: empty, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', env: { ...process.env, NO_COLOR: '1', CI: '1' } })
    // Help is the contract; other output is only judged by the exit code (it names paths and checks).
    const helpful = args.some((a) => a === '--help' || a === '-h') || args.length === 0
    return [`$ youj ${args.join(' ')}`.trimEnd(), `exit ${run.status}`, ...(helpful ? ['', plain(run.stdout).trimEnd()] : [])].join('\n')
  })
  return expect(`${blocks.join('\n\n---\n\n')}\n`).toMatchFileSnapshot(snapshot)
}, 60_000)
