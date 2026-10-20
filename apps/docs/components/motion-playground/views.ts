import type { PlaygroundState } from './state'

/** What each tab's view gets from the playground: the state it shows, and a way to change it. */
export interface ViewProps {
  state: PlaygroundState
  update: (patch: Partial<PlaygroundState>) => void
}
