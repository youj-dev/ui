// Serves a built static site (storybook-static by default) for the Playwright
// suites. Plain Node on purpose: it also runs inside the Playwright Linux
// image, where the workspace's native build tools can't.
//
//   node scripts/serve-static.mjs [dir] [port]
import { createReadStream, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

const root = resolve(process.argv[2] ?? 'storybook-static')
const port = Number(process.argv[3] ?? 6141)
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.lottie': 'application/zip',
  '.riv': 'application/octet-stream',
}

createServer((req, res) => {
  // An absolute pathname normalizes inside the root: /../x is /x.
  let file = join(root, normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)))
  if (statSync(file, { throwIfNoEntry: false })?.isDirectory()) file = join(file, 'index.html')
  if (!statSync(file, { throwIfNoEntry: false })?.isFile()) {
    res.writeHead(404).end()
    return
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`))
