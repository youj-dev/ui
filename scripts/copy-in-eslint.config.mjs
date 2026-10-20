// create-next-app's eslint.config.mjs, for scripts/check-copy-in-lint.mjs. rootDir is a Next app, so the pages-link rule finds its app/ folder.
import { join } from 'node:path'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default [...nextVitals, ...nextTs, { settings: { next: { rootDir: join(import.meta.dirname, '../apps/docs') } } }]
