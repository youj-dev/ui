import type { MouseEventHandler, ReactNode } from 'react'
import { BrandGithubIcon, BrandLinkedinIcon, BrandXIcon } from '@youj/icons'
import { ArcsCover, BarsCover, GridCover, OrbitCover, StackCover, TypeCover } from './covers'

/** An entry of the menu: a link (`href`) or a level of its own (`items`), shown large. */
export interface NavbarFullscreenItem {
  label: string
  /** Where a link goes. */
  href?: string
  /** A level the entry opens, in place of the list. */
  items?: NavbarFullscreenItem[]
  /** One line under the picture while this entry is hovered or focused. */
  description?: string
  /** The picture beside the list on wide screens while this entry is hovered or focused. Decorative. */
  media?: ReactNode
  /** A small tag after the label ("3 open"). */
  badge?: string
}

/** A small link at the menu's foot, or its contact line. */
export interface NavbarFullscreenLink {
  label: string
  href: string
}

/** A profile elsewhere, shown as its icon. */
export interface NavbarFullscreenSocial {
  /** Its accessible name: "Kestrel on GitHub". */
  label: string
  href: string
  icon: ReactNode
}

/** The studio's name, mark and home link. */
export interface NavbarFullscreenBrand {
  name: string
  logo?: ReactNode
  href?: string
}

/** A call to action link. */
export interface NavbarFullscreenCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export const ITEMS: NavbarFullscreenItem[] = [
  {
    label: 'Work',
    description: 'Selected projects, 2019 to now.',
    media: <GridCover />,
    items: [
      { label: 'Identity', href: '#work/identity', description: 'Marks, type and systems that hold at every size.', media: <ArcsCover /> },
      { label: 'Products', href: '#work/products', description: 'Interfaces for tools people use all day.', media: <GridCover /> },
      { label: 'Motion', href: '#work/motion', description: 'Films, launches and the movement inside an interface.', media: <OrbitCover /> },
      { label: 'Spaces', href: '#work/spaces', description: 'Wayfinding and screens for buildings.', media: <StackCover /> },
    ],
  },
  {
    label: 'Studio',
    description: 'Fourteen people in two rooms, Lisbon and Oslo.',
    media: <StackCover />,
    items: [
      { label: 'About', href: '#studio/about', description: 'How we work, and what we will not do.', media: <StackCover /> },
      { label: 'People', href: '#studio/people', description: 'Designers, engineers and one producer.', media: <BarsCover /> },
      { label: 'Careers', href: '#studio/careers', badge: '3 open', description: 'Two designers and an engineer, from autumn.', media: <OrbitCover /> },
    ],
  },
  { label: 'Journal', href: '#journal', description: 'Notes on process, tools and type.', media: <TypeCover /> },
  { label: 'Sound', href: '#sound', description: 'A library of interface sounds, free to use.', media: <BarsCover /> },
  { label: 'Contact', href: '#contact', description: 'Tell us what you are making.', media: <ArcsCover /> },
]

export function Logo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="text-fg">
      <path d="M4 20 L12 4 L20 20 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8.5 13 L15.5 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent" />
    </svg>
  )
}

export const BRAND: NavbarFullscreenBrand = { name: 'Kestrel', logo: <Logo />, href: '#home' }

export const CTA: NavbarFullscreenCta = { label: 'Start a project', href: '#contact' }

export const FOOTER_LINKS: NavbarFullscreenLink[] = [
  { label: 'Press', href: '#press' },
  { label: 'Imprint', href: '#imprint' },
  { label: 'Privacy', href: '#privacy' },
]

export const SOCIALS: NavbarFullscreenSocial[] = [
  { label: 'Kestrel on X', href: 'https://x.com', icon: <BrandXIcon size={16} /> },
  { label: 'Kestrel on GitHub', href: 'https://github.com', icon: <BrandGithubIcon size={16} /> },
  { label: 'Kestrel on LinkedIn', href: 'https://linkedin.com', icon: <BrandLinkedinIcon size={16} /> },
]

export const CONTACT: NavbarFullscreenLink = { label: 'hello@kestrel.studio', href: 'mailto:hello@kestrel.studio' }

export const DEFAULT_COPY = {
  /** The menu button, and the menu's accessible name. */
  menu: 'Menu',
  /** The button that closes it, where the menu button was. */
  close: 'Close',
  /** Names the navigation inside the menu. */
  navLabel: 'Main',
  /** The button that leaves a level. */
  back: 'Back',
  /** Names the links at the foot of the menu. */
  footerLabel: 'More',
  /** The first stop for the keyboard: jumps past the bar to the page's content. */
  skipLink: 'Skip to content',
}

export type NavbarFullscreenCopy = typeof DEFAULT_COPY
