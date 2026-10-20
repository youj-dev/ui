import { parseInstall } from './install-command'

describe('parseInstall', () => {
  it('reads a CLI command and a package install, in any package manager’s words', () => {
    expect(parseInstall('npx @youj/cli add button\n')).toEqual({ kind: 'cli', run: 'add button' })
    expect(parseInstall('pnpm add @youj/sound')).toEqual({ kind: 'package', packages: '@youj/sound', dev: false })
    expect(parseInstall('npm i -D tailwindcss @tailwindcss/vite')).toEqual({ kind: 'package', packages: 'tailwindcss @tailwindcss/vite', dev: true })
    expect(parseInstall('yarn add --dev vitest')).toEqual({ kind: 'package', packages: 'vitest', dev: true })
  })

  it('leaves everything else a code block', () => {
    for (const text of ['pnpm install', 'pnpm up "@youj/*" --latest', 'npx -y @youj/mcp', 'npx @youj/cli@next init', 'npx @youj/cli init\nnpx @youj/cli add button', 'npx @youj/cli add button && pnpm dev', 'grep -rn "x" src | head', 'pnpm -F docs verify', '']) {
      expect(parseInstall(text), text).toBeUndefined()
    }
  })
})
