// `pnpm -F promo approve`: the user has reviewed exports/review/site and approves it. Its videos and posters go to
// exports/approved (what `pnpm -F docs media:upload` puts on R2), its manifest.json and og.png to apps/docs/public/promo.
// Then run `pnpm -F docs media:upload` and commit apps/docs/lib/media.json and the manifest.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const review = path.join(root, 'exports/review/site')
const approved = path.join(root, 'exports/approved')
const site = path.resolve(root, '../docs/public/promo')

if (!existsSync(review)) throw new Error('Nothing to approve: render first (pnpm -F promo render), then review exports/review/site.')
mkdirSync(approved, { recursive: true })
mkdirSync(site, { recursive: true })
let moved = 0
for (const name of readdirSync(review)) {
  const to = name === 'manifest.json' || name === 'og.png' ? site : /\.(mp4|webm|jpg|avif|webp)$/.test(name) ? approved : undefined
  if (!to) continue
  copyFileSync(path.join(review, name), path.join(to, name))
  moved++
}
console.log(`approved ${moved} files: videos and posters to exports/approved, manifest.json and og.png to apps/docs/public/promo. Next: pnpm -F docs media:upload`)
