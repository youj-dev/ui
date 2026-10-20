// Contact sheet of a rendered PNG sequence, for reviewing choreography.
// node scripts/sheet.mjs <dir> <out.png> <first> <step> <count> [cols=4] [width=480]
import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'

const [dir, out, first, step, count, cols = '4', width = '480'] = process.argv.slice(2)
const files = readdirSync(dir).filter((f) => f.endsWith('.png')).sort()
const pad = files[0].match(/(\d+)\.png$/)[1].length
const prefix = files[0].replace(/\d+\.png$/, '')
const picks = Array.from({ length: Number(count) }, (_, i) => Number(first) + i * Number(step))
const inputs = picks.flatMap((n) => ['-i', path.join(dir, `${prefix}${String(n).padStart(pad, '0')}.png`)])
// Frames read left to right, top to bottom: first, first + step, …
const labelled = picks.map((_, i) => `[${i}:v]scale=${width}:-1,pad=iw+4:ih+4:2:2:gray[v${i}]`).join(';')
const rows = Math.ceil(picks.length / Number(cols))
const stack = `${picks.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${picks.length}:layout=${picks
  .map((_, i) => {
    const c = i % Number(cols)
    const r = Math.floor(i / Number(cols))
    const x = c === 0 ? '0' : Array.from({ length: c }, () => 'w0').join('+')
    const y = r === 0 ? '0' : Array.from({ length: r }, () => 'h0').join('+')
    return `${x}_${y}`
  })
  .join('|')}:fill=black`
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', `${labelled};${stack}`, '-frames:v', '1', out], {
  stdio: 'inherit',
})
console.log(`${out}: ${picks.length} frames, ${rows} rows`)
