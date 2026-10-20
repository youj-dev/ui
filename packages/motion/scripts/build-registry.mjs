// Assembles registry.json from registry/*.json, then (unless --check) runs
// `shadcn build` into public/r, which the docs site serves beside core's and
// UI's items. The components install at components/youj/, and their imports
// from @youj/core become youj-core's files (scripts/source-registry.mjs).
//
//   node scripts/build-registry.mjs          write registry.json + public/r
//   node scripts/build-registry.mjs --check  validate only; exit 1 on problems
import { join } from 'node:path'
import { buildSourceRegistry } from '../../../scripts/source-registry.mjs'

buildSourceRegistry(join(import.meta.dirname, '..'), 'youj-motion')
