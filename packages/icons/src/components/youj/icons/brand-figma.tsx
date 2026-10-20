import { createIcon } from './icon-base'

/* Figma's single-color icon, from Figma's brand guidelines (https://www.figma.com/using-the-figma-brand/):
 * the logo download → Figma Icon (Mono-line)/Figma Icon (Mono-line black).svg, scaled into the
 * 24-unit grid, drawing unchanged (holes rewound for nonzero fill). */
const MARK =
  'M6.89 8.95 C5.9 8.3 5.24 7.17 5.24 5.89 C5.24 3.88 6.87 2.25 8.88 2.25 L15.12 2.25 C17.13 2.25 18.76 3.88 18.76 5.89 C18.76 7.17 18.1 8.3 17.11 8.95 C18.1 9.6 18.76 10.72 18.76 12 C18.76 14.01 17.13 15.64 15.12 15.64 L15.05 15.64 C14.1 15.64 13.24 15.28 12.59 14.68 L12.59 18.07 C12.59 20.11 10.92 21.75 8.9 21.75 C6.89 21.75 5.24 20.12 5.24 18.11 C5.24 16.83 5.9 15.7 6.89 15.05 C5.9 14.4 5.24 13.28 5.24 12 C5.24 10.72 5.9 9.6 6.89 8.95 Z M12.59 12 C12.59 13.36 13.69 14.47 15.05 14.47 L15.12 14.47 C16.48 14.47 17.59 13.36 17.59 12 C17.59 10.64 16.48 9.53 15.12 9.53 L15.05 9.53 C13.69 9.53 12.59 10.64 12.59 12 Z M11.41 9.53 L8.88 9.53 C7.52 9.53 6.41 10.64 6.41 12 C6.41 13.36 7.51 14.46 8.87 14.47 L8.88 14.47 L11.41 14.47 Z M8.88 15.64 C8.88 15.64 8.87 15.64 8.87 15.64 C7.51 15.65 6.41 16.75 6.41 18.11 C6.41 19.47 7.53 20.57 8.9 20.57 C10.28 20.57 11.41 19.45 11.41 18.07 L11.41 15.64 Z M11.41 8.36 L11.41 3.43 L8.88 3.43 C7.52 3.43 6.41 4.53 6.41 5.89 C6.41 7.25 7.52 8.36 8.88 8.36 Z M15.12 8.36 C16.48 8.36 17.59 7.25 17.59 5.89 C17.59 4.53 16.48 3.43 15.12 3.43 L12.59 3.43 L12.59 8.36 Z'

/** Figma's single-color icon, to link to Figma files or say a product works with Figma, per Figma's brand guidelines. Static. */
export const BrandFigmaIcon = createIcon({
  name: 'brand-figma',
  category: 'brand',
  keywords: ['figma', 'figjam', 'design', 'prototype', 'open in figma', 'social', 'sign in with figma', 'oauth', 'login', 'brand', 'logo'],
  defaultTrigger: 'none',
  variants: () => ({}),
  render: () => <path d={MARK} fill="currentColor" stroke="none" />,
})
