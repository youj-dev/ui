import * as p from '@clack/prompts'
import { statSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { add, expandItemAliases } from './add'
import { MOTIONS, PACKAGES, QUALITIES, REGISTRY_LATEST_ENV, THEMES, VERSION, type Mode, type Motion, type Quality, type ThemeId } from './constants'
import { create } from './create'
import { doctor, typecheck } from './doctor'
import { checkOptions } from './flags'
import { init } from './init'
import { CLIENTS, mcp, MCP_CLIENTS, type McpResult } from './mcp'
import { format, run } from './run'
import { checkLook, LOOKS } from './look'
import { bold, CliError, dim, terminalUi } from './ui'

const HEAD = `${bold('youj')} ${dim(`v${VERSION}`)}: set up Youj in a React app.`

/** Each command's help: its line, then its options. `youj <command> --help` prints just one. */
const COMMAND_HELP: Record<string, string> = {
  init: `  ${bold('npx @youj/cli init')}              detect the app, ask a few questions, set everything up
    --yes, -y                      take the defaults; no prompts
    --mode <package|registry>      the package, or copy-in source (default: package)
    --theme <${THEMES.join('|')}>   default: basalt
    --motion-personality <${MOTIONS.join('|')}>    default: the preset's own
    --quality <${QUALITIES.join('|')}>          default: auto
    --look <${LOOKS.join('|')}>          how components are built, with any theme (default: classic)
    --dry-run                      show the changes; write and install nothing`,
  create: `  ${bold('npx @youj/cli create')} '<link>'   set the app up from a Create link (quoted): Youj, the theme
                                   in lib/theme.ts, the link's look, the frame's blocks and components/app-shell.tsx
    --mode <package|registry>      for an app without Youj yet (default: package)
    --overwrite                    replace a lib/theme.ts or app-shell.tsx that's already there
    --allow-low-contrast           write a theme that misses WCAG AA contrast (refused by default)
    --dry-run                      show the changes and commands; write and run nothing`,
  add: `  ${bold('npx @youj/cli add')} <items…>       copy items in as source you own;
                                   on the package, install what a component needs (add chart → recharts),
                                   and copy a block on its own, importing the rest from the packages;
                                   add sound: @youj/sound, with sound={beacon} on YoujProvider;
                                   add locale de, add theme terminal: a language, a theme's stylesheet
                                   (the core holds English, Basalt and Graphite);
                                   stops (exit 1) when Youj's code needs files of yours replaced;
                                   prints the import for what it copied
    --overwrite                    replace files of yours with Youj's (lib/utils.ts is always merged)
    --path, -p <dir>               where the items go, instead of where components.json says
    --dry-run                      list the files it would copy; write and install nothing
    --diff[=file]                 show shadcn's diff of what would change (registry apps)
    --view[=file]                 show the items' files as the registry has them (registry apps)
    --yes, -y                      don't ask before replacing files of yours
                                   other options go to shadcn as they are
                                   (shadcn's own only: any other stops the run, naming the nearest)`,
  doctor: `  ${bold('npx @youj/cli doctor')}            check the setup and print fixes
    --strict                       fail on what's to look at too, and typecheck the app (tsc)`,
  mcp: `  ${bold('npx @youj/cli mcp')}               add the Youj MCP server to your AI editor's config
    --client <${MCP_CLIENTS.join('|')}|all>   which editor (repeatable; default: ask, or the ones found)
    --yes, -y                      don't ask which editors
    --print                        print the config; write nothing
    --dry-run                      show the changes; write nothing`,
}

const GLOBAL_HELP = `  --cwd <dir>                      the app's folder (default: here)
  -c <dir>                         the same as --cwd
  --latest                         init, create, add: copy items from the registry's latest alias
                                   (/r/<name>.json) instead of this CLI's version (/r/v${VERSION}/<name>.json)

Env: YOUJ_REGISTRY_URL overrides the registry (default https://www.youj.dev/r/v${VERSION}/{name}.json); ${REGISTRY_LATEST_ENV}=1 is --latest; YOUJ_REGISTRY_TOKEN sends it a bearer token (a private registry).`

const HELP = `${HEAD}\n\n${Object.values(COMMAND_HELP).join('\n\n')}\n\n${GLOBAL_HELP}`

/** `youj <command> --help`: that command's options and the global ones; the whole help for no command or an unknown one. */
const helpFor = (command: string | undefined) => (command && COMMAND_HELP[command] ? `${HEAD}\n\n${COMMAND_HELP[command]}\n\n${GLOBAL_HELP}` : HELP)

async function main(argv: string[]) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: false,
    options: {
      yes: { type: 'boolean', short: 'y' },
      mode: { type: 'string' },
      theme: { type: 'string' },
      'motion-personality': { type: 'string' },
      quality: { type: 'string' },
      look: { type: 'string' },
      cwd: { type: 'string', short: 'c' },
      'dry-run': { type: 'boolean' },
      overwrite: { type: 'boolean' },
      'allow-low-contrast': { type: 'boolean' },
      client: { type: 'string', multiple: true },
      print: { type: 'boolean' },
      latest: { type: 'boolean' },
      strict: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  })
  const [command] = positionals
  const cwd = typeof values.cwd === 'string' ? values.cwd : process.cwd()
  if (values.version) return console.log(VERSION)
  if (values.help || !command) return console.log(helpFor(command))
  // A misspelled option must stop the run (`--dryrun` is no preview), and --cwd must name a folder that is there.
  checkOptions(argv, command)
  if (values.cwd === true) throw new CliError('--cwd takes a folder: --cwd apps/web')
  if (typeof values.cwd === 'string' && !statSync(resolve(cwd), { throwIfNoEntry: false })?.isDirectory()) throw new CliError(`--cwd names ${resolve(cwd)}, which isn't a folder.`)
  // Every registry fetch reads the template from the environment (constants.ts), so the flag is set there once.
  if (values.latest) process.env[REGISTRY_LATEST_ENV] = '1'

  if (command === 'init') {
    p.intro(`${bold('Youj')} ${dim(`v${VERSION}`)}`)
    const result = await init(
      {
        cwd,
        yes: Boolean(values.yes) || !process.stdin.isTTY,
        mode: values.mode as Mode | undefined,
        theme: values.theme as ThemeId | undefined,
        motion: values['motion-personality'] as Motion | undefined,
        quality: values.quality as Quality | undefined,
        look: checkLook(typeof values.look === 'string' ? values.look : undefined),
        dryRun: Boolean(values['dry-run']),
      },
      run,
      terminalUi,
    )
    terminalUi.changes(result.changes)
    if (values['dry-run'] && result.commands.length) terminalUi.note('Would run', result.commands.map(format).join('\n'))
    for (const step of result.manual) terminalUi.warn(step)
    const theirs = result.shadcn
    const named = theirs.length > 4 ? `${theirs.slice(0, 4).join(', ')}…` : theirs.join(', ')
    const next =
      result.mode === 'package'
        ? `import { Button } from '@youj/react'\n\n${theirs.length ? dim(`Your own ${named} stay as they are: switch each import to @youj/react when you're ready.\n`) : ''}${dim('Then: npx @youj/cli doctor, any time')}`
        : theirs.length
          ? `npx @youj/cli add ${theirs.slice(0, 5).join(' ')} --overwrite\n\n${dim(`Your own ${named} stay until you replace them. Youj's components import each other, so replace the shared ones together, as above.\n`)}${dim('Then: npx @youj/cli doctor, any time')}`
          : `npx @youj/cli add button dialog\n\n${dim('Then: npx @youj/cli doctor, any time')}`
    const reactDocument = result.framework === 'next-app' || result.framework === 'next-pages' || result.framework === 'react-router'
    const toggle = result.mode === 'package' ? `<ThemeToggle /> from ${PACKAGES.react}` : 'a ThemeToggle (npx @youj/cli add theme-toggle)'
    const scheme = dim(
      reactDocument && result.mode === 'registry'
        ? `Dark by default: data-theme="dark" on <html>. Remove it for light, or add ${toggle} to switch it (see Installation: Theme).`
        : `Light or dark follows the visitor's system until they choose: ${reactDocument ? '<ThemeScript /> in <head>' : 'the script in <head>'} restores their choice before the page paints.\n` +
            `Add ${toggle} to let them switch, or switch from code with setThemeMode('dark') from ${PACKAGES.core} (see Installation: Theme).`,
    )
    if (!values.yes && process.stdin.isTTY && !values['dry-run'] && (await terminalUi.confirm('Add the Youj MCP server to your AI editor? It helps it use Youj correctly.', false)))
      reportMcp(await mcp({ cwd }, terminalUi))
    p.outro(result.changes.length ? `Done. Next:\n\n${next}\n${scheme}` : 'Already set up. Nothing changed.')
    return
  }

  if (command === 'create') {
    p.intro(`${bold('Youj Create')} ${dim(`v${VERSION}`)}`)
    const dryRun = Boolean(values['dry-run'])
    const result = await create(
      {
        cwd,
        link: positionals[1] ?? '',
        mode: values.mode as Mode | undefined,
        overwrite: Boolean(values.overwrite),
        dryRun,
        allowLowContrast: Boolean(values['allow-low-contrast']),
      },
      run,
      terminalUi,
    )
    terminalUi.changes(result.changes)
    if (dryRun && result.commands.length) terminalUi.note('Would run', result.commands.map(format).join('\n'))
    for (const step of result.manual) terminalUi.warn(step)
    p.outro(dryRun ? 'Dry run: nothing was written or run.' : result.changes.length || result.commands.length ? `Done. Next:\n\n${result.next}` : 'Already set up. Nothing changed.')
    return
  }

  if (command === 'mcp') {
    p.intro(`${bold('Youj MCP')} ${dim(`v${VERSION}`)}`)
    const result = await mcp(
      {
        cwd,
        clients: values.client as string[] | undefined,
        yes: Boolean(values.yes) || !process.stdin.isTTY,
        dryRun: Boolean(values['dry-run']),
        print: Boolean(values.print),
      },
      terminalUi,
    )
    reportMcp(result, Boolean(values.print))
    p.outro(values.print ? 'Paste the config above into your editor.' : result.changes.length ? (values['dry-run'] ? 'Dry run: nothing was written.' : 'Done. Restart the editor, or reload its MCP servers.') : 'Already set up. Nothing changed.')
    return
  }

  if (command === 'add') {
    // Items are the bare words; flags (and the values of shadcn's --path) go to shadcn; --cwd and --latest are ours.
    const items: string[] = []
    const passthrough: string[] = []
    const args = argv.slice(argv.indexOf('add') + 1)
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]!
      if (arg === '--cwd' || arg === '-c') i++
      else if (arg.startsWith('--cwd=') || arg === '--latest') continue
      else if (arg === '--path' || arg === '-p') passthrough.push(arg, args[++i] ?? '')
      else if (arg.startsWith('-')) passthrough.push(arg)
      else items.push(arg)
    }
    await add(cwd, expandItemAliases(items), passthrough, run, terminalUi, process.env, Boolean(process.stdin.isTTY) && !values.yes)
    return
  }

  if (command === 'doctor') {
    p.intro(`${bold('Youj doctor')} ${dim(`v${VERSION}`)}`)
    const checks = doctor(cwd)
    // --strict: what's to look at fails too, and the app's own TypeScript runs over it.
    if (values.strict) checks.push(await terminalUi.task('Typechecking the app', 'Typechecked', () => typecheck(cwd, run)))
    for (const check of checks) {
      const text = check.fix ? `${check.message}\n${dim(`→ ${check.fix}`)}` : check.message
      if (check.level === 'ok') p.log.success(text)
      else if (check.level === 'warn') p.log.warn(text)
      else p.log.error(text)
    }
    const errors = checks.filter((c) => c.level === 'error').length
    const warnings = checks.filter((c) => c.level === 'warn').length
    p.outro(errors ? `${errors} to fix${warnings ? `, ${warnings} to look at` : ''}.` : warnings ? `Works; ${warnings} to look at${values.strict ? ' (--strict fails on these too)' : ''}.` : 'All good.')
    process.exitCode = errors || (values.strict && warnings) ? 1 : 0
    return
  }

  throw new CliError(`Unknown command "${command}". Try: init, create, add, doctor, mcp (or --help).`)
}

function reportMcp(result: McpResult, print = false) {
  if (!print) terminalUi.changes(result.changes)
  for (const s of result.snippets) {
    if (!print && s.manual) terminalUi.warn(`${CLIENTS[s.client].name} keeps its servers in a settings dialog. In ${s.path}, add this:`)
    else if (!print) terminalUi.warn(`Couldn't read ${s.path} (comments?), so it's unchanged. Add this to it:`)
    terminalUi.note(`${CLIENTS[s.client].name}: ${s.path}`, s.text.trimEnd())
  }
  if (result.clients.includes('claude')) terminalUi.info(`Claude Code, without a .mcp.json: ${result.claudeCommand}`)
  if (result.clients.includes('codex')) terminalUi.info(`Codex, for every project (~/.codex/config.toml): ${result.codexCommand}`)
}

main(process.argv.slice(2)).catch((error: unknown) => {
  if (error instanceof CliError) p.log.error(error.message)
  else console.error(error)
  process.exitCode = 1
})
