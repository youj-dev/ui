import { defineConfig } from 'tsdown'

/* The published CLI: one ESM file with a shebang, run by `npx @youj/cli`.
 * @clack/prompts stays a dependency; everything else is Node built-ins. */
export default defineConfig({
  entry: ['src/cli.ts'],
  platform: 'node',
  target: 'node20',
  dts: false,
  outputOptions: { banner: '#!/usr/bin/env node' },
})
