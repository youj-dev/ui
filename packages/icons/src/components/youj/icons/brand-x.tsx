import { createIcon } from './icon-base'

/* X's logo, from X's brand toolkit (https://about.x.com/en/who-we-are/brand-toolkit):
 * x-logo.zip → logo.svg, scaled into the 24-unit grid, drawing unchanged.
 * The X brand guidelines (x-brand-guidelines.pdf) allow it in black or white only. */
const MARK =
  'M13.68 10.62 L20.81 21 L15.56 21 L10.76 14.01 L4.75 21 L3.19 21 L10.07 13.01 L3.19 3 L8.44 3 L12.99 9.62 L18.68 3 L20.23 3 Z M11.55 13.1 L16.29 19.88 L18.68 19.88 L12.86 11.57 L12.17 10.57 L7.69 4.17 L5.31 4.17 L10.85 12.1 Z'

/** The X logo, to link to an X account or sign in with X, per X's brand guidelines: black or white only. Static. */
export const BrandXIcon = createIcon({
  name: 'brand-x',
  category: 'brand',
  keywords: ['x', 'twitter', 'x.com', 'post', 'tweet', 'social', 'sign in with x', 'oauth', 'login', 'brand', 'logo'],
  defaultTrigger: 'none',
  variants: () => ({}),
  render: () => <path d={MARK} fill="currentColor" stroke="none" />,
})
