// A local npm registry for the install test: it serves the packed @youj packages and the CLI from
// their tarballs, the way the public registry will once they're published, and passes every other
// request through to registry.npmjs.org. `npx`, npm and pnpm pointed at it (npm_config_registry)
// install exactly what the docs say, with nothing published.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { basename } from 'node:path'

const UPSTREAM = 'https://registry.npmjs.org'

/** Starts the registry on a free port; resolves to { url, close }. */
export async function startRegistry(tarballs) {
  const packages = new Map()
  for (const file of tarballs) {
    const manifest = JSON.parse(execFileSync('tar', ['-xzOf', file, 'package/package.json'], { encoding: 'utf8' }))
    const data = readFileSync(file)
    // As scripts/release.mjs publishes it: the workspace manifests stay private.
    delete manifest.private
    delete manifest.scripts
    delete manifest.devDependencies
    packages.set(manifest.name, { manifest, data, file: basename(file), integrity: `sha512-${createHash('sha512').update(data).digest('base64')}`, shasum: createHash('sha1').update(data).digest('hex') })
  }
  let base = ''
  const packument = ({ manifest, file, integrity, shasum }) => ({
    name: manifest.name,
    'dist-tags': { latest: manifest.version },
    versions: { [manifest.version]: { ...manifest, _id: `${manifest.name}@${manifest.version}`, dist: { tarball: `${base}/-/${file}`, integrity, shasum } } },
    time: { [manifest.version]: new Date().toISOString() },
  })
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const own = [...packages.values()].find((p) => path === `/-/${p.file}`)
    if (own) return void res.writeHead(200, { 'content-type': 'application/octet-stream' }).end(own.data)
    const pkg = packages.get(path.slice(1))
    if (pkg) return void res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(packument(pkg)))
    try {
      const headers = { accept: req.headers.accept ?? 'application/json' }
      const upstream = await fetch(`${UPSTREAM}${req.url}`, { headers, redirect: 'follow' })
      const body = Buffer.from(await upstream.arrayBuffer())
      res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'application/octet-stream' }).end(body)
    } catch (error) {
      res.writeHead(502).end(String(error))
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}`
  return { url: `${base}/`, names: [...packages.keys()], close: () => server.close() }
}
