import { describe, expect, it } from 'vitest'
import worker from '../worker/index'

const call = (body: unknown, env?: { STEALTH_TOKEN?: string }, authorization?: string) =>
  worker.fetch(
    new Request('https://mcp.youj.dev/', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...(authorization && { authorization }) },
      body: JSON.stringify(body),
    }),
    env,
  )

const rpc = async (id: number, method: string, params?: unknown) => {
  const response = await call({ jsonrpc: '2.0', id, method, params })
  expect(response.status).toBe(200)
  return (await response.json()) as { result: any }
}

describe('remote worker', () => {
  it('explains how to connect at /', async () => {
    const response = await worker.fetch(new Request('https://mcp.youj.dev/'))
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('https://mcp.youj.dev')
  })

  it('initializes without a session', async () => {
    const { result } = await rpc(1, 'initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '0' } })
    expect(result.serverInfo.name).toBe('youj')
  })

  it('lists the stdio server\'s tools, minus the local project inspector', async () => {
    const { result } = await rpc(2, 'tools/list')
    const names = result.tools.map((tool: { name: string }) => tool.name)
    expect(names).toContain('search')
    expect(names).toContain('get_component')
    expect(names).not.toContain('get_project_info')
  })

  it('answers a tool call from the bundled index', async () => {
    const { result } = await rpc(3, 'tools/call', { name: 'get_component', arguments: { name: 'button' } })
    expect(result.isError).toBeFalsy()
    expect(result.content[0].text).toMatch(/button/i)
  })

  it('refuses other paths', async () => {
    expect((await worker.fetch(new Request('https://mcp.youj.dev/nope'))).status).toBe(404)
    expect((await worker.fetch(new Request('https://mcp.youj.dev/mcp', { method: 'POST' }))).status).toBe(404)
  })

  it('asks for the key while STEALTH_TOKEN is set, and takes only the right one', async () => {
    const list = { jsonrpc: '2.0', id: 1, method: 'tools/list' }
    const env = { STEALTH_TOKEN: 'tok-123' }
    expect((await call(list, env)).status).toBe(401)
    expect((await call(list, env, 'Bearer tok-12')).status).toBe(401)
    expect((await call(list, env, 'Basic tok-123')).status).toBe(401)
    expect((await call(list, env, 'Bearer tok-123')).status).toBe(200)
    expect((await worker.fetch(new Request('https://mcp.youj.dev/'), env)).status).toBe(200)
  })

  it('refuses a body over 64 KB with 413, declared or streamed', async () => {
    const big = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: { pad: 'x'.repeat(65 * 1024) } })
    const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }
    expect((await worker.fetch(new Request('https://mcp.youj.dev/', { method: 'POST', headers, body: big }))).status).toBe(413)
    const streamed = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(big)); c.close() } })
    const request = new Request('https://mcp.youj.dev/', { method: 'POST', headers, body: streamed, duplex: 'half' } as RequestInit)
    expect((await worker.fetch(request)).status).toBe(413)
  })

  it('still asks for the key before judging the body size', async () => {
    const big = { jsonrpc: '2.0', id: 1, method: 'tools/list', params: { pad: 'x'.repeat(65 * 1024) } }
    expect((await call(big, { STEALTH_TOKEN: 'tok-123' })).status).toBe(401)
    expect((await call(big, { STEALTH_TOKEN: 'tok-123' }, 'Bearer tok-123')).status).toBe(413)
  })

  it('refuses methods the transport does not use', async () => {
    expect((await worker.fetch(new Request('https://mcp.youj.dev/', { method: 'PUT', body: '{}' }))).status).toBe(405)
  })
})
