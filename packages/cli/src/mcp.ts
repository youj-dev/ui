import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { PACKAGES, VERSION } from './constants'
import { installedVersion } from './detect'
import { Project, type Change } from './project'
import { CliError, type Ui } from './ui'

/* `youj mcp`: adds the Youj MCP server to an editor's config. Each
 * editor keeps a small JSON file (Codex a TOML one); the server goes in
 * under `youj`, merged into whatever else is there. Re-running changes
 * nothing; a config that can't be read (JSON with comments) is left alone
 * and printed instead. JetBrains keeps its servers in a settings dialog, no
 * file, so its config is always printed to paste. */

export const MCP_PACKAGE = '@youj/mcp'
export const SERVER_NAME = 'youj'

export type McpClient = 'claude' | 'cursor' | 'vscode' | 'windsurf' | 'codex' | 'gemini' | 'zed' | 'jetbrains'
export const MCP_CLIENTS: McpClient[] = ['claude', 'cursor', 'vscode', 'windsurf', 'codex', 'gemini', 'zed', 'jetbrains']

interface ClientConfig {
  name: string
  /** Where the config lives: in the project, in the user's home folder, or in the editor's settings dialog (never written). */
  scope: 'project' | 'user' | 'manual'
  /** The file, or for a `manual` client where to paste the config. */
  path: string
  /** The file's format. */
  format: 'json' | 'toml'
  /** The key servers go under (the JSON key, or the TOML table `mcp_servers`). */
  key: 'mcpServers' | 'servers' | 'context_servers'
  /** Extra fields the editor wants on a stdio server. */
  extra?: Record<string, string>
}

export const CLIENTS: Record<McpClient, ClientConfig> = {
  claude: { name: 'Claude Code', scope: 'project', path: '.mcp.json', format: 'json', key: 'mcpServers' },
  cursor: { name: 'Cursor', scope: 'project', path: '.cursor/mcp.json', format: 'json', key: 'mcpServers' },
  vscode: { name: 'VS Code', scope: 'project', path: '.vscode/mcp.json', format: 'json', key: 'servers', extra: { type: 'stdio' } },
  windsurf: { name: 'Windsurf', scope: 'user', path: '.codeium/windsurf/mcp_config.json', format: 'json', key: 'mcpServers' },
  codex: { name: 'Codex', scope: 'project', path: '.codex/config.toml', format: 'toml', key: 'mcpServers' },
  gemini: { name: 'Gemini CLI', scope: 'project', path: '.gemini/settings.json', format: 'json', key: 'mcpServers' },
  zed: { name: 'Zed', scope: 'project', path: '.zed/settings.json', format: 'json', key: 'context_servers' },
  jetbrains: { name: 'JetBrains AI Assistant', scope: 'manual', path: 'Settings | Tools | AI Assistant | Model Context Protocol (MCP)', format: 'json', key: 'mcpServers' },
}

/** The server as a stdio command, pinned to the app's Youj version when it has one, else to this CLI's, which is released with it. */
export function serverCommand(root: string): { command: string; args: string[] } {
  const version = Object.values(PACKAGES).map((name) => installedVersion(root, name)).find(Boolean)
  return { command: 'npx', args: ['-y', `${MCP_PACKAGE}@${version ?? VERSION}`] }
}

/** Claude Code's own command for the same thing, for people who'd rather not have a .mcp.json. */
export function claudeCommand(server: { command: string; args: string[] }): string {
  return `claude mcp add ${SERVER_NAME} -- ${server.command} ${server.args.join(' ')}`
}

/** Codex's own command for the same thing, which writes ~/.codex/config.toml. */
export function codexCommand(server: { command: string; args: string[] }): string {
  return `codex mcp add ${SERVER_NAME} -- ${server.command} ${server.args.join(' ')}`
}

type Server = { command: string; args: string[] }

/** The Codex config table for the server: TOML, where a JSON string is a valid basic string. */
function tomlBlock(server: Server): string {
  return `[mcp_servers.${SERVER_NAME}]\ncommand = ${JSON.stringify(server.command)}\nargs = [${server.args.map((a) => JSON.stringify(a)).join(', ')}]\n`
}

/** Codex's config with the server's table in it, or null when `mcp_servers.youj` is written some way we don't edit (an inline table, dotted keys). */
function withTomlServer(text: string | null, server: Server): string | null {
  const block = tomlBlock(server)
  if (!text?.trim()) return block
  const header = new RegExp(`^\\[mcp_servers\\.${SERVER_NAME}\\][ \\t]*(#.*)?$`, 'm').exec(text)
  if (!header) {
    if (new RegExp(`^[ \\t]*(mcp_servers\\s*=|mcp_servers\\.${SERVER_NAME}\\b|\\[mcp_servers\\]|\\[mcp_servers\\.["']?${SERVER_NAME}["']?\\.)`, 'm').test(text)) return null
    return `${text.replace(/\n*$/, '\n')}\n${block}`
  }
  const start = header.index
  const afterHeader = start + header[0].length
  const next = /\n\[/.exec(text.slice(afterHeader))
  const end = next ? afterHeader + next.index + 1 : text.length
  const current = text.slice(start, end).trim()
  if (current === block.trim()) return text
  // Keys we don't know in the old table (a bearer token, a timeout) mean it's the user's; don't guess.
  if (current.split('\n').some((line) => /^\s*[\w-]+\s*=/.test(line) && !/^\s*(command|args)\s*=/.test(line))) return null
  return `${text.slice(0, start)}${block}${end < text.length ? '\n' : ''}${text.slice(end)}`
}

export function configSnippet(client: McpClient, server: { command: string; args: string[] }): string {
  const { key, extra, format } = CLIENTS[client]
  if (format === 'toml') return tomlBlock(server)
  return `${JSON.stringify({ [key]: { [SERVER_NAME]: { ...extra, ...server } } }, null, 2)}\n`
}

/**
 * The config with the Youj server in it, or null when the file isn't plain
 * JSON. Other servers and fields stay as they are; the file's indentation is kept.
 */
export function withServer(text: string | null, client: McpClient, server: { command: string; args: string[] }): string | null {
  const { key, extra, format } = CLIENTS[client]
  if (format === 'toml') return withTomlServer(text, server)
  let config: Record<string, unknown> = {}
  if (text?.trim()) {
    try {
      config = JSON.parse(text) as Record<string, unknown>
    } catch {
      return null
    }
    if (typeof config !== 'object' || config === null || Array.isArray(config)) return null
  }
  const servers = (config[key] && typeof config[key] === 'object' ? config[key] : {}) as Record<string, unknown>
  const next = { ...config, [key]: { ...servers, [SERVER_NAME]: { ...extra, ...server } } }
  const indent = text?.match(/^([ \t]+)"/m)?.[1] ?? '  '
  const out = `${JSON.stringify(next, null, indent)}\n`
  // Same content, different formatting: leave the file alone.
  if (text && JSON.stringify(JSON.parse(text)) === JSON.stringify(next)) return text
  return out
}

/** Editors this project already has config folders or files for. */
export function detectClients(project: Project): McpClient[] {
  const found: McpClient[] = []
  if (project.exists('.mcp.json') || project.exists('CLAUDE.md') || project.exists('.claude')) found.push('claude')
  if (project.exists('.cursor')) found.push('cursor')
  if (project.exists('.vscode')) found.push('vscode')
  if (project.exists('.codex')) found.push('codex')
  if (project.exists('.gemini') || project.exists('GEMINI.md')) found.push('gemini')
  if (project.exists('.zed')) found.push('zed')
  if (project.exists('.idea')) found.push('jetbrains')
  return found
}

export interface McpOptions {
  cwd: string
  clients?: string[]
  yes?: boolean
  /** Show what would change; write nothing. */
  dryRun?: boolean
  /** Print each editor's config; write nothing. */
  print?: boolean
  /** Where user-level configs live (Windsurf's); the home folder by default. */
  home?: string
}

export interface McpResult {
  clients: McpClient[]
  changes: Change[]
  /** Configs to paste by hand: printed on request, or for files that couldn't be read. */
  snippets: { client: McpClient; path: string; text: string; /** Pasted into a dialog: there's no file to have written. */ manual?: boolean }[]
  claudeCommand: string
  codexCommand: string
}

async function chooseClients(project: Project, options: McpOptions, ui: Ui): Promise<McpClient[]> {
  if (options.clients?.length) {
    const ids = options.clients.flatMap((c) => c.split(',')).map((c) => c.trim().toLowerCase()).filter(Boolean)
    const expanded = ids.includes('all') ? MCP_CLIENTS : ids
    const unknown = expanded.filter((c) => !(MCP_CLIENTS as string[]).includes(c))
    if (unknown.length) throw new CliError(`--client takes ${MCP_CLIENTS.join(', ')} or all; got "${unknown.join(', ')}".`)
    return [...new Set(expanded)] as McpClient[]
  }
  const detected = detectClients(project)
  if (options.yes) return detected.length ? detected : ['claude']
  const initial = detected[0] ?? 'claude'
  const picked = await ui.select<McpClient | 'project'>(
    'Which editor?',
    [
      ...MCP_CLIENTS.map((c) => ({ value: c, label: CLIENTS[c].name, hint: `${CLIENTS[c].scope === 'user' ? '~/' : ''}${CLIENTS[c].scope === 'manual' ? 'paste in settings' : CLIENTS[c].path}${detected.includes(c) ? ' · found' : ''}` })),
      { value: 'project', label: 'Claude Code, Cursor and VS Code', hint: 'all three project configs' },
    ],
    initial,
  )
  return picked === 'project' ? ['claude', 'cursor', 'vscode'] : [picked]
}

export async function mcp(options: McpOptions, ui: Ui): Promise<McpResult> {
  const project = new Project(resolve(options.cwd))
  const home = new Project(resolve(options.home ?? homedir()))
  const clients = await chooseClients(project, options, ui)
  const server = serverCommand(project.root)
  const snippets: McpResult['snippets'] = []
  for (const client of clients) {
    const config = CLIENTS[client]
    const target = config.scope === 'user' ? home : project
    const shown = config.scope === 'user' ? `~/${config.path}` : config.path
    if (config.scope === 'manual') {
      snippets.push({ client, path: shown, text: configSnippet(client, server), manual: true })
      continue
    }
    if (options.print) {
      snippets.push({ client, path: shown, text: configSnippet(client, server) })
      continue
    }
    const next = withServer(target.read(config.path), client, server)
    if (next === null) snippets.push({ client, path: shown, text: configSnippet(client, server) })
    else target.write(config.path, next)
  }
  const staged = [...project.pending, ...home.pending.map((c) => ({ ...c, path: `~/${c.path}` }))]
  if (!options.dryRun && !options.print) {
    project.commit()
    home.commit()
  }
  return { clients, changes: staged, snippets, claudeCommand: claudeCommand(server), codexCommand: codexCommand(server) }
}
