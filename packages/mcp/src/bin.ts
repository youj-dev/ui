import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { loadCatalog } from './data'
import { createServer } from './server'

/* `npx @youj/mcp`: the server over stdio. stdout carries the protocol,
 * so anything for a human goes to stderr. */

const server = createServer(loadCatalog())
await server.connect(new StdioServerTransport())
process.stderr.write('Youj MCP server running on stdio\n')
