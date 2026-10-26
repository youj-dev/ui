import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkOptions } from '../src/flags'
import { CliError } from '../src/ui'

// The help text as committed (api/youj-cli.api.txt): the options each command lists.
const help = readFileSync(join(import.meta.dirname, '../../../api/youj-cli.api.txt'), 'utf8')
const listed = (command: string) => {
  const block = help.split('\n\n---\n\n').find((b) => b.startsWith(`$ youj ${command} --help\n`))!
  return [...block.matchAll(/^\s+(--[a-z-]+)/gm)].map((m) => m[1]!)
}
const message = (argv: string[], command?: string) => {
  try {
    checkOptions(argv, command)
  } catch (error) {
    expect(error).toBeInstanceOf(CliError)
    return (error as Error).message
  }
  return null
}

describe('the options a command takes', () => {
  for (const command of ['init', 'create', 'add', 'doctor', 'mcp']) {
    it(`are the ones its help lists: ${command}`, () => {
      const flags = listed(command)
      expect(flags.length).toBeGreaterThan(2)
      for (const flag of flags) expect(message([command, flag], command), flag).toBeNull()
    })
  }

  it('stop a typo with the nearest option, so a --dryrun is not run for real', () => {
    expect(message(['--dryrun'], 'init')).toMatch(/^Unknown option --dryrun: did you mean --dry-run\?\nnpx @youj\/cli init --help lists the options\.$/)
    expect(message(['button', '--overwite'], 'add')).toContain('Unknown option --overwite: did you mean --overwrite?')
    expect(message(['--mod', 'registry'], 'init')).toContain('did you mean --mode?')
    expect(message(['--stict'], 'doctor')).toContain('did you mean --strict?')
    expect(message(['--allow-low-contast'], 'create')).toContain('did you mean --allow-low-contrast?')
    expect(message(['--dryrun=true'], 'mcp')).toContain('Unknown option --dryrun: did you mean --dry-run?')
  })

  it('name each wrong option once, with a guess only when something is near', () => {
    const text = message(['--bogus', '--dryrun', '--bogus'], 'init')!
    expect(text.split('\n').filter((l) => l.startsWith('Unknown'))).toEqual(['Unknown option --bogus.', 'Unknown option --dryrun: did you mean --dry-run?'])
  })

  it("reject another command's option instead of ignoring it", () => {
    expect(message(['--theme', 'brutal'], 'doctor')).toContain('Unknown option --theme.')
    expect(message(['--strict'], 'init')).toContain('Unknown option --strict')
  })

  it('take a short form only where the command takes its option', () => {
    expect(message(['-y'], 'init')).toBeNull()
    expect(message(['-yo'], 'add')).toBeNull()
    expect(message(['-y'], 'doctor')).toContain('Unknown option -y.')
    expect(message(['-o'], 'init')).toContain('Unknown option -o.')
    expect(message(['-c', 'apps/web'], 'doctor')).toBeNull()
    expect(message(['-psrc/components/kit'], 'add')).toBeNull()
  })

  it('end at --, and at the positional values around them', () => {
    expect(message(['button', '--', '--not-an-option'], 'add')).toBeNull()
    expect(message(['https://www.youj.dev/create?sidebar=rail&upgrade=0'], 'create')).toBeNull()
    expect(message(['--cwd=apps/web', '--look', 'bezel'], 'init')).toBeNull()
  })

  it('leave an unknown command to be reported as one, and check against every command when there is none', () => {
    expect(message(['--bogus'], 'bogus')).toBeNull()
    expect(message(['--theme'], undefined)).toBeNull()
    expect(message(['--halp'], undefined)).toContain('did you mean --help?')
  })
})
