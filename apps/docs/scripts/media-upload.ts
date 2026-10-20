// `pnpm -F docs media:upload`: puts the site's promo videos and posters on R2 (the youj-media bucket, served at
// media.youj.dev) and records what is there in lib/media.json, which the build trusts (no network at build time).
//   - promo videos and posters: from apps/promo/exports/approved (what the user approved from exports/review,
//     `pnpm -F promo approve`), at promo/<name>.<first 10 hex of its sha256>.<ext>
// It lists the bucket once, uploads only keys that aren't there, and never deletes. Uses the `cf` CLI only.
// A file that can't be uploaded stays out of lib/media.json: its video is left out.
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Media } from '../lib/media.ts'

// cf reads apps/docs/cloudflare.config.ts (which demands a --mode) when run from here; R2 needs no config, so run it from the repo root.
const REPO = fileURLToPath(new URL('../../../', import.meta.url))

const DOCS = fileURLToPath(new URL('..', import.meta.url))
const APPROVED = join(DOCS, '../promo/exports/approved')
const BUCKET = 'youj-media'
const CF = join(DOCS, 'node_modules/.bin/cf')
const env = { ...process.env, CF_SEND_TELEMETRY: 'false' }
const TYPES: Record<string, string> = { '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.webm': 'video/webm' }
const PROMO = /^(.+?)\.(mp4|webm|jpg|avif|webp)$/

// 1. What should be on R2: key → file and type.
const wanted = new Map<string, { file: string; type: string }>()
const files: Media['files'] = {}
for (const name of existsSync(APPROVED) ? readdirSync(APPROVED).sort() : []) {
  const match = PROMO.exec(name)
  if (!match) continue
  const file = join(APPROVED, name)
  const digest = createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 10)
  const key = `promo/${match[1]}.${digest}.${match[2]}`
  files[name] = key
  wanted.set(key, { file, type: TYPES[extname(name)]! })
}
if (!existsSync(APPROVED)) console.warn(`media:upload: no ${APPROVED}; keeping the videos already listed in lib/media.json`)

// 2. List the bucket once.
const cf = (args: string[]) =>
  new Promise<string>((resolve, reject) => execFile(CF, args, { env, maxBuffer: 1 << 28, cwd: REPO }, (error, stdout, stderr) => (error ? reject(new Error(`${args.slice(0, 3).join(' ')}: ${stderr || error.message}`.trim())) : resolve(stdout))))
const onR2 = new Set<string>()
// The CLI prints a bare array, so it pages by key: each list starts after the last key of the one before.
for (let after: string | undefined; ; ) {
  const objects: { key: string }[] = JSON.parse(await cf(['r2', 'objects', 'list', '--bucket-name', BUCKET, '--per-page', '1000', ...(after ? ['--start-after', after] : [])]))
  for (const object of objects) onR2.add(object.key)
  if (!objects.length) break
  after = objects.at(-1)!.key
}
console.log(`media:upload: ${onR2.size} objects on R2, ${wanted.size} wanted`)

// 3. Upload what's missing.
const todo = [...wanted].filter(([key]) => !onR2.has(key))
const failed = new Set<string>()
let done = 0
const queue = [...todo]
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const [key, { file, type }] = job
      let ok = false
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        try {
          await cf(['r2', 'objects', 'put', key, '--bucket-name', BUCKET, '--file', file, '--content-type', type])
          ok = true
        } catch (error) {
          if (attempt === 2) console.warn(`media:upload: ${key} failed: ${(error as Error).message.split('\n')[0]}`)
        }
      }
      if (ok) onR2.add(key)
      else failed.add(key)
      if (++done % 100 === 0) console.log(`media:upload: ${done}/${todo.length}`)
    }
  }),
)

// 4. Record what is on R2.
const mediaFile = join(DOCS, 'lib/media.json')
const before: Media = JSON.parse(readFileSync(mediaFile, 'utf8'))
const manifest: Media = { files: {} }
if (existsSync(APPROVED)) {
  for (const [name, key] of Object.entries(files)) if (onR2.has(key)) manifest.files[name] = key
} else manifest.files = before.files
const sorted = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(mediaFile, `${JSON.stringify({ files: sorted(manifest.files) }, null, 1)}\n`)
console.log(`media:upload: uploaded ${todo.length - failed.size}, kept ${wanted.size - todo.length}, failed ${failed.size}; lib/media.json lists ${Object.keys(manifest.files).length} promo files. Commit it.`)
if (failed.size) process.exitCode = 1
