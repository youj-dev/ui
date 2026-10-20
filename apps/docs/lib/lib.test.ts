// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { copyInFootprint, installInfo, itemPackages, packageEntry, registryItem, registryItems, sourceExports } from './registry'
import { sectionTrail } from './sections'
import { dependencyRegistryUrl, fillUrls, registryHomepage, registryUrl, siteUrl } from './site'

describe('siteUrl', () => {
  it('prefers an explicit site URL and trims trailing slashes', () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: 'https://youj.io/', VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app' })).toBe('https://youj.io')
  })

  it("falls back to Vercel's production domain, then to the dev server", () => {
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'youj.vercel.app' })).toBe('https://youj.vercel.app')
    expect(siteUrl({})).toBe('http://localhost:3100')
  })

  it('names www.youj.dev, never the apex that redirects to it', () => {
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'www.youj.dev' })).toBe('https://www.youj.dev')
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: 'www.youj.dev/' })).toBe('https://www.youj.dev')
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'www.youj.dev' })).toBe('https://www.youj.dev')
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: 'https://next.youj.dev' })).toBe('https://next.youj.dev')
  })

  it('hosts the registry under /r', () => {
    expect(registryUrl({ NEXT_PUBLIC_SITE_URL: 'https://youj.io' })).toBe('https://youj.io/r')
  })

  it("names the public site as the registry's homepage unless a deployment origin is set", () => {
    expect(registryHomepage({})).toBe('https://www.youj.dev')
    expect(registryHomepage({ NEXT_PUBLIC_SITE_URL: 'https://next.youj.dev' })).toBe('https://next.youj.dev')
  })

  it("names built items' dependencies under the deployment's registry, or production's in a local build", () => {
    expect(dependencyRegistryUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'www.youj.dev' })).toBe('https://www.youj.dev/r')
    expect(dependencyRegistryUrl({ NEXT_PUBLIC_SITE_URL: 'https://next.youj.dev' })).toBe('https://next.youj.dev/r')
    expect(dependencyRegistryUrl({})).toBe('https://www.youj.dev/r')
  })

  it('fills snippet placeholders from the same source', () => {
    expect(fillUrls('add {registry}/reveal.json from {site}', { NEXT_PUBLIC_SITE_URL: 'https://k.dev' })).toBe('add https://k.dev/r/reveal.json from https://k.dev')
  })
})

describe('sectionTrail', () => {
  it('names the section and the group a page is filed in, though the URL leaves the group out', () => {
    expect(sectionTrail(['components', 'select'])).toEqual(['Components', 'Forms & inputs'])
    expect(sectionTrail(['components', 'date-picker'])).toEqual(['Components', 'Pickers & inputs'])
    expect(sectionTrail(['components', 'lottie-player'])).toEqual(['Components', 'Media'])
    expect(sectionTrail(['motion', 'reveal'])).toEqual(['Motion', 'Primitives'])
    expect(sectionTrail(['components', 'chat', 'message'])).toEqual(['Components', 'Chat'])
  })

  it('names only the section for its own pages, and for a group’s own page', () => {
    expect(sectionTrail(['components'])).toEqual(['Components'])
    expect(sectionTrail(['components', 'overlays'])).toEqual(['Components'])
    expect(sectionTrail(['components', 'chat'])).toEqual(['Components'])
    expect(sectionTrail(['motion', 'principles'])).toEqual(['Motion'])
    expect(sectionTrail(['icons', 'morphs'])).toEqual(['Icons'])
    expect(sectionTrail(['guides', 'shadcn'])).toEqual(['Guides'])
  })

  it('files top-level pages under Get started', () => {
    expect(sectionTrail([])).toEqual(['Get started'])
    expect(sectionTrail(['installation'])).toEqual(['Get started'])
  })
})

describe('itemPackages', () => {
  it('lists what a block needs installed, the packages behind the components it is built from included', () => {
    const packages = itemPackages('app-fleet-overview')
    for (const dep of ['@youj/core', '@youj/icons', '@youj/motion', '@youj/react']) expect(packages).toContain(dep)
    expect(itemPackages('app-money-overview')).not.toContain('@youj/illustrations')
  })
})

describe('packageEntry', () => {
  it("imports from the entry that exports the item: motion's heavier areas have their own", () => {
    expect(packageEntry(registryItem('reveal'))).toBe('@youj/motion')
    expect(packageEntry(registryItem('sliding-indicator'))).toBe('@youj/motion')
    expect(packageEntry(registryItem('dock'))).toBe('@youj/motion/interactions')
    expect(packageEntry(registryItem('mesh-gradient'))).toBe('@youj/motion/backgrounds')
    expect(packageEntry(registryItem('lottie-player'))).toBe('@youj/motion/players')
    expect(packageEntry(registryItem('loader-tittle'))).toBe('@youj/loaders/tittle')
    expect(packageEntry(registryItem('loader-kit'))).toBe('@youj/loaders')
    expect(packageEntry(registryItem('iso-stack'))).toBe('@youj/illustrations')
    expect(packageEntry(registryItem('grid-backdrops'))).toBe('@youj/illustrations')
    expect(packageEntry(registryItem('icon-bell'))).toBe('@youj/icons')
    expect(packageEntry(registryItem('icon-swap'))).toBe('@youj/icons')
  })

  it('imports a UI component that needs an optional peer from its entry', () => {
    expect(packageEntry(registryItem('chart'))).toBe('@youj/react/chart')
    expect(packageEntry(registryItem('date-picker'))).toBe('@youj/react/date')
    expect(packageEntry(registryItem('combobox'))).toBe('@youj/react/command')
    expect(packageEntry(registryItem('button'))).toBe('@youj/react')
    expect(packageEntry(registryItem('table'))).toBe('@youj/react')
  })

  it('keeps other packages on their root entry', () => {
    expect(packageEntry({ name: 'button', package: '@youj/react', files: [{ path: 'src/components/ui/button.tsx' }] })).toBe('@youj/react')
  })
})

describe('installInfo', () => {
  it('installs the optional peers a component needs with the package', () => {
    const exportsOf = () => ['Carousel']
    expect(installInfo('carousel', exportsOf)).toMatchObject({
      packageCommand: 'pnpm add @youj/react embla-carousel-react',
      packageImport: "import { Carousel } from '@youj/react/carousel'",
    })
    expect(installInfo('button', () => ['Button']).packageCommand).toBe('pnpm add @youj/react')
    // Motion has no entries.json: the item names its optional peer, at the range @youj/motion accepts.
    expect(installInfo('lottie-player', () => ['LottiePlayer']).packageCommand).toBe('pnpm add @youj/motion @lottiefiles/dotlottie-react@^0.19.16')
  })

  it('offers a block only as copy-in, importing its real export from the path the CLI writes', () => {
    const info = installInfo('marketing-cta-banner', () => [])
    expect(info.packageCommand).toBeUndefined()
    expect(info.packageImport).toBeUndefined()
    expect(info.registryCommand).toBe('npx youj add marketing-cta-banner')
    expect(info.registryImport).toBe("import { CtaBanner } from '@/blocks/marketing/cta-banner'")
    expect(installInfo('app-error', () => []).registryImport).toBe("import { ErrorScreen } from '@/blocks/app/error'")
  })
})

describe('sourceExports', () => {
  it('names exported components and hooks, not types', () => {
    const code = 'function A() {}\nexport { A, B as Bee, type CProps }\nexport type { DProps }\nexport function useThing() {}\nexport const helper = 1\n'
    expect(sourceExports(code)).toEqual(['A', 'Bee', 'useThing'])
  })
})

describe('copy-in footprint', () => {
  it('says nothing for a lean copy and names the extras of a heavy one', () => {
    expect(installInfo('button', () => ['Button']).copyIn).toBeUndefined()
    const dialog = installInfo('alert-dialog', () => ['AlertDialog']).copyIn
    expect(dialog?.extras).toContain('async-button')
    expect(dialog?.items).toContain('youj-core')
  })

  it('counts what the UI package counts for its budget', async () => {
    const { footprint } = await import('../../../packages/ui/scripts/footprint.mjs')
    for (const name of ['button', 'alert-dialog', 'data-table']) {
      const mine = copyInFootprint(name)
      const theirs = footprint(name)
      expect({ items: mine.items, lines: mine.lines }).toEqual({ items: theirs.items, lines: theirs.lines })
    }
  })
})

describe("the docs' add commands", () => {
  it('name items the registry has (or its aliases: sound, locale <id>, theme <id>)', () => {
    const content = join(process.cwd(), 'content/docs')
    const named = (readdirSync(content, { recursive: true }) as string[])
      .filter((f) => f.endsWith('.mdx'))
      .flatMap((f) => [...readFileSync(join(content, f), 'utf8').matchAll(/npx youj add ((?:[\w@/<>-]+ ?)+)/g)].map((m) => ({ page: f, args: m[1]!.trim().split(' ') })))
    expect(named.length).toBeGreaterThan(10)
    const items = registryItems()
    const unknown = named.flatMap(({ page, args }) =>
      args
        .map((arg, i) => (args[i - 1] === 'locale' || args[i - 1] === 'theme' ? `youj-${args[i - 1]}-${arg}` : arg))
        .filter((arg) => !/^-|<|>/.test(arg) && !['locale', 'theme', 'sound'].includes(arg) && !items.has(arg))
        .map((arg) => `${page}: ${arg}`),
    )
    expect(unknown).toEqual([])
  })
})

describe("the docs' imports", () => {
  it('name what the package entry exports, as the api/ snapshots list it', () => {
    const api = join(process.cwd(), '../../api')
    const exported = new Map<string, Set<string>>()
    for (const file of readdirSync(api).filter((f) => f.endsWith('.api.md'))) {
      let entry: Set<string> | undefined
      for (const line of readFileSync(join(api, file), 'utf8').split('\n')) {
        const heading = line.match(/^## (@youj\/\S+)/)
        if (heading) exported.set(heading[1]!, (entry = new Set()))
        const declared = line.match(/^(?:const|function|interface|type|class) ([\w$]+)/)
        if (declared) entry?.add(declared[1]!)
      }
    }
    expect(exported.get('@youj/react')?.has('Button')).toBe(true)
    const content = join(process.cwd(), 'content/docs')
    const wrong = (readdirSync(content, { recursive: true }) as string[])
      .filter((f) => f.endsWith('.mdx'))
      .flatMap((page) =>
        [...readFileSync(join(content, page), 'utf8').matchAll(/```(?:tsx|ts|jsx|js)\b[^\n]*\n([\s\S]*?)```/g)].flatMap((fence) =>
          [...fence[1]!.matchAll(/^import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+'(@youj\/[^']+)'/gm)].flatMap(([, list, entry]) =>
            list!
              .split(',')
              .map((name) => name.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]!)
              .filter((name) => name && !exported.get(entry!)?.has(name))
              .map((name) => `${page}: ${name} from ${entry}`),
          ),
        ),
      )
    expect(wrong).toEqual([])
  })
})
