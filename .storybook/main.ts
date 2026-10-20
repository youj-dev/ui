import { globSync, readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'

const packagesDir = fileURLToPath(new URL('../packages/', import.meta.url))

/* Every package keeps the shadcn-style `@/` alias for its own `src/`, because
 * that is what registry consumers get. In one Vite graph that alias has to be
 * resolved relative to the package the importing file lives in. */
function packageAlias(): Plugin {
  return {
    name: 'youj:package-alias',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!source.startsWith('@/') || !importer?.startsWith(packagesDir)) return null
      const pkg = importer.slice(packagesDir.length).split('/')[0]
      return this.resolve(`${packagesDir}${pkg}/src/${source.slice(2)}`, importer, { ...options, skipSelf: true })
    },
  }
}

/* Storybook prints a prop's docgen default with escodegen, which cannot print JSX. A default like
 * `brand = AUTH_BRAND`, which docgen resolves to an object holding an `<svg>`, crashed it on every
 * story of that component. A default made of JSX is dropped from the docgen; the prop's description
 * says what it is. */
function docgenJsxDefaults(): Plugin {
  const jsxDefault = /"defaultValue": \{\s*"value": "((?:[^"\\]|\\.)*)",\s*"computed": (?:true|false)\s*\}/g
  return {
    name: 'youj:docgen-jsx-defaults',
    enforce: 'post',
    transform(code) {
      if (!code.includes('__docgenInfo')) return null
      return code.replace(jsxDefault, (match, value: string) => (/<[A-Za-z]/.test(value) ? '"defaultValue": undefined' : match))
    },
  }
}

/* `pnpm test:stories` runs only the stories that have a `play()`: opening all
 * ~690 story files in the test browser takes minutes and makes Vite re-optimize
 * dependencies mid-run. */
const rootDir = fileURLToPath(new URL('../', import.meta.url))
const playStories = () =>
  globSync('packages/*/src/**/*.stories.{ts,tsx}', { cwd: rootDir })
    .filter((file) => /\bplay\s*[:(]/.test(readFileSync(`${rootDir}${file}`, 'utf8')))
    .map((file) => `../${file}`)

const config: StorybookConfig = {
  stories: process.env.YOUJ_PLAY_ONLY ? playStories() : ['../packages/*/src/**/*.mdx', '../packages/*/src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: { name: '@storybook/react-vite', options: {} },
  // The commerce blocks' demo photos are the docs site's; Storybook serves them at the same path.
  staticDirs: ['../packages/motion/public', { from: '../apps/docs/public/blocks', to: '/blocks' }],
  viteFinal: (viteConfig) => {
    viteConfig.plugins = [packageAlias(), ...(viteConfig.plugins ?? []), docgenJsxDefaults(), tailwindcss()]
    // In the workspace, packages consume each other's source directly.
    const coreSrc = `${packagesDir}core/src`
    const motionSrc = `${packagesDir}motion/src`
    const iconsSrc = `${packagesDir}icons/src`
    const illustrationsSrc = `${packagesDir}illustrations/src`
    // The root has no @base-ui of its own: alias it to @youj/react's, so
    // preview.tsx's bare import resolves to the same module the components use.
    const baseUiDir = `${packagesDir}ui/node_modules/@base-ui/react`
    viteConfig.resolve ??= {}
    const existing = viteConfig.resolve.alias ?? []
    viteConfig.resolve.alias = [
      ...(Array.isArray(existing) ? existing : Object.entries(existing).map(([find, replacement]) => ({ find, replacement }))),
      { find: /^@youj\/core$/, replacement: `${coreSrc}/index.ts` },
      { find: /^@youj\/motion$/, replacement: `${motionSrc}/index.ts` },
      { find: /^@youj\/core\/(.*)$/, replacement: `${coreSrc}/$1` },
      { find: /^@youj\/motion\/(.*)$/, replacement: `${motionSrc}/$1` },
      { find: /^@youj\/icons$/, replacement: `${iconsSrc}/index.ts` },
      { find: /^@youj\/icons\/(.*)$/, replacement: `${iconsSrc}/$1` },
      { find: /^@youj\/illustrations$/, replacement: `${illustrationsSrc}/index.ts` },
      { find: /^@youj\/illustrations\/(.*)$/, replacement: `${illustrationsSrc}/$1` },
      { find: /^@base-ui\/react\/(.*)$/, replacement: `${baseUiDir}/$1` },
    ]
    return viteConfig
  },
}

export default config
