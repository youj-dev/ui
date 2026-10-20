import { createIcon } from './icon-base'

/* Discord's symbol (Clyde), from Discord's branding page (https://discord.com/branding):
 * Discord_Symbol_Black.zip → Discord-Symbol-Black.svg, scaled into the 24-unit grid,
 * drawing unchanged. Permitted in color, black or white, where the Discord name is visible. */
const MARK =
  'M14.67 4.8 L14.68 4.81 C16.03 5.03 17.35 5.44 18.6 6.01 C20.75 9.15 21.81 12.7 21.42 16.79 C19.97 17.86 18.34 18.68 16.61 19.2 C16.22 18.68 15.88 18.12 15.58 17.54 C16.14 17.33 16.69 17.07 17.21 16.77 C17.07 16.67 16.94 16.57 16.81 16.47 C13.76 17.9 10.24 17.9 7.19 16.47 C7.07 16.56 6.93 16.67 6.8 16.77 C7.32 17.07 7.86 17.33 8.42 17.54 C8.12 18.12 7.78 18.67 7.39 19.2 C5.66 18.67 4.03 17.86 2.58 16.78 C2.25 13.26 2.92 9.68 5.39 6.01 C6.65 5.44 7.96 5.03 9.32 4.8 C9.5 5.13 9.67 5.47 9.82 5.82 C11.26 5.6 12.73 5.6 14.17 5.82 C14.32 5.47 14.49 5.13 14.67 4.8 Z M8.84 14.61 C9.8 14.61 10.54 13.76 10.55 12.71 C10.57 11.67 9.8 10.81 8.84 10.81 C7.88 10.81 7.13 11.66 7.13 12.71 C7.13 13.76 7.91 14.61 8.84 14.61 Z M15.16 14.61 C16.11 14.61 16.85 13.76 16.86 12.71 C16.88 11.67 16.12 10.81 15.16 10.81 C14.19 10.81 13.45 11.66 13.45 12.71 C13.45 13.76 14.22 14.61 15.16 14.61 Z'

/** The Discord symbol, to link to a Discord server or sign in with Discord, per Discord's brand guidelines: Blurple, black or white, beside the Discord name. Static. */
export const BrandDiscordIcon = createIcon({
  name: 'brand-discord',
  category: 'brand',
  keywords: ['discord', 'clyde', 'chat', 'community', 'server', 'voice', 'gaming', 'social', 'sign in with discord', 'oauth', 'login', 'brand', 'logo'],
  defaultTrigger: 'none',
  variants: () => ({}),
  render: () => <path d={MARK} fill="currentColor" stroke="none" />,
})
