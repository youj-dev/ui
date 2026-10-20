/* A file:// listening grid for the review emitted by render.ts.
 * Run from the repo root: node packages/sound/scripts/review-page.ts <dir>
 * No server, fetch, modules, remote fonts or other network requests. */

import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { packs } from '../packs.config.ts'
import { lab } from '../lab/manifest.ts'
import { CUES, type Cue } from './variants/types.ts'

const dir = process.argv[2]
if (!dir) throw new Error('usage: review-page.ts <render review directory>')

const families = [
  { id: 'beacon', name: 'Beacon', color: '#427b86', character: 'Default · pure · dry · calm', instrument: 'Clean sine pings · natural decay' },
  { id: 'halo', name: 'Halo', color: '#78835d', character: 'Refined · calm · soft', instrument: 'Warm chord swells · slow shimmer' },
  { id: 'rill', name: 'Rill', color: '#247c96', character: 'Liquid · playful · round', instrument: 'Liquid sine bloops · bubbles' },
  { id: 'glyph', name: 'Glyph', color: '#a06140', character: 'Digital · precise · game-like', instrument: 'Chip square waves · steps' },
  { id: 'zephyr', name: 'Zephyr', color: '#717f97', character: 'Airy · approved reference', instrument: 'Airy blown pipe · phrases' },
  { id: 'glass', name: 'Glass', color: '#717579', character: 'First default · reference', instrument: 'Glass · rods, beads and bell' },
] as const

const labels: Record<Cue, string> = {
  tap: 'Tap', select: 'Select', toggleOn: 'Toggle on', toggleOff: 'Toggle off',
  success: 'Success', error: 'Error', notify: 'Notify', open: 'Open', close: 'Close', tick: 'Tick',
}
const escape = (text: string) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
const soundFor = (family: string, cue: Cue) => {
  const id = packs[family]![cue]
  if (!existsSync(join(dir, `${id}.mp3`))) throw new Error(`Missing review audio: ${id}.mp3. Run render --review first.`)
  const sound = lab.find((entry) => entry.cue === cue)!.variants.find((sound) => sound.id === id)
  if (!sound) throw new Error(`Missing lab entry: ${id}`)
  return sound
}

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Youj — Sound palette review</title>
  <style>
    :root { color-scheme: light; --ink: #282823; --muted: #6e7069; --line: #deded6; --paper: #f6f5ef; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--paper); color: var(--ink); font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { max-width: 1880px; margin: auto; padding: 48px 40px 32px; }
    .eyebrow { font-size: 11px; font-weight: 650; letter-spacing: .16em; text-transform: uppercase; color: var(--color-band); }
    h1 { font: 48px/1.08 Georgia, serif; letter-spacing: -.035em; margin: 14px 0; font-weight: 400; }
    .intro { max-width: 670px; color: var(--color-band); font-size: 15px; margin: 0 0 26px; }
    .toolbar { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; padding: 16px 0; border-top: 1px solid var(--line); }
    .volume { display: flex; align-items: center; gap: 10px; }
    input { width: 130px; accent-color: var(--ink); }
    output { min-width: 3em; color: var(--color-band); font-variant-numeric: tabular-nums; }
    button { font: inherit; cursor: pointer; }
    .stop { border: 1px solid #cccfc3; padding: 6px 14px; background: transparent; color: var(--ink); border-radius: 6px; }
    #status { color: var(--color-band); margin-left: auto; font-size: 13px; }
    .grid { overflow-x: auto; border: 1px solid var(--line); border-radius: 10px; background: #fffefa; }
    table { border-collapse: collapse; table-layout: fixed; width: 100%; min-width: 1380px; }
    th, td { border-bottom: 1px solid var(--line); border-right: 1px solid var(--line); }
    th:last-child, td:last-child { border-right: 0; }
    tr:last-child th, tr:last-child td { border-bottom: 0; }
    thead th { padding: 23px 18px 18px; text-align: left; vertical-align: top; border-top: 3px solid var(--accent, #deded6); }
    .cue-head { width: 120px; color: var(--color-band); font-size: 12px; font-weight: 500; }
    .family-name { font: 27px/1.15 Georgia, serif; font-weight: 400; margin: 0 0 8px; }
    .character { display: block; color: var(--accent); font-size: 11px; font-weight: 600; margin-bottom: 7px; }
    .instrument { margin: 0; white-space: nowrap; font-size: 12px; font-weight: 400; color: var(--color-band); }
    .pack-size { font-size: 11px; font-weight: 400; color: var(--color-band); margin: 12px 0; }
    .family-play { background: transparent; border: 1px solid var(--accent); color: var(--accent); border-radius: 6px; padding: 7px 10px; font-size: 12px; width: 100%; }
    .family-play.is-queue { background: var(--accent); color: white; }
    tbody th { text-align: left; padding: 10px 16px; font-size: 12px; font-weight: 600; }
    .spectrum { display: block; font-size: 10px; font-weight: 400; color: var(--color-band); text-underline-offset: 3px; margin-top: 3px; }
    td { padding: 8px 12px; }
    .sample { display: flex; align-items: center; gap: 12px; width: 100%; border: 1px solid transparent; border-radius: 7px; padding: 8px; background: transparent; color: var(--ink); text-align: left; }
    .sample:hover { background: #f3f2ec; }
    .sample.is-playing { border-color: var(--accent); background: #f3f2ec; }
    .play-icon { display: grid; place-items: center; width: 30px; height: 30px; flex-shrink: 0; border-radius: 50%; color: var(--accent); background: #eeeee7; font-size: 10px; }
    .sample.is-playing .play-icon { background: var(--accent); color: white; }
    .sample small { display: block; font-size: 10px; color: var(--color-band); font-variant-numeric: tabular-nums; }
    .sample .action { font-size: 12px; font-weight: 500; }
    button:focus-visible, a:focus-visible { outline: 2px solid var(--accent, #386f8c); outline-offset: 3px; }
    .footnotes { display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-top: 18px; font-size: 12px; color: var(--color-band); }
    .footnotes p { margin: 0; max-width: 610px; }
    @media (max-width: 700px) { main { padding: 26px 16px; } h1 { font-size: 36px; } #status { margin-left: 0; width: 100%; } }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">Youj / Sound studies / Final round</div>
    <h1>Six families. Ten cues.</h1>
    <p class="intro">Compare the dry Beacon pings with Halo, Rill, Glyph, Zephyr and the default Glass across all ten cues, or play a whole family to hear its character.</p>
    <div class="toolbar">
      <label class="volume" for="volume">Volume <input id="volume" type="range" min="0" max="100" value="50"><output id="volume-label" for="volume">50%</output></label>
      <button class="stop" type="button" id="stop">■ Stop</button>
      <span id="status" role="status" aria-live="polite">Ready to listen</span>
    </div>
    <div class="grid">
      <table aria-label="Sound palettes by cue">
        <thead><tr><th scope="col" class="cue-head">10 cues<br>6 palettes</th>${families.map((family) => {
          const bytes = CUES.reduce((sum, cue) => sum + soundFor(family.id, cue).bytes, 0)
          return `<th scope="col" style="--accent: ${family.color}"><h2 class="family-name">${family.name}</h2><span class="character">${family.character}</span><p class="instrument">${family.instrument}</p><div class="pack-size">${(bytes / 1024).toFixed(1)} KB · complete pack</div><button type="button" class="family-play" data-family="${family.id}" data-name="${family.name}" aria-label="Play whole ${family.name} family">▶ Play whole family</button></th>`
        }).join('')}</tr></thead>
        <tbody>${CUES.map((cue) => `<tr><th scope="row">${labels[cue]}<a class="spectrum" href="${cue}.png" target="_blank" rel="noopener">Spectrogram ↗</a></th>${families.map((family) => {
          const sound = soundFor(family.id, cue)
          return `<td style="--accent: ${family.color}"><button type="button" class="sample" data-family="${family.id}" data-src="${sound.id}.mp3" data-label="${family.name} · ${labels[cue]}" aria-label="Play ${family.name} ${labels[cue]}" title="${escape(sound.recipe)}"><span class="play-icon" aria-hidden="true">▶</span><span><span class="action">Play</span><small>${sound.ms} ms · ${sound.lufs} LUFS</small></span></button></td>`
        }).join('')}</tr>`).join('\n')}</tbody>
      </table>
    </div>
    <div class="footnotes"><p>Levels are matched per cue. Whole-family playback follows the rows with a 180 ms gap. Click any sound to switch immediately.</p><p>Glass is the unchanged default, including its Classic error. WAV masters, spectrograms and the <a href="distinctness.md">measured distinctness report</a> are in this folder.</p></div>
    <audio id="player" preload="none"></audio>
  </main>
  <script>
    const player = document.getElementById('player');
    const status = document.getElementById('status');
    const volume = document.getElementById('volume');
    let generation = 0;
    let cancelPending = null;
    player.volume = 0.5;

    function stop() {
      generation++;
      if (cancelPending) cancelPending();
      player.pause();
      document.querySelectorAll('.is-playing, .is-queue').forEach(el => el.classList.remove('is-playing', 'is-queue'));
      document.querySelectorAll('.family-play').forEach(el => { el.textContent = '▶ Play whole family'; });
    }

    function playSample(button, run) {
      return new Promise(resolve => {
        let settled = false;
        const done = ok => {
          if (settled) return;
          settled = true;
          player.removeEventListener('ended', ended);
          player.removeEventListener('error', failed);
          button.classList.remove('is-playing');
          if (cancelPending === cancel) cancelPending = null;
          resolve(ok);
        };
        const cancel = () => done(false);
        const ended = () => done(true);
        const failed = () => {
          if (run === generation) status.textContent = 'Could not play ' + button.dataset.label + '. Keep the MP3s beside this page.';
          done(false);
        };
        cancelPending = cancel;
        player.addEventListener('ended', ended);
        player.addEventListener('error', failed);
        player.src = button.dataset.src;
        button.classList.add('is-playing');
        status.textContent = 'Playing ' + button.dataset.label;
        player.play().catch(() => { if (!settled) failed(); });
      });
    }

    function gap(run) {
      return new Promise(resolve => {
        const timer = setTimeout(() => {
          if (cancelPending === cancel) cancelPending = null;
          resolve(run === generation);
        }, 180);
        const cancel = () => { clearTimeout(timer); resolve(false); };
        cancelPending = cancel;
      });
    }

    document.querySelectorAll('.sample').forEach(button => {
      button.addEventListener('click', async () => {
        stop();
        const run = generation;
        if (await playSample(button, run) && run === generation) status.textContent = 'Played ' + button.dataset.label;
      });
    });
    document.querySelectorAll('.family-play').forEach(button => {
      button.addEventListener('click', async () => {
        stop();
        const run = generation;
        button.classList.add('is-queue');
        button.textContent = 'Playing family…';
        const sounds = Array.from(document.querySelectorAll('.sample')).filter(el => el.dataset.family === button.dataset.family);
        let complete = true;
        for (let i = 0; i < sounds.length; i++) {
          if (run !== generation || !await playSample(sounds[i], run)) { complete = false; break; }
          if (i + 1 < sounds.length && !await gap(run)) { complete = false; break; }
        }
        if (run === generation) {
          button.classList.remove('is-queue');
          button.textContent = '▶ Play whole family';
          if (complete) status.textContent = 'Played all 10 ' + button.dataset.name + ' cues';
        }
      });
    });
    document.getElementById('stop').addEventListener('click', () => { stop(); status.textContent = 'Stopped'; });
    volume.addEventListener('input', () => {
      player.volume = Number(volume.value) / 100;
      document.getElementById('volume-label').value = volume.value + '%';
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') { stop(); status.textContent = 'Stopped'; }
    });
  </script>
</body>
</html>
`

writeFileSync(join(dir, 'index.html'), html)
console.log(`listening page: ${join(dir, 'index.html')}`)
