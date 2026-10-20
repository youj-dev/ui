import { describe, expect, it } from 'vitest'
import worker from '../worker/index'
import meta from '../data/meta.json'

/* Smoke for scripts/ship.sh, not part of the suite: with YOUJ_MCP_HOSTED=<url> set it asks the deployed Worker
 * for `tools/list` and compares it with the one this checkout would serve. A mismatch means the hosted index is
 * out of date: run pnpm -F @youj/mcp cf:deploy. YOUJ_MCP_TOKEN is sent as a bearer token if the Worker is gated. */
const url = process.env.YOUJ_MCP_HOSTED
const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }

const rpc = async (send: (init: RequestInit) => Promise<Response>, method: string) => {
  const response = await send({ method: 'POST', headers: { ...headers, ...(process.env.YOUJ_MCP_TOKEN && { authorization: `Bearer ${process.env.YOUJ_MCP_TOKEN}` }) }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: method === 'initialize' ? { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'ship', version: '0' } } : undefined }) })
  return response
}

describe.skipIf(!url)('hosted MCP', () => {
  it('serves the tools and version this checkout builds', async () => {
    const hosted = (init: RequestInit) => fetch(url!, init)
    const local = (init: RequestInit) => worker.fetch(new Request('https://mcp.youj.dev/', init))

    const gate = await rpc(hosted, 'initialize')
    if (gate.status === 401) {
      console.warn('hosted MCP answers 401: set YOUJ_MCP_TOKEN to check it; freshness NOT verified')
      return
    }
    expect(gate.status, 'hosted MCP answers').toBe(200)
    const info = ((await gate.json()) as { result: { serverInfo: { version: string } } }).result.serverInfo
    expect(info.version, 'hosted version').toBe(meta.version)

    const tools = async (send: typeof hosted) => {
      const body = (await (await rpc(send, 'tools/list')).json()) as { result: { tools: { name: string }[] } }
      return body.result.tools.sort((a, b) => a.name.localeCompare(b.name))
    }
    const [theirs, ours] = [await tools(hosted), await tools(local)]
    expect(theirs.map((t) => t.name), 'hosted tool names').toEqual(ours.map((t) => t.name))
    expect(theirs, 'hosted tool descriptions and schemas').toEqual(ours)
  })
})
