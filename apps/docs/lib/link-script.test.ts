import { LOADER_LINK_SCRIPT } from '@/components/loaders/query'
import { linkScript } from './link-script'
import { SCENE_LINK_SCRIPT } from '@/components/illustrations/query'

describe('link scripts', () => {
  it('mark the document when the address names something other than the flagship', () => {
    expect(LOADER_LINK_SCRIPT).toBe(
      `(function(){try{var s=new URLSearchParams(location.search).get('id');if(s&&s!=="draft")document.documentElement.setAttribute('data-loader-link','')}catch(e){}})()`,
    )
    expect(SCENE_LINK_SCRIPT).toBe(
      `(function(){try{var s=new URLSearchParams(location.search).get('scene');if(s&&s!=="padlock")document.documentElement.setAttribute('data-scene-link','')}catch(e){}})()`,
    )
  })
})

describe('linkScript escaping', () => {
  /** Runs the script with a fake address and document; returns what it marked. */
  function run(script: string, search: string) {
    const marked: string[] = []
    new Function('location', 'document', 'URLSearchParams', script)(
      { search },
      { documentElement: { setAttribute: (name: string) => marked.push(name) } },
      URLSearchParams,
    )
    return marked
  }

  it('keeps the same script for plain words', () => {
    expect(linkScript('id', 'draft', 'data-loader-link')).toBe(LOADER_LINK_SCRIPT)
  })

  it.each([
    "a'b",
    'a"b',
    'back\\slash\\',
    '</script><script>alert(1)</script>',
    "x'+(globalThis.__pwned=1)+'",
    'one\ntwo\u2028three\u2029',
  ])('stays one valid script, with %j in every place', (text) => {
    const script = linkScript(text, text, text)
    expect(script).not.toContain('<')
    expect(script).not.toMatch(/[\n\u2028\u2029]/)
    // An address naming something other than the flagship marks the page with the attribute named exactly.
    expect(run(script, `?${new URLSearchParams({ [text]: 'other' })}`)).toEqual([text])
    // Naming the flagship, or nothing, marks nothing.
    expect(run(script, `?${new URLSearchParams({ [text]: text })}`)).toEqual([])
    expect(run(script, '')).toEqual([])
    expect((globalThis as Record<string, unknown>).__pwned).toBeUndefined()
  })
})
