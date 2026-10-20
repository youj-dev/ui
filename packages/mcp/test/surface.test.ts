import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { expect, it } from 'vitest'
import { createServer } from '../src/server'
import { loadCatalog } from '../src/data'

/* The MCP surface AI clients save: each tool's name and argument schema, and the prompt and
 * resource names. Committed as api/youj-mcp.api.json, part of `pnpm check:api`; `pnpm api:update`
 * rewrites it after an intended change. A tool or argument removed or renamed is a breaking
 * change (RELEASING.md): keep the old one as a deprecated alias. Descriptions are prose and
 * aren't part of it. */

const snapshot = join(import.meta.dirname, '../../../api/youj-mcp.api.json')

it('keeps its tool names and argument schemas', async () => {
  const server = createServer(loadCatalog(), { remote: true })
  const client = new Client({ name: 'surface', version: '0.0.0' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  await Promise.all([server.connect(a), client.connect(b)])
  const { tools } = await client.listTools()
  const { prompts } = await client.listPrompts()
  const { resourceTemplates } = await client.listResourceTemplates()
  const { resources } = await client.listResources()
  await client.close()
  const surface = {
    tools: Object.fromEntries(tools.sort((x, y) => x.name.localeCompare(y.name)).map((t) => [t.name, { inputSchema: t.inputSchema, annotations: t.annotations }])),
    prompts: prompts.map((p) => ({ name: p.name, arguments: p.arguments?.map(({ name, required }) => ({ name, required: Boolean(required) })) })).sort((x, y) => x.name.localeCompare(y.name)),
    resources: [...resourceTemplates.map((r) => r.uriTemplate), ...resources.filter((r) => !r.uri.startsWith('youj://docs/')).map((r) => r.uri)].sort(),
  }
  await expect(`${JSON.stringify(surface, null, 2)}\n`).toMatchFileSnapshot(snapshot)
})
