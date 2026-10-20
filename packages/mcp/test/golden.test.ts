import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadCatalog, loadIndex } from '../src/data'
import { createServer } from '../src/server'
import worker from '../worker/index'

/* A sample of tool outputs, hashed, in test/fixtures/golden-tools.json. The file was recorded before the block
 * files moved out of the index into data/sources/, so a pass means the tools still answer byte for byte.
 * Re-record on purpose, after a change to the docs or the tools, with:  GOLDEN_WRITE=1 pnpm -F @youj/mcp test */

const recordedFile = join(import.meta.dirname, 'fixtures/golden-tools.json')
const fixtures = join('test', 'fixtures')
const index = loadIndex()
const every = <T>(list: T[], step: number) => list.filter((_, i) => i % step === 0)
const blocks = every(index.blocks, 7).map((b) => b.slug)

type Call = [name: string, args: Record<string, unknown>]
const calls: Call[] = [
  ['search', { query: 'date picker' }],
  ['search', { query: 'empty state illustration' }],
  ['search', { query: 'dashboard' }],
  ['get_component', { name: 'button' }],
  ['get_component', { name: 'DataGrid' }],
  ['list_components', {}],
  ['list_loaders', {}],
  ['list_miniatures', {}],
  ['search_icons', { query: 'arrow' }],
  ['get_icon', { name: 'bell' }],
  ['suggest_icon_morph', { from: 'play', to: 'pause' }],
  ['list_blocks', {}],
  ['list_illustrations', {}],
  ['get_tokens', {}],
  ['motion_guidance', { interaction: 'button press' }],
  ['setup', { framework: 'vite' }],
  ...blocks.flatMap((name): Call[] => [['get_block', { name }], ['get_block', { name, source: true }]]),
]
// Install commands read the app on disk, so they run only against the local server's fixture apps.
const addCalls: Call[] = ['package', 'registry'].flatMap((app) => [
  ...blocks.slice(0, 6).map((name): Call => ['get_add_command', { items: [name], cwd: join(fixtures, app) }]),
  ['get_add_command', { items: ['button', 'DataGrid', blocks[0]!], cwd: join(fixtures, app) }] as Call,
])

const key = ([name, args]: Call) => `${name} ${JSON.stringify(args)}`
const fingerprint = (text: string) => `${text.length}:${createHash('sha256').update(text).digest('hex')}`
const read = (result: Awaited<ReturnType<Client['callTool']>>) => (result.content as { text: string }[]).map((c) => c.text).join('\n')

let client: Client
beforeAll(async () => {
  const [a, b] = InMemoryTransport.createLinkedPair()
  await createServer(loadCatalog()).connect(a)
  client = new Client({ name: 'golden', version: '0' })
  await client.connect(b)
})
afterAll(() => client.close())

describe('tool outputs', () => {
  it('match the recorded sample', async () => {
    const now: Record<string, string> = {}
    for (const call of [...calls, ...addCalls]) now[key(call)] = fingerprint(read(await client.callTool({ name: call[0], arguments: call[1] })))
    if (process.env.GOLDEN_WRITE || !existsSync(recordedFile)) {
      writeFileSync(recordedFile, `${JSON.stringify(now, null, 2)}\n`)
      return
    }
    expect(now).toEqual(JSON.parse(readFileSync(recordedFile, 'utf8')))
  })

  it('are the same from the remote Worker, which reads block files from its assets', async () => {
    const recorded = JSON.parse(readFileSync(recordedFile, 'utf8')) as Record<string, string>
    const sources = join(import.meta.dirname, '../data/sources')
    const ASSETS = {
      async fetch(request: Request) {
        const path = join(sources, decodeURIComponent(new URL(request.url).pathname).slice(1))
        return existsSync(path) ? new Response(readFileSync(path)) : new Response('Not found', { status: 404 })
      },
    }
    let id = 0
    for (const call of calls) {
      const response = await worker.fetch(
        new Request('https://mcp.youj.dev/', {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
          body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name: call[0], arguments: call[1] } }),
        }),
        { ASSETS },
      )
      const { result } = (await response.json()) as { result: Parameters<typeof read>[0] }
      expect(fingerprint(read(result)), key(call)).toBe(recorded[key(call)])
    }
  })
})
