import { onMediaHost } from '@/components/landing/promo-video'
import { promoUrl } from './media'
import { mediaUrl } from './media-url'

describe('media URLs', () => {
  it('serves a key from the given host', () => {
    expect(mediaUrl('promo/a.1.mp4', 'https://m.example')).toBe('https://m.example/promo/a.1.mp4')
  })

  it('maps a promo file to its content-addressed key, and to nothing when it is not on R2', () => {
    const files = { 'home-film.mp4': 'promo/home-film.0123456789.mp4' }
    expect(promoUrl('/promo/home-film.mp4', files, 'https://m.example')).toBe('https://m.example/promo/home-film.0123456789.mp4')
    expect(promoUrl('home-film.mp4', files, 'https://m.example')).toBe('https://m.example/promo/home-film.0123456789.mp4')
    expect(promoUrl('/promo/other.mp4', files)).toBeUndefined()
  })

  it('rewrites a manifest to the media host and drops a video that has no poster there', () => {
    const files = { 'a.mp4': 'promo/a.1.mp4', 'a.jpg': 'promo/a.1.jpg', 'a-640.webp': 'promo/a-640.1.webp', 'b.mp4': 'promo/b.1.mp4' }
    const out = onMediaHost(
      {
        videos: {
          a: { sources: [{ src: '/promo/a.mp4', type: 'video/mp4' }, { src: '/promo/a.webm', type: 'video/webm' }], poster: { src: '/promo/a.jpg', srcset: { webp: '/promo/a-640.webp 640w, /promo/a-1280.webp 1280w' } } },
          b: { sources: [{ src: '/promo/b.mp4', type: 'video/mp4' }], poster: { src: '/promo/b.jpg' } },
        },
      },
      files,
    )
    expect(out.videos!.a!.sources.map((s) => s.src)).toEqual(['https://media.youj.dev/promo/a.1.mp4'])
    expect(out.videos!.a!.poster).toEqual({ src: 'https://media.youj.dev/promo/a.1.jpg', srcset: { webp: 'https://media.youj.dev/promo/a-640.1.webp 640w' } })
    expect(out.videos!.b!.poster).toBeUndefined()
  })
})
