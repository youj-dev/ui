import { LOADER_LINK_SCRIPT } from '@/components/loaders/query'
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
