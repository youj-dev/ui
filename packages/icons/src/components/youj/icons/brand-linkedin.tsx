import { createIcon } from './icon-base'

/* LinkedIn's [in] logo, as LinkedIn's brand site draws it (https://brand.linkedin.com/in-logo,
 * icons.svg #linkedin-bug), checked against in-logo.zip → InBug-Black.png, scaled into the
 * 24-unit grid, drawing unchanged. Permitted in blue, black or white. */
const MARK =
  'M3.25 4.71 C3.25 3.9 3.9 3.25 4.71 3.25 L19.29 3.25 C20.1 3.25 20.75 3.9 20.75 4.71 L20.75 19.29 C20.75 20.1 20.1 20.75 19.29 20.75 L4.71 20.75 C3.9 20.75 3.25 20.1 3.25 19.29 Z M10.18 9.92 L10.18 18.31 L12.73 18.31 L12.73 14.25 C12.73 12.88 13.23 12.02 14.44 12.02 C15.3 12.02 15.65 12.82 15.65 14.25 L15.65 18.31 L18.2 18.31 L18.2 13.68 C18.2 11.18 17.6 9.81 15.08 9.81 C13.76 9.81 12.89 10.43 12.55 11.11 L12.55 9.92 Z M5.8 18.2 L8.35 18.2 L8.35 9.81 L5.8 9.81 Z M8.72 7.08 C8.72 6.17 7.98 5.44 7.08 5.44 C6.17 5.44 5.44 6.17 5.44 7.08 C5.44 7.98 6.17 8.72 7.08 8.72 C7.98 8.72 8.72 7.98 8.72 7.08 Z'

/** The LinkedIn [in] logo, to link to a LinkedIn profile or page, per LinkedIn's brand guidelines: blue, black or white only. Static. */
export const BrandLinkedinIcon = createIcon({
  name: 'brand-linkedin',
  category: 'brand',
  keywords: ['linkedin', 'in', 'professional', 'network', 'career', 'profile', 'jobs', 'social', 'sign in with linkedin', 'oauth', 'login', 'brand', 'logo'],
  defaultTrigger: 'none',
  variants: () => ({}),
  render: () => <path d={MARK} fill="currentColor" stroke="none" />,
})
