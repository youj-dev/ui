import { fireEvent, render, screen, within } from '@testing-library/react'
import type { Pillar } from '@/lib/nav'
import SiteSearch, { glyphOf, sceneOf, renderExcerpt, stageOf } from './search'
import { groupResults, rankResults, resultGroup, RESULT_GROUPS, searchTerms, splits, titleFit } from './search-rank'
import { readRecent } from './search-recent'
import SearchStage from './search-stage'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

describe('rankResults', () => {
  const page = (url: string, content: string) => ({ id: url, type: 'page' as const, url, content })
  const text = (url: string, content: string) => ({ id: `${url}-t`, type: 'text' as const, url, content })

  it('puts the page titled by the query ahead of pages that only mention it', () => {
    const ranked = rankResults(
      [page('/docs/hooks/use-icon-state', 'useIconState'), text('/docs/hooks/use-icon-state', 'a <mark>button</mark>'), page('/docs/components/button', '<mark>Button</mark>')],
      'button',
    )
    expect(ranked.map((r) => r.url)).toEqual(['/docs/components/button', '/docs/hooks/use-icon-state', '/docs/hooks/use-icon-state'])
  })

  it('ranks a page whose title holds every word of the query above pages that only mention them', () => {
    const ranked = rankResults([page('/docs/components/mesh', 'Mesh gradient'), page('/blocks/hero', 'Hero section')], 'section hero')
    expect(ranked.map((r) => r.url)).toEqual(['/blocks/hero', '/docs/components/mesh'])
  })

  it('reads a word’s forms as one: “theme” finds Theming ahead of Theme Playground', () => {
    const ranked = rankResults([page('/blocks/theme-playground', '<mark>Theme</mark> Playground'), page('/docs/theming', 'Theming')], 'theme')
    expect(ranked.map((r) => r.url)).toEqual(['/docs/theming', '/blocks/theme-playground'])
  })

  it('puts a page with a heading that names the query ahead of pages that only mention it', () => {
    const heading = (url: string, content: string) => ({ id: `${url}#h`, type: 'heading' as const, url: `${url}#h`, content })
    const ranked = rankResults(
      [page('/docs/icons', 'Icons'), text('/docs/icons', 'one <mark>easing</mark>'), page('/docs/motion/tokens', 'Motion tokens'), heading('/docs/motion/tokens', '<mark>Easings</mark>')],
      'easing',
    )
    expect(ranked[0]!.url).toBe('/docs/motion/tokens')
  })

  it('keeps a block’s story and the Blocks page it opens apart, each with its own hits', () => {
    const story = { id: 'blocks/app-track-arranger', type: 'page' as const, url: '/docs/blocks/media', content: '<mark>Song</mark> sketch' }
    const ranked = rankResults([page('/docs/blocks/media', 'Audio'), text('/docs/blocks/media', 'a <mark>song</mark> idea'), story, text('/docs/blocks/media', 'four tracks of a <mark>song</mark>')], 'song')
    expect(ranked.filter((r) => r.type === 'page').map((r) => r.id)).toEqual(['blocks/app-track-arranger', '/docs/blocks/media'])
    expect(ranked.map((r) => r.content)).toEqual(['<mark>Song</mark> sketch', 'four tracks of a <mark>song</mark>', 'Audio', 'a <mark>song</mark> idea'])
  })

  it('keeps at most two excerpts under a page', () => {
    const ranked = rankResults([page('/a', 'A'), text('/a#1', 'x'), text('/a#2', 'y'), text('/a#3', 'z')], 'x')
    expect(ranked).toHaveLength(3)
  })

  it('among pages whose headings name the query, puts the one with more hits first', () => {
    const heading = (url: string, content: string) => ({ id: `${url}-h`, type: 'heading' as const, url: `${url}#h`, content })
    const ranked = rankResults(
      [
        page('/mesh', 'Mesh Gradient'),
        heading('/mesh', '<mark>Colors</mark>'),
        page('/theming', 'Theming'),
        heading('/theming', '<mark>Colors</mark> per mode'),
        text('/theming', 'one <mark>color</mark>'),
        text('/theming', 'two <mark>colors</mark>'),
      ],
      'color',
    )
    expect(ranked[0]!.url).toBe('/theming')
  })

  it('puts a page whose hits hold every word ahead of a title holding some of them', () => {
    const ranked = rankResults(
      [page('/form', '<mark>Form</mark>'), page('/auth', 'Auth Flow'), text('/auth', 'Pages: <mark>Login</mark>: a sign-in <mark>form</mark>')],
      'login form',
    )
    expect(ranked[0]!.url).toBe('/auth')
  })
})

describe('results by level', () => {
  const page = (url: string, content: string) => ({ id: url, type: 'page' as const, url, content })
  const text = (url: string, content: string) => ({ id: `${url}-t`, type: 'text' as const, url, content })

  it('files each result’s page under its level, the visuals together, and everything else under Docs', () => {
    const at = (url: string) => resultGroup(url)
    expect(at('/docs/components/button')).toBe('Components')
    expect(at('/docs/components/data-marks')).toBe('Components')
    expect(at('/docs/components/table')).toBe('Components')
    expect(at('/docs/components/chat/message#props')).toBe('Components')
    expect(at('/components/actions')).toBe('Components')
    // A Blocks docs page under its group, read from the groups' meta.json, a story's hash or not.
    expect(at('/docs/blocks/trends-and-comparisons#latency')).toBe('Cards')
    expect(at('/docs/blocks/hero#split')).toBe('Sections')
    expect(at('/docs/blocks/top-bars#tabs')).toBe('Docs')
    expect(at('/docs/blocks/settings')).toBe('Screens')
    expect(at('/docs/blocks/not-a-page')).toBe('Docs')
    expect(at('/create')).toBe('Create')
    // The retired lists are no group's.
    expect(at('/cards/app-percentile-trend')).toBe('Docs')
    expect(at('/icons')).toBe('Visuals')
    expect(at('/illustrations?scene=coffee')).toBe('Visuals')
    expect(at('/loaders?id=tittle')).toBe('Visuals')
    expect(at('/miniatures')).toBe('Visuals')
    expect(at('/docs/theming')).toBe('Docs')
    expect(at('/docs/components-extra')).toBe('Docs')
    expect(at('/faq')).toBe('Docs')
    expect(at('/screensx')).toBe('Docs')
  })

  it('lists the groups in the ladder’s order when the matches are equal', () => {
    const results = ['/docs/theming', '/templates/theme-mail', '/docs/blocks/checkout#theme', '/docs/blocks/tables-and-lists#theme', '/docs/components/theme-picker', '/create?theme', '/docs/blocks/hero#theme', '/docs/blocks/specialized#theme', '/loaders?id=theme-spin'].map((url) => page(url, 'Theme'))
    expect(groupResults(results, 'theme').map((g) => g.group)).toEqual([...RESULT_GROUPS])
  })

  it('never mixes levels in a group: each holds only its own pages, with their excerpts', () => {
    const groups = groupResults(
      [page('/docs/blocks/trends-and-comparisons#latency', 'Latency'), text('/docs/blocks/trends-and-comparisons#latency', 'a <mark>latency</mark> chart'), page('/docs/blocks/dashboards#latency-report', 'Latency report'), page('/docs/components/gauge', 'Gauge')],
      'latency',
    )
    for (const { group, items } of groups) for (const item of items) expect(resultGroup(item.url), `${group}: ${item.url}`).toBe(group)
    expect(groups.map((g) => g.group)).toEqual(['Cards', 'Screens', 'Components'])
  })

  it('leads with the group holding the best match, so a docs page named by the query isn’t buried', () => {
    const groups = groupResults([page('/docs/components/button', 'A component that mentions installation'), page('/docs/installation', 'Installation')], 'installation')
    expect(groups.map((g) => g.group)).toEqual(['Docs', 'Components'])
  })

  it('keeps the pages of a group in rank order', () => {
    const groups = groupResults([page('/docs/blocks/trends-and-comparisons#usage-overview', 'Usage log'), page('/docs/blocks/trends-and-comparisons#latency', 'Latency'), page('/docs/blocks/meters-and-limits#limit-tracker', 'Limit tracker')], 'latency')
    expect(groups).toHaveLength(1)
    expect(groups[0]!.items[0]!.url).toBe('/docs/blocks/trends-and-comparisons#latency')
  })
})

describe('the query the index is asked', () => {
  it('drops a long word’s plural and reads British spellings as American', () => {
    expect(searchTerms('Colors')).toBe('color')
    expect(searchTerms('colour')).toBe('color')
    expect(searchTerms('class focus')).toBe('class focu')
    expect(searchTerms('tabs')).toBe('tabs')
  })

  it('splits a compound typed without its space at every point', () => {
    expect(splits('datepiker')).toEqual(['dat epiker', 'date piker', 'datep iker', 'datepi ker'])
    expect(splits('button')).toEqual([])
    expect(splits('date picker')).toEqual([])
  })

  it('scores how well a title holds the words: prefixes, then one typo each', () => {
    const results = [{ id: '/d', type: 'page' as const, url: '/d', content: 'Date Picker' }]
    expect(titleFit(results, 'date picker')).toBe(0)
    expect(titleFit(results, 'date piker')).toBe(1)
    expect(titleFit(results, 'dat epiker')).toBe(Infinity)
    expect(titleFit(results, 'datepicker')).toBe(Infinity)
  })
})

describe('renderExcerpt', () => {
  it('marks the matches the index highlighted, as text, never as HTML', () => {
    const { container } = render(<p>{renderExcerpt('Reduced <mark>motion</mark> for <img src=x> <mark>tokens</mark>')}</p>)
    expect([...container.querySelectorAll('mark')].map((m) => m.textContent)).toEqual(['motion', 'tokens'])
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toBe('Reduced motion for <img src=x> tokens')
  })

  it('drops Markdown emphasis and link syntax, keeping the words', () => {
    const { container } = render(<p>{renderExcerpt('**Right to <mark>left</mark>.** See [the guide](/docs/guides/rtl).')}</p>)
    expect(container.textContent).toBe('Right to left. See the guide.')
    expect(container.querySelector('mark')?.textContent).toBe('left')
  })

  it('drops Markdown code ticks', () => {
    const { container } = render(<p>{renderExcerpt('Use `useYouj()` in <mark>components</mark>')}</p>)
    expect(container.textContent).toBe('Use useYouj() in components')
  })
})

describe('the palette, with nothing typed', () => {
  const part = (id: Pillar['id'], label: string, stat: string, status?: Pillar['status']): Pillar => ({ id, name: `Youj ${label}`, label, url: `/${id}`, blurb: '', stat, status })
  const PILLARS = [
    part('ui', 'UI', 'Components'),
    part('motion', 'Motion', 'Animation tools'),
    part('loaders', 'Loaders', 'Loading animations', 'experimental'),
    part('icons', 'Icons', 'Animated icons'),
    part('illustrations', 'Illustrations', 'Isometric scenes'),
    part('sound', 'Sound', 'Interface sounds'),
    part('themes', 'Themes', 'Theme presets'),
    part('blocks', 'Blocks', 'Pages and sections'),
  ]

  it('opens on every part of the family, each with its glyph and what it holds, Loaders marked experimental', () => {
    render(<SiteSearch open onOpenChange={() => {}} pillars={PILLARS} />)
    const family = screen.getByRole('group', { name: 'Youj' })
    const rows = within(family).getAllByRole('option')
    expect(rows.map((row) => row.textContent)).toEqual(PILLARS.map((p) => `${p.label}${p.status ?? ''}${p.stat}`))
    for (const row of rows) expect(row.querySelector('svg')).toBeInTheDocument()
    expect(within(rows[2]!).getByText('experimental')).toHaveAttribute('data-status', 'experimental')
  })
})

describe('the stage beside the list', () => {
  it('shows a result as what it is: the loader, scene or icon its URL opens on, the theming page as a theme', () => {
    expect(stageOf('/loaders?id=tittle', 'Tittle').art).toEqual({ kind: 'loader', id: 'tittle' })
    expect(stageOf('/illustrations?scene=coffee', 'Coffee').art).toEqual({ kind: 'scene', id: 'coffee' })
    expect(stageOf('/icons?icon=bell', 'bell').art).toEqual({ kind: 'icon', name: 'bell' })
    expect(stageOf('/docs/theming#presets', 'Theming', undefined, true).art).toEqual({ kind: 'theme', id: 'basalt' })
    expect(stageOf('/docs/components/button#props', 'Button').art).toMatchObject({ kind: 'glyph' })
    expect(stageOf('/docs/blocks/trends-and-comparisons#latency', 'Latency')).toMatchObject({ kind: 'Card', art: { kind: 'glyph' } })
    expect(stageOf('/docs/installation', 'Installation')).toMatchObject({ kind: 'Docs page', art: { kind: 'scene', id: 'delivery' } })
    expect(stageOf('/loaders', 'Loaders')).toMatchObject({ kind: 'Explorer', art: { kind: 'loader', id: 'tittle' } })
  })

  it('draws docs pages and explorers as an isometric scene: the page’s own art, else its section’s', () => {
    expect(sceneOf('/docs/mcp')).toBe('chat')
    expect(sceneOf('/docs/guides/rtl')).toBe('globe')
    expect(sceneOf('/docs/motion/presets')).toBe('stopwatch')
    expect(sceneOf('/docs/loaders')).toBe('documents')
    expect(sceneOf('/icons')).toBe('design-tools')
    expect(stageOf('/docs/sound/api', 'API').art).toEqual({ kind: 'scene', id: 'music' })
  })

  it('names the row it shows and stays out of the accessibility tree', () => {
    const { container } = render(<SearchStage item={{ art: { kind: 'glyph', Glyph: glyphOf('/docs') }, kind: 'Docs page', title: 'Installation', text: 'Add Youj to an app.' }} />)
    const stage = container.querySelector('[data-slot="search-stage"]')!
    expect(stage).toHaveAttribute('aria-hidden', 'true')
    expect(stage).toHaveTextContent('Docs pageInstallationAdd Youj to an app.')
  })
})

describe('the palette, remembering', () => {
  afterEach(() => localStorage.clear())

  it('lists the pages last opened from it first, and ignores anything in storage that isn’t one of the site’s pages', () => {
    localStorage.setItem(
      'youj:search-recent',
      JSON.stringify([{ url: '/docs/components/button', title: 'Button' }, { url: 'https://example.com', title: 'Away' }, { url: '//example.com', title: 'Away' }, { title: 'No URL' }]),
    )
    expect(readRecent()).toEqual([{ url: '/docs/components/button', title: 'Button' }])
    render(<SiteSearch open onOpenChange={() => {}} />)
    const recent = screen.getByRole('group', { name: 'Recent' })
    expect(within(recent).getAllByRole('option').map((row) => row.textContent)).toEqual(['Button'])
  })

  it('reads broken storage as no history', () => {
    localStorage.setItem('youj:search-recent', '{not json')
    expect(readRecent()).toEqual([])
  })
})

describe('the palette, searching for a theme', () => {
  it('lists a preset the query names first, with its colors', async () => {
    render(<SiteSearch open onOpenChange={() => {}} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'basalt' } })
    const themes = await screen.findByRole('group', { name: 'Themes' })
    const [basalt] = within(themes).getAllByRole('option')
    expect(basalt).toHaveTextContent('BasaltTheme')
    expect(screen.getAllByRole('group')[0]).toBe(themes)
  })
})
