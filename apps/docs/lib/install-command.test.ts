import { parseInstall } from './install-command'

describe('parseInstall', () => {
  it('reads a CLI command and a package install, in any package manager’s words', () => {
    expect(parseInstall('npx youj add button\n')).toEqual({ kind: 'cli', run: 'add button' })
    expect(parseInstall('pnpm add @youj/sound')).toEqual({ kind: 'package', packages: '@youj/sound', dev: false })
    expect(parseInstall('npm i -D tailwindcss @tailwindcss/vite')).toEqual({ kind: 'package', packages: 'tailwindcss @tailwindcss/vite', dev: true })
    expect(parseInstall('yarn add --dev vitest')).toEqual({ kind: 'package', packages: 'vitest', dev: true })
  })

  it('leaves everything else a code block', () => {
    for (const text of ['pnpm install', 'pnpm up "@youj/*" --latest', 'npx -y @youj/mcp', 'npx youj@next init', 'npx youj init\nnpx youj add button', 'npx youj add button && pnpm dev', 'grep -rn "x" src | head', 'pnpm -F docs verify', '']) {
      expect(parseInstall(text), text).toBeUndefined()
    }
  })
})
