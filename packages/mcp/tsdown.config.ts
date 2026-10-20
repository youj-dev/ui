import { defineConfig } from 'tsdown'

/* The published server: one ESM file with a shebang, run by `npx @youj/mcp`.
 * The MCP SDK, zod and the theme code from @youj/core are bundled in
 * (all devDependencies), so `npx` installs nothing else; the index ships
 * beside it in data/. The list is what THIRD_PARTY_NOTICES.md credits. */
export default defineConfig({
  entry: { server: 'src/bin.ts' },
  platform: 'node',
  target: 'node20',
  dts: false,
  deps: {
    onlyBundle: ['@modelcontextprotocol/sdk', 'zod', 'zod-to-json-schema', 'ajv', 'ajv-formats', 'fast-deep-equal', 'fast-uri', 'json-schema-traverse'],
  },
  outputOptions: { banner: '#!/usr/bin/env node' },
})
