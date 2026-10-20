import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { VERSION } from '../src/constants'
import { claudeCommand, codexCommand, mcp, withServer } from '../src/mcp'
import { silentUi } from '../src/ui'
import { fixture, read, write } from './helpers'

const homes: string[] = []
afterEach(() => {
  for (const dir of homes.splice(0)) rmSync(dir, { recursive: true, force: true })
})
function home() {
  const dir = mkdtempSync(join(tmpdir(), 'youj-cli-home-'))
  homes.push(dir)
  return dir
}

const PINNED = { command: 'npx', args: ['-y', `@youj/mcp@${VERSION}`] }

describe('mcp', () => {
  it('pins the server to this CLI’s version when the app has no Youj package', async () => {
    const result = await mcp({ cwd: fixture('vite'), clients: ['claude'], print: true, home: home() }, silentUi())
    expect(result.claudeCommand).toContain(`@youj/mcp@${VERSION}`)
    expect(result.claudeCommand).not.toContain('latest')
  })

  it('writes each editor’s project config', async () => {
    const root = fixture('next-app')
    const result = await mcp({ cwd: root, clients: ['claude', 'cursor,vscode'], home: home() }, silentUi())
    expect(result.changes.map((c) => c.path).sort()).toEqual(['.cursor/mcp.json', '.mcp.json', '.vscode/mcp.json'])
    expect(JSON.parse(read(root, '.mcp.json'))).toEqual({ mcpServers: { youj: PINNED } })
    expect(JSON.parse(read(root, '.cursor/mcp.json'))).toEqual({ mcpServers: { youj: PINNED } })
    expect(JSON.parse(read(root, '.vscode/mcp.json'))).toEqual({ servers: { youj: { type: 'stdio', ...PINNED } } })
    expect(result.claudeCommand).toBe(`claude mcp add youj -- npx -y @youj/mcp@${VERSION}`)
  })

  it('changes nothing when run again', async () => {
    const root = fixture('vite')
    await mcp({ cwd: root, clients: ['all'], home: home() }, silentUi())
    const again = await mcp({ cwd: root, clients: ['all'], home: home() }, silentUi())
    expect(again.changes.filter((c) => !c.path.startsWith('~/'))).toEqual([])
  })

  it('merges into a config with other servers, keeping its indentation', async () => {
    const root = fixture('next-pages')
    write(root, '.cursor/mcp.json', '{\n\t"mcpServers": {\n\t\t"github": { "command": "gh-mcp" }\n\t},\n\t"other": true\n}\n')
    await mcp({ cwd: root, clients: ['cursor'], home: home() }, silentUi())
    const text = read(root, '.cursor/mcp.json')
    expect(JSON.parse(text)).toEqual({ mcpServers: { github: { command: 'gh-mcp' }, youj: PINNED }, other: true })
    expect(text).toMatch(/^\t"mcpServers"/m)
  })

  it('pins the server to the app’s Youj version', async () => {
    const root = fixture('next-app')
    write(root, 'node_modules/@youj/react/package.json', JSON.stringify({ name: '@youj/react', version: '0.3.1' }))
    const result = await mcp({ cwd: root, clients: ['claude'], home: home() }, silentUi())
    expect(JSON.parse(read(root, '.mcp.json')).mcpServers.youj.args).toEqual(['-y', '@youj/mcp@0.3.1'])
    expect(result.claudeCommand).toContain('@youj/mcp@0.3.1')
  })

  it('writes Windsurf’s config in the home folder', async () => {
    const root = fixture('vite')
    const userHome = home()
    const result = await mcp({ cwd: root, clients: ['windsurf'], home: userHome }, silentUi())
    expect(result.changes.map((c) => c.path)).toEqual(['~/.codeium/windsurf/mcp_config.json'])
    expect(JSON.parse(read(userHome, '.codeium/windsurf/mcp_config.json'))).toEqual({ mcpServers: { youj: PINNED } })
  })

  it('writes Codex’s config as TOML, Gemini CLI’s and Zed’s as JSON under their own keys', async () => {
    const root = fixture('next-app')
    const result = await mcp({ cwd: root, clients: ['codex', 'gemini', 'zed'], home: home() }, silentUi())
    expect(result.changes.map((c) => c.path).sort()).toEqual(['.codex/config.toml', '.gemini/settings.json', '.zed/settings.json'])
    expect(read(root, '.codex/config.toml')).toBe(`[mcp_servers.youj]\ncommand = "npx"\nargs = ["-y", "@youj/mcp@${VERSION}"]\n`)
    expect(JSON.parse(read(root, '.gemini/settings.json'))).toEqual({ mcpServers: { youj: PINNED } })
    expect(JSON.parse(read(root, '.zed/settings.json'))).toEqual({ context_servers: { youj: PINNED } })
    expect(result.codexCommand).toBe(`codex mcp add youj -- npx -y @youj/mcp@${VERSION}`)
  })

  it('adds to a Codex config beside its other servers and settings, and updates its own table in place', async () => {
    const root = fixture('vite')
    write(root, '.codex/config.toml', 'model = "gpt-5"\n\n[mcp_servers.github]\ncommand = "gh-mcp"\n')
    await mcp({ cwd: root, clients: ['codex'], home: home() }, silentUi())
    expect(read(root, '.codex/config.toml')).toBe(`model = "gpt-5"\n\n[mcp_servers.github]\ncommand = "gh-mcp"\n\n[mcp_servers.youj]\ncommand = "npx"\nargs = ["-y", "@youj/mcp@${VERSION}"]\n`)
    const again = await mcp({ cwd: root, clients: ['codex'], home: home() }, silentUi())
    expect(again.changes).toEqual([])
    write(root, '.codex/config.toml', '[mcp_servers.youj]\ncommand = "npx"\nargs = ["-y", "@youj/mcp@0.1.0"]\n\n[other]\na = 1\n')
    await mcp({ cwd: root, clients: ['codex'], home: home() }, silentUi())
    expect(read(root, '.codex/config.toml')).toBe(`[mcp_servers.youj]\ncommand = "npx"\nargs = ["-y", "@youj/mcp@${VERSION}"]\n\n[other]\na = 1\n`)
  })

  it('leaves a Codex table with settings of the user’s own alone and hands back the snippet', async () => {
    const root = fixture('vite')
    const text = '[mcp_servers.youj]\nurl = "https://mcp.youj.dev"\n'
    write(root, '.codex/config.toml', text)
    const result = await mcp({ cwd: root, clients: ['codex'], home: home() }, silentUi())
    expect(result.changes).toEqual([])
    expect(result.snippets.map((s) => s.path)).toEqual(['.codex/config.toml'])
    expect(read(root, '.codex/config.toml')).toBe(text)
  })

  it('prints JetBrains’ config to paste into its settings, writing no file', async () => {
    const root = fixture('vite')
    const result = await mcp({ cwd: root, clients: ['jetbrains'], home: home() }, silentUi())
    expect(result.changes).toEqual([])
    expect(result.snippets[0]).toMatchObject({ client: 'jetbrains', manual: true })
    expect(JSON.parse(result.snippets[0]!.text)).toEqual({ mcpServers: { youj: PINNED } })
  })

  it('finds Codex, Gemini CLI, Zed and JetBrains by their folders', async () => {
    const root = fixture('next-app')
    for (const dir of ['.codex', '.gemini', '.zed', '.idea']) mkdirSync(join(root, dir))
    const result = await mcp({ cwd: root, yes: true, home: home() }, silentUi())
    expect(result.clients).toEqual(['codex', 'gemini', 'zed', 'jetbrains'])
    expect(codexCommand(PINNED)).toContain('codex mcp add youj')
  })

  it('shows the changes on --dry-run and prints the config on --print, writing nothing', async () => {
    const root = fixture('react-router')
    const dry = await mcp({ cwd: root, clients: ['claude'], dryRun: true, home: home() }, silentUi())
    expect(dry.changes.map((c) => c.path)).toEqual(['.mcp.json'])
    expect(existsSync(join(root, '.mcp.json'))).toBe(false)
    const printed = await mcp({ cwd: root, clients: ['vscode'], print: true, home: home() }, silentUi())
    expect(printed.changes).toEqual([])
    expect(printed.snippets[0]).toMatchObject({ client: 'vscode', path: '.vscode/mcp.json' })
    expect(JSON.parse(printed.snippets[0]!.text)).toEqual({ servers: { youj: { type: 'stdio', ...PINNED } } })
    expect(existsSync(join(root, '.vscode/mcp.json'))).toBe(false)
  })

  it('leaves a config it can’t parse alone and hands back the snippet', async () => {
    const root = fixture('vite')
    write(root, '.vscode/mcp.json', '{\n  // my servers\n  "servers": {}\n}\n')
    const result = await mcp({ cwd: root, clients: ['vscode'], home: home() }, silentUi())
    expect(result.changes).toEqual([])
    expect(result.snippets.map((s) => s.path)).toEqual(['.vscode/mcp.json'])
    expect(read(root, '.vscode/mcp.json')).toContain('// my servers')
  })

  it('picks the editors the project has when not asked', async () => {
    const root = fixture('next-app')
    mkdirSync(join(root, '.cursor'))
    const result = await mcp({ cwd: root, yes: true, home: home() }, silentUi())
    expect(result.clients).toEqual(['cursor'])
    const fresh = await mcp({ cwd: fixture('vite'), yes: true, home: home() }, silentUi())
    expect(fresh.clients).toEqual(['claude'])
  })

  it('rejects an unknown editor', async () => {
    await expect(mcp({ cwd: fixture('vite'), clients: ['emacs'], home: home() }, silentUi())).rejects.toThrow(/--client takes claude, cursor, vscode, windsurf, codex, gemini, zed, jetbrains or all/)
  })

  it('keeps a file whose content already matches, whatever its formatting', () => {
    const text = `{"mcpServers":{"youj":{"command":"npx","args":["-y","@youj/mcp@${VERSION}"]}}}`
    expect(withServer(text, 'claude', PINNED)).toBe(text)
    expect(claudeCommand(PINNED)).toBe(`claude mcp add youj -- npx -y @youj/mcp@${VERSION}`)
  })
})
