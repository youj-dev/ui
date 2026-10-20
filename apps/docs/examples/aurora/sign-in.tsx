'use client'

import { useId } from 'react'
import { Aurora } from '@youj/motion/backgrounds'

export default function AuroraSignIn() {
  const email = useId()
  return (
    <div className="relative isolate flex min-h-[440px] w-full items-center justify-center overflow-hidden px-6 py-10 rounded-2xl border border-line bg-canvas mx-auto max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)]">
      {/* Behind a form, a calmer field that doesn't follow the pointer. */}
      <Aurora intensity={0.8} horizon={0.72} interactive={false} />
      <form
        onSubmit={(event) => event.preventDefault()}
        className="relative w-full max-w-xs rounded-2xl border border-line bg-surface/85 youj-allow-glass p-6 shadow-lg backdrop-blur-xl"
      >
        <p className="text-base font-semibold tracking-tight text-fg">Sign in to Youj</p>
        <p className="mt-1 text-sm text-fg-muted">Use the email you work with.</p>
        <label htmlFor={email} className="mt-5 block text-xs font-medium text-fg">
          Email
        </label>
        <input
          id={email}
          type="email"
          autoComplete="email"
          placeholder="ana@studio.dev"
          className="mt-1.5 h-9 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-fg placeholder:text-fg-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-line focus-visible:outline-none"
        />
        <button
          type="submit"
          className="mt-3 h-9 w-full rounded-lg bg-fg text-sm font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
        >
          Continue with email
        </button>
        <p className="mt-4 text-center text-xs text-fg-muted">We’ll send you a magic link.</p>
      </form>
    </div>
  )
}
