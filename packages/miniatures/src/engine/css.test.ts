import { describe, expect, it } from 'vitest'
import { adaptCss, HOST_CSS, splitSelectors } from './css'

describe('adaptCss', () => {
  it('turns the page root into the wrapper, and its tokens into themeable ones', () => {
    expect(adaptCss(':root{color-scheme:light dark;--accent:#3b5bfd;--stage-ink:var(--ink)}')).toBe(
      '.yjm-root{color-scheme:light dark;--accent:var(--yjm-accent,#3b5bfd);--stage-ink:var(--yjm-stage-ink,var(--ink))}',
    )
    expect(adaptCss('html{--a:1}body .x{y:z}')).toBe('.yjm-root{--a:var(--yjm-a,1)}.yjm-root .x{y:z}')
  })

  it('keeps the figure’s own rules as written: the shadow root scopes them', () => {
    const css = '.face{fill:var(--body);stroke:var(--line)}.top.wood{fill:var(--wood-top)}#lid:focus-visible .cover{stroke:var(--accent)}.shadow{filter:url(#soft)}@keyframes spin{to{transform:rotate(1turn)}}'
    expect(adaptCss(css)).toBe(css)
  })

  it('keeps a root mode on the root: :root.night, :root:not(.night) svg', () => {
    expect(adaptCss(':root.night{--bg:#050505}:root:not(.night) .inside{--unit:#343434}')).toBe(
      '.yjm-root.night{--bg:var(--yjm-bg,#050505)}.yjm-root:not(.night) .inside{--unit:#343434}',
    )
  })

  it('applies dark blocks under [data-dark], without adding specificity', () => {
    expect(adaptCss('@media(prefers-color-scheme:dark){:root{--top:#eaeae8}svg{--ink:#282828}.stage-floor,.stage-pool{transform:scale(1.5)}:root.night .stage-floor{display:none}}')).toBe(
      '.yjm-root:where([data-dark]){--top:var(--yjm-top,#eaeae8)}' +
        ':where(.yjm-root[data-dark]) svg{--ink:#282828}' +
        ':where(.yjm-root[data-dark]) .stage-floor,:where(.yjm-root[data-dark]) .stage-pool{transform:scale(1.5)}' +
        '.yjm-root:where([data-dark]).night .stage-floor{display:none}',
    )
  })

  it('applies reduced-motion blocks under [data-reduced]', () => {
    expect(adaptCss('@media (prefers-reduced-motion: reduce){.cl.live{opacity:.9}}')).toBe(':where(.yjm-root[data-reduced]) .cl.live{opacity:.9}')
  })

  it('leaves other conditions alone and drops comments', () => {
    expect(adaptCss('/* a */@media(hover:hover){.knob:hover{fill:red}}@supports (x:y){.a{b:c}}')).toBe('@media(hover:hover){.knob:hover{fill:red}}@supports (x:y){.a{b:c}}')
  })

  it('splits selector lists on top-level commas only', () => {
    expect(splitSelectors('.a,:is(.b,.c) .d, [x="1,2"]')).toEqual(['.a', ':is(.b,.c) .d', '[x="1,2"]'])
  })

  it('reads every rule of the host sheet as scoped to the shadow root', () => {
    expect(HOST_CSS).not.toMatch(/(^|})(\.face|svg|\*)\{/)
    expect(HOST_CSS).toContain(':host(:focus-visible)')
  })
})
