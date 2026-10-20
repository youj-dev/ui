import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { delimiter, dirname, join } from 'node:path'
import type { PackageManager } from './detect'
import { REGISTRY_TOKEN_ENV } from './constants'
import { CliError } from './ui'

export interface Command {
  cmd: string
  args: string[]
}

/** Runs a command in the app. `inherit` hands it the terminal (for tools that may prompt); `capture` resolves with its output instead of showing it. */
export type Runner = (command: Command, cwd: string, options?: { inherit?: boolean; capture?: boolean }) => Promise<string | void>

/**
 * What to spawn for a command, never through a shell. On Windows npm's tools are
 * `.cmd` scripts, which Node refuses to spawn without one, so npm and npx run as
 * node on their own scripts; any other tool must be a real `.exe` on PATH.
 */
export function spawnTarget(command: Command, platform: NodeJS.Platform = process.platform, exists: (path: string) => boolean = existsSync, env: NodeJS.ProcessEnv = process.env): Command {
  if (platform !== 'win32') return command
  const script = { npm: 'npm-cli.js', npx: 'npx-cli.js' }[command.cmd]
  if (script) {
    const file = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', script)
    if (exists(file)) return { cmd: process.execPath, args: [file, ...command.args] }
  }
  for (const dir of (env.Path ?? env.PATH ?? '').split(delimiter).filter(Boolean)) {
    const file = join(dir, `${command.cmd}.exe`)
    if (exists(file)) return { cmd: file, args: command.args }
  }
  throw new CliError(`Couldn't find ${command.cmd}.exe or npm's own scripts. youj runs tools without a shell, so on Windows it needs a real executable; run this yourself: ${format(command)}`)
}

export const run: Runner = (command, cwd, options = {}) =>
  new Promise((resolve, reject) => {
    const target = spawnTarget(command)
    const child = spawn(target.cmd, target.args, {
      cwd,
      stdio: options.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
      shell: false,
      env: process.env,
    })
    let output = ''
    child.stdout?.on('data', (d) => (output += d))
    child.stderr?.on('data', (d) => (output += d))
    child.on('error', (error) => reject(new CliError(`Couldn't run ${command.cmd}: ${error.message}`)))
    child.on('close', (code) =>
      code === 0 ? resolve(options.capture ? output : undefined) : output.includes(REGISTRY_TOKEN_ENV) && /environment variables?/.test(output) ? reject(missingToken()) : reject(new CliError(`${format(command)} exited with ${code}${output ? `\n\n${output.trim().split('\n').slice(-30).join('\n')}` : ''}`)),
    )
  })

/** shadcn's "requires the following environment variables" stop, said in one line: components.json refers to the token by name, so a later run needs it in the shell too. */
const missingToken = () =>
  new CliError(`The registry needs ${REGISTRY_TOKEN_ENV} in your shell (it's a private registry, and components.json refers to it by name instead of holding it). Set it, then run again.`)

export function format({ cmd, args }: Command): string {
  return [cmd, ...args].join(' ')
}

/** An npm package name as the registry accepts it (`recharts`, `@scope/pkg`). */
export const isPackageName = (name: string) => name.length <= 214 && /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/.test(name)

/** The command that installs `packages` (`name` or `name@range`); a name that isn't one stops it before anything runs. */
export function installCommand(pm: PackageManager, packages: string[], dev = false): Command {
  const bad = packages.filter((spec) => !isPackageName(spec.lastIndexOf('@') > 0 ? spec.slice(0, spec.lastIndexOf('@')) : spec))
  if (bad.length) throw new CliError(`Refusing to install ${bad.map((b) => JSON.stringify(b)).join(', ')}: not a package name. This is a bug in youj; please report it.`)
  const verb = pm === 'npm' ? 'install' : 'add'
  const flag = dev ? (pm === 'bun' ? ['-d'] : ['-D']) : []
  return { cmd: pm, args: [verb, ...flag, ...packages] }
}

/** Runs a package's bin without installing it: `pnpm dlx`, `bunx`, else `npx`. */
export function dlxCommand(pm: PackageManager, pkg: string, args: string[]): Command {
  if (pm === 'pnpm') return { cmd: 'pnpm', args: ['dlx', pkg, ...args] }
  if (pm === 'bun') return { cmd: 'bunx', args: [pkg, ...args] }
  return { cmd: 'npx', args: ['--yes', pkg, ...args] }
}

/** The shadcn CLI, pinned to the exact version Youj's registry items are tested against: a shadcn minor can change what `youj add` writes. */
export const SHADCN = 'shadcn@4.21.0'
