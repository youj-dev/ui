'use client'

import { useId, useState } from 'react'
import { Collapse } from '@youj/motion'
import { Badge } from '../../../components/ui/badge'
import { Field, FieldContent, FieldDescription, FieldLabel } from '../../../components/ui/field'
import { Switch } from '../../../components/ui/switch'
import type { CookieConsentCategory, CookieConsentCopy } from './data'

interface CategoryRowProps {
  category: CookieConsentCategory
  checked: boolean
  onCheckedChange?: (value: boolean) => void
  copy: CookieConsentCopy
}

export function CategoryRow({ category, checked, onCheckedChange, copy }: CategoryRowProps) {
  const [open, setOpen] = useState(false)
  const panel = useId()
  const locked = !!category.required
  return (
    <div className="rounded-lg border border-line">
      <Field orientation="horizontal" className="px-4 pt-3.5 pb-2">
        <FieldContent>
          <FieldLabel className="flex items-center gap-2">
            {category.title}
            {locked && <Badge variant="secondary">{copy.alwaysOn}</Badge>}
          </FieldLabel>
          <FieldDescription>{category.description}</FieldDescription>
        </FieldContent>
        <Switch checked={checked} disabled={locked} onCheckedChange={onCheckedChange} />
      </Field>
      {category.cookies.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panel}
            onClick={() => setOpen(!open)}
            className="focus-ring ms-3 mb-2.5 rounded-sm px-1 text-ui-sm text-accent-text hover:underline hover:underline-offset-4"
          >
            {copy.toggleCookies(open, category.cookies.length)}
          </button>
          <Collapse id={panel} open={open}>
            <table className="w-full border-t border-line text-ui-sm">
              <thead className="sr-only">
                <tr>
                  <th>{copy.cookieColumn}</th>
                  <th>{copy.purposeColumn}</th>
                  <th>{copy.expiresColumn}</th>
                </tr>
              </thead>
              <tbody>
                {category.cookies.map((c) => (
                  <tr key={c.name} className="border-b border-line last:border-b-0">
                    <td className="py-2 ps-4 font-mono text-fg">{c.name}</td>
                    <td className="py-2 text-fg-muted">{c.purpose}</td>
                    <td className="py-2 pe-4 text-end text-fg-muted tabular-nums">{c.expires}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Collapse>
        </>
      )}
    </div>
  )
}

/** The page the consent sits over: quiet, so the card is the only thing speaking. */
export function FauxSite() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-6 md:px-8">
      <header className="flex items-center gap-6">
        <span className="font-semibold tracking-tight">Crumb &amp; Co.</span>
        <span className="ms-auto hidden gap-5 text-ui text-fg-muted sm:flex">
          <span>Loaves</span>
          <span>Pastry</span>
          <span>Subscriptions</span>
        </span>
      </header>
      <main className="grid items-center gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight md:text-5xl">Sourdough, at your door by eight.</h1>
          <p className="max-w-md text-lg text-fg-muted">Baked overnight in Leith and delivered before breakfast, three days a week.</p>
          <div className="flex gap-2">
            <span className="h-control w-32 rounded-md bg-accent" />
            <span className="h-control w-24 rounded-md border border-line" />
          </div>
        </div>
        <div aria-hidden className="aspect-[4/3] rounded-xl bg-[radial-gradient(circle_at_30%_35%,var(--color-accent)_0_18%,transparent_19%),radial-gradient(circle_at_68%_60%,color-mix(in_oklab,var(--color-accent)_60%,transparent)_0_24%,transparent_25%)] bg-band" />
        <div aria-hidden className="grid gap-4 sm:grid-cols-3 md:col-span-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border border-line p-4">
              <span className="h-24 rounded-md bg-well" />
              <span className="h-3 w-2/3 rounded-full bg-well" />
              <span className="h-3 w-1/3 rounded-full bg-well" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
