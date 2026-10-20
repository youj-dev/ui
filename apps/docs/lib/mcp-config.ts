/* How each editor adds the Youj MCP server, for the AI & MCP page and its
 * Markdown twin. `npx youj mcp` writes the same files
 * (packages/cli/src/mcp.ts). No imports, so lib/markdown.ts can use it
 * anywhere it runs. */

export interface McpEditor {
  id: 'claude' | 'cursor' | 'vscode' | 'windsurf' | 'codex' | 'gemini' | 'zed' | 'jetbrains'
  name: string
  /** The config file, from the project root (or `~` for a user config). */
  path: string
  config: string
  /** The config's language, for highlighting. */
  lang: 'json' | 'toml'
  /** The editor's own command, where it has one. */
  command?: string
  /** What that command is, after "Or ". */
  commandNote?: string
  /** The editor keeps its servers in a settings dialog: `path` is where to paste, and the CLI prints the config instead of writing it. */
  manual?: boolean
}

const server = { command: 'npx', args: ['-y', '@youj/mcp@latest'] }
/** Pretty JSON with short arrays of strings on one line, as people write these files. */
const json = (value: unknown) => JSON.stringify(value, null, 2).replace(/\[\n\s+("[^\n]*"(?:,\n\s+"[^\n]*")*)\n\s*\]/g, (_, items: string) => `[${items.split(/,\n\s+/).join(', ')}]`)

const toml = `[mcp_servers.youj]\ncommand = "${server.command}"\nargs = [${server.args.map((a) => `"${a}"`).join(', ')}]`

export const MCP_EDITORS: McpEditor[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    path: '.mcp.json',
    lang: 'json',
    config: json({ mcpServers: { youj: server } }),
    command: `claude mcp add youj -- ${server.command} ${server.args.join(' ')}`,
    commandNote: "Claude Code's own command, which adds it for every project.",
  },
  { id: 'cursor', name: 'Cursor', path: '.cursor/mcp.json', lang: 'json', config: json({ mcpServers: { youj: server } }) },
  { id: 'vscode', name: 'VS Code', path: '.vscode/mcp.json', lang: 'json', config: json({ servers: { youj: { type: 'stdio', ...server } } }) },
  { id: 'windsurf', name: 'Windsurf', path: '~/.codeium/windsurf/mcp_config.json', lang: 'json', config: json({ mcpServers: { youj: server } }) },
  {
    id: 'codex',
    name: 'Codex',
    path: '.codex/config.toml',
    lang: 'toml',
    config: toml,
    command: `codex mcp add youj -- ${server.command} ${server.args.join(' ')}`,
    commandNote: "Codex's own command, which adds it to ~/.codex/config.toml for every project.",
  },
  { id: 'gemini', name: 'Gemini CLI', path: '.gemini/settings.json', lang: 'json', config: json({ mcpServers: { youj: server } }) },
  { id: 'zed', name: 'Zed', path: '.zed/settings.json', lang: 'json', config: json({ context_servers: { youj: server } }) },
  {
    id: 'jetbrains',
    name: 'JetBrains',
    path: 'Settings | Tools | AI Assistant | Model Context Protocol (MCP)',
    lang: 'json',
    config: json({ mcpServers: { youj: server } }),
    manual: true,
  },
]

/** The AI tools with a command that adds the hosted server, in the order their menu lists them. */
export type AiClient = 'claude' | 'codex' | 'gemini'
export const AI_CLIENTS: { value: AiClient; label: string }[] = [
  { value: 'claude', label: 'Claude Code' },
  { value: 'codex', label: 'Codex' },
  { value: 'gemini', label: 'Gemini CLI' },
]

/** The hosted server's URL, and each AI tool's command that adds it for every project. */
export const MCP_URL = 'https://mcp.youj.dev'
export const MCP_CONNECT: Record<AiClient, string> = {
  claude: `claude mcp add --transport http youj ${MCP_URL}`,
  codex: `codex mcp add youj --url ${MCP_URL}`,
  gemini: `gemini mcp add --transport http youj ${MCP_URL}`,
}
