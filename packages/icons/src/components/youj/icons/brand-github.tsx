import { createIcon } from './icon-base'

/* GitHub's mark (the Invertocat), from GitHub's logo guidelines
 * (https://brand.github.com/foundations/logo): GitHub_Logos.zip
 * → SVG/GitHub_Invertocat_Black.svg, scaled into the 24-unit grid, drawing unchanged.
 * Permitted in black, white (or gray) to link to GitHub; never recolored or altered. */
const MARK =
  'M10.55 16.19 C10.33 16.38 10.1 16.65 9.78 16.96 C9.36 17.38 9.07 17.55 8.61 17.55 C8.15 17.55 7.77 17.31 7.4 16.78 C6.93 16.1 6.47 15.77 5.94 15.77 C5.57 15.77 5.21 15.94 5.21 16.16 C5.21 16.27 5.28 16.36 5.5 16.38 C5.92 16.43 6.14 16.73 6.34 17.22 C6.85 18.45 7.57 19.11 8.78 19.11 C9.07 19.11 9.4 19.03 9.66 18.92 L9.66 20.39 C9.66 20.88 9.18 21.21 8.69 21.03 C5.21 19.76 2.62 16.4 2.63 12.33 C2.63 7.15 6.8 2.92 11.98 2.92 C17.16 2.92 21.38 7.15 21.38 12.33 C21.38 16.43 18.77 19.75 15.46 21.01 C14.91 21.23 14.45 20.92 14.45 20.37 L14.45 18.46 C14.45 17.46 14.03 16.58 13.41 16.18 C15.86 15.86 17.57 14.16 17.57 11.91 C17.57 10.96 17.26 10.02 16.67 9.33 C16.91 8.71 16.87 7.42 16.61 6.93 C15.88 6.84 14.87 7.22 14.31 7.73 C13.65 7.53 12.92 7.42 12.02 7.42 C11.12 7.42 10.39 7.53 9.69 7.75 C9.11 7.22 8.12 6.84 7.39 6.93 C7.11 7.46 7.07 8.74 7.31 9.35 C6.76 10.01 6.43 10.99 6.43 11.91 C6.43 14.16 8.14 15.9 10.55 16.19 Z'

/** The GitHub mark, to link to GitHub or sign in with it, per GitHub's logo guidelines: black, white or gray only. Static. */
export const BrandGithubIcon = createIcon({
  name: 'brand-github',
  category: 'brand',
  keywords: ['github', 'git', 'invertocat', 'octocat', 'repository', 'code', 'developer', 'sign in with github', 'social', 'oauth', 'login', 'brand', 'logo'],
  defaultTrigger: 'none',
  variants: () => ({}),
  render: () => <path d={MARK} fill="currentColor" stroke="none" />,
})
