/* The scene categories alone, with none of the scenes: a server component can
 * read them without importing every scene (each a client module). */

/** The kinds of moment the scenes cover, in the order a gallery shows them. */
export const illustrationCategories = [
  { id: 'data', name: 'Data' },
  { id: 'infrastructure', name: 'Infrastructure' },
  { id: 'app', name: 'App' },
  { id: 'lifecycle', name: 'Lifecycle' },
  { id: 'commerce', name: 'Commerce' },
  { id: 'finance', name: 'Finance' },
  { id: 'health', name: 'Health' },
  { id: 'education', name: 'Education' },
  { id: 'travel', name: 'Travel' },
  { id: 'food', name: 'Food' },
  { id: 'media', name: 'Media' },
  { id: 'social', name: 'Social' },
  { id: 'home', name: 'Home' },
  { id: 'work', name: 'Work' },
  { id: 'sports', name: 'Sports' },
  { id: 'play', name: 'Play' },
  { id: 'events', name: 'Events' },
  { id: 'pets', name: 'Pets' },
  { id: 'weather', name: 'Weather' },
  { id: 'nature', name: 'Nature' },
  { id: 'energy', name: 'Energy' },
  { id: 'transport', name: 'Transport' },
  { id: 'places', name: 'Places' },
  { id: 'outdoors', name: 'Outdoors' },
  { id: 'science', name: 'Science' },
  { id: 'security', name: 'Security' },
  { id: 'devices', name: 'Devices' },
  { id: 'business', name: 'Business' },
] as const

export type IllustrationCategory = (typeof illustrationCategories)[number]['id']
