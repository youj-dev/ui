// Renders every deliverable to apps/promo/exports for review: what the site plays to exports/review/site, the rest to exports/.
// Nothing is published from here: once a film is approved, `pnpm -F promo approve` and `pnpm -F docs media:upload` publish it.
//   pnpm -F promo render [steps…]
// Steps, in order (default: all): masters encode posters stills captions publish verify check
//   masters   lossless PNG sequences of the film, the square cut, the hero loop and the topic loops (out/master)
//   encode    AV1 WebM, VP9 WebM and H.264 MP4, at 30 fps, from the masters (out/web): each video at its web size,
//             and a small cut (`-sm`) for phones; each loop is held under its budget. FROM=<dir of <name>.mp4>
//             encodes from those files instead (1080p60 encodes, when the masters aren't at hand).
//   posters   AVIF, WebP (when cwebp is installed) and JPG per video, at each web size, from its master
//   stills    the OG image and the square social posts
//   captions  promo.vtt, from the same beats and brand strings the film uses
//   publish   copies out/web to where each file belongs (what wasn't re-rendered is carried over from exports/approved):
//             the site's own (the homepage film in each scheme, each topic's wide loop, the OG image) to
//             exports/review/site, for approval, the rest (the tile
//             and portrait loops, the film and its square cut, the hero loop, the social posts) to apps/promo/exports,
//             which is git-ignored and local only. Writes manifest.json for what the site plays: sources by preference
//             (phones' small cut first, then AV1, VP9, H.264), each with its type
//   verify    decodes frames at each chapter from the published files (out/verify), checks each loop's
//             seam and budget, and prints each stream
//   check     determinism: renders a few frames of each topic loop on their own, each replayed from frame 0
//             in a fresh render, and compares them with the master rendered in parallel
// Run with type stripping (the package script passes the flag): it reads src/film/beats.ts, src/loops/beats.ts
// and src/brand.ts.
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const out = path.join(root, 'out')
const masters = path.join(out, 'master')
const web = path.join(out, 'web')
/** Local only (gitignored): everything the site doesn't play. */
const exportsDir = path.join(root, 'exports')
/** Where a render lands for review: never published from here (`pnpm -F promo approve`, then `pnpm -F docs media:upload`). */
const publicDir = path.join(exportsDir, 'review/site')
/** What the user approved: the files `pnpm -F docs media:upload` puts on R2. */
const approvedDir = path.join(exportsDir, 'approved')
const siteDir = path.resolve(root, '../docs/public/promo')
const { BRAND } = await import('../src/brand.ts')
const B = await import('../src/film/beats.ts')
const L = await import('../src/loops/beats.ts')
const H = await import('../src/home/beats.ts')
const H2 = await import('../src/home/beats-v2.ts')
/** The device scales the stages render at: 1440 × 810 and 810 × 810 at 4/3, the loop's 1200 × 675 at 1.6. */
const SCALE = { film: 4 / 3, loop: 1.6 }

const steps = process.argv.slice(2)
const want = (step) => steps.length === 0 || steps.includes(step)
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 4)
/** ONLY=promo-square renders, encodes and posters just that video, or still (the rest stay as they are). A pick may hold `*`
 *  for any run of characters (ONLY='loop-icons*', ONLY='loop-*-tall'), and picks are comma-separated. */
const ONLY = process.env.ONLY?.split(',')
const literal = (text) => text.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
const only = (name) => !ONLY || ONLY.some((pick) => new RegExp(`^${pick.split('*').map(literal).join('.*')}$`).test(name))
const selected = (entries) => entries.filter(([name]) => only(name))
/** The loops play on the docs site: each of their files stays under this (a tile's, a portrait cut's under their own). */
const LOOP_BUDGET = 1.25 * 1024 * 1024
const TILE_BUDGET = 0.75 * 1024 * 1024
const TALL_BUDGET = 1.25 * 1024 * 1024
/** The web plays at half the masters' 60 fps: the loops' motion is eased and slow enough to hold it... */
const WEB_FPS = 30
/** ...except the topics whose pans and swipes are fast enough to step at 30: the icons loop's camera crosses a whole icon in
 *  a few frames, and a sixth of its 30 fps steps change the frame by more than 8 luma levels (the busiest of the others: a tenth). */
const KEEP_60 = ['icons']
/** What the encodes are: their web sizes (the slot on the page is at most 1136 px wide) and a small cut for phones. */
const WEB = {
  wide: { full: [1280, 720], small: [854, 480] },
  tile: { full: [960, 384], small: [640, 256] },
  tall: { full: [720, 900] },
  square: { full: [1080, 1080] },
}
/** The phones the small cut is for; a `<source media>` says so, and the player checks it itself (browsers ignore it on video). */
const SMALL_MEDIA = '(max-width: 640px)'
/** Constant-quality settings per codec; a loop over its budget steps its own down. */
const CRF = { av1: 46, vp9: 42, h264: 26 }

const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] })
const read = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8' })
const remotion = (args) => run('pnpm', ['exec', 'remotion', ...args, '--log=error'])
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`

/** How alike two images are: "identical", or their PSNR. */
function psnr(a, b) {
  const { stderr } = spawnSync('ffmpeg', ['-hide_banner', '-i', a, '-i', b, '-lavfi', 'psnr', '-f', 'null', '-'], { cwd: root, encoding: 'utf8' })
  const average = stderr.match(/average:(\S+)/)?.[1]
  return average === 'inf' ? 'identical' : `${Number(average).toFixed(1)} dB`
}

/* ── What gets made ────────────────────────────────────────────────────── */

// `to` says where a video's or a still's files are published: `site`, apps/docs/public/promo, is what the site plays;
// `exports`, apps/promo/exports, is everything else, local only.
const VIDEOS = {
  promo: {
    composition: 'Film',
    title: `${BRAND.name}: ${BRAND.tagline}`,
    scale: SCALE.film,
    // The tokens specimen, built: the whole contract on one sheet.
    poster: B.STILLS_AT.specimen,
    web: WEB.wide,
    crf: { av1: 40, vp9: 36, h264: 22 },
    to: 'exports',
  },
  'promo-square': {
    composition: 'FilmSquare',
    title: `${BRAND.name}: ${BRAND.tagline} (square)`,
    scale: SCALE.film,
    // The lockup, formed, with the tagline under it.
    poster: B.STILLS_AT.lockup,
    web: WEB.square,
    crf: { av1: 40, vp9: 36, h264: 22 },
    to: 'exports',
  },
  'hero-loop': {
    composition: 'HeroLoop',
    title: `${BRAND.name} icons: a star morphs to a heart and a bell that rings, then the whole set plays in a wave`,
    scale: SCALE.loop,
    frames: [B.LOOP.preroll, B.LOOP.preroll + B.LOOP.frames - 1],
    // Its first frame, so the poster hands over to playback without a jump.
    poster: B.LOOP.preroll,
    web: WEB.wide,
    loop: true,
    budget: LOOP_BUDGET,
    to: 'exports',
  },
  // The homepage film, once per scheme: seamless, silent, from its first frame (which is also its poster). Longer
  // than a loop but held to the same budget, so it starts a notch lower.
  ...Object.fromEntries(
    H.HOME_CUTS.map((cut) => [
      cut.name,
      {
        composition: cut.composition,
        title: H.HOME_TITLE,
        scale: SCALE.loop,
        frames: [H.HOME.preroll, H.HOME.preroll + H.HOME.frames - 1],
        poster: H.HOME.preroll,
        web: WEB.wide,
        loop: true,
        budget: LOOP_BUDGET,
        to: 'site',
      },
    ]),
  ),
  // Its second version (HOME-FILM-V2.md), the same way: rendered beside the first so the two can be compared.
  ...Object.fromEntries(
    H2.HOME_V2_CUTS.map((cut) => [
      cut.name,
      {
        composition: cut.composition,
        title: H2.HOME_V2_TITLE,
        scale: SCALE.loop,
        frames: [H2.HOME_V2.preroll, H2.HOME_V2.preroll + H2.HOME_V2.frames - 1],
        poster: H2.HOME_V2.preroll,
        web: WEB.wide,
        loop: true,
        budget: LOOP_BUDGET,
        to: 'site',
      },
    ]),
  ),
  // The topic loops, every cut: seamless, silent, from their first frame (which is also their poster). The site plays
  // the wide cut; the others go where `destination` in src/loops/beats.ts says.
  ...Object.fromEntries(
    L.TOPIC_CUTS.map((cut) => {
      const { preroll, frames } = L.TOPICS[cut.topic]
      return [
        cut.name,
        {
          composition: cut.composition,
          title: L.TOPIC_TITLES[cut.topic],
          scale: cut.scale,
          frames: [preroll, preroll + frames - 1],
          poster: preroll,
          web: WEB[cut.cut],
          fps: KEEP_60.includes(cut.topic) ? B.FPS : WEB_FPS,
          loop: true,
          budget: { tile: TILE_BUDGET, tall: TALL_BUDGET, wide: LOOP_BUDGET }[cut.cut],
          topic: cut,
          to: cut.destination,
        },
      ]
    }),
  ),
}

const SPECIMEN_ALT = 'the tokens specimen: type, colour ramps, control sizes and the motion durations and easings of the Basalt theme, on one sheet'

/** 960 × 504 at 1.25 is 1200 × 630; the squares are 810 × 810 at 4/3, 1080 × 1080. The OG image is the site's; the social posts are exports. */
const STILLS = {
  og: { composition: 'OgImage', frame: B.STILL_FRAMES.og, scale: 1.25, alt: `${BRAND.name}: ${BRAND.tagline} Beside it, ${SPECIMEN_ALT}.`, to: 'site' },
  'social-tokens': {
    composition: 'SocialTokens',
    frame: B.STILL_FRAMES.tokens,
    scale: SCALE.film,
    alt: `${BRAND.name}: ${BRAND.tagline} Below it, ${SPECIMEN_ALT}.`,
    to: 'exports',
  },
  'social-icons': {
    composition: 'SocialIcons',
    frame: B.STILL_FRAMES.icons,
    scale: SCALE.film,
    alt: `${BRAND.modules.icons}: every icon in the set on one wall, a wave of their choreographies passing through it`,
    to: 'exports',
  },
}

/** Where a video's or still's files are published, by its `to`. */
const DIRS = { site: publicDir, exports: exportsDir }
const dirOf = (name) => DIRS[(VIDEOS[name] ?? STILLS[name]).to]
/** The video or still a file in out/web belongs to: `<name>[-sm].<ext>`, or the film's captions (`promo.vtt`). */
const ownerOf = (file) => {
  const name = file.replace(/\.(av1\.webm|webm|mp4|jpg|avif|webp|png|vtt)$/, '').replace(/-sm$/, '')
  return name in VIDEOS || name in STILLS ? name : undefined
}

/* ── Masters ───────────────────────────────────────────────────────────── */

function sequence(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.png')).sort()
  const [, prefix, digits] = files[0].match(/^(.*?)(\d+)\.png$/)
  return { files, pattern: `${prefix}%0${digits.length}d.png`, start: Number(digits), pad: digits.length, prefix }
}

function frameFile(dir, frame) {
  const { prefix, pad } = sequence(dir)
  return path.join(dir, `${prefix}${String(frame).padStart(pad, '0')}.png`)
}

if (want('masters')) {
  for (const [name, video] of selected(Object.entries(VIDEOS))) {
    const dir = path.join(masters, name)
    rmSync(dir, { recursive: true, force: true })
    console.log(`▸ master ${name}`)
    remotion([
      'render',
      video.composition,
      // Relative: Remotion reads the ".claude" in an absolute worktree path as a file extension.
      path.relative(root, dir),
      '--sequence',
      `--scale=${video.scale}`,
      `--concurrency=${CONCURRENCY}`,
      ...(video.frames ? [`--frames=${video.frames[0]}-${video.frames[1]}`] : []),
    ])
  }
}

/* ── Encoding ──────────────────────────────────────────────────────────── */

// Tagged BT.709, which the masters' sRGB is converted with (the matrix HD players assume).
const TAGS = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv']
// From the masters (PNG, full range RGB) or from a published 1080p60 MP4 (already BT.709 limited range), down to the
// web size at 30 fps.
const scaleTo = (width, height, fromMasters, fps) =>
  `fps=${fps},scale=${width}:${height}:flags=lanczos${fromMasters ? ':in_range=full:out_range=tv:out_color_matrix=bt709' : ''},format=yuv420p`
const FROM = process.env.FROM && path.resolve(root, process.env.FROM)

/** A video's encodes: its AV1 and VP9 WebM and H.264 MP4 at a web size, `-sm` for the small cut. */
const encodesOf = (name, cut) => {
  const base = cut === 'small' ? `${name}-sm` : name
  return { av1: `${base}.av1.webm`, vp9: `${base}.webm`, h264: `${base}.mp4` }
}

const CODECS = {
  // SVT-AV1, 8-bit, a keyframe every 10 s (the loops never seek).
  av1: (crf) => ['-c:v', 'libsvtav1', '-crf', String(crf), '-preset', '4', '-g', '300'],
  vp9: (crf) => ['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(crf), '-row-mt', '1', '-tile-columns', '2', '-deadline', 'good', '-cpu-used', '2'],
  h264: (crf) => ['-c:v', 'libx264', '-preset', 'veryslow', '-crf', String(crf), '-profile:v', 'high', '-tune', 'animation', '-movflags', '+faststart'],
}

function encode(name, video, cut, crf) {
  const [width, height] = video.web[cut]
  let input
  if (FROM) input = ['-y', '-loglevel', 'error', '-i', path.join(FROM, `${name}.mp4`)]
  else {
    const dir = path.join(masters, name)
    const { pattern, start } = sequence(dir)
    input = ['-y', '-loglevel', 'error', '-framerate', String(B.FPS), '-start_number', String(start), '-i', path.join(dir, pattern)]
  }
  const sizes = {}
  for (const [codec, file] of Object.entries(encodesOf(name, cut))) {
    run('ffmpeg', [...input, '-vf', scaleTo(width, height, !FROM, video.fps ?? WEB_FPS), ...CODECS[codec](crf[codec]), ...TAGS, '-an', path.join(web, file)])
    sizes[codec] = statSync(path.join(web, file)).size
  }
  return sizes
}

if (want('encode')) {
  mkdirSync(web, { recursive: true })
  for (const [name, video] of selected(Object.entries(VIDEOS))) {
    for (const cut of Object.keys(video.web)) {
      const crf = { ...CRF, ...video.crf }
      let sizes = encode(name, video, cut, crf)
      // A loop has a budget (for its full cut): step the quality down until every file fits.
      const budget = video.budget ?? LOOP_BUDGET
      while (video.loop && cut === 'full' && Math.max(...Object.values(sizes)) > budget) {
        for (const codec of Object.keys(crf)) if (sizes[codec] > budget) crf[codec] += 2
        console.log(`  ${name} over budget (${Object.entries(sizes).map(([c, n]) => `${c} ${mb(n)}`).join(', ')}); crf → ${crf.av1}/${crf.vp9}/${crf.h264}`)
        sizes = encode(name, video, cut, crf)
      }
      console.log(`▸ ${name}${cut === 'small' ? ' (small)' : ''}: ${Object.entries(sizes).map(([c, n]) => `${c} ${mb(n)} (crf ${crf[c]})`).join(', ')}`)
    }
  }
}

/* ── Posters and stills ────────────────────────────────────────────────── */

/** cwebp makes the WebP (this ffmpeg has no WebP encoder); without it the posters are AVIF and JPG only. */
const CWEBP = spawnSync('cwebp', ['-version'], { encoding: 'utf8' }).status === 0

/** A video's poster at each web size in each format, from its first frame as RGB: `name.*` and `name-sm.*`. */
function poster(name, video) {
  const tmp = path.join(out, 'poster')
  mkdirSync(tmp, { recursive: true })
  const frame = path.join(tmp, `${name}.png`)
  // A published MP4's frame is converted from its BT.709 limited range, as a player would.
  if (FROM) run('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(FROM, `${name}.mp4`), '-vf', 'scale=in_color_matrix=bt709:in_range=tv,format=rgb24', '-frames:v', '1', frame])
  else copyFileSync(frameFile(path.join(masters, name), video.poster), frame)
  for (const [cut, [width, height]] of Object.entries(video.web)) {
    const base = path.join(web, cut === 'small' ? `${name}-sm` : name)
    const sized = path.join(tmp, `${name}-${cut}.png`)
    run('ffmpeg', ['-y', '-loglevel', 'error', '-i', frame, '-vf', `scale=${width}:${height}:flags=lanczos`, sized])
    run('ffmpeg', ['-y', '-loglevel', 'error', '-i', sized, '-q:v', '4', '-huffman', 'optimal', `${base}.jpg`])
    // Preset 8: SVT-AV1's slower presets can take a minute over one still.
    run('ffmpeg', ['-y', '-loglevel', 'error', '-i', sized, '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libsvtav1', '-crf', '34', '-preset', '8', ...TAGS, '-f', 'avif', `${base}.avif`])
    if (CWEBP) run('cwebp', ['-quiet', '-q', '80', '-m', '6', sized, '-o', `${base}.webp`])
  }
}

if (want('posters')) {
  mkdirSync(web, { recursive: true })
  for (const [name, video] of selected(Object.entries(VIDEOS))) {
    poster(name, video)
    console.log(`▸ poster ${name}: avif${CWEBP ? ', webp' : ''}, jpg ← ${FROM ? 'its first frame, published' : `frame ${video.poster}`}`)
  }
  rmSync(path.join(out, 'poster'), { recursive: true, force: true })
}

if (want('stills')) {
  mkdirSync(web, { recursive: true })
  for (const [name, still] of selected(Object.entries(STILLS))) {
    const file = path.join(web, `${name}.png`)
    remotion(['still', still.composition, path.relative(root, file), `--frame=${still.frame}`, `--scale=${still.scale}`])
    console.log(`▸ still ${name}.png`)
  }
}

/* ── Captions ──────────────────────────────────────────────────────────── */

function timestamp(frame) {
  const ms = Math.round((frame / B.FPS) * 1000)
  const pad = (n, w = 2) => String(n).padStart(w, '0')
  return `${pad(Math.floor(ms / 60000))}:${pad(Math.floor(ms / 1000) % 60)}.${pad(ms % 1000, 3)}`
}

if (want('captions')) {
  mkdirSync(web, { recursive: true })
  const name = (i) => B.PRESETS[i].id[0].toUpperCase() + B.PRESETS[i].id.slice(1)
  const T = B.THEMES_SCRIPT
  const at = (frame) => B.THEMES.from + frame
  const shot = (hero) => T.shots.find((s) => s.hero === hero)
  const cues = [
    [0, B.ORIGIN_BEATS.toHud, `An easing curve draws itself on a grid, a spring settles over it, and the curve resolves into the ${BRAND.name} mark. ${BRAND.tagline}`],
    [B.ORIGIN_BEATS.toHud, B.ICONS.from, 'Tokens. A specimen of the theme contract, type, colour, control sizes, radius and motion, retunes from Basalt to Graphite to Brutal and back.'],
    // In words, never counts: the captions stay true as the set grows.
    [B.ICONS.from, B.PARTS.from, 'Icons. One icon morphs star to heart to bell at close range; bell, loader and check play their states; then the whole set plays in a wave: icons that move with intent.'],
    [B.PARTS.from, B.PARTS.from + B.PARTS_BEATS.personalities, 'Components, close up. Save goes from saving to saved, tab underlines glide, a popover grows from its trigger, toasts stack, a one-time code verifies, a table re-sorts and the command palette runs a command.'],
    [B.PARTS.from + B.PARTS_BEATS.personalities, B.ASSEMBLE.from, 'The same presses in the three motion personalities, precise, calm and lively, side by side; then reduced motion joins them as a calm crossfade.'],
    [B.ASSEMBLE.from, B.THEMES.from, 'Composition. The same parts fly together into one settings block.'],
    [at(0), at(shot('folio').at), `The block becomes a window: Tandem, a launch planned as a runway, in ${name(0)}. A task is dragged two days later, what waits on it glides aside, and the verdict turns to a warning. The theme picker opens ${name(1)} over it.`],
    [at(shot('folio').at), at(shot('ledger').at), `Folio, mail one letter at a time, in ${name(1)}. Letters are filed with E and the next sheet settles from the pile. Then ${name(2)}.`],
    [at(shot('ledger').at), B.END.from, `The Ledger, a revenue memo, in ${name(2)}. Selecting drivers in the bridge moves the band on the running total. Then ${name(3)}, then ${name(4)}.`],
    [B.END.from, B.FILM_FRAMES, `${BRAND.promise} Set everything up with ${BRAND.install.all}, or add one component with ${BRAND.install.one}.`],
  ]
  const vtt = ['WEBVTT', '', ...cues.flatMap(([from, to, text], i) => [`${i + 1}`, `${timestamp(from)} --> ${timestamp(to)}`, text, ''])].join('\n')
  writeFileSync(path.join(web, 'promo.vtt'), vtt)
  console.log(`▸ promo.vtt (${cues.length} cues)`)
}

/* ── Publish ───────────────────────────────────────────────────────────── */

function probe(file) {
  const json = JSON.parse(read('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,level,avg_frame_rate:format=duration', '-of', 'json', file]))
  const stream = json.streams[0]
  const [num, den] = stream.avg_frame_rate.split('/').map(Number)
  return {
    width: stream.width,
    height: stream.height,
    fps: Math.round(num / den),
    duration: Number(Number(json.format.duration).toFixed(3)),
    // H.264 High profile at the level x264 chose, as a codecs string (e.g. avc1.64002a for 4.2).
    avc: `avc1.6400${Number(stream.level).toString(16).padStart(2, '0')}`,
  }
}

function dimensions(file) {
  const json = JSON.parse(read('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', file]))
  return { width: json.streams[0].width, height: json.streams[0].height }
}

/** The AV1 codecs string for a size: level 3.0 up to 665,856 pixels, 3.1 up to 1,065,024, else 4.0 (8-bit main profile). */
const av1Codec = ({ width, height }) => `av01.0.${width * height <= 665_856 ? '04' : width * height <= 1_065_024 ? '05' : '08'}M.08`
const inPublic = (file) => path.join(publicDir, file)

/** A video's sources: the phones' small cut first (each says which screens it is for), then the full cut; AV1, VP9, H.264 in each. */
function sourcesOf(name) {
  const cut = (base, media) =>
    [
      [`${base}.av1.webm`, () => `video/webm; codecs="${av1Codec(dimensions(inPublic(`${base}.av1.webm`)))}"`],
      [`${base}.webm`, () => 'video/webm; codecs="vp9"'],
      [`${base}.mp4`, () => `video/mp4; codecs="${probe(inPublic(`${base}.mp4`)).avc}"`],
    ]
      .filter(([file]) => existsSync(inPublic(file)))
      .map(([file, type]) => ({ src: `/promo/${file}`, type: type(), bytes: statSync(inPublic(file)).size, ...(media && { media }) }))
  return [...cut(`${name}-sm`, SMALL_MEDIA), ...cut(name)]
}

/** A poster: its JPG (the fallback), and a srcset per format that was made, its small size first. */
function posterOf(name) {
  const { width, height } = dimensions(inPublic(`${name}.jpg`))
  const srcset = {}
  for (const ext of ['avif', 'webp', 'jpg']) {
    const files = [`${name}-sm.${ext}`, `${name}.${ext}`].filter((file) => existsSync(inPublic(file)))
    if (files.includes(`${name}.${ext}`)) srcset[ext] = files.map((file) => `/promo/${file} ${dimensions(inPublic(file)).width}w`).join(', ')
  }
  return { src: `/promo/${name}.jpg`, width, height, bytes: statSync(inPublic(`${name}.jpg`)).size, srcset }
}

if (want('publish')) {
  // What was rendered this time replaces its published copy; everything else stays as published. Each file goes where
  // its video or still says (`to`): the site's own to apps/docs/public/promo, the rest to apps/promo/exports.
  mkdirSync(publicDir, { recursive: true })
  // What wasn't re-rendered is carried over from the approved set (and the OG image from the site), so the manifest covers all of it.
  for (const [from, names] of [
    [approvedDir, existsSync(approvedDir) ? readdirSync(approvedDir) : []],
    [siteDir, ['og.png']],
  ]) {
    for (const name of names) if (!existsSync(path.join(publicDir, name)) && existsSync(path.join(from, name))) copyFileSync(path.join(from, name), path.join(publicDir, name))
  }
  const files = existsSync(web) ? readdirSync(web).filter((f) => /\.(mp4|webm|jpg|avif|webp|png|vtt)$/.test(f)) : []
  const routed = []
  for (const file of files) {
    const owner = ownerOf(file)
    if (!owner) {
      console.warn(`  ! ${file} belongs to no video or still: not published`)
      continue
    }
    const dir = dirOf(owner)
    mkdirSync(dir, { recursive: true })
    copyFileSync(path.join(web, file), path.join(dir, file))
    routed.push([dir, file])
  }
  const url = (file) => `/promo/${file}`
  const bytes = (file) => statSync(inPublic(file)).size
  // The manifest lists only what the site plays, and only what is in public/promo.
  const site = Object.entries(VIDEOS).filter(([, video]) => video.to === 'site')
  const published = (name) => ['mp4', 'webm', 'jpg'].every((ext) => existsSync(inPublic(`${name}.${ext}`)))
  for (const [name] of site.filter(([name]) => !published(name))) console.warn(`  ! ${name} has never been rendered: left out of the manifest`)

  const videos = Object.fromEntries(
    site.filter(([name]) => published(name)).map(([name, video]) => {
      const mp4 = probe(inPublic(`${name}.mp4`))
      return [
        name,
        {
          title: video.title,
          width: mp4.width,
          height: mp4.height,
          fps: mp4.fps,
          duration: mp4.duration,
          loop: Boolean(video.loop),
          muted: true,
          // In the order a player should take them: the phones' small cut first (each source says which screens it
          // is for), then AV1, VP9 and H.264, the smallest a browser can play first.
          sources: sourcesOf(name),
          poster: posterOf(name),
        },
      ]
    }),
  )
  const images = Object.fromEntries(
    Object.entries(STILLS)
      .filter(([name, still]) => still.to === 'site' && existsSync(inPublic(`${name}.png`)))
      .map(([name, still]) => {
        const { width, height } = dimensions(inPublic(`${name}.png`))
        return [name, { src: url(`${name}.png`), width, height, bytes: bytes(`${name}.png`), alt: still.alt }]
      }),
  )
  // Each topic's loop by cut, as the site asks for it: the wide cut for its docs overview. The tile (a homepage
  // tile's strip, in the page's scheme) and the portrait cut are exports, so they are never here; a reader treats both
  // as optional. Only cuts that are published.
  const loops = {}
  for (const cut of L.TOPIC_CUTS) {
    if (!videos[cut.name]) continue
    const topic = (loops[cut.topic] ??= {})
    if (cut.cut === 'tile') (topic.tile ??= {})[cut.scheme] = cut.name
    else topic[cut.cut] = cut.name
  }
  const manifest = {
    // The homepage's film, by scheme: the page plays the one that matches it. Only cuts that are published.
    // Its second version once it's rendered, else the first.
    home: Object.fromEntries(
      (H2.HOME_V2_CUTS.every((cut) => videos[cut.name]) ? H2.HOME_V2_CUTS : H.HOME_CUTS).filter((cut) => videos[cut.name]).map((cut) => [cut.scheme, cut.name]),
    ),
    videos,
    loops,
    images,
    ...(images.og && { og: 'og' }),
    note: `Rendered from apps/promo (Remotion) with the real ${BRAND.packages.motion} and ${BRAND.packages.ui} source. Silent by design.`,
  }
  writeFileSync(inPublic('manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  const inSite = routed.filter(([dir]) => dir === publicDir)
  console.log(
    `▸ published ${inSite.length} files to ${path.relative(path.resolve(root, '../..'), publicDir)}, and manifest.json; ${routed.length - inSite.length} to ${path.relative(path.resolve(root, '../..'), exportsDir)}`,
  )
  const listed = [...routed, [publicDir, 'manifest.json']].sort(([, a], [, b]) => a.localeCompare(b))
  for (const [dir, file] of listed) console.log(`  ${dir === publicDir ? 'site   ' : 'exports'} ${file.padEnd(34)} ${mb(statSync(path.join(dir, file)).size)}`)
}

/* ── Verify ────────────────────────────────────────────────────────────── */

if (want('verify')) {
  const dir = path.join(out, 'verify')
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  const grab = (from, file, seconds, name) =>
    run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', seconds.toFixed(3), '-i', path.join(from, file), '-frames:v', '1', path.join(dir, name)])
  // The middle of each chapter, from the published files.
  const middle = (chapter) => (chapter.from + chapter.duration / 2) / B.FPS
  const chapters = {
    origin: B.ORIGIN,
    tokens: B.TOKENS,
    icons: B.ICONS,
    parts: B.PARTS,
    assemble: B.ASSEMBLE,
    themes: B.THEMES,
    end: B.END,
  }
  // The film and its square cut are exports (or archived outside the repo); check them only when published.
  const film = existsSync(path.join(dirOf('promo'), 'promo.mp4'))
  for (const [name, chapter] of Object.entries(film ? chapters : {})) {
    for (const ext of ['mp4', 'webm']) grab(dirOf('promo'), `promo.${ext}`, middle(chapter), `promo-${name}-${ext}.png`)
  }
  const S = B.SQUARE
  const squareChapters = {
    origin: S.origin,
    icons: S.icons,
    save: { from: S.save.from, duration: S.save.length },
    lanes: { from: S.lanes.from, duration: S.lanes.length },
    themes: S.themes,
    end: S.end,
  }
  for (const [name, chapter] of Object.entries(existsSync(path.join(dirOf('promo-square'), 'promo-square.mp4')) ? squareChapters : {})) {
    for (const ext of ['mp4', 'webm']) grab(dirOf('promo-square'), `promo-square.${ext}`, middle(chapter), `promo-square-${name}-${ext}.png`)
  }
  // Each loop's seam: its last frame should lead straight back into its first (they are the same, at rest). A loop
  // that never rests (the sound loop's tape) steps across its seam as it steps between any two frames: the last
  // step before it is printed beside it to compare.
  // Every encode of it is checked, the small cut's too. Its last frame is a web step short of the loop's end.
  let failed = 0
  for (const [name, video] of Object.entries(VIDEOS).filter(([n, v]) => v.loop && existsSync(path.join(dirOf(n), `${n}.mp4`)))) {
    const from = dirOf(name)
    const seconds = (video.frames[1] - video.frames[0] + 1) / B.FPS
    const budget = video.budget ?? LOOP_BUDGET
    const fps = video.fps ?? WEB_FPS
    for (const cut of Object.keys(video.web)) {
      for (const file of Object.values(encodesOf(name, cut)).filter((f) => existsSync(path.join(from, f)))) {
        const key = file.replace(/\./g, '-')
        grab(from, file, 0, `${key}-first.png`)
        // A hair early: a grab takes the first frame at or after its time, and a WebM's times are rounded to the millisecond.
        grab(from, file, seconds - 2 / fps - 0.0005, `${key}-before.png`)
        grab(from, file, seconds - 1 / fps - 0.0005, `${key}-last.png`)
        const seam = psnr(path.join(dir, `${key}-first.png`), path.join(dir, `${key}-last.png`))
        const step = psnr(path.join(dir, `${key}-before.png`), path.join(dir, `${key}-last.png`))
        const size = statSync(path.join(from, file)).size
        // Only the full cut has a budget; a small one is smaller than its full.
        const within = cut === 'small' || size < budget
        if (!within) failed++
        console.log(`▸ ${file.padEnd(34)} ${mb(size)} ${within ? 'within' : 'OVER'} its ${mb(budget)} budget; seam ${seam} (a step before it: ${step})`)
      }
    }
  }
  if (failed) {
    console.error(`✗ ${failed} files over budget`)
    process.exitCode = 1
  }
  for (const from of [publicDir, exportsDir].filter((d) => existsSync(d))) {
    for (const file of readdirSync(from).filter((f) => /\.(mp4|webm)$/.test(f)).sort()) {
      const info = read('ffprobe', [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'stream=codec_name,profile,width,height,pix_fmt,color_space,avg_frame_rate:format=duration,bit_rate',
        '-of',
        'compact=p=0:nk=1',
        path.join(from, file),
      ])
      console.log(`  ${file.padEnd(28)} ${info.trim().replace(/\n/g, ' | ')}`)
    }
  }
  console.log(`▸ frames in ${path.relative(root, dir)}`)
}

/* ── Determinism ───────────────────────────────────────────────────────── */

if (want('check')) {
  const dir = path.join(out, 'check')
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  let drifted = 0
  // Frames a quarter, half and three quarters in, each rendered on its own (a fresh render, replayed from
  // frame 0 in one tab), against the master rendered in parallel tabs.
  for (const [name, video] of selected(Object.entries(VIDEOS)).filter(([n, v]) => v.topic && existsSync(path.join(masters, n)))) {
    const [first, last] = video.frames
    for (const at of [0.25, 0.5, 0.75].map((t) => Math.round(first + (last - first) * t))) {
      const file = path.join(dir, `${name}-${at}.png`)
      remotion(['still', video.composition, path.relative(root, file), `--frame=${at}`, `--scale=${video.scale}`])
      const match = psnr(file, frameFile(path.join(masters, name), at))
      if (match !== 'identical' && parseFloat(match) < 50) drifted++
      console.log(`▸ ${name} frame ${at}: ${match}`)
    }
  }
  if (drifted) {
    console.error(`✗ ${drifted} frames differ from their master`)
    process.exitCode = 1
  }
}
