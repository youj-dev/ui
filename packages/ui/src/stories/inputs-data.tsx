import { Avatar, AvatarFallback } from '../components/ui/avatar'
import type { ComboboxOption } from '../components/ui/combobox'

/* Story fixtures shared by the Inputs stories and the Create project example. */

export const people = [
  { id: 'ada', name: 'Ada Lovelace', email: 'ada@orion.dev', team: 'Engineering' },
  { id: 'alan', name: 'Alan Turing', email: 'alan@orion.dev', team: 'Engineering' },
  { id: 'barbara', name: 'Barbara Liskov', email: 'barbara@orion.dev', team: 'Engineering' },
  { id: 'donald', name: 'Donald Knuth', email: 'don@orion.dev', team: 'Engineering' },
  { id: 'grace', name: 'Grace Hopper', email: 'grace@orion.dev', team: 'Engineering' },
  { id: 'margaret', name: 'Margaret Hamilton', email: 'margaret@orion.dev', team: 'Engineering' },
  { id: 'dieter', name: 'Dieter Rams', email: 'dieter@orion.dev', team: 'Design' },
  { id: 'susan', name: 'Susan Kare', email: 'susan@orion.dev', team: 'Design' },
  { id: 'paula', name: 'Paula Scher', email: 'paula@orion.dev', team: 'Design' },
  { id: 'massimo', name: 'Massimo Vignelli', email: 'massimo@orion.dev', team: 'Design' },
  { id: 'katherine', name: 'Katherine Johnson', email: 'katherine@orion.dev', team: 'Research' },
  { id: 'claude', name: 'Claude Shannon', email: 'claude@orion.dev', team: 'Research' },
]

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}

export function PersonAvatar({ name }: { name: string }) {
  return (
    <Avatar size="sm" className="size-5">
      <AvatarFallback className="text-[9px]">{initials(name)}</AvatarFallback>
    </Avatar>
  )
}

export const personOptions: ComboboxOption[] = people.map((p) => ({
  value: p.id,
  label: p.name,
  description: p.email,
  group: p.team,
  icon: <PersonAvatar name={p.name} />,
}))

/** A fake directory search: resolves after `delay` ms with the people matching `query`. */
export function searchPeople(query: string, delay = 650): Promise<ComboboxOption[]> {
  const q = query.trim().toLowerCase()
  return new Promise((resolve) =>
    setTimeout(
      () => resolve(personOptions.filter((o) => o.label.toLowerCase().includes(q) || o.description!.includes(q))),
      delay,
    ),
  )
}

export const frameworks: ComboboxOption[] = [
  { value: 'next', label: 'Next.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'solidstart', label: 'SolidStart' },
  { value: 'vite', label: 'Vite (static)' },
]
