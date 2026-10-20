/* Google's "G" and its sign-in button colors, per the Sign in with Google
 * branding guidelines (developers.google.com/identity/branding-guidelines):
 * the standard four-color G, never monochrome or recolored, on the light
 * (#FFFFFF fill, #747775 stroke, #1F1F1F text), dark (#131314, #8E918F,
 * #E3E3E3) or neutral (#F2F2F2, no stroke, #1F1F1F) button, labeled "Sign in
 * with Google", "Sign up with Google" or "Continue with Google".
 *
 * These are Google's brand values, not Youj tokens, so this one file is
 * allowlisted in scripts/check-tokens.mjs. Keep every raw color here. */

/** The four-color G at its native proportions. Sized by the parent (18px in a 40px button). */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

/* Class strings for a Button. `auto` is Google's light theme in a light scope
 * and its dark theme in a dark one: `light-dark()` follows the color-scheme
 * each data-theme scope sets, so a light card inside a dark page stays light.
 * Hover lays Google's 8% state layer of the text color over the fill. */
const googleButton = {
  auto: 'border-[color:light-dark(#747775,#8E918F)] bg-[color:light-dark(#FFFFFF,#131314)] text-[color:light-dark(#1F1F1F,#E3E3E3)] shadow-none hover:bg-[color:light-dark(color-mix(in_srgb,#1F1F1F_8%,#FFFFFF),color-mix(in_srgb,#E3E3E3_8%,#131314))]',
  neutral: 'border-transparent bg-[color:#F2F2F2] text-[color:#1F1F1F] shadow-none hover:bg-[color:color-mix(in_srgb,#1F1F1F_8%,#F2F2F2)]',
} as const

export { GoogleMark, googleButton }
