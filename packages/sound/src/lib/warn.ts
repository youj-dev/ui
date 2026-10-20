/* Warnings for the developer, in development only. Bundlers write
 * process.env.NODE_ENV into the code (Base UI relies on it too), so in a
 * production build every `if (DEV)` folds away, message and all. */

declare const process: { env: { NODE_ENV?: string } }

export const DEV = process.env.NODE_ENV !== 'production'

export function warn(message: string) {
  console.warn(`[youj] ${message}`)
}

/** An error as a short reason. */
export const reason = (error: unknown) => (error instanceof Error ? error.message : String(error))
