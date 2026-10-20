/* node scripts/contact-sheet.ts <out.png> <window seconds> <a.wav> <b.wav> …
 * One picture of several sounds, stacked: each a labelled spectrogram
 * (100 Hz–16 kHz, log frequency, 80 dB range) over its waveform, on the
 * same time scale, to look at what can't be listened to. Needs ffmpeg. */

import { spawnSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [out, windowArg, ...files] = process.argv.slice(2)
if (!out || !files.length) throw new Error('usage: contact-sheet.ts <out.png> <window> <files…>')
const window = Number(windowArg)
const work = mkdtempSync(join(tmpdir(), 'youj-sheet-'))
const run = (args: string[]) => spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
const parts: string[] = []
files.forEach((file, i) => {
  const spec = join(work, `s${i}.png`)
  const wave = join(work, `w${i}.png`)
  const fit = `apad=whole_dur=${window},atrim=0:${window}`
  run(['-i', file, '-lavfi', `${fit},showspectrumpic=s=640x200:legend=1:scale=log:fscale=log:color=magma:start=100:stop=16000:drange=80`, spec])
  run(['-i', file, '-lavfi', `${fit},showwavespic=s=1024x60:colors=white:scale=lin`, wave])
  parts.push(spec, wave)
})
const scaled = parts.map((_, i) => `[${i}:v]scale=1024:-1[p${i}]`).join(';')
run([...parts.flatMap((p) => ['-i', p]), '-filter_complex', `${scaled};${parts.map((_, i) => `[p${i}]`).join('')}vstack=inputs=${parts.length}`, out])
