import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/* The published bundle, end to end: build it, spawn it over stdio as an
 * editor would, and talk to it with the SDK's own client. */

const pkg = join(import.meta.dirname, '..')
let client: Client

beforeAll(async () => {
  execFileSync('pnpm', ['exec', 'tsdown', '--log-level', 'error'], { cwd: pkg, stdio: 'pipe' })
  client = new Client({ name: 'youj-e2e', version: '0.0.0' })
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [join(pkg, 'dist/server.mjs')], stderr: 'pipe' }))
}, 60_000)

afterAll(async () => {
  await client?.close()
})

const text = (result: Awaited<ReturnType<Client['callTool']>>) => (result.content as { type: string; text: string }[]).map((c) => c.text).join('\n')

describe('stdio server', () => {
  it('introduces itself with instructions', () => {
    expect(client.getServerVersion()).toMatchObject({ name: 'youj', title: 'Youj' })
    expect(client.getInstructions()).toContain('suggest_icon_morph')
    // Each loader is an entry of its own: the package's root doesn't export them.
    expect(client.getInstructions()).toContain('loaders from `@youj/loaders/<id>`')
  })

  it('lists every tool, read-only, with a schema', async () => {
    const { tools } = await client.listTools()
    expect(tools.map((t) => t.name).sort()).toEqual(
      ['get_project_info', 'get_add_command', 'create_theme', 'draw_illustration', 'get_block', 'get_component', 'get_icon', 'get_illustration_guide', 'get_tokens', 'list_blocks', 'list_components', 'list_loaders', 'list_miniatures', 'list_illustrations', 'motion_guidance', 'search', 'search_icons', 'setup', 'suggest_icon_morph'].sort(),
    )
    for (const tool of tools) {
      expect(tool.description, tool.name).toBeTruthy()
      expect(tool.annotations?.readOnlyHint, tool.name).toBe(true)
    }
    expect(tools.find((t) => t.name === 'search')!.inputSchema.required).toEqual(['query'])
  })

  it('answers search and suggest_icon_morph', async () => {
    expect(text(await client.callTool({ name: 'search', arguments: { query: 'delete confirmation', limit: 5 } }))).toContain('get_component("alert-dialog")')
    const morph = text(await client.callTool({ name: 'suggest_icon_morph', arguments: { pair: 'menu → close' } }))
    expect(morph).toContain('MenuIcon')
    expect(morph).toContain('aria-expanded={open}')
  })

  it('reports a lookup miss as a tool error, and rejects bad input', async () => {
    const miss = await client.callTool({ name: 'get_component', arguments: { name: 'datepickr' } })
    expect(miss.isError).toBe(true)
    expect(text(miss)).toMatch(/Did you mean/)
    const bad = await client.callTool({ name: 'search', arguments: { query: 'x', limit: 999 } })
    expect(bad.isError).toBe(true)
  })

  it('inspects projects and returns commands over stdio with validated inputs', async () => {
    const cwd = join(pkg, 'test/fixtures/registry')
    const info = await client.callTool({ name: 'get_project_info', arguments: { cwd } })
    expect(info.isError).not.toBe(true)
    expect(text(info)).toContain('Route: registry')
    const add = await client.callTool({ name: 'get_add_command', arguments: { cwd, items: ['DATATABLETOOLBAR', 'auth-login'] } })
    expect(text(add)).toContain('npx youj add data-table auth-login')
    const unknown = await client.callTool({ name: 'get_add_command', arguments: { cwd, items: ['buton'] } })
    expect(unknown.isError).toBe(true)
    expect(text(unknown)).toContain('button')
    for (const items of [[], [''], [' '.repeat(4)], Array(51).fill('button')]) {
      expect((await client.callTool({ name: 'get_add_command', arguments: { cwd, items } })).isError).toBe(true)
    }
    expect((await client.callTool({ name: 'get_project_info', arguments: { cwd: '' } })).isError).toBe(true)
    expect((await client.callTool({ name: 'get_project_info', arguments: { cwd: 'bad\0path' } })).isError).toBe(true)
    expect((await client.callTool({ name: 'get_project_info', arguments: { cwd: '/' } })).isError).toBe(true)
    expect((await client.callTool({ name: 'get_project_info', arguments: { cwd: '../..' } })).isError).toBe(true)
  })

  it('knows the illustrations over stdio', async () => {
    const cwd = join(pkg, 'test/fixtures/registry')
    expect(text(await client.callTool({ name: 'get_add_command', arguments: { cwd, items: ['illustration-coffee'] } }))).toContain('npx youj add illustration-coffee')
    expect(text(await client.callTool({ name: 'get_component', arguments: { name: 'Illustration' } }))).toContain("from '@youj/illustrations'")
    expect(text(await client.callTool({ name: 'list_illustrations', arguments: { category: 'food' } }))).toContain('`coffee`')
    expect(text(await client.callTool({ name: 'search', arguments: { query: 'coffee', kinds: ['illustration'] } }))).toContain('illustration-coffee')
    expect(text(await client.callTool({ name: 'get_block', arguments: { name: 'app-customers' } }))).toContain('blocks/app/customers.tsx')
    expect(text(await client.callTool({ name: 'get_block', arguments: { slug: 'app-customers' } }))).toContain('blocks/app/customers.tsx')
    expect((await client.callTool({ name: 'get_block', arguments: {} })).isError).toBe(true)
    expect(text(await client.callTool({ name: 'list_loaders', arguments: {} }))).toContain('loaders')
    expect(text(await client.callTool({ name: 'list_miniatures', arguments: {} }))).toContain('miniatures')
    expect(text(await client.callTool({ name: 'list_components', arguments: { kind: 'ui' } }))).toContain('`button`')
    const page = await client.readResource({ uri: 'youj://docs/illustrations/build' })
    expect((page.contents[0] as { text: string }).text).toMatch(/^# Illustration builder/)
  })

  it('guides and draws an illustration over stdio, and reports a bad scene as a tool error', async () => {
    expect(text(await client.callTool({ name: 'get_illustration_guide', arguments: {} }))).toContain('## Composing one')
    const cwd = join(pkg, 'test/fixtures/registry')
    const scene = { name: 'Cube', parts: [{ type: 'box', x: 3, y: 3, z: 0.5, w: 2, d: 2, h: 1, lit: true }] }
    const drawn = await client.callTool({ name: 'draw_illustration', arguments: { scene, cwd } })
    expect(drawn.isError).not.toBe(true)
    expect(text(drawn)).toContain('export function IllustrationCube(props: IllustrationProps)')
    expect(text(drawn)).toContain('/illustrations/build?name=Cube&s=1!P!b_3_3_0.5_2_2_1_sna')
    const bad = await client.callTool({ name: 'draw_illustration', arguments: { scene: { parts: [{ type: 'box', x: 9 }] }, cwd } })
    expect(bad.isError).toBe(true)
    expect(text(bad)).toContain('x 9 is out of range; use 6')
  })

  it('serves docs as resources and the prompts', async () => {
    const { resources } = await client.listResources()
    expect(resources.some((r) => r.uri === 'youj://docs/components/button')).toBe(true)
    const page = await client.readResource({ uri: 'youj://docs/components/button' })
    expect((page.contents[0] as { text: string }).text).toMatch(/^# Button/)
    const { prompts } = await client.listPrompts()
    expect(prompts.map((p) => p.name)).toEqual(['build-screen', 'brand-theme'])
  })
})
