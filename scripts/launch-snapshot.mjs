// The public repository's first commit: the tracked files at HEAD (`git archive`, never a folder copy, so untracked
// folders such as plans/ and .claude/ can't come along), in a fresh `git init` with one commit, scanned by gitleaks.
// It pushes nothing: it prints the commands.
//
//   pnpm launch:snapshot                 into a new temp folder
//   pnpm launch:snapshot --out <dir>     into <dir>, which must not exist yet
//
// Needs gitleaks (brew install gitleaks). Commit everything first: uncommitted changes are not in the snapshot.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

const root = join(import.meta.dirname, '..')
const REMOTE = 'https://github.com/youj-dev/ui.git'
// GitHub refuses files over 100 MB and warns over 50 MB.
const MAX_FILE = 50 * 1024 * 1024
const { values: options } = parseArgs({ options: { out: { type: 'string' } } })

const git = (args, cwd = root) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const fail = (message) => {
  console.error(`launch:snapshot: ${message}`)
  process.exit(1)
}

try {
  execFileSync('gitleaks', ['version'], { stdio: 'ignore' })
} catch {
  fail('gitleaks is not installed (brew install gitleaks); the snapshot is only safe to push once it has been scanned')
}

const head = git(['rev-parse', 'HEAD'])
const { version } = JSON.parse(git(['show', 'HEAD:packages/core/package.json']))
if (git(['status', '--porcelain'])) console.warn('launch:snapshot: the working tree has uncommitted changes; they are NOT in the snapshot (it is HEAD)')

let dir
if (options.out) {
  dir = resolve(options.out)
  if (existsSync(dir)) fail(`${dir} already exists; name a new folder`)
  mkdirSync(dir, { recursive: true })
} else {
  dir = mkdtempSync(join(tmpdir(), 'youj-public-'))
}

// git archive writes the committed tree only, and honours export-ignore; tar unpacks it into the empty folder.
execFileSync('sh', ['-c', `git archive --format=tar HEAD | tar -x -C "${dir}"`], { cwd: root, stdio: 'inherit' })
for (const untracked of ['plans', '.claude', 'node_modules', '.ship']) if (existsSync(join(dir, untracked))) fail(`${untracked}/ is in the snapshot; it must never be published`)
const big = (readdirSync(dir, { recursive: true }))
  .map((file) => [file, statSync(join(dir, file))])
  .filter(([, stat]) => stat.isFile() && stat.size > MAX_FILE)
if (big.length) fail(`files over 50 MB, which GitHub won't take well:\n${big.map(([file, stat]) => `  ${file} (${(stat.size / 1048576).toFixed(1)} MB)`).join('\n')}`)

git(['init', '--quiet', '--initial-branch=main'], dir)
git(['add', '--all'], dir)
// The commit is authored by whoever runs this, from their git config, like any other commit of theirs.
git(['commit', '--quiet', '--no-verify', '-m', `Youj ${version}`], dir)
const files = git(['ls-files'], dir).split('\n').length
// The same tree, hash for hash: nothing added, dropped or changed on the way (which also makes the switch below a no-op).
if (git(['rev-parse', 'HEAD^{tree}'], dir) !== git(['rev-parse', 'HEAD^{tree}'])) fail(`the snapshot's tree differs from HEAD's; don't push ${dir}`)

console.log(`launch:snapshot: ${files} files from ${head.slice(0, 9)} committed in ${dir}; scanning with gitleaks`)
try {
  execFileSync('gitleaks', ['git', dir, '--config', join(dir, '.gitleaks.toml'), '--redact', '--no-banner', '--exit-code', '1'], { stdio: 'inherit' })
} catch {
  fail(`gitleaks found something in ${dir}: fix it in the repository, commit, and run this again. Don't push this snapshot.`)
}

console.log(`
launch:snapshot: ready, nothing pushed. The public repository's first commit is in
  ${dir}

The github.com/youj-dev/ui that exists today holds the private history (every commit, branch and pull request ref),
and GitHub keeps old commits reachable by their hash. Don't push this into it and make it public: rename it first
(Settings, General, Repository name, e.g. ui-private), then create a new, empty, public youj-dev/ui (no README,
licence or .gitignore), and push:

  cd ${dir}
  git remote add origin ${REMOTE}
  git push -u origin main

Then move the working checkout onto the public history, so scripts/ship.sh finds main level with origin/main
(the files are the same; the old history stays on the private-main branch):

  cd ${root}
  git remote set-url origin ${REMOTE}      # only if origin points somewhere else
  git branch private-main ${head.slice(0, 9)}
  git fetch origin
  git checkout -B main origin/main

A branch started before the snapshot moves across with: git rebase --onto main private-main <branch>`)
