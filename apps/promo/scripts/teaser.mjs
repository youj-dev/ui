// The launch teaser, for review only: everything lands in apps/promo/exports/review/teaser (gitignored). Nothing here
// publishes: no public/, no R2, no manifest.
//   pnpm -F promo teaser [steps…]   (default: board)
// Steps:
//   board    the storyboard: each frame in BOARD (src/teaser/beats.ts) rendered at 1920 × 1080 with its timecode and
//            beat burnt in (board/<frame>.png), and a 4 × 3 grid of them (storyboard.png)
//   master   the lossless PNG sequence at 1920 × 1080, 60 fps (out/master/teaser)
//   encode   teaser.mp4 from the master: H.264 High, 60 fps, BT.709, faststart, silent; and the poster (teaser.png)
// Run with type stripping (the package script passes the flag): it reads src/teaser/beats.ts.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const review = path.join(root, 'exports/review/teaser')
const master = path.join(root, 'out/master/teaser')
const bundle = path.join(root, 'out/teaser-bundle')
const { BOARD, TEASER_FPS, T } = await import('../src/teaser/beats.ts')

const SCALE = 4 / 3
/** The poster: the wordmark and the address, at rest. */
const POSTER = T.logo.still + 20
const CRF = Number(process.env.CRF ?? 16)
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 8)

const steps = process.argv.slice(2)
const want = (step) => (steps.length === 0 ? step === 'board' : steps.includes(step))
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] })
// Relative paths: Remotion reads the ".claude" in an absolute worktree path as a file extension.
const rel = (file) => path.relative(root, file)
const remotion = (args) => run('pnpm', ['exec', 'remotion', ...args, '--log=error'])

mkdirSync(review, { recursive: true })

function bundled() {
  rmSync(bundle, { recursive: true, force: true })
  remotion(['bundle', '--out-dir', rel(bundle)])
  return rel(bundle)
}

if (want('board')) {
  const serve = bundled()
  const dir = path.join(review, 'board')
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  const files = []
  for (const { frame } of BOARD) {
    const file = path.join(dir, `${String(frame).padStart(3, '0')}.png`)
    console.log(`▸ board ${frame}`)
    remotion(['still', serve, 'Teaser', rel(file), `--frame=${frame}`, `--scale=${SCALE}`, '--props={"board":true}'])
    files.push(file)
  }
  const cols = 4
  const cell = 960
  const inputs = files.flatMap((f) => ['-i', f])
  const scaled = files.map((_, i) => `[${i}:v]scale=${cell}:-1,pad=iw+8:ih+8:4:4:0x333333[v${i}]`).join(';')
  const layout = files.map((_, i) => `${(i % cols) * (cell + 8)}_${Math.floor(i / cols) * ((cell * 9) / 16 + 8)}`).join('|')
  const out = path.join(review, 'storyboard.png')
  run('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', `${scaled};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${layout}:fill=black`, '-frames:v', '1', out])
  console.log(`▸ ${rel(out)}`)
}

if (want('master')) {
  rmSync(master, { recursive: true, force: true })
  remotion(['render', 'Teaser', rel(master), '--sequence', `--scale=${SCALE}`, `--concurrency=${CONCURRENCY}`])
}

if (want('encode')) {
  const files = readdirSync(master).filter((f) => f.endsWith('.png')).sort()
  const [, prefix, digits] = files[0].match(/^(.*?)(\d+)\.png$/)
  const pattern = path.join(master, `${prefix}%0${digits.length}d.png`)
  const mp4 = path.join(review, 'teaser.mp4')
  run('ffmpeg', [
    '-y', '-loglevel', 'error', '-framerate', String(TEASER_FPS), '-i', pattern,
    '-vf', 'scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'veryslow', '-crf', String(CRF), '-profile:v', 'high', '-level', '4.2', '-tune', 'animation',
    '-g', String(TEASER_FPS * 2), '-movflags', '+faststart',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-an', mp4,
  ])
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(master, `${prefix}${String(POSTER).padStart(digits.length, '0')}.png`), path.join(review, 'teaser-poster.png')])
  console.log(`▸ ${rel(mp4)}: ${(statSync(mp4).size / 1024 / 1024).toFixed(2)} MB`)
}
